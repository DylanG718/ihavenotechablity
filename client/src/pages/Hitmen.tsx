import { useState } from 'react';
import { MOCK_HITMAN_PROFILES, fmt } from '../lib/mockData';
import { useGame } from '../lib/gameContext';
import { can } from '../lib/permissions';
import { PageHeader, EmptySlate } from '../components/layout/AppShell';
import { RepBadge, AvailBadge, BlacksiteBadge } from '../components/ui/Badges';
import type { HitmanProfile } from '../../../shared/schema';
import { MiniStatBar } from '../components/ui/StatGrid';

function FormDots({ form }: { form: HitmanProfile['recent_form'] }) {
  return (
    <div className="flex gap-0.5">
      {form.map((r, i) => (
        <div key={i} title={r}
          className={`w-2 h-2 rounded-full
            ${r === 'SUCCESS' ? 'bg-green-500' : r === 'MESSY' ? 'bg-yellow-500' : 'bg-red-500'}`}
        />
      ))}
    </div>
  );
}

function HitmanCard({ p, canHire }: { p: HitmanProfile; canHire: boolean }) {
  const [hired, setHired] = useState(false);
  const unavail = p.availability_status !== 'FREE' && p.availability_status !== 'FREE_REBUILT';

  return (
    <div className={`panel p-4 flex flex-col gap-3 ${unavail ? 'opacity-60' : ''}`}
      data-testid={`hitman-${p.player_id}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <RepBadge tier={p.reputation_tier} />
            <AvailBadge avail={p.availability_status} />
          </div>
          <h3 className="text-base font-bold text-foreground">{p.alias}</h3>
        </div>
        <div className="text-right">
          <span className="label-caps block">Price</span>
          <span className="text-xs font-semibold text-cash">{fmt(p.price_range.min)}–{fmt(p.price_range.max)}</span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs text-muted-foreground italic leading-relaxed">"{p.bio}"</p>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {[
          ['W',        p.success_count,                    'text-success'],
          ['L',        p.failure_count,                    'text-danger'],
          ['Rate',     `${Math.round(p.success_rate*100)}%`,'text-foreground'],
          ['Streak',   p.current_streak > 0 ? `×${p.current_streak}` : '—', 'text-cash'],
          ['HV Hits',  p.high_value_hits,                  'text-foreground'],
          ['Support',  p.support_jobs,                     'text-foreground'],
          ['Avg Pay',  fmt(p.avg_payout),                  'text-cash'],
          ['Score',    p.hitman_score.toLocaleString(),     'text-foreground'],
        ].map(([l, v, cls]) => (
          <div key={String(l)}>
            <span className="label-caps block">{l}</span>
            <span className={`text-sm font-bold ${cls}`}>{v}</span>
          </div>
        ))}
      </div>

      {/* Recent form */}
      <div>
        <span className="label-caps block mb-1">Recent Form (last {p.recent_form.length})</span>
        <FormDots form={p.recent_form} />
      </div>

      {/* Safehouse/Informant */}
      <div className="space-y-1">
        <MiniStatBar label="Safehouse" value={p.safehouse_level} max={5} />
        <MiniStatBar label="Informant Net" value={p.informant_level} max={5} />
      </div>

      {/* Prison notice */}
      {p.blacksite_state && (
        <div className="px-2 py-1.5 bg-purple-950/30 border border-purple-900/30 rounded-sm">
          <p className="text-xs text-purple-400 flex items-center gap-1.5">
            <BlacksiteBadge state={p.blacksite_state} />
            <span className="text-muted-foreground">· Unavailable for contracts</span>
          </p>
        </div>
      )}

      {canHire && !unavail && !p.blacksite_state && (
        <button
          onClick={() => setHired(true)}
          disabled={hired}
          className={`btn text-xs w-full ${hired ? 'btn-ghost opacity-60' : 'btn-primary'}`}
          data-testid={`hire-${p.player_id}`}
        >
          {hired ? 'Contract Sent ✓' : 'Hire for Contract'}
        </button>
      )}
    </div>
  );
}

export default function Hitmen() {
  const { gameRole } = useGame();
  const canHire = can(gameRole, 'POST_CONTRACT');
  const [filter, setFilter] = useState<'ALL'|'AVAILABLE'|'IN_PRISON'>('ALL');

  const profiles = MOCK_HITMAN_PROFILES
    .filter(p => {
      if (filter === 'AVAILABLE') return ['FREE','FREE_REBUILT'].includes(p.availability_status);
      if (filter === 'IN_PRISON') return p.availability_status === 'IN_PRISON';
      return true;
    })
    .sort((a, b) => {
      const aAvail = ['FREE','FREE_REBUILT'].includes(a.availability_status) ? 0 : 1;
      const bAvail = ['FREE','FREE_REBUILT'].includes(b.availability_status) ? 0 : 1;
      if (aAvail !== bAvail) return aAvail - bAvail;
      return b.hitman_score - a.hitman_score;
    });

  const available = MOCK_HITMAN_PROFILES.filter(p => ['FREE','FREE_REBUILT'].includes(p.availability_status)).length;
  const inPrison  = MOCK_HITMAN_PROFILES.filter(p => p.availability_status === 'IN_PRISON').length;

  return (
    <div>
      <PageHeader
        title="Hitman Registry"
        sub="Independent contractors. All identities protected."
      />

      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          ['Registered', MOCK_HITMAN_PROFILES.length, ''],
          ['Available',  available,                   'text-success'],
          ['In Prison',  inPrison,                    inPrison > 0 ? 'text-bs' : ''],
        ].map(([l, v, cls]) => (
          <div key={String(l)} className="panel p-4">
            <span className="label-caps block mb-1">{l}</span>
            <span className={`stat-val ${cls}`}>{v}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-1 mb-4">
        {(['ALL','AVAILABLE','IN_PRISON'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`btn text-xs ${filter === f ? 'btn-primary' : 'btn-ghost'}`}
          >{f.replace('_',' ')}</button>
        ))}
      </div>

      <div className="ml-grid-auto">
        {profiles.map(p => <HitmanCard key={p.player_id} p={p} canHire={canHire} />)}
      </div>
    </div>
  );
}
