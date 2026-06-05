'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';
import { useDialog } from '@/components/ui/DialogProvider';

const TARGET_OUTLETS = [
  {
    name: 'SUKA SHAWARMA KITCHEN',
    address: 'Jl. Bukit Nirwana Raya No.3, Mulyaharja, Kec. Bogor Sel., Kota Bogor, Jawa Barat 16135',
    phone: '08123456701'
  },
  {
    name: 'SUKA SHAWARMA EMPANG',
    address: 'Jl. Pahlawan No.10A, Empang, Kec. Bogor Sel., Kota Bogor, Jawa Barat 16132',
    phone: '08123456702'
  },
  {
    name: 'SUKA SHAWARMA PALEDANG',
    address: 'Jl. Paledang No. 18, Bogor Tengah, Kota Bogor, Jawa Barat 16122',
    phone: '08123456703'
  },
  {
    name: 'SUKA SHAWARMA CIMANGGU',
    address: 'Jl. Ruko Bukit Cimanggu City, Jl. Bukit Cimanggu City Raya No.3A, Cibadak, Kec. Tanah Sereal, Kota Bogor, Jawa Barat 16165',
    phone: '08123456704'
  },
  {
    name: 'SUKA SHAWARMA DEPOK SUKMAJAYA',
    address: 'Jl. K.H.M. Yusuf Raya, Mekar Jaya, Kec. Sukmajaya, Kota Depok, Jawa Barat 16411',
    phone: '08123456705'
  },
  {
    name: 'SUKA SHAWARMA JAGAKARSA',
    address: 'Jl. Raya Jagakarsa No.159, RT.13/RW.1, Jagakarsa, Kec. Jagakarsa, Kota Jakarta Selatan, DKI. Jakarta 12620',
    phone: '08123456706'
  },
  {
    name: 'SUKA SHAWARMA BEJI',
    address: 'Jl. H. Asmawi No.44, Beji, Kecamatan Beji, Kota Depok, Jawa Barat 16421',
    phone: '08123456707'
  },
  {
    name: 'SUKA SHAWARMA SAWANGAN',
    address: 'Jl. Raya Sawangan Jl. Raya Parung Bingung No.49, Rangkapan Jaya Baru, Kec. Pancoran Mas, Kota Depok, Jawa Barat 16434',
    phone: '08123456708'
  },
  {
    name: 'SUKA SHAWARMA PAJAJARAN',
    address: 'Jl. Raya Pajajaran No.21, RT.03/RW.06, Sukasari, Kec. Bogor Tim., Kota Bogor, Jawa Barat 16142',
    phone: '08123456709'
  },
  {
    name: 'SUKA SHAWARMA JATIWARINGIN',
    address: 'Jl. Raya Jatiwaringin No.51, Jatiwaringin, Kec. Pd. Gede, Kota Bks, Jawa Barat 17411',
    phone: '08123456710'
  },
  {
    name: 'SUKA SHAWARMA CIRENDEU',
    address: 'Jl. Raya Cirendeu No.Raya, Pisangan, Kec. Ciputat Tim., Kota Tangerang Selatan, Banten 1541',
    phone: '08123456711'
  },
  {
    name: 'SUKA SHAWARMA JATIASIH',
    address: 'Jl. Raya Mess Al No.10, Jatisari, Kec. Jatiasih, Kota Bks, Jawa Barat 17426',
    phone: '08123456712'
  },
  {
    name: 'SUKA SHAWARMA DRAMAGA',
    address: 'Jl. Raya Dramaga No.15, RT.03/RW.03, Margajaya, Kec. Bogor Bar., Kota Bogor, Jawa Barat 16116',
    phone: '08123456713'
  },
  {
    name: 'MITRA SUKA SHAWARMA CIBINONG',
    address: 'Jl. Raya Sukahati No.35, Sukahati, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16913',
    phone: '08123456714'
  },
  {
    name: 'MITRA SUKA SHAWARMA CITAYAM',
    address: 'Jl. Raya Sukahati No.35, Sukahati, Kec. Cibinong, Kabupaten Bogor, Jawa Barat 16913',
    phone: '08123456715'
  },
  {
    name: 'MITRA SUKA SHAWARMA TEBET',
    address: 'Jl. Tebet Timur Dalam Raya No.60E, RW.6, Tebet Tim., Kec. Tebet, Kota Jakarta Selatan, Daerah Khusus Ibukota Jakarta 12820',
    phone: '08123456716'
  },
  {
    name: 'MITRA SUKA SHAWARMA CISEENG',
    address: 'Jl. H. Mawi No.17, Parigi Mekar, Kec. Ciseeng, Kabupaten Bogor, Jawa Barat 16120',
    phone: '08123456717'
  },
  {
    name: 'MITRA SUKA Shawarma Pekayon',
    address: 'Jl. Pulo Ribung No.1, Pekayon Jaya, Kec. Bekasi Sel., Kota Bks, Jawa Barat 17147',
    phone: '08123456718'
  },
  {
    name: 'MITRA SUKA Shawarma Kalisari',
    address: 'Jl. Kalisari No.13, RT.6/RW.2, Kalisari, Kec. Ps. Rebo, Kota Jakarta Timur, Daerah Khusus Ibukota Jakarta 13790',
    phone: '08123456719'
  }
];

