'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';
import { formatRupiah, formatDate, formatTime } from '@/lib/utils';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/lib/constants';

export default function OrdersPage() {
  const { profile, supabase } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: 'all', payment: 'all', search: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const { toasts, addToast, dismissToast } = useToast();

  const outletId = profile?.outlet_id || profile?.outlets?.id;

  const fetchOrders = useCallback(async () => {
    if (!outletId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select('*, profiles(full_name)')
        .eq('outlet_id', outletId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (filter.status !== 'all') query = query.eq('status', filter.status);
      if (filter.payment !== 'all') query = query.eq('payment_method', filter.payment);

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (err) {
      addToast('Gagal memuat data order', 'error');
    } finally {
      setLoading(false);
    }
  }, [outletId, supabase, filter.status, filter.payment]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const viewOrderDetail = async (order) => {
    setSelectedOrder(order);
    try {
      const { data } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);
      setOrderItems(data || []);
    } catch (err) {
      addToast('Gagal memuat detail order', 'error');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!confirm('Batalkan order ini?')) return;
    try {
      const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
      if (error) throw error;
      addToast('Order dibatalkan', 'warning');
      fetchOrders();
      setSelectedOrder(null);
    } catch (err) {
      addToast('Gagal membatalkan order', 'error');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filter.search) {
      const q = filter.search.toLowerCase();
      return o.order_number?.toLowerCase().includes(q) ||
        o.customer_name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <Header title="Riwayat Order" subtitle={profile?.outlets?.name} onToggleSidebar={() => {}} />
      <div style={orderStyles.page}>
        {/* Filters */}
        {outletId && (
          <div style={orderStyles.filters}>
            <div className="input-with-icon" style={{ flex: 1, maxWidth: '300px' }}>
              <span className="material-icons-round">search</span>
              <input className="input" placeholder="Cari nomor order / pelanggan..."
                value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} id="orders-search" />
            </div>
            <select className="input" style={{ width: '160px' }}
              value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="all">Semua Status</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
            <select className="input" style={{ width: '140px' }}
              value={filter.payment} onChange={(e) => setFilter({ ...filter, payment: e.target.value })}>
              <option value="all">Semua Bayar</option>
              <option value="cash">Cash</option>
              <option value="qris">QRIS</option>
            </select>
          </div>
        )}

        {/* Orders Table */}
        {!outletId ? (
          <div style={orderStyles.emptyHero} className="animate-fade-in">
            <div style={orderStyles.emptyIconWrap}>
              <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>store</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Belum Ada Outlet</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', maxWidth: '360px', textAlign: 'center', lineHeight: 1.6, marginTop: '8px' }}>
              Akun Super Admin tidak terhubung ke outlet. Silakan assign outlet terlebih dahulu melalui <strong style={{ color: 'var(--color-primary)' }}>Kelola User</strong>.
            </p>
          </div>
        ) : loading ? (
          <div className="loading-screen"><div className="spinner spinner-lg" /><p>Memuat order...</p></div>
        ) : filteredOrders.length === 0 ? (
          <div style={orderStyles.emptyHero} className="animate-fade-in">
            <div style={orderStyles.emptyIconWrap}>
              <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>receipt_long</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Belum Ada Order</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>Hari ini belum ada transaksi masuk dari outlet ini.</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>No. Order</th>
                  <th>Waktu</th>
                  <th>Pelanggan</th>
                  <th>Kasir</th>
                  <th>Pembayaran</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '700', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                      {order.order_number}
                    </td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td>{order.customer_name || '-'}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }}>{order.profiles?.full_name || '-'}</td>
                    <td>
                      <span className="badge badge-info">{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</span>
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--color-primary-light)' }}>
                      {formatRupiah(order.total)}
                    </td>
                    <td>
                      <span className={`badge ${order.status === 'completed' ? 'badge-success' : order.status === 'cancelled' ? 'badge-danger' : 'badge-warning'}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={() => viewOrderDetail(order)}>
                        <span className="material-icons-round" style={{ fontSize: '18px' }}>visibility</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Detail Order - {selectedOrder.order_number}</h2>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedOrder(null)}>
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '20px' }}>
                <div><span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Tanggal</span><br />{formatDate(selectedOrder.created_at)}</div>
                <div><span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Kasir</span><br />{selectedOrder.profiles?.full_name || '-'}</div>
                <div><span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Pelanggan</span><br />{selectedOrder.customer_name || '-'}</div>
                <div><span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>Pembayaran</span><br />{PAYMENT_METHOD_LABELS[selectedOrder.payment_method]}</div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr><th>Produk</th><th>Harga</th><th>Qty</th><th>Subtotal</th></tr>
                  </thead>
                  <tbody>
                    {orderItems.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '600' }}>{item.product_name}</td>
                        <td>{formatRupiah(item.product_price)}</td>
                        <td>{item.quantity}</td>
                        <td style={{ fontWeight: '600' }}>{formatRupiah(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: '16px', textAlign: 'right' }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Subtotal: {formatRupiah(selectedOrder.subtotal)}</div>
                {selectedOrder.tax > 0 && (
                  <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>PPN 11%: {formatRupiah(selectedOrder.tax)}</div>
                )}
                <div style={{ fontWeight: '800', fontSize: 'var(--text-xl)', color: 'var(--color-primary-light)', marginTop: '4px' }}>
                  Total: {formatRupiah(selectedOrder.total)}
                </div>
                {selectedOrder.payment_method === 'cash' && (
                  <>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginTop: '8px' }}>Bayar: {formatRupiah(selectedOrder.amount_paid)}</div>
                    <div style={{ color: 'var(--color-success)', fontSize: 'var(--text-sm)' }}>Kembalian: {formatRupiah(selectedOrder.change_amount)}</div>
                  </>
                )}
              </div>
            </div>
            <div className="modal-footer">
              {selectedOrder.status === 'completed' && (profile?.role === 'super_admin' || profile?.role === 'outlet_manager') && (
                <button className="btn btn-danger" onClick={() => cancelOrder(selectedOrder.id)}>
                  <span className="material-icons-round">cancel</span>Batalkan Order
                </button>
              )}
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

const orderStyles = {
  page: { padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  filters: { display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap', alignItems: 'center' },
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
    marginBottom: '16px',
  },
};
