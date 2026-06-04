'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';
import { ROLE_LABELS, ROLES } from '@/lib/constants';
import { createBrowserClient } from '@supabase/ssr';

export default function UsersPage() {
  const { profile, supabase } = useAuth();
  const [users, setUsers] = useState([]);
  const [outlets, setOutlets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterOutlet, setFilterOutlet] = useState('all');
  const { toasts, addToast, dismissToast } = useToast();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, outletsRes] = await Promise.all([
        supabase.from('profiles').select('*, outlets(name, code)').order('created_at', { ascending: false }),
        supabase.from('outlets').select('id, name, code').order('code'),
      ]);
      if (usersRes.data) setUsers(usersRes.data);
      if (outletsRes.data) setOutlets(outletsRes.data);
    } catch (err) {
      addToast('Gagal memuat data user', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreateUser = async (form) => {
    try {
      // Create a temporary Supabase client with persistSession: false
      // so it doesn't overwrite the logged-in admin's session in localStorage/cookies
      let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
      let key = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

      const isValidUrl = (str) => {
        try {
          const u = new URL(str);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch (_) {
          return false;
        }
      };

      if (!isValidUrl(url)) {
        url = 'https://placeholder.supabase.co';
      }
      if (!key || key === 'placeholder' || key === 'undefined') {
        key = 'placeholder';
      }

      if (url === 'https://placeholder.supabase.co' || key === 'placeholder') {
        console.warn('Warning: Using fallback Supabase placeholder client credentials in temporary signup client!');
      }

      const tempSupabase = createBrowserClient(
        url,
        key,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            role: form.role,
            outlet_id: form.outlet_id,
          },
        },
      });

      if (authError) throw authError;
      addToast('User berhasil dibuat! Email konfirmasi telah dikirim.', 'success');
      setShowModal(false);
      fetchData();
    } catch (err) {
      addToast('Gagal membuat user: ' + err.message, 'error');
    }
  };

  const toggleUserActive = async (user) => {
    try {
      const { error } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id);
      if (error) throw error;
      addToast(user.is_active ? 'User dinonaktifkan' : 'User diaktifkan', 'success');
      fetchData();
    } catch (err) {
      addToast('Gagal mengupdate status', 'error');
    }
  };

  const handleDeleteUser = async (user) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus user "${user.full_name}" secara permanen? Tindakan ini tidak dapat dibatalkan.`)) return;

    try {
      const { error } = await supabase.rpc('delete_user', { user_id: user.id });
      if (error) throw error;
      addToast('User berhasil dihapus', 'success');
      fetchData();
    } catch (err) {
      let msg = err.message;
      if (msg.includes('function') && msg.includes('does not exist')) {
        msg = 'Jalankan migrasi database di SQL Editor Supabase untuk mengaktifkan fungsi ini.';
      }
      addToast('Gagal menghapus user: ' + msg, 'error');
    }
  };

  const updateRole = async (userId, newRole) => {
    try {
      const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      addToast('Role berhasil diperbarui', 'success');
      fetchData();
    } catch (err) {
      addToast('Gagal mengupdate role', 'error');
    }
  };

  const filteredUsers = filterOutlet === 'all' ? users : users.filter((u) => u.outlet_id === filterOutlet);

  return (
    <>
      <Header title="Kelola User" subtitle="Super Admin" onToggleSidebar={() => {}} />
      <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', gap: 'var(--space-sm)', alignItems: 'center' }}>
            <select className="input" style={{ width: '200px' }}
              value={filterOutlet} onChange={(e) => setFilterOutlet(e.target.value)}>
              <option value="all">Semua Outlet</option>
              {outlets.map((o) => (
                <option key={o.id} value={o.id}>{o.code} - {o.name}</option>
              ))}
            </select>
            <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>{filteredUsers.length} user</span>
          </div>
          <button className="btn btn-accent" onClick={() => setShowModal(true)} id="admin-add-user">
            <span className="material-icons-round">person_add</span>Tambah User
          </button>
        </div>

        {loading ? (
          <div className="loading-screen"><div className="spinner spinner-lg" /><p>Memuat user...</p></div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Outlet</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: 'var(--radius-full)',
                          background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                          color: 'var(--text-inverse)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '11px', fontWeight: '700', flexShrink: 0,
                        }}>
                          {user.full_name?.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '600' }}>{user.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                        {user.outlets?.code || '-'}
                      </span>
                      <br />
                      <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                        {user.outlets?.name || '-'}
                      </span>
                    </td>
                    <td>
                      <select className="input" style={{ padding: '4px 8px', fontSize: 'var(--text-xs)', width: '140px' }}
                        value={user.role} onChange={(e) => updateRole(user.id, e.target.value)}>
                        <option value={ROLES.CASHIER}>{ROLE_LABELS[ROLES.CASHIER]}</option>
                        <option value={ROLES.OUTLET_MANAGER}>{ROLE_LABELS[ROLES.OUTLET_MANAGER]}</option>
                        <option value={ROLES.SUPER_ADMIN}>{ROLE_LABELS[ROLES.SUPER_ADMIN]}</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => toggleUserActive(user)}
                          title={user.is_active ? 'Nonaktifkan User' : 'Aktifkan User'}
                          style={{ color: user.is_active ? 'var(--color-danger)' : 'var(--color-success)', padding: '4px' }}>
                          <span className="material-icons-round" style={{ fontSize: '18px' }}>
                            {user.is_active ? 'person_off' : 'person'}
                          </span>
                        </button>
                        {user.id !== profile?.id && (
                          <button className="btn btn-ghost btn-sm" onClick={() => handleDeleteUser(user)}
                            title="Hapus User"
                            style={{ color: 'var(--color-danger)', padding: '4px' }}>
                            <span className="material-icons-round" style={{ fontSize: '18px' }}>
                              delete
                            </span>
                          </button>
                        )}
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
        <CreateUserModal outlets={outlets} onSave={handleCreateUser} onClose={() => setShowModal(false)} />
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

function CreateUserModal({ outlets, onSave, onClose }) {
  const [form, setForm] = useState({
    email: '', password: '', full_name: '', role: 'cashier', outlet_id: '',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Tambah User Baru</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}><span className="material-icons-round">close</span></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="input-group">
              <label>Nama Lengkap *</label>
              <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required placeholder="Ahmad Kasir" />
            </div>
            <div className="input-group">
              <label>Email *</label>
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required placeholder="nama@email.com" />
            </div>
            <div className="input-group">
              <label>Password *</label>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required placeholder="Min. 6 karakter" minLength={6} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="input-group">
                <label>Outlet *</label>
                <select className="input" value={form.outlet_id} onChange={(e) => setForm({ ...form, outlet_id: e.target.value })} required>
                  <option value="">Pilih Outlet</option>
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>{o.code} - {o.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Role *</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="cashier">Kasir</option>
                  <option value="outlet_manager">Manager Outlet</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Batal</button>
            <button type="submit" className="btn btn-primary"><span className="material-icons-round">person_add</span>Buat User</button>
          </div>
        </form>
      </div>
    </div>
  );
}
