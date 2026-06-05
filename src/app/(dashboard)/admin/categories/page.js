'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';

export default function CategoriesAdminPage() {
  const { profile, supabase } = useAuth();
  const [categories, setCategories] = useState([]);
  const [pusatId, setPusatId] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { toasts, addToast, dismissToast } = useToast();

  // Find the central Pusat outlet ID
  const fetchPusatOutlet = useCallback(async () => {
    try {
      const { data } = await supabase.from('outlets').select('*');
      if (data && data.length > 0) {
        const pusat = data.find(o => o.code === 'OTL01' || o.name.toLowerCase().includes('pusat'));
        const idVal = pusat ? pusat.id : data[0].id;
        setPusatId(idVal);
      }
    } catch (err) {
      console.error('Error loading outlets:', err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchPusatOutlet();
  }, [fetchPusatOutlet]);

  // Fetch categories belonging to the Pusat outlet
  const fetchData = useCallback(async () => {
    if (!pusatId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('outlet_id', pusatId)
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      addToast('Gagal memuat kategori', 'error');
    } finally {
      setLoading(false);
    }
  }, [pusatId, supabase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Save (Create or Update)
  const handleSaveCategory = async (form) => {
    if (!pusatId) return;
    try {
      const payload = {
        name: form.name.trim(),
        is_active: form.is_active,
      };

      if (editing) {
        const { error } = await supabase
          .from('categories')
          .update(payload)
          .eq('id', editing.id);

        if (error) throw error;
        addToast('Kategori berhasil diperbarui', 'success');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert({
            ...payload,
            outlet_id: pusatId,
          });

        if (error) throw error;
        addToast('Kategori berhasil ditambahkan', 'success');
      }

      setShowModal(false);
      setEditing(null);
      fetchData();
    } catch (err) {
      console.error('Error saving category:', err);
      addToast('Gagal menyimpan kategori: ' + err.message, 'error');
    }
  };

  // Handle Delete
  const handleDeleteCategory = async (id, name) => {
    try {
      if (!confirm(`Hapus kategori "${name}"? Produk yang menggunakan kategori ini akan kehilangan relasinya.`)) return;

      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      addToast('Kategori berhasil dihapus', 'success');
      fetchData();
    } catch (err) {
      console.error('Error deleting category:', err);
      addToast('Gagal menghapus kategori: ' + err.message, 'error');
    }
  };

  return (
    <>
      <Header title="Kelola Kategori" subtitle="Super Admin Dashboard" onToggleSidebar={() => {}} />

      <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: '700', color: 'var(--text-primary)' }}>
              Daftar Kategori ({categories.length})
            </h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)', marginTop: '2px' }}>
              Kategori yang ditambahkan di sini bersifat global dan digunakan oleh seluruh outlet.
            </p>
          </div>
          <button
            className="btn btn-accent"
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            id="admin-category-add"
            disabled={!pusatId}
          >
            <span className="material-icons-round">add</span>
            Tambah Kategori
          </button>
        </div>

        {loading ? (
          <div className="loading-screen" style={{ minHeight: '30vh' }}>
            <div className="spinner spinner-lg" />
            <p>Memuat kategori...</p>
          </div>
        ) : categories.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'var(--space-2xl)',
              textAlign: 'center',
              minHeight: '200px',
            }}
          >
            <span className="material-icons-round" style={{ fontSize: '48px', color: 'var(--text-tertiary)', opacity: 0.5 }}>
              category
            </span>
            <h3 style={{ marginTop: '12px', fontSize: 'var(--text-md)', fontWeight: '600' }}>Belum ada kategori</h3>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: '4px' }}>
              Silakan tambahkan kategori pertama untuk sistem.
            </p>
          </div>
        ) : (
          <div className="table-container animate-fade-in">
            <table>
              <thead>
                <tr>
                  <th>Nama Kategori</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => (
                  <tr key={cat.id}>
                    <td style={{ fontWeight: '600' }}>{cat.name}</td>
                    <td>
                      <span className={`badge ${cat.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {cat.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setEditing(cat);
                            setShowModal(true);
                          }}
                        >
                          <span className="material-icons-round" style={{ fontSize: '18px' }}>edit</span>
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          style={{ color: 'var(--color-danger)' }}
                        >
                          <span className="material-icons-round" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CategoryAdminModal
          category={editing}
          onSave={handleSaveCategory}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function CategoryAdminModal({ category, onSave, onClose }) {
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
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Nama Kategori *</label>
              <input
                className="input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                placeholder="e.g. Shawarma, Kentang, Mix"
                id="category-name"
              />
            </div>
            <div className="input-group">
              <label>Status</label>
              <select
                className="input"
                value={form.is_active.toString()}
                onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
              >
                <option value="true">Aktif</option>
                <option value="false">Non-aktif</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Batal
            </button>
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
