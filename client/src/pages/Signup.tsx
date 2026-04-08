/**
 * Signup — New account creation.
 * Route: /signup (standalone, no AppShell)
 *
 * Flow:
 *   1. Collect email, username, street name (alias), password
 *   2. Call signUp() → creates Supabase auth user + player row
 *   3a. If email confirmation required → show "check your inbox" screen
 *   3b. If no confirmation (disabled in Supabase) → onAuthStateChange
 *       fires → AuthRouter routes to /onboarding automatically
 *
 * NOTE: After signup, the routing is reactive — we do not navigate()
 * manually. AuthProvider's onAuthStateChange handles it.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { signUp, isSupabaseConfigured } from '../lib/supabaseClient';
import { Analytics } from '../lib/analyticsEngine';

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
  color: '#e0e0e0', padding: '10px 12px', fontSize: '13px',
  borderRadius: '4px', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};

const labelStyle: React.CSSProperties = {
  fontSize: '9px', color: '#555', letterSpacing: '0.08em',
  textTransform: 'uppercase', display: 'block', marginBottom: '5px',
};

export default function Signup() {
  const [, navigate] = useLocation();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [alias, setAlias]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !username.trim()) return;

    setError(null);
    setLoading(true);

    try {
      Analytics.signupStarted?.('new-user');

      const result = await signUp(
        email.trim(),
        password,
        username.trim(),
        alias.trim() || username.trim(),
      );

      if (result.error) {
        setError(friendlySignupError(result.error));
        return;
      }

      if (result.requiresEmailConfirmation) {
        // Email confirmation is enabled in Supabase
        // Show the "check your inbox" screen
        setAwaitingConfirmation(true);
        return;
      }

      // No email confirmation required — session is active.
      // onAuthStateChange in AuthProvider will detect the new session.
      // AuthRouter will route to /onboarding automatically.
      // Nothing else to do here.

      Analytics.accountCreated(result.playerId ?? 'new-player', 'RUNNER');

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // ── Email confirmation waiting screen ─────
  if (awaitingConfirmation) {
    return (
      <div style={{
        minHeight: '100vh', background: '#080808',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#cc3333', marginBottom: '32px' }}>
            THE LAST FIRM
          </div>
          <div style={{ background: '#0f0f0f', border: '1px solid #2a4a2a', borderRadius: '8px', padding: '32px 24px' }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#4a9a4a', marginBottom: '12px' }}>
              Check your email.
            </div>
            <div style={{ fontSize: '12px', color: '#777', lineHeight: '1.7', marginBottom: '20px' }}>
              We sent a confirmation link to{' '}
              <strong style={{ color: '#e0e0e0' }}>{email}</strong>.
              Click the link to verify your account and complete sign-up.
            </div>
            <div style={{ fontSize: '11px', color: '#555', marginBottom: '24px' }}>
              Once confirmed, come back and sign in.
            </div>
            <button onClick={() => navigate('/login')} className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '12px', fontWeight: '700' }}>
              Go to Sign In →
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080808',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
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

        <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '28px 24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#e0e0e0', marginBottom: '20px' }}>Create Account</div>

          {!isSupabaseConfigured && (
            <div style={{ background: '#1a1500', border: '1px solid #3a2a00', borderRadius: '4px', padding: '10px 12px', marginBottom: '16px', fontSize: '10px', color: '#cc9900', lineHeight: '1.6' }}>
              <strong>DEV MODE</strong> — Supabase not configured. Signup goes straight to onboarding.
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required autoComplete="email"
                data-testid="input-signup-email" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Username</label>
              <input type="text" value={username} onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                placeholder="johnny_guns" required autoComplete="username"
                data-testid="input-signup-username" maxLength={24} style={inputStyle} />
              <div style={{ fontSize: '9px', color: '#444', marginTop: '3px' }}>
                Letters, numbers, and underscores only. 3–24 characters.
              </div>
            </div>

            <div>
              <label style={labelStyle}>Street Name <span style={{ color: '#333' }}>(optional)</span></label>
              <input type="text" value={alias} onChange={e => setAlias(e.target.value)}
                placeholder="Johnny Two Fingers" autoComplete="off"
                data-testid="input-signup-alias" maxLength={32} style={inputStyle} />
              <div style={{ fontSize: '9px', color: '#444', marginTop: '3px' }}>
                The name other players will see. Defaults to your username.
              </div>
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="min 8 characters" required autoComplete="new-password"
                minLength={8} data-testid="input-signup-password" style={inputStyle} />
            </div>

            {error && (
              <div style={{ background: '#1a0808', border: '1px solid #3a1010', borderRadius: '4px', padding: '8px 10px', fontSize: '11px', color: '#cc4444', lineHeight: '1.5' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} data-testid="button-signup"
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '12px', fontWeight: '700', marginTop: '4px', opacity: loading ? 0.6 : 1 }}>
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px' }}>
              Already have an account? Sign in →
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: '#2a2a2a' }}>
          Closed alpha. Invite only.
        </div>
      </div>
    </div>
  );
}

function friendlySignupError(msg: string): string {
  if (msg.toLowerCase().includes('username_taken'))     return 'That username is already taken. Choose another.';
  if (msg.toLowerCase().includes('user already registered')) return 'An account with this email already exists.';
  if (msg.toLowerCase().includes('invalid_username_length')) return 'Username must be 3–24 characters.';
  if (msg.toLowerCase().includes('password should be')) return 'Password must be at least 8 characters.';
  if (msg.toLowerCase().includes('invalid email'))     return 'Please enter a valid email address.';
  return msg;
}
