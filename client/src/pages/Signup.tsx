/**
 * Signup — New account creation page.
 * Route: /signup (standalone, no AppShell)
 *
 * Creates Supabase auth user + initial player row.
 * After signup, routes to /onboarding.
 */

import { useState } from 'react';
import { useLocation } from 'wouter';
import { signUp, isSupabaseConfigured } from '../lib/supabaseClient';
import { Analytics } from '../lib/analyticsEngine';

export default function Signup() {
  const [, navigate] = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [alias, setAlias] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password || !username.trim()) return;

    setError(null);
    setLoading(true);

    try {
      Analytics.signupStarted?.('new-user');

      if (!isSupabaseConfigured) {
        // Mock mode: skip actual signup, go straight to onboarding
        Analytics.accountCreated('mock-user', 'EARNER');
        navigate('/onboarding');
        return;
      }

      await signUp(
        email.trim(),
        password,
        username.trim(),
        alias.trim() || username.trim(),
      );

      Analytics.accountCreated('new-user', 'EARNER');
      setDone(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
        fontFamily: "'Helvetica Now Display', Helvetica, Arial, sans-serif",
      }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <div style={{ fontSize: '28px', fontWeight: '900', color: '#cc3333', marginBottom: '32px' }}>
            MAFIALIFE
          </div>
          <div style={{
            background: '#111', border: '1px solid #2a4a2a',
            borderRadius: '8px', padding: '32px 24px',
          }}>
            <div style={{ fontSize: '18px', fontWeight: '700', color: '#4a9a4a', marginBottom: '12px' }}>
              Account created.
            </div>
            <div style={{ fontSize: '12px', color: '#888', lineHeight: '1.7', marginBottom: '20px' }}>
              Check your inbox at <strong style={{ color: '#e0e0e0' }}>{email}</strong> to confirm
              your email address before signing in.
            </div>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: '12px', fontWeight: '700' }}
            >
              Go to Sign In →
            </button>
          </div>
        </div>
      </div>
    );
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

        {/* Logo */}
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
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#e0e0e0', marginBottom: '20px' }}>
            Create Account
          </div>

          {!isSupabaseConfigured && (
            <div style={{
              background: '#1a1500', border: '1px solid #3a2a00',
              borderRadius: '4px', padding: '10px 12px',
              marginBottom: '16px', fontSize: '10px', color: '#cc9900', lineHeight: '1.6',
            }}>
              <strong>DEV MODE</strong> — Supabase not configured. Signup goes straight to onboarding.
            </div>
          )}

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

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
                data-testid="input-signup-email"
                style={{
                  width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                  color: '#e0e0e0', padding: '10px 12px', fontSize: '12px',
                  borderRadius: '4px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="johnny_guns"
                required
                autoComplete="username"
                data-testid="input-signup-username"
                maxLength={24}
                style={{
                  width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                  color: '#e0e0e0', padding: '10px 12px', fontSize: '12px',
                  borderRadius: '4px', outline: 'none', boxSizing: 'border-box',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                Street Name <span style={{ color: '#444' }}>(optional)</span>
              </label>
              <input
                type="text"
                value={alias}
                onChange={e => setAlias(e.target.value)}
                placeholder="Johnny Two Fingers"
                autoComplete="off"
                data-testid="input-signup-alias"
                maxLength={32}
                style={{
                  width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a',
                  color: '#e0e0e0', padding: '10px 12px', fontSize: '12px',
                  borderRadius: '4px', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ fontSize: '9px', color: '#444', marginTop: '3px' }}>
                The name other players will see you by.
              </div>
            </div>

            <div>
              <label style={{ fontSize: '9px', color: '#555', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: '5px' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="min 8 characters"
                required
                autoComplete="new-password"
                minLength={8}
                data-testid="input-signup-password"
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
              data-testid="button-signup"
              className="btn btn-primary"
              style={{
                width: '100%', padding: '12px', fontSize: '12px',
                fontWeight: '700', marginTop: '4px',
                opacity: loading ? 0.6 : 1,
              }}
            >
              {loading ? 'Creating account…' : 'Create Account →'}
            </button>

          </form>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <button
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: '10px' }}
            >
              Already have an account? Sign in →
            </button>
          </div>

        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '10px', color: '#333', lineHeight: '1.6' }}>
          This is a closed alpha. Invite only.
        </div>

      </div>
    </div>
  );
}
