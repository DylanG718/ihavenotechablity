/**
 * Login — Email/password sign-in.
 * Route: /login (standalone, no AppShell)
 *
 * Handles:
 *   - Email + password sign in
 *   - Forgot password flow (sends reset email)
 *   - DEV MODE banner when Supabase not configured
 *
 * On success: AuthRouter (in App.tsx) detects the new session via
 * onAuthStateChange and routes to /onboarding or / automatically.
 * No manual navigation needed here.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { signIn, isSupabaseConfigured } from '../lib/supabaseClient';

type Mode = 'login' | 'forgot';

// ─────────────────────────────────────────────
// Input style (shared)
// ─────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0d0d0d',
  border: '1px solid #2a2a2a',
  color: '#e0e0e0',
  padding: '10px 12px',
  fontSize: '13px',
  borderRadius: '4px',
  outline: 'none',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: '9px',
  color: '#555',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  display: 'block',
  marginBottom: '5px',
};

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function Login() {
  const [, navigate] = useLocation();
  const [mode, setMode]       = useState<Mode>('login');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [forgotSent, setForgotSent] = useState(false);

  // ─── Sign in ──────────────────────────────
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      // AuthProvider's onAuthStateChange will pick up the new session.
      // AuthRouter will route to /onboarding or / automatically.
      // No navigate() call needed — let the reactive system drive routing.
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed. Check your email and password.';
      setError(friendlyAuthError(msg));
    } finally {
      setLoading(false);
    }
  }

  // ─── Forgot password ──────────────────────
  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setError(null);
    setLoading(true);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const sb = createClient(
        import.meta.env.VITE_SUPABASE_URL as string,
        import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      );
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/#/reset-password`,
      });
      if (error) throw error;
      setForgotSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#080808',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif",
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>

        {/* Wordmark */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#cc3333', letterSpacing: '-0.02em', marginBottom: '4px' }}>
            THE LAST FIRM
          </div>
          <div style={{ fontSize: '10px', color: '#333', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Alpha · Closed Access
          </div>
        </div>

        {/* Card */}
        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '28px 24px' }}>

          {/* DEV MODE notice */}
          {!isSupabaseConfigured && (
            <div style={{ background: '#1a1500', border: '1px solid #3a2a00', borderRadius: '4px', padding: '10px 12px', marginBottom: '16px', fontSize: '10px', color: '#cc9900', lineHeight: '1.6' }}>
              <strong>DEV MODE</strong> — Supabase not configured.
              Any credentials will work. The game runs on mock data.
            </div>
          )}

          {mode === 'login' && (
            <>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#e0e0e0', marginBottom: '20px' }}>Sign In</div>
              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoComplete="email"
                    data-testid="input-email" style={inputStyle}
                  />
                </div>
                <div>
                  <label style={labelStyle}>Password</label>
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required autoComplete="current-password"
                    data-testid="input-password" style={inputStyle}
                  />
                </div>

                {error && <ErrorBox message={error} />}

                <button
                  type="submit" disabled={loading} data-testid="button-login"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '12px', fontWeight: '700', marginTop: '4px', opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? 'Signing in…' : 'Sign In →'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
                <button onClick={() => { setMode('forgot'); setError(null); }}
                  style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px' }}>
                  Forgot password?
                </button>
                <button onClick={() => navigate('/signup')}
                  style={{ background: 'none', border: 'none', color: '#cc3333', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}>
                  Create account →
                </button>
              </div>
            </>
          )}

          {mode === 'forgot' && (
            <>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#e0e0e0', marginBottom: '6px' }}>Reset Password</div>
              <div style={{ fontSize: '11px', color: '#555', marginBottom: '20px' }}>Enter your email and we will send a reset link.</div>

              {forgotSent ? (
                <div style={{ background: '#0a1a0a', border: '1px solid #2a4a2a', borderRadius: '4px', padding: '14px', fontSize: '11px', color: '#4a9a4a', lineHeight: '1.6' }}>
                  Check your inbox. A reset link was sent to <strong>{email}</strong>.
                </div>
              ) : (
                <form onSubmit={handleForgotPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>Email</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com" required style={inputStyle} />
                  </div>
                  {error && <ErrorBox message={error} />}
                  <button type="submit" disabled={loading} className="btn btn-primary"
                    style={{ width: '100%', padding: '12px', fontSize: '12px', fontWeight: '700', opacity: loading ? 0.6 : 1 }}>
                    {loading ? 'Sending…' : 'Send Reset Link'}
                  </button>
                </form>
              )}

              <button onClick={() => { setMode('login'); setError(null); setForgotSent(false); }}
                style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px', marginTop: '16px' }}>
                ← Back to sign in
              </button>
            </>
          )}

        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: '#2a2a2a' }}>
          Closed alpha. Invite only.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function ErrorBox({ message }: { message: string }) {
  return (
    <div style={{ background: '#1a0808', border: '1px solid #3a1010', borderRadius: '4px', padding: '8px 10px', fontSize: '11px', color: '#cc4444', lineHeight: '1.5' }}>
      {message}
    </div>
  );
}

/** Maps Supabase error messages to friendlier player-facing copy */
function friendlyAuthError(msg: string): string {
  if (msg.toLowerCase().includes('invalid login credentials'))
    return 'Incorrect email or password.';
  if (msg.toLowerCase().includes('email not confirmed'))
    return 'Please confirm your email before signing in.';
  if (msg.toLowerCase().includes('too many requests'))
    return 'Too many attempts. Wait a few minutes and try again.';
  return msg;
}
