'use client';

import { useAuth } from './AuthProvider';
import { formatDate } from '@/lib/utils';
import { useSidebar } from './SidebarContext';

export default function Header({ title, subtitle, onToggleSidebar }) {
  const { profile } = useAuth();
  const { toggleSidebar } = useSidebar();
  const now = new Date();

  // If onToggleSidebar is a dummy/empty function, fall back to global context toggleSidebar
  const isDummy = onToggleSidebar && (onToggleSidebar.toString() === '() => {}' || onToggleSidebar.toString() === '()=>{}');
  const handleToggle = (onToggleSidebar && !isDummy) ? onToggleSidebar : toggleSidebar;

  return (
    <header style={headerStyles.container}>
      <div style={headerStyles.left}>
        <button
          onClick={handleToggle}
          style={headerStyles.menuButton}
          className="btn-ghost btn-icon"
          id="header-toggle-sidebar"
        >
          <span className="material-icons-round">menu</span>
        </button>
        <div>
          <h1 style={headerStyles.title}>{title}</h1>
          {subtitle && <p style={headerStyles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      <div style={headerStyles.right} className="header-date-container">
        <div style={headerStyles.dateTime}>
          <span className="material-icons-round" style={{ fontSize: '18px', color: 'var(--text-tertiary)' }}>
            calendar_today
          </span>
          <span style={headerStyles.dateText}>
            {formatDate(now, { hour: undefined, minute: undefined })}
          </span>
        </div>
      </div>
    </header>
  );
}

const headerStyles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 var(--space-lg)',
    height: 'var(--header-height)',
    borderBottom: '1px solid var(--border-color)',
    background: 'var(--bg-glass)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    position: 'sticky',
    top: 0,
    zIndex: 'var(--z-sticky)',
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
  },
  menuButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 'var(--text-xl)',
    fontWeight: '700',
    fontFamily: 'var(--font-heading)',
  },
  subtitle: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
    marginTop: '2px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-md)',
  },
  dateTime: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  dateText: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
};
