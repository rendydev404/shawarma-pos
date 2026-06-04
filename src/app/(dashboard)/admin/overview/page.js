'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';
import { formatRupiah } from '@/lib/utils';

export default function OverviewPage() {
  const { supabase } = useAuth();
  const [outlets, setOutlets] = useState([]);
  const [outletStats, setOutletStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);
  const { toasts, addToast, dismissToast } = useToast();

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all outlets
      const { data: outletsData } = await supabase.from('outlets').select('*').eq('is_active', true).order('code');
      if (!outletsData) {
        setLoading(false);
        return;
      }
      setOutlets(outletsData);

      // Fetch today's stats for each outlet
      let totalRev = 0;
      let totalOrd = 0;
      const stats = {};

      for (const outlet of outletsData) {
        const { data } = await supabase.rpc('get_dashboard_stats', { p_outlet_id: outlet.id });
        if (data) {
          stats[outlet.id] = data;
          totalRev += data.today_revenue || 0;
          totalOrd += data.today_orders || 0;
        }
      }

      setOutletStats(stats);
      setTotalRevenue(totalRev);
      setTotalOrders(totalOrd);
    } catch (err) {
      console.error('Error:', err);
      addToast('Gagal memuat overview', 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  // Sort outlets by revenue
  const sortedOutlets = [...outlets].sort((a, b) => {
    const revA = outletStats[a.id]?.today_revenue || 0;
    const revB = outletStats[b.id]?.today_revenue || 0;
    return revB - revA;
  });

  return (
    <>
      <Header title="Overview Semua Outlet" subtitle="Super Admin Dashboard" onToggleSidebar={() => {}} />
      <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
        {loading ? (
          <div className="loading-screen"><div className="spinner spinner-lg" /><p>Memuat data semua outlet...</p></div>
        ) : outlets.length === 0 ? (
          <div style={overviewStyles.emptyHero} className="animate-fade-in">
            <div style={overviewStyles.emptyIconWrap}>
              <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>storefront</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Belum Ada Outlet Terdaftar</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', maxWidth: '360px', textAlign: 'center', lineHeight: 1.6, marginTop: '8px' }}>
              Belum ada outlet aktif di sistem ini. Silakan buat outlet baru terlebih dahulu melalui menu <strong style={{ color: 'var(--color-primary)' }}>Kelola Outlet</strong>.
            </p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
              <div className="card" style={{ padding: 'var(--space-lg)', borderLeft: '3px solid var(--color-primary)' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Total Revenue Hari Ini</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--color-primary-light)' }}>
                  {formatRupiah(totalRevenue)}
                </p>
              </div>
              <div className="card" style={{ padding: 'var(--space-lg)', borderLeft: '3px solid var(--color-accent)' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Total Order Hari Ini</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {totalOrders}
                </p>
              </div>
              <div className="card" style={{ padding: 'var(--space-lg)', borderLeft: '3px solid var(--color-success)' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Outlet Aktif</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {outlets.length}
                </p>
              </div>
              <div className="card" style={{ padding: 'var(--space-lg)', borderLeft: '3px solid var(--color-info)' }}>
                <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Rata-rata/Outlet</p>
                <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '800', fontFamily: 'var(--font-heading)' }}>
                  {formatRupiah(outlets.length > 0 ? Math.round(totalRevenue / outlets.length) : 0)}
                </p>
              </div>
            </div>

            {/* Outlet Performance Table */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-md)' }}>
                Performa Outlet Hari Ini
              </h3>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Outlet</th>
                      <th>Order</th>
                      <th>Revenue</th>
                      <th>Rata-rata</th>
                      <th>vs Kemarin</th>
                      <th>Kontribusi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOutlets.map((outlet, idx) => {
                      const stat = outletStats[outlet.id] || {};
                      const contribution = totalRevenue > 0 ? ((stat.today_revenue || 0) / totalRevenue * 100).toFixed(1) : 0;
                      const change = stat.yesterday_revenue > 0
                        ? Math.round(((stat.today_revenue - stat.yesterday_revenue) / stat.yesterday_revenue) * 100)
                        : 0;

                      return (
                        <tr key={outlet.id}>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '24px', height: '24px', borderRadius: 'var(--radius-full)',
                              background: idx < 3 ? 'var(--color-primary-subtle)' : 'var(--bg-tertiary)',
                              color: idx < 3 ? 'var(--color-primary)' : 'var(--text-tertiary)',
                              fontSize: '11px', fontWeight: '700',
                            }}>
                              {idx + 1}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontWeight: '700' }}>{outlet.name}</span>
                            <br />
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>{outlet.code}</span>
                          </td>
                          <td style={{ fontWeight: '600' }}>{stat.today_orders || 0}</td>
                          <td style={{ fontWeight: '700', color: 'var(--color-primary-light)' }}>{formatRupiah(stat.today_revenue || 0)}</td>
                          <td>{formatRupiah(stat.today_avg || 0)}</td>
                          <td>
                            {change !== 0 && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: '2px',
                                fontSize: 'var(--text-xs)', fontWeight: '600',
                                color: change > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                              }}>
                                <span className="material-icons-round" style={{ fontSize: '14px' }}>
                                  {change > 0 ? 'arrow_upward' : 'arrow_downward'}
                                </span>
                                {Math.abs(change)}%
                              </span>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                height: '6px', borderRadius: '3px', background: 'var(--bg-tertiary)',
                                flex: 1, overflow: 'hidden',
                              }}>
                                <div style={{
                                  height: '100%', borderRadius: '3px',
                                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-primary-light))',
                                  width: `${contribution}%`,
                                  transition: 'width 0.5s ease-out',
                                }} />
                              </div>
                              <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', minWidth: '40px' }}>{contribution}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

const overviewStyles = {
  emptyHero: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-2xl)',
    textAlign: 'center',
    minHeight: '350px',
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
