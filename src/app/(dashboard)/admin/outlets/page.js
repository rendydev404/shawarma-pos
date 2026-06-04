'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';

export default function OutletsPage() {
  const { profile, supabase } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toasts, addToast, dismissToast } = useToast();

  const fetchOutlets = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('outlets').select('*').order('code');
      if (error) throw error;
      setOutlets(data || []);
    } catch (err) {
      addToast('Gagal memuat data outlet', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchOutlets(); }, [fetchOutlets]);

  const handleSave = async (form) => {
    try {
      if (editing) {
        const { error } = await supabase.from('outlets').update({
          name: form.name, address: form.address, phone: form.phone, is_active: form.is_active,
        }).eq('id', editing.id);
        if (error) throw error;
        addToast('Outlet berhasil diperbarui', 'success');
      } else {
        const { error } = await supabase.from('outlets').insert({
          name: form.name, code: form.code, address: form.address, phone: form.phone,
        });
        if (error) throw error;
        addToast('Outlet berhasil ditambahkan', 'success');
      }
      setShowModal(false); setEditing(null); fetchOutlets();
    } catch (err) {
      addToast('Gagal menyimpan: ' + err.message, 'error');
    }
  };

  const toggleActive = async (outlet) => {
    try {
      const { error } = await supabase.from('outlets').update({ is_active: !outlet.is_active }).eq('id', outlet.id);
      if (error) throw error;
      addToast(outlet.is_active ? 'Outlet dinonaktifkan' : 'Outlet diaktifkan', 'success');
      fetchOutlets();
    } catch (err) {
      addToast('Gagal mengupdate status', 'error');
    }
  };

  const filteredOutlets = outlets.filter((o) => {
    const q = searchQuery.toLowerCase();
    return o.name?.toLowerCase().includes(q) ||
      o.code?.toLowerCase().includes(q) ||
      o.address?.toLowerCase().includes(q) ||
      o.phone?.toLowerCase().includes(q);
  });

  return (
    <>
      <Header title="Kelola Outlet" subtitle="Super Admin" onToggleSidebar={() => {}} />
      <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center', flex: 1, minWidth: '280px' }}>
            <div className="input-with-icon" style={{ flex: 1, maxWidth: '300px' }}>
              <span className="material-icons-round">search</span>
              <input
                className="input"
                placeholder="Cari nama, kode, atau alamat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="outlets-search"
              />
            </div>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              {filteredOutlets.length} dari {outlets.length} outlet
            </span>
          </div>
          <button className="btn btn-accent" onClick={() => { setEditing(null); setShowModal(true); }} id="admin-add-outlet">
            <span className="material-icons-round">add</span>Tambah Outlet
          </button>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner spinner-lg" /><p>Memuat outlet...</p></div>
        ) : filteredOutlets.length === 0 ? (
          <div style={outletStyles.emptyHero} className="animate-fade-in">
            <div style={outletStyles.emptyIconWrap}>
              <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>storefront</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Outlet Tidak Ditemukan</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>Tidak ada outlet yang cocok dengan pencarian "{searchQuery}".</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
            {filteredOutlets.map((outlet) => (
              <div key={outlet.id} className="card card-glow" style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: '700', color: 'var(--color-primary)', fontFamily: 'var(--font-mono)' }}>{outlet.code}</span>
                    <h3 style={{ fontSize: 'var(--text-lg)', marginTop: '4px' }}>{outlet.name}</h3>
                  </div>
                  <span className={`badge ${outlet.is_active ? 'badge-success' : 'badge-danger'}`}>
                    {outlet.is_active ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                {outlet.address && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '4px' }}>📍 {outlet.address}</p>}
                {outlet.phone && <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>📞 {outlet.phone}</p>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                  <button className="btn btn-ghost btn-sm" onClick={() => { setEditing(outlet); setShowModal(true); }}>
                    <span className="material-icons-round" style={{ fontSize: '16px' }}>edit</span>Edit
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(outlet)}
                    style={{ color: outlet.is_active ? 'var(--color-danger)' : 'var(--color-success)' }}>
                    <span className="material-icons-round" style={{ fontSize: '16px' }}>{outlet.is_active ? 'block' : 'check_circle'}</span>
                    {outlet.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <OutletModal
          outlet={editing}
          suggestedCode={generateNextCode(outlets)}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

const generateNextCode = (existingOutlets) => {
  let maxNum = 0;
  existingOutlets.forEach((o) => {
    const matches = o.code ? o.code.match(/\d+/) : null;
    if (matches) {
      const num = parseInt(matches[0], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  });
  const nextNum = maxNum + 1;
  return `OTL${String(nextNum).padStart(2, '0')}`;
};

function OutletModal({ outlet, suggestedCode, onSave, onClose }) {
  const [form, setForm] = useState({
    name: outlet?.name || '',
    code: outlet?.code || suggestedCode || '',
    address: outlet?.address || '',
    phone: outlet?.phone || '',
    is_active: outlet?.is_active ?? true,
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{outlet ? 'Edit Outlet' : 'Tambah Outlet'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><span className="material-icons-round">close</span></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Nama Outlet *</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Shawarma - Senayan" />
            </div>
            {!outlet && (
              <div className="input-group">
                <label>Kode Outlet (Dibuat Otomatis)</label>
                <input
                  className="input"
                  value={form.code}
                  disabled
                  style={{
                    opacity: 0.65,
                    cursor: 'not-allowed',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px dashed rgba(255, 255, 255, 0.15)'
                  }}
                  placeholder="OTLXX"
                />
              </div>
            )}
            <div className="input-group">
              <label>Alamat</label>
              <textarea className="input" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Alamat lengkap" rows={2} />
            </div>
            <div className="input-group">
              <label>Telepon</label>
              <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="08xxx" />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><span className="material-icons-round">save</span>Simpan</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const outletStyles = {
  emptyHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2xl)',
    textAlign: 'center',
    minHeight: '350px',
    width: '100%',
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
    marginBottom: '16px',
  },
};
