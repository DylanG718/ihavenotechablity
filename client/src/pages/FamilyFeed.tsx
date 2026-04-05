/**
 * FamilyFeed — family activity event timeline.
 * Route: /family/feed
 */

import { useState } from 'react';
import { Link } from 'wouter';
import { PageHeader, SectionPanel, EmptySlate } from '../components/layout/AppShell';
import { useGame } from '../lib/gameContext';
import { getFamilyFeed } from '../lib/opsData';
import type { FamilyActivityEvent, FamilyActivityType } from '../../../shared/ops';

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

type FeedFilter = 'ALL' | 'TURF_BUSINESS' | 'MEMBERS' | 'DIPLOMACY' | 'FINANCE';

const TURF_BUSINESS_TYPES: FamilyActivityType[] = [
  'TURF_PURCHASED', 'FRONT_BUILT', 'FRONT_UPGRADED', 'FRONT_REMOVED',
  'BUSINESS_JOB_COMPLETED', 'CREW_CREATED',
];
const MEMBER_TYPES: FamilyActivityType[] = [
  'MEMBER_JOINED', 'MEMBER_LEFT', 'MEMBER_PROMOTED', 'MEMBER_DEMOTED',
  'MEMBER_KICKED', 'LEADERSHIP_CHANGED',
];
const DIPLOMACY_TYPES: FamilyActivityType[] = [
  'DIPLOMACY_CHANGED', 'WAR_STARTED', 'WAR_ENDED',
];
const FINANCE_TYPES: FamilyActivityType[] = [
  'TREASURY_LARGE_WITHDRAWAL',
];

function matchesFilter(type: FamilyActivityType, filter: FeedFilter): boolean {
  if (filter === 'ALL') return true;
  if (filter === 'TURF_BUSINESS') return (TURF_BUSINESS_TYPES as string[]).includes(type);
  if (filter === 'MEMBERS') return (MEMBER_TYPES as string[]).includes(type);
  if (filter === 'DIPLOMACY') return (DIPLOMACY_TYPES as string[]).includes(type);
  if (filter === 'FINANCE') return (FINANCE_TYPES as string[]).includes(type);
  return true;
}

// ─────────────────────────────────────────────
// Type badge config
// ─────────────────────────────────────────────

const TYPE_CONFIG: Record<FamilyActivityType, { label: string; color: string }> = {
  MEMBER_JOINED:            { label: 'Joined',       color: '#4a9a4a' },
  MEMBER_LEFT:              { label: 'Left',          color: '#888' },
  MEMBER_PROMOTED:          { label: 'Promoted',      color: '#818cf8' },
  MEMBER_DEMOTED:           { label: 'Demoted',       color: '#cc9900' },
  MEMBER_KICKED:            { label: 'Kicked',        color: '#cc3333' },
  TURF_PURCHASED:           { label: 'Turf',          color: '#5580bb' },
  FRONT_BUILT:              { label: 'Built',         color: '#4a9a4a' },
  FRONT_UPGRADED:           { label: 'Upgraded',      color: '#818cf8' },
  FRONT_REMOVED:            { label: 'Removed',       color: '#cc3333' },
  BUSINESS_JOB_COMPLETED:   { label: 'Business Job',  color: '#ffcc33' },
  DIPLOMACY_CHANGED:        { label: 'Diplomacy',     color: '#5580bb' },
  WAR_STARTED:              { label: 'War Started',   color: '#cc3333' },
  WAR_ENDED:                { label: 'War Ended',     color: '#888' },
  CREW_CREATED:             { label: 'Crew',          color: '#4a9a4a' },
  LEADERSHIP_CHANGED:       { label: 'Leadership',    color: '#cc9900' },
  TREASURY_LARGE_WITHDRAWAL:{ label: 'Treasury',      color: '#cc9900' },
};

// ─────────────────────────────────────────────
// Event card
// ─────────────────────────────────────────────

function EventCard({ event }: { event: FamilyActivityEvent }) {
  const config = TYPE_CONFIG[event.type];
  const [expanded, setExpanded] = useState(false);
  const hasMetadata = Object.keys(event.metadata).length > 0;

  return (
    <div style={{
      padding: '10px',
      borderBottom: '1px solid #1a1a1a',
    }}>
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
        }}>
          {config.label}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
            <div style={{ fontSize: '10px', color: '#e0e0e0', lineHeight: '1.5' }}>
              {event.description}
            </div>
            <span style={{ fontSize: '9px', color: '#444', flexShrink: 0 }}>
              {relativeTime(event.timestamp)}
            </span>
          </div>

          {/* Actor info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px', color: '#ffcc33', fontWeight: 'bold' }}>{event.actorAlias}</span>
            <span style={{ fontSize: '8px', color: '#333' }}>·</span>
            <span style={{
              fontSize: '8px', color: '#555',
              padding: '1px 4px',
              border: '1px solid #222',
            }}>
              {event.actorRole}
            </span>
            {hasMetadata && (
              <button
                onClick={() => setExpanded(v => !v)}
                style={{ fontSize: '8px', color: '#333', background: 'none', border: 'none', cursor: 'pointer', marginLeft: '4px' }}
              >
                {expanded ? '▲ less' : '▼ details'}
              </button>
            )}
          </div>

          {/* Expanded metadata (DEV) */}
          {expanded && hasMetadata && (
            <div style={{ marginTop: '6px', padding: '6px', background: '#111', border: '1px solid #1a1a1a', fontSize: '9px', color: '#444' }}>
              {Object.entries(event.metadata).map(([k, v]) => (
                <div key={k}>
                  <span style={{ color: '#555' }}>{k}:</span> {String(v)}
                </div>
              ))}
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

export default function FamilyFeedPage() {
  const { player } = useGame();
  const familyId = player.family_id ?? 'fam-1';
  const familyName = 'Corrado Family'; // mock
  const [filter, setFilter] = useState<FeedFilter>('ALL');

  const allEvents = getFamilyFeed(familyId);
  const filtered = allEvents.filter(e => matchesFilter(e.type, filter));

  const filters: { id: FeedFilter; label: string }[] = [
    { id: 'ALL',          label: 'All' },
    { id: 'TURF_BUSINESS',label: 'Turf & Business' },
    { id: 'MEMBERS',      label: 'Members' },
    { id: 'DIPLOMACY',    label: 'Diplomacy' },
    { id: 'FINANCE',      label: 'Finance' },
  ];

  return (
    <div>
      <PageHeader
        title={`Family Feed`}
        sub={familyName}
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
          <EmptySlate msg="No activity in this category." />
        ) : (
          filtered.map(e => <EventCard key={e.id} event={e} />)
        )}
      </SectionPanel>

      {/* World feed link */}
      <div style={{ marginTop: '12px', padding: '10px', background: '#111', border: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: '10px', color: '#555', marginBottom: '4px' }}>
          Looking for world-level events, wars, or obituaries?
        </div>
        <Link href="/world/feed">
          <a style={{ fontSize: '10px', color: '#cc3333', fontWeight: 'bold' }}>
            See World Events →
          </a>
        </Link>
      </div>

      {/* DEV note */}
      <div style={{ marginTop: '8px', fontSize: '9px', color: '#333', padding: '4px 8px' }}>
        DEV: Showing {allEvents.length} events for family {familyId}. Click any card for metadata.
      </div>
    </div>
  );
}
