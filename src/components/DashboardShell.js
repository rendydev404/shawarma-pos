'use client';

import { AuthProvider, useAuth } from './AuthProvider';
import Sidebar from './Sidebar';
import Toast, { useToast } from './ui/Toast';
import { SidebarProvider, useSidebar } from './SidebarContext';

export default function DashboardShell({ user, profile, children }) {
  return (
    <AuthProvider initialUser={user} initialProfile={profile}>
      <SidebarProvider>
        <DashboardShellContent profile={profile}>
          {children}
        </DashboardShellContent>
      </SidebarProvider>
    </AuthProvider>
  );
}

function DashboardShellContent({ profile, children }) {
  const { sidebarCollapsed, mobileOpen, setMobileOpen } = useSidebar();
  const { toasts, dismissToast } = useToast();

  const isUserActive = profile?.is_active !== false;
  // Super admin doesn't require an active outlet
  const isOutletActive = profile?.role === 'super_admin' || !profile?.outlets || profile?.outlets?.is_active !== false;

  return (
    <div className={`shell-container ${sidebarCollapsed ? 'sidebar-collapsed-state' : ''}`} style={shellStyles.container}>
      {!isUserActive || !isOutletActive ? (
        <DeactivatedModal profile={profile} />
      ) : (
        <>
          <Sidebar />
          {mobileOpen && (
            <div 
              className="sidebar-backdrop" 
              onClick={() => setMobileOpen(false)}
            />
          )}
          <main className="main-content" style={shellStyles.main}>
            {children}
          </main>
        </>
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

// Premium Deactivated Modal Component
function DeactivatedModal({ profile }) {
  const { signOut } = useAuth();
  const isUserInactive = profile?.is_active === false;
  
  const title = isUserInactive ? 'Akun Anda Dinonaktifkan' : 'Outlet Dinonaktifkan';
  const message = isUserInactive 
    ? 'Maaf, akun Anda telah dinonaktifkan oleh Administrator. Silakan hubungi Super Admin untuk informasi lebih lanjut.'
    : `Maaf, outlet "${profile?.outlets?.name || 'terkait'}" sedang dinonaktifkan oleh Administrator. Segala aktivitas operasional ditangguhkan sementara.`;

  return (
    <div className="modal-overlay" style={{ background: 'var(--bg-primary)' }}>
      <div className="modal animate-scale-in" style={{ maxWidth: '440px', padding: 'var(--space-xl)', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: 'var(--radius-full)',
          background: 'var(--color-danger-bg)', display: 'inline-flex',
          alignItems: 'center', justifyContent: 'center', marginBottom: '20px',
          boxShadow: '0 0 24px rgba(239, 68, 68, 0.2)'
        }}>
          <span className="material-icons-round" style={{ fontSize: '44px', color: 'var(--color-danger)' }}>block</span>
        </div>
        
        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'var(--text-xl)', color: 'var(--text-primary)', marginBottom: '12px' }}>
          {title}
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.6, marginBottom: '24px' }}>
          {message}
        </p>
        
        <button className="btn btn-danger" onClick={signOut} style={{ width: '100%' }} id="btn-logout-deactivated">
          <span className="material-icons-round">logout</span>
          Keluar ke Halaman Login
        </button>
      </div>
    </div>
  );
}

const shellStyles = {
  container: {
    minHeight: '100vh',
    position: 'relative',
  },
  main: {
    minHeight: '100vh',
  },
};
