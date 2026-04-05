/**
 * playerBootstrap.tsx — First-load routing logic.
 *
 * Determines where to send a player on app boot based on their account state.
 *
 * Decision tree:
 *   1. Unauthenticated → /login
 *   2. Authenticated, no profile yet → /onboarding
 *   3. Authenticated, profile exists, onboarding incomplete → /onboarding
 *   4. Authenticated, profile exists, onboarding complete, no archetype → /archetype
 *   5. Authenticated, profile complete, no family → dashboard (unaffiliated)
 *   6. Authenticated, profile complete, has family → dashboard
 *
 * In MOCK MODE (Supabase not configured), onboarding completion is tracked
 * in React state only (resets on refresh — acceptable for alpha testing).
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useLocation } from 'wouter';
import { useAuth } from './authContext';
import { useGame } from './gameContext';
import { isSupabaseConfigured } from './supabaseClient';

// ─────────────────────────────────────────────
// Bootstrap state
// ─────────────────────────────────────────────

export interface PlayerBootstrapState {
  /** Has the player completed onboarding for this session/account? */
  onboardingComplete: boolean;
  /** Has the player chosen an archetype? */
  archetypeChosen: boolean;
  /** Is the bootstrap check complete (not loading)? */
  ready: boolean;
  /** Mark onboarding as complete (called at end of onboarding flow) */
  markOnboardingComplete: (archetype?: string) => void;
}

const BootstrapCtx = createContext<PlayerBootstrapState | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function PlayerBootstrapProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { player, setRealPlayer } = useGame();
  const [, navigate] = useLocation();

  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [archetypeChosen, setArchetypeChosen] = useState(false);
  const [ready, setReady] = useState(false);

  // When auth resolves, bootstrap the player state
  useEffect(() => {
    if (authLoading) return;

    if (!session) {
      // Not authenticated — routing handled by AuthRouter in App.tsx
      setReady(true);
      return;
    }

    if (isSupabaseConfigured) {
      // Real mode: load player profile from Supabase
      import('./supabaseClient').then(({ fetchMyProfile }) => {
        fetchMyProfile().then(profile => {
          if (profile) {
            setRealPlayer(profile as never);
            setOnboardingComplete(!!(profile as { onboarding_complete?: boolean }).onboarding_complete);
            setArchetypeChosen(!!(profile as { archetype?: string }).archetype);
          }
          // If no profile exists yet → new player, go to onboarding
          setReady(true);
        }).catch(() => {
          // Profile fetch failed — treat as new player
          setReady(true);
        });
      });
    } else {
      // Mock mode: check session user metadata for mock onboarding state
      // New mock users (fresh session) always get onboarding
      const isMockNew = session.user.id === 'mock-user-id' && !onboardingComplete;
      if (isMockNew) {
        // Mock new player — will route to onboarding
        setOnboardingComplete(false);
      }
      setReady(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, authLoading]);

  const markOnboardingComplete = useCallback((archetype?: string) => {
    setOnboardingComplete(true);
    if (archetype) setArchetypeChosen(true);

    if (isSupabaseConfigured) {
      // Persist to Supabase (fire and forget)
      import('./supabaseClient').then(({ fetchMyProfile: _ }) => {
        // In production: call rpc('complete_onboarding', { p_archetype: archetype })
        // TODO: wire when RPC exists
      });
    }
  }, []);

  return (
    <BootstrapCtx.Provider value={{
      onboardingComplete,
      archetypeChosen,
      ready,
      markOnboardingComplete,
    }}>
      {children}
    </BootstrapCtx.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function usePlayerBootstrap() {
  const c = useContext(BootstrapCtx);
  if (!c) throw new Error('usePlayerBootstrap outside PlayerBootstrapProvider');
  return c;
}
