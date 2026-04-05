import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Player, PlayerStats } from '../../../shared/schema';
import { MOCK_PLAYERS, VIEW_PRESETS } from './mockData';
import { toGameRole, type GameRole } from './permissions';

interface GameCtx {
  player: Player;
  gameRole: GameRole;
  setPlayer: (id: string) => void;
  applyStatDeltas: (deltas: Partial<PlayerStats>) => void;
  presets: typeof VIEW_PRESETS;
}

const Ctx = createContext<GameCtx | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [pid, setPid] = useState('p-boss');
  // Keep a mutable overlay of stats so actions update UI without a backend
  const [statOverlay, setStatOverlay] = useState<Record<string, Partial<PlayerStats>>>({});

  const base = MOCK_PLAYERS[pid] ?? MOCK_PLAYERS['p-boss'];
  const overlay = statOverlay[pid] ?? {};
  const player: Player = {
    ...base,
    stats: { ...base.stats, ...overlay },
  };
  const gameRole = toGameRole(player.family_role, player.affiliation);

  function handleSetPlayer(id: string) {
    setPid(id);
  }

  function applyStatDeltas(deltas: Partial<PlayerStats>) {
    setStatOverlay(prev => {
      const current = { ...(prev[pid] ?? {}) };
      for (const key of Object.keys(deltas) as (keyof PlayerStats)[]) {
        const d = deltas[key] as number;
        const base = current[key] as number | undefined;
        const baseVal = base !== undefined ? base : (MOCK_PLAYERS[pid]?.stats[key] as number ?? 0);
        (current as Record<string, number>)[key] = Math.max(0, baseVal + d);
      }
      return { ...prev, [pid]: current };
    });
  }

  return (
    <Ctx.Provider value={{ player, gameRole, setPlayer: handleSetPlayer, applyStatDeltas, presets: VIEW_PRESETS }}>
      {children}
    </Ctx.Provider>
  );
}

export function useGame() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useGame outside GameProvider');
  return c;
}
