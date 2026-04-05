/**
 * Login — Email/password sign-in page.
 * Route: /login (standalone, no AppShell)
 *
 * Also handles: password reset request flow.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { signIn, isSupabaseConfigured, supabase } from '../lib/supabaseClient';

type Mode = 'login' | 'forgot';

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<Mode>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // onAuthStateChange in AuthProvider will update session
      // Navigate to home or onboarding will handle routing
      navigate('/');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset email.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Logo / wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            fontSize: '28px', fontWeight: '900', color: '#cc3333',
            letterSpacing: '-0.02em', marginBottom: '4px',
          }}>
            MAFIALIFE
          </div>
          <div style={{ fontSize: '11px', color: '#444', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Alpha · Private Access
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#111', border: '1px solid #222',
          borderRadius: '8px', padding: '28px 24px',
        }}>

          {mode === 'login' && (
            <>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#e0e0e0', marginBottom: '20px' }}>
                Sign In
              </div>

              {!isSupabaseConfigured && (
                <div style={{
                  background: '#1a1500', border: '1px solid #3a2a00',
                  borderRadius: '4px', padding: '10px 12px',
                  marginBottom: '16px', fontSize: '10px', color: '#cc9900', lineHeight: '1.6',
                }}>
                  <strong>DEV MODE</strong> — Supabase not configured. Any credentials will be accepted.
                  The game runs on mock data.
                </div>
              )}

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    data-testid="input-email"
                    style={{
                      width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                      color: '#e0e0e0', padding: '10px 12px', fontSize: '12px',
                      borderRadius: '4px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                    data-testid="input-password"
                    style={{
                      width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                      color: '#e0e0e0', padding: '10px 12px', fontSize: '12px',
                      borderRadius: '4px', outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                </div>

                {error && (
                  <div style={{
                    background: '#1a0808', border: '1px solid #3a1010',
                    borderRadius: '4px', padding: '8px 10px',
                    fontSize: '11px', color: '#cc4444', lineHeight: '1.5',
                  }}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  data-testid="button-login"
                  className="btn btn-primary"
                  style={{
                    width: '100%', padding: '12px', fontSize: '12px',
                    fontWeight: '700', marginTop: '4px',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button
                  onClick={() => { setMode('forgot'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px' }}
                >
                  Forgot password?
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  style={{ background: 'none', border: 'none', color: '#cc3333', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}
                >
                  Create account →
                </button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#e0e0e0', marginBottom: '8px' }}>
                Reset Password
              </div>
              <div style={{ fontSize: '11px', color: '#666', marginBottom: '20px' }}>
                Enter your email and we will send a reset link.
              </div>

              {forgotSent ? (
                <div style={{
                  background: '#0a1a0a', border: '1px solid #2a4a2a',
                  borderRadius: '4px', padding: '14px',
                  fontSize: '11px', color: '#4a9a4a', lineHeight: '1.6',
                }}>
                  Check your inbox. A reset link has been sent to <strong>{email}</strong>.
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      style={{
                        width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                        color: '#e0e0e0', padding: '10px 12px', fontSize: '12px',
                        borderRadius: '4px', outline: 'none', boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {error && (
                    <div style={{
                      background: '#1a0808', border: '1px solid #3a1010',
                      borderRadius: '4px', padding: '8px 10px',
                      fontSize: '11px', color: '#cc4444',
                    }}>
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '12px', fontWeight: '700', opacity: loading ? 0.6 : 1 }}
                  >
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              )}

              <button
                onClick={() => { setMode('login'); setError(null); setForgotSent(false); }}
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px', marginTop: '16px' }}
              >
                ← Back to sign in
              </button>
            </>
          )}

        </div>

        {/* Alpha disclaimer */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: '#333', lineHeight: '1.6' }}>
          This is a closed alpha. Invite only.
        </div>

      </div>
    </div>
  );
}
