/**
 * WorldFeed — world-level activity event timeline.
 * Route: /world/feed
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { PageHeader, SectionPanel, EmptySlate } from '../components/layout/AppShell';
import { MOCK_WORLD_FEED } from '../lib/opsData';
import type { WorldActivityEvent, WorldActivityType } from '../../../shared/ops';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type WorldFilter = 'ALL' | 'WARS' | 'LEADERSHIP' | 'DISTRICTS' | 'SEASONS';

const WAR_TYPES: WorldActivityType[] = ['MAJOR_WAR_ENDED'];
const LEADERSHIP_TYPES: WorldActivityType[] = ['FAMILY_RANK_CHANGE', 'FAMILY_DISSOLVED', 'OBITUARY', 'WITNESS_PROTECTION'];
const DISTRICT_TYPES: WorldActivityType[] = ['DISTRICT_CONTROL_CHANGE'];
const SEASON_TYPES: WorldActivityType[] = ['SEASON_STARTED', 'SEASON_ENDED'];

function matchesFilter(type: WorldActivityType, filter: WorldFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'WARS')       return (WAR_TYPES as string[]).includes(type);
  if (filter === 'LEADERSHIP') return (LEADERSHIP_TYPES as string[]).includes(type);
  if (filter === 'DISTRICTS')  return (DISTRICT_TYPES as string[]).includes(type);
  if (filter === 'SEASONS')    return (SEASON_TYPES as string[]).includes(type);
  return true;
}

// ─────────────────────────────────────────────
// Type badge config
// ─────────────────────────────────────────────

const TYPE_CONFIG: Record<WorldActivityType, { label: string; color: string }> = {
  OBITUARY:               { label: 'Obituary',       color: '#cc3333' },
  WITNESS_PROTECTION:     { label: 'Witness Prot.',  color: '#818cf8' },
  SEASON_STARTED:         { label: 'Season Start',   color: '#4a9a4a' },
  SEASON_ENDED:           { label: 'Season End',     color: '#5580bb' },
  FAMILY_RANK_CHANGE:     { label: '#1 Change',      color: '#ffcc33' },
  DISTRICT_CONTROL_CHANGE:{ label: 'District',       color: '#5580bb' },
  FAMILY_DISSOLVED:       { label: 'Dissolved',      color: '#cc3333' },
  MAJOR_WAR_ENDED:        { label: 'War Ended',      color: '#cc9900' },
};

// ─────────────────────────────────────────────
// Event card
// ─────────────────────────────────────────────

function WorldEventCard({ event }: { event: WorldActivityEvent }) {
  const config = TYPE_CONFIG[event.type];

  return (
    <div style={{ padding: '12px', borderBottom: '1px solid #1a1a1a' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        {/* Type badge */}
        <div style={{
          padding: '2px 6px',
          background: `${config.color}22`,
          border: `1px solid ${config.color}44`,
          color: config.color,
          fontSize: '8px',
          fontWeight: 'bold',
          letterSpacing: '0.06em',
          flexShrink: 0,
          marginTop: '2px',
          whiteSpace: 'nowrap',
        }}>
          {config.label}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
            <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#e0e0e0', lineHeight: '1.4' }}>
              {event.headline}
            </div>
            <span style={{ fontSize: '9px', color: '#444', flexShrink: 0 }}>
              {relativeTime(event.timestamp)}
            </span>
          </div>
          <div style={{ fontSize: '10px', color: '#555', lineHeight: '1.5' }}>
            {event.detail}
          </div>
          {(event.familyId || event.districtId) && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
              {event.familyId && (
                <span style={{ fontSize: '8px', color: '#333', padding: '1px 4px', border: '1px solid #1a1a1a' }}>
                  Family: {event.familyId}
                </span>
              )}
              {event.districtId && (
                <span style={{ fontSize: '8px', color: '#333', padding: '1px 4px', border: '1px solid #1a1a1a' }}>
                  District: {event.districtId}
                </span>
              )}
            </div>
          )}
          {event.type === 'OBITUARY' && (
            <div style={{ marginTop: '6px' }}>
              <Link href="/obituaries">
                <a style={{ fontSize: '9px', color: '#cc3333' }}>View Obituaries →</a>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────

export default function WorldFeedPage() {
  const [filter, setFilter] = useState<WorldFilter>('ALL');

  const sorted = [...MOCK_WORLD_FEED].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const filtered = sorted.filter(e => matchesFilter(e.type, filter));

  const filters: { id: WorldFilter; label: string }[] = [
    { id: 'ALL',        label: 'All' },
    { id: 'WARS',       label: 'Wars' },
    { id: 'LEADERSHIP', label: 'Leadership' },
    { id: 'DISTRICTS',  label: 'Districts' },
    { id: 'SEASONS',    label: 'Seasons' },
  ];

  return (
    <div>
      <PageHeader
        title="World Feed"
        sub="The streets never stop talking."
      />

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '12px',
        borderBottom: '1px solid #1a1a1a', paddingBottom: '1px',
        flexWrap: 'wrap',
      }}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '6px 12px',
              fontSize: '10px',
              fontWeight: filter === f.id ? 'bold' : 'normal',
              color: filter === f.id ? '#cc3333' : '#555',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              borderBottom: filter === f.id ? '2px solid #cc3333' : '2px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <SectionPanel title={`${filtered.length} Events`}>
        {filtered.length === 0 ? (
          <EmptySlate msg="No events in this category." />
        ) : (
          filtered.map(e => <WorldEventCard key={e.id} event={e} />)
        )}
      </SectionPanel>

      {/* Obituaries link */}
      <div style={{ marginTop: '12px', padding: '10px', background: '#111', border: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>
          Player deaths are recorded in the Obituaries page with full contract and kill details.
        </div>
        <Link href="/obituaries">
          <a style={{ fontSize: '10px', color: '#cc3333', fontWeight: 'bold' }}>
            View Obituaries →
          </a>
        </Link>
      </div>
    </div>
  );
}
