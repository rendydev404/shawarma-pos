'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import Header from '@/components/Header';
import Toast, { useToast } from '@/components/ui/Toast';
import { formatRupiah, formatDateShort } from '@/lib/utils';

export default function ReportsPage() {
  const { profile, supabase } = useAuth();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(7);
  const { toasts, addToast, dismissToast } = useToast();

  const outletId = profile?.outlet_id || profile?.outlets?.id;

  const fetchReports = useCallback(async () => {
    if (!outletId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [statsRes, chartRes, topRes] = await Promise.all([
        supabase.rpc('get_dashboard_stats', { p_outlet_id: outletId }),
        supabase.rpc('get_sales_chart', { p_outlet_id: outletId, p_days: days }),
        supabase.rpc('get_top_products', { p_outlet_id: outletId, p_limit: 10 }),
      ]);

      if (statsRes.data) setStats(statsRes.data);
      if (chartRes.data) setChartData(chartRes.data || []);
      if (topRes.data) setTopProducts(topRes.data || []);
    } catch (err) {
      console.error('Error fetching reports:', err);
      addToast('Gagal memuat laporan', 'error');
    } finally {
      setLoading(false);
    }
  }, [outletId, supabase, days]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // Calculate chart max value for scaling
  const maxRevenue = chartData.length > 0
    ? Math.max(...chartData.map((d) => d.revenue || 0), 1)
    : 1;

  // Revenue change percentage
  const revenueChange = stats?.yesterday_revenue > 0
    ? Math.round(((stats.today_revenue - stats.yesterday_revenue) / stats.yesterday_revenue) * 100)
    : 0;

  // CSV export
  const exportCSV = () => {
    if (!chartData.length) return;
    const headers = 'Tanggal,Revenue,Orders\n';
    const rows = chartData.map((d) => `${d.date},${d.revenue},${d.orders}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-${profile?.outlets?.code || 'outlet'}-${days}hari.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Laporan berhasil diexport', 'success');
  };

  return (
    <>
      <Header title="Laporan" subtitle={profile?.outlets?.name} onToggleSidebar={() => {}} />
      <div style={reportStyles.page}>
        {!outletId ? (
          <div style={reportStyles.emptyHero} className="animate-fade-in">
            <div style={reportStyles.emptyIconWrap}>
              <span className="material-icons-round" style={{ fontSize: '64px', color: 'var(--color-primary)' }}>store</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', marginTop: '16px' }}>Belum Ada Outlet</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', maxWidth: '360px', textAlign: 'center', lineHeight: 1.6, marginTop: '8px' }}>
              Akun Super Admin tidak terhubung ke outlet. Silakan assign outlet terlebih dahulu melalui <strong style={{ color: 'var(--color-primary)' }}>Kelola User</strong>.
            </p>
          </div>
        ) : loading ? (
          <div className="loading-screen"><div className="spinner spinner-lg" /><p>Memuat laporan...</p></div>
        ) : (
          <>
            {/* Stat Cards */}
            <div style={reportStyles.statsGrid}>
              <StatCard
                icon="receipt_long"
                label="Order Hari Ini"
                value={stats?.today_orders || 0}
                color="var(--color-primary)"
              />
              <StatCard
                icon="payments"
                label="Revenue Hari Ini"
                value={formatRupiah(stats?.today_revenue || 0)}
                change={revenueChange}
                color="var(--color-success)"
              />
              <StatCard
                icon="analytics"
                label="Rata-rata Order"
                value={formatRupiah(stats?.today_avg || 0)}
                color="var(--color-accent)"
              />
              <StatCard
                icon="trending_up"
                label="Revenue Kemarin"
                value={formatRupiah(stats?.yesterday_revenue || 0)}
                color="var(--color-info)"
              />
            </div>

            {/* Chart Section */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <div style={reportStyles.chartHeader}>
                <h3 style={{ fontFamily: 'var(--font-heading)' }}>Grafik Penjualan</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {[7, 14, 30].map((d) => (
                    <button key={d} className={`btn btn-sm ${days === d ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setDays(d)}>{d} Hari</button>
                  ))}
                  <button className="btn btn-sm btn-accent" onClick={exportCSV} id="report-export">
                    <span className="material-icons-round" style={{ fontSize: '16px' }}>download</span>
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Simple Bar Chart */}
              <div className="chart-container" style={{ overflowX: 'auto', paddingBottom: '8px' }}>
                <div style={{ ...reportStyles.chart, minWidth: days > 7 ? '640px' : 'auto' }}>
                  {chartData.length === 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-tertiary)', gap: '8px' }}>
                      <span className="material-icons-round" style={{ fontSize: '32px' }}>analytics</span>
                      <span style={{ fontSize: 'var(--text-sm)' }}>Belum ada data transaksi untuk grafik</span>
                    </div>
                  ) : (
                    chartData.map((data, idx) => (
                      <div key={idx} style={reportStyles.chartBar}>
                        <div style={reportStyles.barContainer}>
                          <div
                            style={{
                              ...reportStyles.bar,
                              height: `${Math.max((data.revenue / maxRevenue) * 100, 2)}%`,
                            }}
                            title={`${formatRupiah(data.revenue)} - ${data.orders} orders`}
                          >
                            {data.revenue > 0 && (
                              <span style={reportStyles.barValue}>
                                {data.revenue >= 1000000
                                  ? `${(data.revenue / 1000000).toFixed(1)}jt`
                                  : `${Math.round(data.revenue / 1000)}rb`}
                              </span>
                            )}
                          </div>
                        </div>
                        <span style={reportStyles.barLabel}>
                          {new Date(data.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

            {/* Top Products */}
            <div className="card" style={{ padding: 'var(--space-lg)' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: 'var(--space-md)' }}>
                Produk Terlaris (30 Hari)
              </h3>
              {topProducts && topProducts.length > 0 ? (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Produk</th>
                        <th>Qty Terjual</th>
                        <th>Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topProducts.map((prod, idx) => (
                        <tr key={idx}>
                          <td>
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              width: '24px', height: '24px', borderRadius: 'var(--radius-full)',
                              background: idx < 3 ? 'var(--color-primary-subtle)' : 'var(--bg-tertiary)',
                              color: idx < 3 ? 'var(--color-primary)' : 'var(--text-tertiary)',
                              fontSize: 'var(--text-xs)', fontWeight: '700',
                            }}>
                              {idx + 1}
                            </span>
                          </td>
                          <td style={{ fontWeight: '600' }}>{prod.name}</td>
                          <td>{prod.total_qty}</td>
                          <td style={{ fontWeight: '600', color: 'var(--color-primary-light)' }}>{formatRupiah(prod.total_revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state" style={{ padding: 'var(--space-lg)' }}>
                  <span className="material-icons-round">bar_chart</span>
                  <p>Belum ada data penjualan</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, change, color }) {
  return (
    <div className="card card-glow" style={{ padding: 'var(--space-lg)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: '500' }}>{label}</p>
          <p style={{ fontSize: 'var(--text-2xl)', fontWeight: '800', fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>
            {value}
          </p>
          {change !== undefined && change !== 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '8px' }}>
              <span className="material-icons-round" style={{ fontSize: '16px', color: change > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {change > 0 ? 'trending_up' : 'trending_down'}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', fontWeight: '600', color: change > 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                {change > 0 ? '+' : ''}{change}% vs kemarin
              </span>
            </div>
          )}
        </div>
        <div style={{
          width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
          background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="material-icons-round" style={{ color, fontSize: '24px' }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

const reportStyles = {
  page: { padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-md)' },
  chartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', flexWrap: 'wrap', gap: 'var(--space-sm)' },
  chart: { display: 'flex', alignItems: 'flex-end', gap: '4px', height: '250px', paddingTop: 'var(--space-md)' },
  chartBar: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minWidth: 0 },
  barContainer: { width: '100%', height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' },
  bar: {
    width: '80%', maxWidth: '40px', borderRadius: '6px 6px 0 0',
    background: 'linear-gradient(180deg, var(--color-primary), var(--color-primary-dark))',
    transition: 'height 0.5s ease-out', position: 'relative', minHeight: '4px',
    boxShadow: '0 0 8px var(--color-primary-glow)',
  },
  barValue: { position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: '600', color: 'var(--text-secondary)', whiteSpace: 'nowrap' },
  barLabel: { fontSize: '9px', color: 'var(--text-tertiary)', textAlign: 'center', whiteSpace: 'nowrap' },
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
