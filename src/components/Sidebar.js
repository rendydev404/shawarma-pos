'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { NAV_ITEMS } from '@/lib/constants';
import { getInitials } from '@/lib/utils';
import { useSidebar } from './SidebarContext';

export default function Sidebar({ collapsed: propCollapsed, onToggle }) {
  const pathname = usePathname();
  const { profile, signOut } = useAuth();
  const { sidebarCollapsed, mobileOpen, setMobileOpen } = useSidebar();

  const collapsed = propCollapsed !== undefined ? propCollapsed : sidebarCollapsed;
  const userRole = profile?.role || 'cashier';
  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(userRole));

  return (
    <aside 
      className={`sidebar-container ${mobileOpen ? 'mobile-open' : ''}`}
    >
      {/* Brand */}
      <div style={sidebarStyles.brand}>
        <div style={sidebarStyles.brandIcon}>🧆</div>
        {!collapsed && (
          <div style={sidebarStyles.brandText}>
            <span style={sidebarStyles.brandName}>Shawarma</span>
            <span style={sidebarStyles.brandLabel}>POS</span>
          </div>
        )}
      </div>

      {/* Outlet Badge */}
      {!collapsed && profile?.outlets && (
        <div style={sidebarStyles.outletBadge}>
          <span className="material-icons-round" style={{ fontSize: '16px', color: 'var(--color-primary)' }}>store</span>
          <span style={sidebarStyles.outletName}>{profile.outlets.name}</span>
        </div>
      )}

      {/* Navigation */}
      <nav style={sidebarStyles.nav}>
        {filteredNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...sidebarStyles.navItem,
                ...(isActive ? sidebarStyles.navItemActive : {}),
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '12px' : '10px 16px',
              }}
              title={collapsed ? item.label : undefined}
              onClick={() => setMobileOpen(false)}
            >
              <span
                className="material-icons-round"
                style={{
                  fontSize: '22px',
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  transition: 'color var(--transition-fast)',
                }}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span style={{
                  ...sidebarStyles.navLabel,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  fontWeight: isActive ? '600' : '500',
                }}>
                  {item.label}
                </span>
              )}
              {isActive && <div style={sidebarStyles.activeIndicator} />}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div style={sidebarStyles.userSection}>
        <div style={sidebarStyles.userInfo}>
          <div style={sidebarStyles.avatar}>
            {getInitials(profile?.full_name)}
          </div>
          {!collapsed && (
            <div style={sidebarStyles.userDetails}>
              <span style={sidebarStyles.userName}>{profile?.full_name || 'User'}</span>
              <span style={sidebarStyles.userRole}>
                {profile?.role === 'super_admin' ? 'Super Admin' :
                  profile?.role === 'outlet_manager' ? 'Manager' : 'Kasir'}
              </span>
            </div>
          )}
        </div>
        <button
          onClick={signOut}
          style={{
            ...sidebarStyles.logoutBtn,
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
          title="Keluar"
          id="sidebar-logout"
        >
          <span className="material-icons-round" style={{ fontSize: '20px' }}>logout</span>
          {!collapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}

const sidebarStyles = {
  container: {
    position: 'fixed',
    left: 0,
    top: 0,
    bottom: 0,
    background: 'var(--bg-secondary)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width var(--transition-base)',
    zIndex: 'var(--z-sticky)',
    overflow: 'hidden',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 16px',
    borderBottom: '1px solid var(--border-color)',
  },
  brandIcon: {
    fontSize: '32px',
    flexShrink: 0,
    filter: 'drop-shadow(0 2px 8px rgba(245, 158, 11, 0.3))',
  },
  brandText: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
  },
  brandName: {
    fontFamily: 'var(--font-heading)',
    fontWeight: '800',
    fontSize: 'var(--text-lg)',
    background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  brandLabel: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    fontWeight: '500',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  outletBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '12px 12px 0',
    padding: '8px 12px',
    background: 'var(--color-primary-subtle)',
    borderRadius: 'var(--radius-md)',
    border: '1px solid rgba(245, 158, 11, 0.15)',
  },
  outletName: {
    fontSize: 'var(--text-xs)',
    fontWeight: '600',
    color: 'var(--color-primary)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  nav: {
    flex: 1,
    padding: '16px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 16px',
    borderRadius: 'var(--radius-md)',
    textDecoration: 'none',
    transition: 'all var(--transition-fast)',
    position: 'relative',
    cursor: 'pointer',
  },
  navItemActive: {
    background: 'var(--color-primary-subtle)',
    borderColor: 'rgba(245, 158, 11, 0.15)',
  },
  navLabel: {
    fontSize: 'var(--text-sm)',
    whiteSpace: 'nowrap',
    transition: 'color var(--transition-fast)',
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '20px',
    background: 'var(--color-primary)',
    borderRadius: '0 3px 3px 0',
  },
  userSection: {
    padding: '12px',
    borderTop: '1px solid var(--border-color)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    marginBottom: '8px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: 'var(--radius-full)',
    background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
    color: 'var(--text-inverse)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 'var(--text-xs)',
    fontWeight: '700',
    flexShrink: 0,
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  },
  userName: {
    fontSize: 'var(--text-sm)',
    fontWeight: '600',
    color: 'var(--text-primary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userRole: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    width: '100%',
    padding: '8px 12px',
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    transition: 'all var(--transition-fast)',
  },
};
