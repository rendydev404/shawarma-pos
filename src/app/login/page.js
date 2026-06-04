'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message.includes('Invalid login')) {
          setError('Email atau password salah');
        } else {
          setError(authError.message);
        }
        return;
      }

      router.push('/pos');
      router.refresh();
    } catch (err) {
      setError('Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Ambient decoration */}
      <div style={styles.ambientOrb1} />
      <div style={styles.ambientOrb2} />

      <div style={styles.loginCard} className="animate-scale-in">
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🧆</div>
          <h1 style={styles.brandName}>Shawarma POS</h1>
          <p style={styles.brandSubtitle}>Point of Sale System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} style={styles.form}>
          {error && (
            <div style={styles.errorBox} className="animate-slide-down">
              <span className="material-icons-round" style={{ fontSize: '18px' }}>error_outline</span>
              <span>{error}</span>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="login-email">Email</label>
            <div className="input-with-icon">
              <span className="material-icons-round">mail</span>
              <input
                id="login-email"
                type="email"
                className="input"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="login-password">Password</label>
            <div className="input-with-icon" style={{ position: 'relative' }}>
              <span className="material-icons-round">lock</span>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                className="input"
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: '44px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                tabIndex={-1}
              >
                <span className="material-icons-round" style={{ fontSize: '20px' }}>
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            disabled={loading}
            style={styles.loginButton}
            id="login-submit"
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                Masuk...
              </>
            ) : (
              <>
                <span className="material-icons-round">login</span>
                Masuk
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>© 2026 Shawarma POS. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'var(--space-lg)',
    position: 'relative',
    overflow: 'hidden',
  },
  ambientOrb1: {
    position: 'fixed',
    top: '-20%',
    right: '-10%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  ambientOrb2: {
    position: 'fixed',
    bottom: '-20%',
    left: '-10%',
    width: '500px',
    height: '500px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(13, 148, 136, 0.06) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  loginCard: {
    width: '100%',
    maxWidth: '420px',
    background: 'var(--bg-glass-strong)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-xl)',
    boxShadow: 'var(--shadow-xl)',
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  logoSection: {
    textAlign: 'center',
    padding: '40px 32px 24px',
    borderBottom: '1px solid var(--border-color)',
    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.05), transparent)',
  },
  logoIcon: {
    fontSize: '56px',
    marginBottom: '12px',
    filter: 'drop-shadow(0 4px 12px rgba(245, 158, 11, 0.3))',
  },
  brandName: {
    fontFamily: 'var(--font-heading)',
    fontSize: 'var(--text-2xl)',
    fontWeight: '800',
    background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-primary))',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '4px',
  },
  brandSubtitle: {
    fontSize: 'var(--text-sm)',
    color: 'var(--text-tertiary)',
    fontWeight: '400',
  },
  form: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'var(--color-danger-bg)',
    color: 'var(--color-danger)',
    borderRadius: 'var(--radius-md)',
    fontSize: 'var(--text-sm)',
    fontWeight: '500',
    border: '1px solid rgba(239, 68, 68, 0.2)',
  },
  eyeButton: {
    position: 'absolute',
    right: '8px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: 'var(--text-tertiary)',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--radius-sm)',
    transition: 'color var(--transition-fast)',
  },
  loginButton: {
    width: '100%',
    marginTop: '8px',
  },
  footer: {
    padding: '16px 32px 24px',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 'var(--text-xs)',
    color: 'var(--text-tertiary)',
  },
};
