/**
 * AuthContext — Supabase session management.
 *
 * In MOCK MODE (no Supabase configured), auth is bypassed and a fake
 * session is injected so the game is always accessible without credentials.
 *
 * In REAL MODE (Supabase configured), uses real auth state.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { isSupabaseConfigured, signOut as sbSignOut } from './supabaseClient';

// ─────────────────────────────────────────────
// Types (minimal — avoid importing Supabase types statically)
// ─────────────────────────────────────────────

export interface MockSession {
  access_token: string;
  user: {
    id: string;
    email: string;
    user_metadata: { username: string; alias: string };
  };
}

interface AuthCtx {
  session: MockSession | null;
  user: MockSession['user'] | null;
  loading: boolean;
  isConfigured: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

// ─────────────────────────────────────────────
// Mock session — dev / preview mode
// ─────────────────────────────────────────────

const MOCK_SESSION: MockSession = {
  access_token: 'mock-access-token',
  user: {
    id: 'mock-user-id',
    email: 'dev@mafialife.local',
    user_metadata: { username: 'DevBoss', alias: 'Don Dev' },
  },
};

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<MockSession | null>(null);
  const [loading, setLoading]  = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      // Mock mode — inject fake session immediately
      setSession(MOCK_SESSION);
      setLoading(false);
      return;
    }

    // Real Supabase auth — dynamic import to avoid bundling localStorage usage
    let unsubscribe: (() => void) | null = null;

    import('@supabase/supabase-js').then(({ createClient }) => {
      const url  = import.meta.env.VITE_SUPABASE_URL as string;
      const key  = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const sb   = createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true },
      });

      sb.auth.getSession().then(({ data: { session } }) => {
        setSession(session as unknown as MockSession);
        setLoading(false);
      });

      const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
        setSession(session as unknown as MockSession);
        setLoading(false);
      });

      unsubscribe = () => subscription.unsubscribe();
    }).catch(() => {
      setSession(null);
      setLoading(false);
    });

    return () => { unsubscribe?.(); };
  }, []);

  const handleSignOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSession(null);
      window.location.hash = '#/login';
      return;
    }
    await sbSignOut();
    setSession(null);
  }, []);

  return (
    <Ctx.Provider value={{
      session,
      user: session?.user ?? null,
      loading,
      isConfigured: isSupabaseConfigured,
      signOut: handleSignOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
}
