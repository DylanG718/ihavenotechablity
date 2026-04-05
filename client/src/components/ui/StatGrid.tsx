import type { PlayerStats } from '../../../../shared/schema';
import { fmt } from '../../lib/mockData';

interface StatItem { label: string; value: string | number; accent?: boolean; warn?: boolean; }

export function StatCell({ label, value, accent, warn }: StatItem) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="label-caps">{label}</span>
      <span className={`stat-val ${accent ? 'text-cash' : warn ? 'text-heat' : ''}`}>{value}</span>
    </div>
  );
}

export function StatGrid({ stats, role }: { stats: PlayerStats; role?: string }) {
  const isHitman = role === 'SOLO_HITMAN';
  const isRecruit = role === 'RECRUIT';

  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-x-5 gap-y-4">
      <StatCell label="Cash"         value={fmt(stats.cash)}       accent />
      <StatCell label="Stash"        value={fmt(stats.stash)}      accent />
      <StatCell label="Heat"         value={`${stats.heat}/100`}   warn={stats.heat > 60} />
      {!isRecruit && <StatCell label="Kills"       value={stats.respect > 0 ? stats.respect : '—'} />}
      <StatCell label="Respect"      value={stats.respect} />
      <StatCell label="Strength"     value={stats.strength} />
      <StatCell label="Accuracy"     value={stats.accuracy} />
      <StatCell label="Intelligence" value={stats.intelligence} />
      <StatCell label="Business"     value={stats.business} />
      <StatCell label="Charisma"     value={stats.charisma} />
      <StatCell label="Intimidation" value={stats.intimidation} />
      <StatCell label="Clout"        value={stats.clout} />
      <StatCell label="Leadership"   value={stats.leadership} />
      <StatCell label="Luck"         value={stats.luck} />
      <StatCell label="Suspicion"    value={stats.suspicion} warn={stats.suspicion > 60} />
      <StatCell label="HP"           value={`${stats.hp}/100`} warn={stats.hp < 40} />
    </div>
  );
}

export function MiniStatBar({ label, value, max = 100 }: { label: string; value: number; max?: number }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  const color = pct >= 70 ? 'bg-green-600' : pct >= 40 ? 'bg-yellow-600' : 'bg-red-600';
  return (
    <div className="flex items-center gap-2">
      <span className="label-caps w-24 shrink-0">{label}</span>
      <div className="flex-1 stat-bar-track">
        <div className={`stat-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground w-8 text-right">{value}</span>
    </div>
  );
}
