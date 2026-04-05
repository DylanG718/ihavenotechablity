/**
 * playerBootstrap.tsx — First-load routing and player state initialization.
 *
 * Determines where to route a player on app boot based on account state
 * loaded from Supabase (or mock state in dev mode).
 *
 * DECISION TREE:
 *   1. Auth loading   → show loading screen (handled by AuthRouter)
 *   2. Unauthenticated → /login  (handled by AuthRouter)
 *   3. Authenticated, no player row yet → /onboarding (new signup)
 *   4. Authenticated, player exists, onboarding_completed = false → /onboarding
 *   5. Authenticated, player exists, onboarding_completed = true → /  (dashboard)
 *
 * SOURCE OF TRUTH (in order of priority):
 *   • Supabase: players.onboarding_completed (persistent, survives refresh)
 *   • React state: for mock mode (resets on refresh — acceptable for dev/alpha)
 *
 * MOCK MODE behavior:
 *   - isSupabaseConfigured = false
 *   - Bootstrap state lives in React state only
 *   - Mock session triggers onboarding on every fresh page load
 *   - "Skip All" or completing onboarding marks it done for the session
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { useAuth } from './authContext';
import { useGame } from './gameContext';
import {
  isSupabaseConfigured,
  fetchBootstrapPlayer,
  ensurePlayerProfile,
  completeOnboarding as supabaseCompleteOnboarding,
  pingLastActive,
  type PlayerBootstrapData,
} from './supabaseClient';
import type { Player, PlayerStats } from '../../../shared/schema';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface PlayerBootstrapState {
  /** True once bootstrap check is done (loading resolved) */
  ready: boolean;
  /** Whether this player has completed onboarding */
  onboardingComplete: boolean;
  /** Whether this player has chosen an archetype */
  archetypeChosen: boolean;
  /** Raw bootstrap data from Supabase (null in mock mode) */
  bootstrapData: PlayerBootstrapData | null;
  /** Mark onboarding as complete and optionally record archetype */
  markOnboardingComplete: (archetype?: string, path?: 'standard' | 'founder', skipped?: boolean) => Promise<void>;
}

const BootstrapCtx = createContext<PlayerBootstrapState | null>(null);

// ─────────────────────────────────────────────
// Helpers: map Supabase PlayerBootstrapData → Player type
// ─────────────────────────────────────────────

function bootstrapToPlayer(data: PlayerBootstrapData): Player {
  return {
    id:               data.player_id,
    username:         data.username,
    alias:            data.alias,
    archetype:        data.archetype as Player['archetype'],
    affiliation:      data.affiliation as Player['affiliation'],
    family_id:        data.family_id,
    family_role:      data.family_role as Player['family_role'],
    crew_id:          null,
    crew_role:        null,
    player_status:    data.player_status as Player['player_status'],
    death_state:      'ALIVE',
    blacksite_state:  null,
    stats: {
      cash:           data.stat_cash,
      stash:          0,
      heat:           data.stat_heat,
      hp:             100,
      respect:        data.stat_respect,
      intimidation:   0,
      strength:       0,
      charisma:       0,
      intelligence:   0,
      clout:          0,
      luck:           0,
      leadership:     0,
      suspicion:      0,
      business:       0,
      accuracy:       0,
    } as PlayerStats,
    created_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function PlayerBootstrapProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading, user } = useAuth();
  const { setRealPlayer } = useGame();

  const [ready, setReady]                       = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [archetypeChosen, setArchetypeChosen]   = useState(false);
  const [bootstrapData, setBootstrapData]       = useState<PlayerBootstrapData | null>(null);

  // ─── Bootstrap on auth state change ───────
  useEffect(() => {
    if (authLoading) return;

    // No session — clear state and mark ready (AuthRouter will redirect to /login)
    if (!session) {
      setReady(true);
      setOnboardingComplete(false);
      setArchetypeChosen(false);
      setBootstrapData(null);
      return;
    }

    if (!isSupabaseConfigured) {
      // MOCK MODE: simulate a fresh new player (always goes through onboarding)
      // onboardingComplete stays false until markOnboardingComplete is called
      setReady(true);
      return;
    }

    // REAL MODE: fetch player state from Supabase
    setReady(false);

    (async () => {
      try {
        // 1. Try to get the player row
        let playerData = await fetchBootstrapPlayer();

        // 2. If no player row exists, this is a first sign-in after email confirmation.
        //    Create the profile row now using user_metadata from auth.
        if (!playerData && user) {
          const username = (user.user_metadata?.username as string | undefined) ?? `player_${user.id.slice(0, 8)}`;
          const alias    = (user.user_metadata?.alias    as string | undefined) ?? username;
          playerData = await ensurePlayerProfile(username, alias);
        }

        if (playerData) {
          // Map to Player type and push into game context
          setRealPlayer(bootstrapToPlayer(playerData));
          setBootstrapData(playerData);
          setOnboardingComplete(playerData.onboarding_completed);
          setArchetypeChosen(!!playerData.archetype && playerData.archetype !== 'RUNNER' || playerData.onboarding_completed);
        }
        // If still null, new player — onboarding_complete stays false, goes to onboarding

        // Ping last active (fire-and-forget)
        pingLastActive();
      } catch (err) {
        console.error('[bootstrap] Error fetching player state:', err);
        // On error, treat as new player — safe fallback
      } finally {
        setReady(true);
      }
    })();
  // session.user.id as dependency ensures this re-runs if user changes (different account)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session?.user?.id]);

  // ─── Mark onboarding complete ─────────────
  const markOnboardingComplete = useCallback(async (
    archetype = 'RUNNER',
    path: 'standard' | 'founder' = 'standard',
    skipped = false,
  ) => {
    // Optimistic update — update React state immediately so routing works
    setOnboardingComplete(true);
    setArchetypeChosen(true);

    // Also update the bootstrapData so UI reflects new state
    setBootstrapData(prev =>
      prev ? { ...prev, onboarding_completed: true, archetype } : prev
    );

    // Persist to Supabase (async, non-blocking)
    if (isSupabaseConfigured) {
      const ok = await supabaseCompleteOnboarding(archetype, path, skipped);
      if (!ok) {
        // Supabase call failed — state is still correct client-side,
        // but will be re-read on next app load
        console.warn('[bootstrap] complete_onboarding RPC failed — state is client-side only until next load');
      }
    }
  }, []);

  return (
    <BootstrapCtx.Provider value={{
      ready,
      onboardingComplete,
      archetypeChosen,
      bootstrapData,
      markOnboardingComplete,
    }}>
      {children}
    </BootstrapCtx.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function usePlayerBootstrap(): PlayerBootstrapState {
  const c = useContext(BootstrapCtx);
  if (!c) throw new Error('usePlayerBootstrap outside PlayerBootstrapProvider');
  return c;
}
