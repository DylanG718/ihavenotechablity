/**
 * Obituaries.tsx — The Obituaries Feed
 * Chronicle of notable events: deaths, witness protection, retirements,
 * family dissolutions, leadership changes.
 */

import { useState } from 'react';
import { PageHeader, EmptySlate } from '../components/layout/AppShell';
import { MOCK_OBITUARIES } from '../lib/worldData';
import type { ObituaryEntry, ObituaryEventType } from '../../../shared/schema';
import { Skull, Shield, Coffee, Users, Crown } from 'lucide-react';

// ── Event type config ─────────────────────────

type FilterType = 'ALL' | ObituaryEventType;

const EVENT_CONFIG: Record<ObituaryEventType, {
  label: string;
  shortLabel: string;
  color: string;
  bg: string;
  Icon: React.ComponentType<{ size?: number }>;
}> = {
  DEATH: {
    label:       'Death',
    shortLabel:  'Death',
    color:       '#cc3333',
    bg:          'rgba(204,51,51,0.12)',
    Icon:        Skull,
  },
  WITNESS_PROTECTION: {
    label:       'Witness Protection',
    shortLabel:  'Witness Protection',
    color:       '#6699ff',
    bg:          'rgba(102,153,255,0.12)',
    Icon:        Shield,
  },
  RETIREMENT: {
    label:       'Retirement',
    shortLabel:  'Retirement',
    color:       '#888888',
    bg:          'rgba(136,136,136,0.12)',
    Icon:        Coffee,
  },
  FAMILY_DISSOLVED: {
    label:       'Family Dissolved',
    shortLabel:  'Dissolved',
    color:       '#cc6633',
    bg:          'rgba(204,102,51,0.12)',
    Icon:        Users,
  },
  LEADERSHIP_CHANGE: {
    label:       'Leadership Change',
    shortLabel:  'Leadership',
    color:       '#ffcc33',
    bg:          'rgba(255,204,51,0.12)',
    Icon:        Crown,
  },
};

// ── Helpers ───────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (days > 7)  return new Date(iso).toLocaleDateString();
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return 'Recently';
}

// ── Entry card ────────────────────────────────

function ObituaryCard({ entry }: { entry: ObituaryEntry }) {
  const config = EVENT_CONFIG[entry.event_type];
  const { Icon, color, bg, label } = config;

  return (
    <div
      className="panel mb-3 overflow-hidden"
      style={{ borderColor: color + '30', background: bg }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-sm flex items-center justify-center shrink-0"
            style={{ background: color + '20', border: `1px solid ${color}30` }}
          >
            <Icon size={14} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="text-xs font-bold px-1.5 py-0.5 rounded-sm"
                style={{ background: color + '25', color }}
              >
                {label}
              </span>
              <span className="text-xs text-muted-foreground">{timeAgo(entry.created_at)}</span>
            </div>
            <div className="font-bold text-sm text-foreground">{entry.player_alias}</div>
            {entry.family_name && (
              <div className="text-xs text-muted-foreground mt-0.5">
                {entry.family_name}
              </div>
            )}
          </div>
        </div>

        {/* Note */}
        <p className="text-xs text-muted-foreground" style={{ lineHeight: 1.7, fontStyle: 'italic', borderLeft: `2px solid ${color}30`, paddingLeft: '10px' }}>
          {entry.note}
        </p>

        {/* Footer */}
        <div className="mt-3 pt-2 border-t border-border/30 text-xs text-muted-foreground">
          {new Date(entry.created_at).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────

const FILTER_TABS: { id: FilterType; label: string }[] = [
  { id: 'ALL',               label: 'All' },
  { id: 'DEATH',             label: 'Deaths' },
  { id: 'WITNESS_PROTECTION',label: 'Witness Protection' },
  { id: 'RETIREMENT',        label: 'Retirements' },
  { id: 'LEADERSHIP_CHANGE', label: 'Leadership' },
  { id: 'FAMILY_DISSOLVED',  label: 'Dissolved' },
];

export default function Obituaries() {
  const [filter, setFilter] = useState<FilterType>('ALL');

  const entries = [...MOCK_OBITUARIES]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .filter(e => filter === 'ALL' || e.event_type === filter);

  const totalByType: Record<ObituaryEventType, number> = {
    DEATH: 0,
    WITNESS_PROTECTION: 0,
    RETIREMENT: 0,
    FAMILY_DISSOLVED: 0,
    LEADERSHIP_CHANGE: 0,
  };
  MOCK_OBITUARIES.forEach(e => { totalByType[e.event_type] = (totalByType[e.event_type] ?? 0) + 1; });

  return (
    <div>
      <PageHeader
        title="The Obituaries"
        sub="Those who fell, fled, or finished their time in the life. The record is permanent."
      />

      {/* Atmospheric subtext */}
      <div className="panel p-4 mb-5" style={{ background: 'hsl(0 0% 4%)', borderColor: '#1a1a1a' }}>
        <p className="text-xs text-muted-foreground" style={{ lineHeight: 1.8, fontStyle: 'italic' }}>
          "Every name here was once a player in this game. Some chose to leave.
          Some were removed. Some simply stopped. The life does not offer retirement packages
          or pensions. It offers endings."
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-5">
        {(Object.keys(totalByType) as ObituaryEventType[]).map(type => {
          const { label, color } = EVENT_CONFIG[type];
          return (
            <div key={type} className="panel p-3 text-center">
              <div className="font-bold text-lg mb-0.5" style={{ color }}>{totalByType[type]}</div>
              <div className="label-caps" style={{ fontSize: '8px' }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 mb-5 border-b border-border pb-3">
        {FILTER_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setFilter(t.id)}
            className={`btn text-xs ${filter === t.id ? 'btn-primary' : 'btn-ghost'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Feed */}
      {entries.length === 0 ? (
        <EmptySlate msg="No entries for this filter." />
      ) : (
        entries.map(entry => (
          <ObituaryCard key={entry.id} entry={entry} />
        ))
      )}
    </div>
  );
}