export default function OutletsPage() {
  const { profile, supabase } = useAuth();
  const { confirm } = useDialog();
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

      const existing = data || [];
      const targetCount = 19;

      if (existing.length > 0 && existing.length <= 5) {
        const needed = targetCount - existing.length;

        // Find the maximum numeric suffix from existing codes (e.g. OTL01 -> 1)
        let maxNum = 0;
        existing.forEach((o) => {
          const matches = o.code ? o.code.match(/\d+/) : null;
          if (matches) {
            const num = parseInt(matches[0], 10);
            if (!isNaN(num) && num > maxNum) {
              maxNum = num;
            }
          }
        });

        const existingNames = new Set(existing.map(o => o.name.toLowerCase()));
        const outletsToInsert = [];
        let nextNum = maxNum + 1;

        for (let i = 0; i < needed; i++) {
          let outletName = `Shawarma Outlet ${nextNum}`;
          let candidateName = `Shawarma ${nextNum}`;
          if (!existingNames.has(candidateName.toLowerCase())) {
            outletName = candidateName;
          }

          const code = `OTL${String(nextNum).padStart(2, '0')}`;
          outletsToInsert.push({
            code,
            name: outletName,
            address: `Alamat Jalan ${outletName}, Area Kota`,
            phone: `081234567${String(nextNum).padStart(2, '0')}`,
            is_active: true
          });
          nextNum++;
        }

        const { error: insertErr } = await supabase.from('outlets').insert(outletsToInsert);
        if (insertErr) {
          console.error("Auto-insert outlets failed:", insertErr);
        } else {
          const { data: refetchedData, error: refetchErr } = await supabase.from('outlets').select('*').order('code');
          if (!refetchErr && refetchedData) {
            existing.splice(0, existing.length, ...refetchedData);
          }
        }
      // Automatic migration block removed so user edits are not overwritten

      setOutlets(existing);
    } catch (err) {
      addToast('Gagal memuat data outlet', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, addToast]);

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

  const handleDelete = async (outletId) => {
    const isConfirmed = await confirm('Apakah Anda yakin ingin menghapus outlet ini? Semua data kode dan nama outlet akan diurutkan kembali otomatis.', { isDanger: true });
    if (!isConfirmed) return;

    setLoading(true);
    try {
      // 1a. Update profiles to clear their outlet_id reference
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({ outlet_id: null })
        .eq('outlet_id', outletId);
      if (profileErr) console.warn("Failed to set profiles outlet_id to null:", profileErr);

      // 1b. Fetch order IDs to delete their corresponding order_items if needed
      const { data: ordersToClean } = await supabase
        .from('orders')
        .select('id')
        .eq('outlet_id', outletId);

      if (ordersToClean && ordersToClean.length > 0) {
        const orderIds = ordersToClean.map(o => o.id);

        // Delete order items first
        const { error: itemErr } = await supabase
          .from('order_items')
          .delete()
          .in('order_id', orderIds);
        if (itemErr) console.warn("Failed to delete order items:", itemErr);
      }

      // 1c. Update orders to set outlet_id to null (try to preserve history if allowed)
      const { error: orderUpdateErr } = await supabase
        .from('orders')
        .update({ outlet_id: null })
        .eq('outlet_id', outletId);

      if (orderUpdateErr) {
        // If updating to null fails (e.g. NOT NULL constraint), delete the orders
        console.warn("Could not set orders outlet_id to null, deleting orders instead:", orderUpdateErr);
        const { error: orderDelErr } = await supabase
          .from('orders')
          .delete()
          .eq('outlet_id', outletId);
        if (orderDelErr) console.warn("Failed to delete orders:", orderDelErr);
      }

      // 1d. Delete products associated with this outlet
      const { error: prodErr } = await supabase
        .from('products')
        .delete()
        .eq('outlet_id', outletId);
      if (prodErr) console.warn("Failed to delete products:", prodErr);

      // 1e. Delete categories associated with this outlet
      const { error: catErr } = await supabase
        .from('categories')
        .delete()
        .eq('outlet_id', outletId);
      if (catErr) console.warn("Failed to delete categories:", catErr);

      // 1f. Delete the outlet itself
      const { error: deleteErr } = await supabase.from('outlets').delete().eq('id', outletId);
      if (deleteErr) throw deleteErr;

      // 2. Fetch remaining outlets in order of current code
      const { data: remaining, error: fetchErr } = await supabase.from('outlets').select('*').order('code');
      if (fetchErr) throw fetchErr;

      const updatedOutlets = remaining || [];

      // 3. Re-sequence all remaining outlets to have sequential codes and names
      for (let i = 0; i < updatedOutlets.length; i++) {
        const newCode = `OTL${String(i + 1).padStart(2, '0')}`;
        const newName = `Shawarma ${i + 1}`;
        const target = updatedOutlets[i];

        if (target.code !== newCode || target.name !== newName) {
          const { error: updateErr } = await supabase
            .from('outlets')
            .update({ code: newCode, name: newName })
            .eq('id', target.id);
          if (updateErr) {
            console.error(`Failed to re-sequence outlet ${target.id}:`, updateErr);
          }
        }
      }

      addToast('Outlet berhasil dihapus dan urutan diperbarui', 'success');
      fetchOutlets();
    } catch (err) {
      addToast('Gagal menghapus: ' + err.message, 'error');
    } finally {
      setLoading(false);
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
                  <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(outlet.id)}
                    style={{ color: 'var(--color-danger)', marginLeft: 'auto' }}>
                    <span className="material-icons-round" style={{ fontSize: '16px' }}>delete</span>Hapus
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
