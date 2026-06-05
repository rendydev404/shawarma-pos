'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/utils';
import JSZip from 'jszip';

export default function MenuPage() {
  const { profile, supabase } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showZipModal, setShowZipModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [pusatId, setPusatId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const { toasts, addToast, dismissToast } = useToast();

  // Load all outlets for super_admin
  useEffect(() => {
    async function loadOutlets() {
      try {
        const { data } = await supabase.from('outlets').select('*').order('name');
        if (data && data.length > 0) {
          if (profile?.role === 'super_admin') {
            setOutlets(data);
            const pusat = data.find(o => o.code === 'OTL01' || o.name.toLowerCase().includes('pusat'));
            setSelectedOutletId(pusat ? pusat.id : data[0].id);
          }
          const pusat = data.find(o => o.code === 'OTL01' || o.name.toLowerCase().includes('pusat'));
          if (pusat) {
            setPusatId(pusat.id);
          } else {
            setPusatId(data[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading outlets:', err);
      }
      if (profile?.role !== 'super_admin') {
        setSelectedOutletId(profile?.outlet_id || profile?.outlets?.id || '');
      }
    }
    if (profile) {
      loadOutlets();
    }
  }, [profile, supabase]);

  const fetchData = useCallback(async () => {
    if (!selectedOutletId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      // Find Pusat outlet
      const { data: outletsData } = await supabase.from('outlets').select('id, code, name');
      const pusat = outletsData?.find(o => o.code === 'OTL01' || o.name.toLowerCase().includes('pusat'));
      const pusatId = pusat ? pusat.id : selectedOutletId;

      const [catRes, prodRes] = await Promise.all([
        supabase
          .from('categories')
          .select('*')
          .eq('outlet_id', pusatId)
          .order('name'),
        supabase
          .from('products')
          .select('*, categories(name)')
          .in('outlet_id', [selectedOutletId, pusatId])
          .order('sort_order')
      ]);

      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    } catch (err) {
      console.error('Fetch data error:', err);
      addToast('Gagal memuat data', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedOutletId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Category CRUD
  const handleSaveCategory = async (formData) => {
    try {
      if (editingCategory) {
        const { error } = await supabase.from('categories').update({
          name: formData.name,
          sort_order: formData.sort_order,
          is_active: formData.is_active,
        }).eq('id', editingCategory.id);
        if (error) throw error;
        addToast('Kategori berhasil diperbarui', 'success');
      } else {
        const { error } = await supabase.from('categories').insert({
          outlet_id: selectedOutletId,
          name: formData.name,
          sort_order: formData.sort_order || 0,
          is_active: true,
        });
        if (error) throw error;
        addToast('Kategori berhasil ditambahkan', 'success');
      }
      setShowCategoryModal(false);
      setEditingCategory(null);
      fetchData();
    } catch (err) {
      addToast('Gagal menyimpan kategori: ' + err.message, 'error');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Hapus kategori ini?')) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      addToast('Kategori dihapus', 'success');
      fetchData();
    } catch (err) {
      addToast('Gagal menghapus: ' + err.message, 'error');
    }
  };

  // Product CRUD
  const handleSaveProduct = async (formData) => {
    try {
      const payload = {
        outlet_id: selectedOutletId,
        name: formData.name,
        description: formData.description || null,
        price: Math.round(parseInt(formData.price) || 0),
        category_id: formData.category_id || null,
        is_available: formData.is_available,
        sort_order: formData.sort_order || 0,
        image_url: formData.image_url || null,
      };

      if (editingProduct) {
        const { error } = await supabase.from('products').update(payload).eq('id', editingProduct.id);
        if (error) throw error;
        addToast('Produk berhasil diperbarui', 'success');
      } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) throw error;
        addToast('Produk berhasil ditambahkan', 'success');
      }
      setShowProductModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (err) {
      addToast('Gagal menyimpan produk: ' + err.message, 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      addToast('Produk dihapus', 'success');
      fetchData();
    } catch (err) {
      addToast('Gagal menghapus: ' + err.message, 'error');
    }
  };

  const handleDeleteAllProducts = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus SEMUA produk di outlet ini? Tindakan ini tidak dapat dibatalkan.')) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('outlet_id', selectedOutletId);

      if (error) throw error;
      
      addToast('Semua produk di outlet ini berhasil dihapus', 'success');
      fetchData();
    } catch (err) {
      console.error('Delete all error:', err);
      addToast('Gagal menghapus produk: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleAvailability = async (product) => {
    try {
      const { error } = await supabase.from('products')
        .update({ is_available: !product.is_available })
        .eq('id', product.id);
      if (error) throw error;
      addToast(product.is_available ? 'Produk ditandai habis' : 'Produk tersedia kembali', 'success');
      fetchData();
    } catch (err) {
      addToast('Gagal mengupdate status', 'error');
    }
  };

  const handleImportProducts = async (selectedProductIds) => {
    if (!selectedProductIds || selectedProductIds.length === 0) return;
    
    // Find Pusat outlet
    const { data: outletsData } = await supabase.from('outlets').select('*');
    const pusat = outletsData?.find(o => o.code === 'OTL01' || o.name.toLowerCase().includes('pusat'));
    if (!pusat) {
      addToast('Outlet Pusat tidak ditemukan', 'error');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Fetch the actual products to import from Pusat
      const { data: masterProds } = await supabase
        .from('products')
        .select('*')
        .eq('outlet_id', pusat.id)
        .in('id', selectedProductIds);
      
      if (!masterProds || masterProds.length === 0) {
        addToast('Tidak ada produk yang di-import', 'error');
        return;
      }
      
      let importCount = 0;
      
      // 2. For each product, copy category_id directly and insert product
      for (const prod of masterProds) {
        // Insert product
        const { error: prodErr } = await supabase
          .from('products')
          .insert({
            outlet_id: selectedOutletId,
            category_id: prod.category_id,
            name: prod.name,
            description: prod.description,
            price: prod.price,
            image_url: prod.image_url,
            is_available: true,
            sort_order: prod.sort_order
          });
          
        if (prodErr) throw prodErr;
        importCount++;
      }
      
      addToast(`Berhasil meng-import ${importCount} produk dari pusat! 🎉`, 'success');
      fetchData(); // refresh menu page list
    } catch (err) {
      console.error('Import error:', err);
      addToast('Gagal meng-import produk: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.categories?.name && p.categories.name.toLowerCase().includes(q))
    );
  });

  return (
    <>
      <Header title="Kelola Menu" subtitle={profile?.outlets?.name} onToggleSidebar={() => {}} />

      {profile?.role === 'super_admin' && outlets.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', padding: '12px var(--space-lg)', borderBottom: '1px solid var(--border-color)', position: 'sticky', top: 'var(--header-height)', zIndex: 10 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: '600', color: 'var(--text-secondary)' }}>Kelola Menu Outlet:</span>
          <select
            className="input"
            style={{ width: '260px', padding: '6px 12px', fontSize: 'var(--text-sm)' }}
            value={selectedOutletId}
            onChange={(e) => setSelectedOutletId(e.target.value)}
          >
            {outlets.map((o) => (
              <option key={o.id} value={o.id}>{o.code} - {o.name}</option>
            ))}
          </select>
        </div>
      )}

      <div style={menuStyles.page}>
        {/* Tab Switcher */}
        <div style={menuStyles.tabs}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-lg)', fontWeight: '700', color: 'var(--text-primary)' }}>
            <span className="material-icons-round" style={{ color: 'var(--color-primary)' }}>restaurant_menu</span>
            Daftar Produk ({filteredProducts.length})
          </div>
          <div style={{ flex: 1 }} />

          {selectedOutletId && (
            <button
              className="btn btn-secondary"
              onClick={() => setShowZipModal(true)}
              style={{ marginRight: '8px' }}
              id="menu-upload-zip"
            >
              <span className="material-icons-round">folder_zip</span>
              Upload ZIP
            </button>
          )}
          {selectedOutletId && products.length > 0 && (
            <button
              className="btn btn-danger"
              onClick={handleDeleteAllProducts}
              style={{ marginRight: '8px' }}
              id="menu-delete-all"
            >
              <span className="material-icons-round">delete_sweep</span>
              Hapus Semua
            </button>
          )}
          <button
            className="btn btn-accent"
            onClick={() => {
              setEditingProduct(null);
              setShowProductModal(true);
            }}
            id="menu-add-new"
          >
            <span className="material-icons-round">add</span>
            Tambah Produk
          </button>
        </div>

        {/* Search Bar */}
        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <div className="input-with-icon" style={{ maxWidth: '360px', flex: 1 }}>
            <span className="material-icons-round">search</span>
            <input
              id="menu-search"
              type="text"
              className="input"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner spinner-lg" /><p>Memuat data...</p></div>
        ) : !selectedOutletId ? (
          <div style={menuStyles.emptyHero} className="animate-fade-in">
            <div style={menuStyles.emptyIconWrap}>
              <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>store</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Belum Ada Outlet</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', maxWidth: '360px', textAlign: 'center', lineHeight: 1.6, marginTop: '8px' }}>
              Akun Super Admin tidak terhubung ke outlet. Silakan assign outlet terlebih dahulu melalui <strong style={{ color: 'var(--color-primary)' }}>Kelola User</strong>.
            </p>
          </div>
        ) : products.length === 0 ? (
          <div style={menuStyles.emptyHero} className="animate-fade-in">
            <div style={menuStyles.emptyIconWrap}>
              <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>restaurant_menu</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Belum Ada Produk</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>Tambahkan produk pertama Anda dengan klik tombol di atas.</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={menuStyles.emptyHero} className="animate-fade-in">
            <div style={menuStyles.emptyIconWrap}>
              <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>search_off</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Produk Tidak Ditemukan</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>Coba kata kunci pencarian yang lain.</p>
          </div>
        ) : (
          <div style={menuStyles.productGrid}>
            {filteredProducts.map((product) => (
                <div key={product.id} style={menuStyles.productCard} className="card card-glow">
                  <div style={menuStyles.productImage}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span className="material-icons-round" style={{ fontSize: '40px', color: 'var(--text-tertiary)' }}>restaurant</span>
                    )}
                    {product.outlet_id !== selectedOutletId && (
                      <span className="badge badge-accent" style={{ ...menuStyles.statusBadge, right: 'auto', left: '8px' }}>
                        Pusat
                      </span>
                    )}
                    <span className={`badge ${product.is_available ? 'badge-success' : 'badge-danger'}`} style={menuStyles.statusBadge}>
                      {product.is_available ? 'Tersedia' : 'Habis'}
                    </span>
                  </div>
                  <div style={menuStyles.productInfo}>
                    <h3 style={menuStyles.prodName}>{product.name}</h3>
                    {product.description && (
                      <p style={menuStyles.prodDesc}>{product.description}</p>
                    )}
                    <span style={menuStyles.prodPrice}>{formatRupiah(product.price)}</span>
                  </div>
                  {product.outlet_id === selectedOutletId ? (
                    <div style={menuStyles.productActions}>
                      <button className="btn btn-ghost btn-sm" onClick={() => toggleAvailability(product)}
                        title={product.is_available ? 'Tandai habis' : 'Tandai tersedia'}>
                        <span className="material-icons-round" style={{ fontSize: '18px' }}>
                          {product.is_available ? 'remove_circle_outline' : 'check_circle_outline'}
                        </span>
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => { setEditingProduct(product); setShowProductModal(true); }}>
                        <span className="material-icons-round" style={{ fontSize: '18px' }}>edit</span>
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteProduct(product.id)}
                        style={{ color: 'var(--color-danger)' }}>
                        <span className="material-icons-round" style={{ fontSize: '18px' }}>delete</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ ...menuStyles.productActions, justifyContent: 'center', color: 'var(--text-tertiary)', fontSize: '11px', fontWeight: '600', fontStyle: 'italic' }}>
                      <span className="material-icons-round" style={{ fontSize: '14px', marginRight: '4px' }}>info</span>
                      Produk Pusat (Read Only)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        }
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
          isSuperAdmin={profile?.role === 'super_admin'}
          pusatId={pusatId || selectedOutletId}
          onCategoryAdded={fetchData}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportModal
          open={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleImportProducts}
          localProducts={products}
          supabase={supabase}
        />
      )}

      {/* ZIP Upload Modal */}
      {showZipModal && (
        <ZipUploadModal
          open={showZipModal}
          onClose={() => setShowZipModal(false)}
          onUploadComplete={(count) => {
            addToast(`Berhasil mengupload ${count} produk via ZIP! 🎉`, 'success');
            fetchData();
          }}
          selectedOutletId={selectedOutletId}
          supabase={supabase}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

// Product Modal Component
function ProductModal({ product, categories, onSave, onClose, isSuperAdmin, pusatId, onCategoryAdded }) {
  const { supabase } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [imageSource, setImageSource] = useState(
    product?.image_url && !product.image_url.includes('supabase.co/storage') ? 'url' : 'upload'
  );
  const [urlInput, setUrlInput] = useState(product?.image_url || '');
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    category_id: product?.category_id || '',
    is_available: product?.is_available ?? true,
    sort_order: product?.sort_order?.toString() || '0',
    image_url: product?.image_url || '',
  });

  const [showAddCatInput, setShowAddCatInput] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  const handleCreateCategory = async () => {
    if (!newCatName.trim()) return;
    setAddingCategory(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          outlet_id: pusatId,
          name: newCatName.trim(),
          sort_order: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setNewCatName('');
        setShowAddCatInput(false);
        if (onCategoryAdded) {
          await onCategoryAdded();
        }
        // Auto-select the newly created category
        setForm((prev) => ({ ...prev, category_id: data.id }));
      }
    } catch (err) {
      console.error('Failed to add category:', err);
      alert('Gagal menambahkan kategori: ' + err.message);
    } finally {
      setAddingCategory(false);
    }
  };

  const uploadFile = useCallback(async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran gambar maksimal 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name ? file.name.split('.').pop() : 'png';
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('products')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('products')
        .getPublicUrl(filePath);

      setForm((prev) => ({ ...prev, image_url: publicUrl }));
      setUrlInput(publicUrl);
    } catch (err) {
      console.error('Upload error:', err);
      alert('Gagal mengupload gambar: ' + err.message);
    } finally {
      setUploading(false);
    }
  }, [supabase]);

  useEffect(() => {
    const handlePaste = async (e) => {
      if (uploading) return;

      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            setImageSource('upload');
            await uploadFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [uploading, uploadFile]);

  const handleUploadImage = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handleRemoveImage = () => {
    setForm((prev) => ({ ...prev, image_url: '' }));
    setUrlInput('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalForm = { ...form };
    if (imageSource === 'url') {
      finalForm.image_url = urlInput.trim() || null;
    }
    onSave(finalForm);
  };

  const handleUrlChange = (val) => {
    setUrlInput(val);
    setForm((prev) => ({ ...prev, image_url: val.trim() }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{product ? 'Edit Produk' : 'Tambah Produk'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><span className="material-icons-round">close</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Nama Produk *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Chicken Shawarma" id="product-name" />
            </div>
            <div className="input-group">
              <label>Deskripsi</label>
              <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Deskripsi produk (opsional)" rows={2} />
            </div>
            <div className="input-group">
              <label>Harga (Rp) *</label>
              <input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="25000" min="0" id="product-price" />
            </div>
            <div className="input-group">
              <label>Kategori</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="input"
                  value={form.category_id}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                  style={{ flex: 1 }}
                >
                  <option value="">Pilih Kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {isSuperAdmin && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ padding: '8px 12px', minWidth: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
                    onClick={() => setShowAddCatInput(!showAddCatInput)}
                  >
                    <span className="material-icons-round">{showAddCatInput ? 'close' : 'add'}</span>
                    <span>Kategori Baru</span>
                  </button>
                )}
              </div>
            </div>

            {isSuperAdmin && showAddCatInput && (
              <div 
                style={{ 
                  background: 'var(--bg-secondary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '12px', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  marginTop: '-8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              >
                <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-secondary)' }}>Tambah Kategori Baru (Pusat)</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="input"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Nama kategori baru..."
                    style={{ flex: 1, padding: '6px 12px', fontSize: 'var(--text-sm)' }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={handleCreateCategory}
                    disabled={addingCategory || !newCatName.trim()}
                    style={{ padding: '0 16px' }}
                  >
                    {addingCategory ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </div>
            )}
            <div className="input-group">
              <label>Status</label>
              <select className="input" value={form.is_available.toString()} onChange={(e) => setForm({ ...form, is_available: e.target.value === 'true' })}>
                <option value="true">Tersedia</option>
                <option value="false">Habis</option>
              </select>
            </div>
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ margin: 0 }}>Foto Produk</label>
                <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '2px', borderRadius: '6px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSource('upload');
                      if (form.image_url && !form.image_url.includes('supabase.co/storage')) {
                        setForm((prev) => ({ ...prev, image_url: '' }));
                        setUrlInput('');
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: 'none',
                      borderRadius: '4px',
                      background: imageSource === 'upload' ? 'var(--color-primary)' : 'transparent',
                      color: imageSource === 'upload' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Upload File
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageSource('url');
                      if (form.image_url && form.image_url.includes('supabase.co/storage')) {
                        setForm((prev) => ({ ...prev, image_url: '' }));
                        setUrlInput('');
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      border: 'none',
                      borderRadius: '4px',
                      background: imageSource === 'url' ? 'var(--color-primary)' : 'transparent',
                      color: imageSource === 'url' ? '#fff' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    Input URL
                  </button>
                </div>
              </div>

              {imageSource === 'upload' ? (
                form.image_url ? (
                  <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <img src={form.image_url} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(239, 68, 68, 0.9)', color: '#fff',
                        border: 'none', borderRadius: 'var(--radius-full)',
                        width: '28px', height: '28px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }}
                    >
                      <span className="material-icons-round" style={{ fontSize: '18px' }}>delete</span>
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      border: '2px dashed var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      padding: '24px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      background: 'var(--bg-tertiary)',
                      transition: 'border-color var(--transition-fast)',
                      position: 'relative'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--color-primary)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleUploadImage}
                      disabled={uploading}
                      style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        opacity: 0, cursor: 'pointer'
                      }}
                    />
                    {uploading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <div className="spinner spinner-sm" />
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>Mengupload gambar...</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons-round" style={{ fontSize: '32px', color: 'var(--text-tertiary)' }}>cloud_upload</span>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', fontWeight: '600' }}>Klik atau seret file ke sini</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Maks. 2MB (PNG, JPG, JPEG)</span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <input
                    className="input"
                    value={urlInput}
                    onChange={(e) => handleUrlChange(e.target.value)}
                    placeholder="https://example.com/gambar-produk.jpg"
                    style={{ width: '100%' }}
                  />
                  {urlInput.trim() && (
                    <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                      <img
                        src={urlInput.trim()}
                        alt="Preview URL"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const errText = e.currentTarget.parentElement.querySelector('.preview-error');
                          if (errText) errText.style.display = 'flex';
                        }}
                      />
                      <div
                        className="preview-error"
                        style={{
                          display: 'none',
                          width: '100%',
                          height: '100%',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexDirection: 'column',
                          background: 'rgba(255,255,255,0.02)',
                          color: 'var(--text-tertiary)',
                          fontSize: 'var(--text-xs)',
                          gap: '8px'
                        }}
                      >
                        <span className="material-icons-round" style={{ fontSize: '32px', color: 'var(--color-danger)' }}>broken_image</span>
                        <span>Gambar gagal dimuat (Cek kembali URL)</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" id="product-save">
              <span className="material-icons-round">save</span>
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Category Modal Component
function CategoryModal({ category, onSave, onClose }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    is_active: category?.is_active ?? true,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
        <div className="modal-header">
          <h2>{category ? 'Edit Kategori' : 'Tambah Kategori'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><span className="material-icons-round">close</span></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Nama Kategori *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Shawarma, Drinks" id="category-name" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary" id="category-save">
              <span className="material-icons-round">save</span>
              Simpan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const menuStyles = {
  page: {
    padding: 'var(--space-lg)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--space-lg)',
  },
  tabs: {
    display: 'flex',
    gap: 'var(--space-sm)',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  productGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: 'var(--space-md)',
  },
  productCard: {
    padding: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  productImage: {
    width: '100%',
    height: '140px',
    background: 'var(--bg-tertiary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  statusBadge: {
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
  productInfo: {
    padding: 'var(--space-md)',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  prodCategory: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  prodName: {
    fontSize: 'var(--text-base)',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  prodDesc: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    lineHeight: 1.4,
  },
  prodPrice: {
    fontSize: 'var(--text-lg)',
    fontWeight: '800',
    color: 'var(--color-primary-light)',
    fontFamily: 'var(--font-heading)',
    marginTop: '4px',
  },
  productActions: {
    display: 'flex',
    gap: '4px',
    padding: '8px var(--space-md)',
    borderTop: '1px solid var(--border-color)',
    justifyContent: 'flex-end',
  },
  emptyHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2xl)',
    textAlign: 'center',
    minHeight: '300px',
  },
  emptyIconWrap: {
    width: '120px',
    height: '120px',
    borderRadius: 'var(--radius-full)',
    background: 'var(--color-primary-subtle)',
    border: '2px solid rgba(245, 158, 11, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 40px var(--color-primary-glow)',
  },
};

// Import Modal Component for duplicating products from Pusat
function ImportModal({ open, onClose, onImport, localProducts, supabase }) {
  const [masterProducts, setMasterProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadMaster() {
      if (!open) return;
      setLoading(true);
      setError(null);
      try {
        // Find Pusat outlet
        const { data: outletsData } = await supabase.from('outlets').select('*');
        const pusat = outletsData?.find(o => o.code === 'OTL01' || o.name.toLowerCase().includes('pusat'));
        if (!pusat) {
          setError('Outlet Pusat tidak ditemukan. Pastikan ada outlet dengan kode "OTL01" atau nama "Pusat".');
          setLoading(false);
          return;
        }

        // Fetch Pusat products
        const { data: prods } = await supabase
          .from('products')
          .select('*, categories(name)')
          .eq('outlet_id', pusat.id);

        // Filter out products that already exist locally by name (to avoid duplicates)
        const localNames = new Set(localProducts.map(p => p.name.toLowerCase()));
        const availableProds = (prods || []).filter(p => !localNames.has(p.name.toLowerCase()));

        setMasterProducts(availableProds);
      } catch (err) {
        setError('Gagal memuat katalog produk pusat');
      } finally {
        setLoading(false);
      }
    }
    loadMaster();
  }, [open, localProducts, supabase]);

  const filtered = masterProducts.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(p => p.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onImport(selectedIds);
    onClose();
    setSelectedIds([]);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Import Produk dari Pusat</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '60vh', overflowY: 'auto' }}>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Pilih produk dari outlet Pusat untuk di-import ke outlet ini. Produk dengan nama yang sudah ada di outlet ini tidak akan ditampilkan.
            </p>

            <div style={{ display: 'flex', gap: '8px' }}>
              <div className="input-with-icon" style={{ flex: 1 }}>
                <span className="material-icons-round">search</span>
                <input 
                  className="input" 
                  placeholder="Cari produk pusat..." 
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)} 
                />
              </div>
            </div>

            {loading ? (
              <div className="loading-screen" style={{ minHeight: '20vh' }}>
                <div className="spinner" />
                <p>Memuat katalog pusat...</p>
              </div>
            ) : error ? (
              <div style={{ padding: 'var(--space-md)', background: 'var(--color-danger-bg)', color: 'var(--color-danger)', borderRadius: 'var(--radius-md)', fontSize: 'var(--text-sm)' }}>
                ⚠️ {error}
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-tertiary)' }}>
                <span className="material-icons-round" style={{ fontSize: '48px', opacity: 0.3 }}>info</span>
                <p style={{ marginTop: '8px', fontSize: 'var(--text-sm)' }}>Tidak ada produk pusat baru yang tersedia untuk di-import.</p>
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: '40px', padding: '12px 16px' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                          onChange={handleSelectAll}
                        />
                      </th>
                      <th>Gambar</th>
                      <th>Nama Produk</th>
                      <th>Harga Pusat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((prod) => (
                      <tr key={prod.id} style={{ cursor: 'pointer' }} onClick={() => handleToggleSelect(prod.id)}>
                        <td onClick={(e) => e.stopPropagation()} style={{ padding: '12px 16px' }}>
                          <input 
                            type="checkbox" 
                            checked={selectedIds.includes(prod.id)}
                            onChange={() => handleToggleSelect(prod.id)}
                          />
                        </td>
                        <td style={{ width: '60px', padding: '6px' }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                            {prod.image_url ? (
                              <img src={prod.image_url} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              <span className="material-icons-round" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>restaurant</span>
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: '600' }}>{prod.name}</td>
                        <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{formatRupiah(prod.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={selectedIds.length === 0 || loading}
            >
              <span className="material-icons-round">cloud_download</span>
              Import {selectedIds.length} Produk
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Zip Upload Modal Component for bulk importing products
function ZipUploadModal({ open, onClose, onUploadComplete, selectedOutletId, supabase }) {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, loading, uploading, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [discoveredFiles, setDiscoveredFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, currentName: '' });

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.zip')) {
      setErrorMsg('File harus berupa berkas ZIP (.zip)');
      setStatus('error');
      return;
    }

    setFile(selectedFile);
    setStatus('loading');
    setErrorMsg('');

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const arrayBuffer = event.target.result;
          const zip = await JSZip.loadAsync(arrayBuffer);
          const images = [];

          zip.forEach((relativePath, zipEntry) => {
            if (zipEntry.dir) return;

            const name = zipEntry.name;
            const ext = name.split('.').pop().toLowerCase();
            const isImage = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext);

            if (isImage) {
              images.push(zipEntry);
            }
          });

          setDiscoveredFiles(images);
          setStatus('idle');
        } catch (err) {
          console.error(err);
          setErrorMsg('Gagal membaca isi ZIP: ' + err.message);
          setStatus('error');
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (err) {
      setErrorMsg('Gagal memuat file: ' + err.message);
      setStatus('error');
    }
  };

  const handleUpload = async () => {
    if (discoveredFiles.length === 0) return;
    setStatus('uploading');
    setUploadProgress({ current: 0, total: discoveredFiles.length, currentName: '' });

    let successCount = 0;

    for (let i = 0; i < discoveredFiles.length; i++) {
      const zipEntry = discoveredFiles[i];
      const filename = zipEntry.name.split('/').pop();
      
      // Clean name from filename
      const baseName = filename.substring(0, filename.lastIndexOf('.'));
      const cleanName = baseName
        .replace(/[_-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

      setUploadProgress({
        current: i + 1,
        total: discoveredFiles.length,
        currentName: cleanName
      });

      try {
        // Get blob with correct mime type
        const ext = filename.split('.').pop().toLowerCase();
        let mimeType = 'image/jpeg';
        if (ext === 'png') mimeType = 'image/png';
        else if (ext === 'webp') mimeType = 'image/webp';
        else if (ext === 'gif') mimeType = 'image/gif';

        const blob = await zipEntry.async('blob');
        const imageBlob = new Blob([blob], { type: mimeType });

        // 1. Upload to Supabase Storage
        const fileExt = ext;
        const uploadName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
        const filePath = `${uploadName}`;

        const { error: storageErr } = await supabase.storage
          .from('products')
          .upload(filePath, imageBlob, {
            cacheControl: '3600',
            upsert: true,
          });

        if (storageErr) throw storageErr;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        // 2. Insert product to Database
        const { error: dbErr } = await supabase.from('products').insert({
          outlet_id: selectedOutletId,
          name: cleanName,
          price: 0, // default price is 0 so user can edit it
          image_url: publicUrl,
          is_available: true,
          sort_order: 0
        });

        if (dbErr) throw dbErr;

        successCount++;
      } catch (err) {
        console.error(`Gagal mengupload ${cleanName}:`, err);
        // We continue uploading other files even if one fails
      }
    }

    setStatus('success');
    setTimeout(() => {
      onUploadComplete(successCount);
      onClose();
    }, 1500);
  };

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={status === 'uploading' ? undefined : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h2>Bulk Upload via ZIP</h2>
          {status !== 'uploading' && (
            <button className="btn btn-ghost btn-icon" onClick={onClose}>
              <span className="material-icons-round">close</span>
            </button>
          )}
        </div>
        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {status === 'loading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '12px' }}>
              <div className="spinner" />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>Membaca berkas ZIP...</span>
            </div>
          ) : status === 'uploading' ? (
            <div style={{ display: 'flex', flexDirection: 'column', padding: '16px 0', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', fontWeight: '600' }}>
                <span>Mengupload Produk...</span>
                <span>{uploadProgress.current} / {uploadProgress.total}</span>
              </div>
              <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                <div 
                  style={{ 
                    height: '100%', 
                    width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, 
                    background: 'var(--color-primary)', 
                    transition: 'width 0.3s ease-out' 
                  }} 
                />
              </div>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                Sedang memproses: "{uploadProgress.currentName}"
              </span>
            </div>
          ) : status === 'success' ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', gap: '8px', color: 'var(--color-success)' }}>
              <span className="material-icons-round" style={{ fontSize: '48px' }}>check_circle</span>
              <span style={{ fontSize: 'var(--text-md)', fontWeight: '600' }}>Bulk Upload Berhasil!</span>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                Unggah berkas ZIP berisi gambar produk. Nama file gambar akan otomatis dijadikan nama produk (contoh: <code>chicken_shawarma.jpg</code> akan di-import sebagai produk bernama <b>"Chicken Shawarma"</b> dengan harga Rp 0).
              </p>

              {errorMsg && (
                <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: 'var(--color-danger)', fontSize: 'var(--text-xs)' }}>
                  {errorMsg}
                </div>
              )}

              <div 
                style={{
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  background: 'var(--bg-tertiary)',
                  position: 'relative'
                }}
              >
                <input 
                  type="file" 
                  accept=".zip" 
                  onChange={handleFileChange}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons-round" style={{ fontSize: '36px', color: 'var(--text-tertiary)' }}>folder_zip</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: '600' }}>
                    {file ? file.name : 'Pilih Berkas ZIP'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Maksimal 50MB</span>
                </div>
              </div>

              {discoveredFiles.length > 0 && (
                <div style={{ background: 'var(--bg-secondary)', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-color)', maxHeight: '150px', overflowY: 'auto' }}>
                  <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                    Menemukan {discoveredFiles.length} gambar produk siap di-import:
                  </span>
                  <ul style={{ margin: 0, paddingLeft: '20px', fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', listStyleType: 'decimal' }}>
                    {discoveredFiles.map((file, idx) => (
                      <li key={idx} style={{ marginBottom: '2px' }}>{file.name.split('/').pop()}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={status === 'uploading'}>
            Batal
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleUpload}
            disabled={discoveredFiles.length === 0 || status === 'uploading' || status === 'success'}
          >
            <span className="material-icons-round">publish</span>
            Proses Upload
          </button>
        </div>
      </div>
    </div>
  );
}
