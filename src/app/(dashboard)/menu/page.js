'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/utils';

export default function MenuPage() {
  const { profile, supabase } = useAuth();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('products');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [outlets, setOutlets] = useState([]);
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const { toasts, addToast, dismissToast } = useToast();

  // Load all outlets for super_admin
  useEffect(() => {
    async function loadOutlets() {
      if (profile?.role === 'super_admin') {
        try {
          const { data } = await supabase.from('outlets').select('*').order('name');
          if (data && data.length > 0) {
            setOutlets(data);
            const pusat = data.find(o => o.code === 'OTL01' || o.name.toLowerCase().includes('pusat'));
            setSelectedOutletId(pusat ? pusat.id : data[0].id);
          }
        } catch (err) {
          console.error('Error loading outlets:', err);
        }
      } else {
        setSelectedOutletId(profile?.outlet_id || profile?.outlets?.id || '');
      }
    }
    loadOutlets();
  }, [profile, supabase]);

  const fetchData = useCallback(async () => {
    if (!selectedOutletId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').eq('outlet_id', selectedOutletId).order('sort_order'),
        supabase.from('products').select('*, categories(name)').eq('outlet_id', selectedOutletId).order('sort_order'),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (prodRes.data) setProducts(prodRes.data);
    } catch (err) {
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
        price: parseInt(formData.price) || 0,
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
      // 1. Fetch current local categories to avoid duplicate checks
      const { data: localCats } = await supabase
        .from('categories')
        .select('*')
        .eq('outlet_id', selectedOutletId);
      
      const localCatsList = [...(localCats || [])];
      
      // 2. Fetch the actual products to import from Pusat
      const { data: masterProds } = await supabase
        .from('products')
        .select('*, categories(name)')
        .eq('outlet_id', pusat.id)
        .in('id', selectedProductIds);
      
      if (!masterProds || masterProds.length === 0) {
        addToast('Tidak ada produk yang di-import', 'error');
        return;
      }
      
      let importCount = 0;
      
      // 3. For each product, match/create category and insert product
      for (const prod of masterProds) {
        let localCatId = null;
        const catName = prod.categories?.name;
        
        if (catName) {
          // Check if category exists locally
          let localCat = localCatsList.find(c => c.name.toLowerCase() === catName.toLowerCase());
          if (!localCat) {
            // Create local category
            const { data: newCat, error: catErr } = await supabase
              .from('categories')
              .insert({
                outlet_id: selectedOutletId,
                name: catName,
                sort_order: 0,
                is_active: true
              })
              .select()
              .single();
              
            if (catErr) throw catErr;
            if (newCat) {
              localCat = newCat;
              localCatsList.push(newCat); // cache for next products
            }
          }
          localCatId = localCat?.id;
        }
        
        // Insert product
        const { error: prodErr } = await supabase
          .from('products')
          .insert({
            outlet_id: selectedOutletId,
            category_id: localCatId,
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
          <button
            className={`btn ${activeTab === 'products' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('products')}
          >
            <span className="material-icons-round">restaurant_menu</span>
            Produk ({products.length})
          </button>
          <button
            className={`btn ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('categories')}
          >
            <span className="material-icons-round">category</span>
            Kategori ({categories.length})
          </button>
          <div style={{ flex: 1 }} />
          {activeTab === 'products' && selectedOutletId && (() => {
            const currentOutlet = outlets.find(o => o.id === selectedOutletId) || profile?.outlets;
            const isPusat = currentOutlet?.code === 'OTL01' || currentOutlet?.name?.toLowerCase().includes('pusat');
            if (!isPusat) {
              return (
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowImportModal(true)}
                  style={{ marginRight: '8px' }}
                  id="menu-import-pusat"
                >
                  <span className="material-icons-round">cloud_download</span>
                  Import dari Pusat
                </button>
              );
            }
            return null;
          })()}
          <button
            className="btn btn-accent"
            onClick={() => {
              if (activeTab === 'products') {
                setEditingProduct(null);
                setShowProductModal(true);
              } else {
                setEditingCategory(null);
                setShowCategoryModal(true);
              }
            }}
            id="menu-add-new"
          >
            <span className="material-icons-round">add</span>
            Tambah {activeTab === 'products' ? 'Produk' : 'Kategori'}
          </button>
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
        ) : activeTab === 'products' ? (
          /* Products Grid */
          products.length === 0 ? (
            <div style={menuStyles.emptyHero} className="animate-fade-in">
              <div style={menuStyles.emptyIconWrap}>
                <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>restaurant_menu</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Belum Ada Produk</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>Tambahkan produk pertama Anda dengan klik tombol di atas.</p>
            </div>
          ) : (
            <div style={menuStyles.productGrid}>
              {products.map((product) => (
                <div key={product.id} style={menuStyles.productCard} className="card card-glow">
                  <div style={menuStyles.productImage}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span className="material-icons-round" style={{ fontSize: '40px', color: 'var(--text-tertiary)' }}>restaurant</span>
                    )}
                    <span className={`badge ${product.is_available ? 'badge-success' : 'badge-danger'}`} style={menuStyles.statusBadge}>
                      {product.is_available ? 'Tersedia' : 'Habis'}
                    </span>
                  </div>
                  <div style={menuStyles.productInfo}>
                    <span style={menuStyles.prodCategory}>{product.categories?.name || 'Lainnya'}</span>
                    <h3 style={menuStyles.prodName}>{product.name}</h3>
                    {product.description && (
                      <p style={menuStyles.prodDesc}>{product.description}</p>
                    )}
                    <span style={menuStyles.prodPrice}>{formatRupiah(product.price)}</span>
                  </div>
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
                </div>
              ))}
            </div>
          )
        ) : (
          /* Categories Table */
          categories.length === 0 ? (
            <div style={menuStyles.emptyHero} className="animate-fade-in">
              <div style={menuStyles.emptyIconWrap}>
                <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>category</span>
              </div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Belum Ada Kategori</h2>
              <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>Buat kategori untuk mengelompokkan produk Anda.</p>
            </div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Urutan</th>
                    <th>Nama Kategori</th>
                    <th>Status</th>
                    <th>Jumlah Produk</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>{cat.sort_order}</td>
                      <td style={{ fontWeight: '600' }}>{cat.name}</td>
                      <td>
                        <span className={`badge ${cat.is_active ? 'badge-success' : 'badge-danger'}`}>
                          {cat.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td>{products.filter(p => p.category_id === cat.id).length}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost btn-sm" onClick={() => { setEditingCategory(cat); setShowCategoryModal(true); }}>
                            <span className="material-icons-round" style={{ fontSize: '18px' }}>edit</span>
                          </button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDeleteCategory(cat.id)}>
                            <span className="material-icons-round" style={{ fontSize: '18px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onSave={handleSaveProduct}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); }}
        />
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <CategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => { setShowCategoryModal(false); setEditingCategory(null); }}
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

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

// Product Modal Component
function ProductModal({ product, categories, onSave, onClose }) {
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div className="input-group">
                <label>Harga (Rp) *</label>
                <input className="input" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required placeholder="25000" min="0" id="product-price" />
              </div>
              <div className="input-group">
                <label>Kategori</label>
                <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} id="product-category">
                  <option value="">Tanpa kategori</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div className="input-group">
                <label>Urutan</label>
                <input className="input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} min="0" />
              </div>
              <div className="input-group">
                <label>Status</label>
                <select className="input" value={form.is_available.toString()} onChange={(e) => setForm({ ...form, is_available: e.target.value === 'true' })}>
                  <option value="true">Tersedia</option>
                  <option value="false">Habis</option>
                </select>
              </div>
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
    sort_order: category?.sort_order?.toString() || '0',
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
            <div className="input-group">
              <label>Urutan</label>
              <input className="input" type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} min="0" />
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
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.categories?.name && p.categories.name.toLowerCase().includes(search.toLowerCase()))
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
                      <th>Kategori</th>
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
                        <td>
                          <span className="badge badge-primary">{prod.categories?.name || 'Lainnya'}</span>
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
