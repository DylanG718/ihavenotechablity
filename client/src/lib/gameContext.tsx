/**
 * gameContext.tsx — Active player state context.
 *
 * PRODUCTION BEHAVIOR:
 *   In production (ENABLE_DEV_TOOLS = false), the context initializes
 *   with a REAL empty new-player state — no seeded Don identity.
 *   The player's actual account data should be loaded from Supabase
 *   after authentication (fetchMyProfile).
 *
 * DEV BEHAVIOR:
 *   When ENABLE_DEV_TOOLS = true (local dev), the role switcher
 *   allows switching between mock presets for testing.
 *   Starting player defaults to 'p-unaffiliated' (not p-boss)
 *   to better reflect a real new player experience.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { Player, PlayerStats } from '../../../shared/schema';
import { MOCK_PLAYERS, VIEW_PRESETS } from './mockData';
import { toGameRole, type GameRole } from './permissions';
import { ENABLE_DEV_TOOLS } from './env';

// ─────────────────────────────────────────────
// Real new-player state
// Used in production when no real profile is loaded yet.
// ─────────────────────────────────────────────

const NEW_PLAYER_STATE: Player = {
  id: 'new-player',
  username: '',
  alias: 'New Player',
  archetype: 'RUNNER',
  affiliation: 'UNAFFILIATED',
  family_id: null,
  family_role: null,
  crew_id: null,
  crew_role: null,
  player_status: 'ACTIVE',
  death_state: 'ALIVE',
  blacksite_state: null,
  stats: {
    cash: 0,
    stash: 0,
    heat: 0,
    hp: 100,
    respect: 0,
    intimidation: 0,
    strength: 0,
    charisma: 0,
    intelligence: 0,
    clout: 0,
    luck: 0,
    leadership: 0,
    suspicion: 0,
    business: 0,
    accuracy: 0,
  },
  created_at: new Date().toISOString(),
};

// ─────────────────────────────────────────────
// Context type
// ─────────────────────────────────────────────

interface GameCtx {
  player: Player;
  gameRole: GameRole;
  /** DEV ONLY — switches mock player. No-op in production. */
  setPlayer: (id: string) => void;
  /** Apply stat changes from job/action outcomes */
  applyStatDeltas: (deltas: Partial<PlayerStats>) => void;
  /** Load a real player profile (from Supabase) into context */
  setRealPlayer: (p: Player) => void;
  /** DEV ONLY — available presets for role switcher */
  presets: typeof VIEW_PRESETS;
  /** Whether context is using real player data (vs. mock/empty) */
  isRealPlayer: boolean;
}

const Ctx = createContext<GameCtx | null>(null);

// ─────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────

export function GameProvider({ children }: { children: ReactNode }) {
  // In dev: start with unaffiliated player (better reflects new user experience)
  // In prod: start with empty new-player state
  const defaultId   = ENABLE_DEV_TOOLS ? 'p-unaffiliated' : 'new-player';
  const defaultBase = ENABLE_DEV_TOOLS
    ? (MOCK_PLAYERS['p-unaffiliated'] ?? NEW_PLAYER_STATE)
    : NEW_PLAYER_STATE;

  const [pid, setPid]       = useState(defaultId);
  const [realPlayer, setReal] = useState<Player | null>(null);
  const [statOverlay, setStatOverlay] = useState<Record<string, Partial<PlayerStats>>>({});

  // Active player: real profile takes precedence over mock
  const base: Player = realPlayer ?? (MOCK_PLAYERS[pid] ?? defaultBase);
  const overlay = statOverlay[base.id] ?? {};
  const player: Player = {
    ...base,
    stats: { ...base.stats, ...overlay },
  };
  const gameRole = toGameRole(player.family_role, player.affiliation);

  function handleSetPlayer(id: string) {
    if (!ENABLE_DEV_TOOLS) return; // No-op in production
    setPid(id);
    setReal(null); // clear real player when switching mock
  }

  const handleSetRealPlayer = useCallback((p: Player) => {
    setReal(p);
  }, []);

  function applyStatDeltas(deltas: Partial<PlayerStats>) {
    const activeId = player.id;
    setStatOverlay(prev => {
      const current = { ...(prev[activeId] ?? {}) };
      for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
        const d       = deltas[key] as number;
        const base    = current[key] as number | undefined;
        const baseVal = base !== undefined ? base : (player.stats[key] as number ?? 0);
        (current as Record<string, number>)[key] = Math.max(0, baseVal + d);
      }
      return { ...prev, [activeId]: current };
    });
  }

  return (
    <Ctx.Provider value={{
      player,
      gameRole,
      setPlayer:    handleSetPlayer,
      applyStatDeltas,
      setRealPlayer: handleSetRealPlayer,
      presets:      VIEW_PRESETS,
      isRealPlayer: !!realPlayer,
    }}>
      {children}
    </Ctx.Provider>
  );
}

// ─────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGame outside GameProvider');
  return c;
}
