/**
 * authContext.tsx — Supabase auth session management.
 *
 * Provides: session, user, loading, isConfigured, signOut
 *
 * MOCK MODE (no Supabase configured):
 *   - Injects a fake session so the prototype is always accessible
 *   - No real auth calls are made
 *
 * REAL MODE (Supabase configured):
 *   - Dynamically loads @supabase/supabase-js (to avoid bundling localStorage)
 *   - Calls getSession() on mount to restore existing session
 *   - Subscribes to onAuthStateChange for live session updates
 *   - Properly unsubscribes on unmount
 *
 * The Supabase client is only instantiated once (in supabaseClient.ts).
 * authContext uses it through dynamic import to avoid bundling it
 * when credentials are not present.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured } from './supabaseClient';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Minimal session shape — same structure for both real and mock sessions */
export interface AppSession {
  access_token: string;
  user: {
    id: string;
    email: string | undefined;
    user_metadata: {
      username?: string;
      alias?: string;
      [key: string]: unknown;
    };
  };
}

interface AuthCtx {
  session:      AppSession | null;
  user:         AppSession['user'] | null;
  loading:      boolean;
  isConfigured: boolean;
  signOut:      () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

// ─────────────────────────────────────────────
// Mock session — used only when Supabase is not configured
// ─────────────────────────────────────────────

const MOCK_SESSION: AppSession = {
  access_token: 'mock-access-token',
  user: {
    id:             'mock-user-id',
    email:          'dev@thelastfirm.local',
    user_metadata:  { username: 'new_player', alias: 'New Player' },
  },
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<AppSession | null>(null);
  const [loading, setLoading]   = useState(true);
  const unsubRef                = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // MOCK MODE: inject fake session immediately
      setSession(MOCK_SESSION);
      setLoading(false);
      return;
    }

    // REAL MODE: load Supabase dynamically (avoids bundling localStorage)
    let cancelled = false;

    import('@supabase/supabase-js').then(({ createClient }) => {
      if (cancelled) return;

      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

      const sb = createClient(url, key, {
        auth: {
          persistSession:     true,
          autoRefreshToken:   true,
          detectSessionInUrl: true,
          storageKey:         'thelastfirm-auth',
        },
      });

      // Resolve initial session (could already be stored in localStorage)
      sb.auth.getSession().then(({ data: { session: existing } }) => {
        if (cancelled) return;
        setSession(existing as AppSession | null);
        setLoading(false);
      }).catch(() => {
        if (cancelled) return;
        setSession(null);
        setLoading(false);
      });

      // Listen for subsequent auth state changes:
      // SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, PASSWORD_RECOVERY, etc.
      const { data: { subscription } } = sb.auth.onAuthStateChange(
        (_event, newSession) => {
          if (cancelled) return;
          setSession(newSession as AppSession | null);
          // Don't setLoading here — initial load already handled above
        }
      );

      unsubRef.current = () => subscription.unsubscribe();
    }).catch(err => {
      // Supabase client failed to load (network, bad credentials, etc.)
      console.error('[auth] Failed to initialize Supabase client:', err);
      if (!cancelled) {
        setSession(null);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      unsubRef.current?.();
      unsubRef.current = null;
    };
  }, []); // run once on mount

  const handleSignOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      // Mock mode: clear session and go to login
      setSession(null);
      window.location.hash = '#/login';
      return;
    }

    try {
      // Sign out via dynamic client (same instance used by onAuthStateChange)
      const { createClient } = await import('@supabase/supabase-js');
      const url = import.meta.env.VITE_SUPABASE_URL as string;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const sb  = createClient(url, key, { auth: { storageKey: 'thelastfirm-auth' } });
      await sb.auth.signOut();
    } catch (err) {
      console.error('[auth] signOut error:', err);
    } finally {
      // Always clear local session state regardless of network result
      setSession(null);
    }
  }, []);

  return (
    <Ctx.Provider value={{
      session,
      user:         session?.user ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      signOut:      handleSignOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useAuth(): AuthCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
