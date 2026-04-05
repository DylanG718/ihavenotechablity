/**
 * AdminPanel — dev/admin tools interface.
 * Route: /admin
 *
 * Tabs: Families | Players | Economy | Events | Analytics | Abuse Flags | Season
 */

import { useState } from 'react';
import { PageHeader, SectionPanel } from '../components/layout/AppShell';
import { MOCK_PLAYERS, MOCK_FAMILY, fmt } from '../lib/mockData';
import {
  ECONOMY_SINKS,
  LIVE_OPS_EVENTS,
  ANALYTICS_LOG,
  ABUSE_RULES,
  SEASON_ROLLOVER_CONFIG,
  MOCK_CONTRIBUTION_SCORES,
  getEconomySinkTotal,
} from '../lib/opsData';
import { getSessionEvents } from '../lib/analyticsEngine';
import { useToast } from '../hooks/use-toast';

type AdminTab = 'FAMILIES' | 'PLAYERS' | 'ECONOMY' | 'EVENTS' | 'ANALYTICS' | 'ABUSE' | 'SEASON';

// ─────────────────────────────────────────────
// Tab bar
// ─────────────────────────────────────────────

function TabBar({ active, onChange }: { active: AdminTab; onChange: (t: AdminTab) => void }) {
  const tabs: { id: AdminTab; label: string }[] = [
    { id: 'FAMILIES', label: 'Families' },
    { id: 'PLAYERS',  label: 'Players' },
    { id: 'ECONOMY',  label: 'Economy' },
    { id: 'EVENTS',   label: 'Events' },
    { id: 'ANALYTICS',label: 'Analytics' },
    { id: 'ABUSE',    label: 'Abuse Flags' },
    { id: 'SEASON',   label: 'Season' },
  ];

  return (
    <div style={{
      display: 'flex', gap: '2px', marginBottom: '14px',
      borderBottom: '1px solid #1a1a1a', paddingBottom: '1px',
      flexWrap: 'wrap',
    }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '6px 12px', fontSize: '10px',
            fontWeight: active === t.id ? 'bold' : 'normal',
            color: active === t.id ? '#cc3333' : '#555',
            background: 'none', border: 'none', cursor: 'pointer',
            borderBottom: active === t.id ? '2px solid #cc3333' : '2px solid transparent',
            marginBottom: '-1px',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// Families tab
// ─────────────────────────────────────────────

const MOCK_FAMILIES_ADMIN = [
  {
    id: 'fam-1', name: 'The Corrado Family', boss: 'Don Corrado',
    members: 7, treasury: 1240000, powerScore: 8420, status: 'ACTIVE',
  },
  {
    id: 'fam-2', name: 'Ferrante Crew', boss: 'Carlo Ferrante',
    members: 5, treasury: 620000, powerScore: 7100, status: 'ACTIVE',
  },
  {
    id: 'fam-3', name: 'West Side Outfit', boss: 'Big Mickey',
    members: 3, treasury: 210000, powerScore: 4200, status: 'ACTIVE',
  },
];

function FamiliesTab() {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <SectionPanel title="All Families">
      <div className="ml-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Family</th>
              <th>Boss</th>
              <th>Members</th>
              <th>Treasury</th>
              <th>Power</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {MOCK_FAMILIES_ADMIN.map(f => (
              <>
                <tr key={f.id}>
                  <td style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{f.name}</td>
                  <td style={{ color: '#ffcc33' }}>{f.boss}</td>
                  <td>{f.members}</td>
                  <td className="text-cash">{fmt(f.treasury)}</td>
                  <td>{f.powerScore.toLocaleString()}</td>
                  <td>
                    <span style={{ color: '#4a9a4a', fontSize: '9px' }}>{f.status}</span>
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '9px' }}
                      onClick={() => setExpanded(expanded === f.id ? null : f.id)}
                    >
                      {expanded === f.id ? 'Close' : 'Expand'}
                    </button>
                  </td>
                </tr>
                {expanded === f.id && f.id === 'fam-1' && (
                  <tr key={`${f.id}-expand`}>
                    <td colSpan={7} style={{ padding: '10px', background: '#0a0a0a' }}>
                      <div style={{ fontSize: '10px', color: '#888', marginBottom: '6px', fontWeight: 'bold' }}>
                        Members
                      </div>
                      <table className="data-table" style={{ marginBottom: '10px' }}>
                        <thead><tr><th>Alias</th><th>Role</th><th>Missions</th><th>Earned</th></tr></thead>
                        <tbody>
                          {MOCK_FAMILY.members.map(m => {
                            const p = MOCK_PLAYERS[m.player_id];
                            return (
                              <tr key={m.player_id}>
                                <td style={{ color: '#e0e0e0' }}>{p?.alias ?? m.player_id}</td>
                                <td style={{ color: '#888', fontSize: '9px' }}>{m.role}</td>
                                <td>{m.missions_completed}</td>
                                <td className="text-cash">{fmt(m.money_earned)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </SectionPanel>
  );
}

// ─────────────────────────────────────────────
// Players tab
// ─────────────────────────────────────────────

function PlayersTab() {
  const { toast } = useToast();

  function fixState(playerId: string) {
    toast({
      title: 'State Fixed (Mock)',
      description: `Player ${playerId} state reset. In production, this would call the admin API.`,
    });
  }

  return (
    <SectionPanel title="All Players">
      <div className="ml-table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Alias</th>
              <th>Rank</th>
              <th>Family</th>
              <th>Heat</th>
              <th>Cash</th>
              <th>Stash</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {Object.values(MOCK_PLAYERS).map(p => (
              <tr key={p.id}>
                <td style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{p.alias}</td>
                <td style={{ fontSize: '9px', color: '#888' }}>{p.family_role ?? p.affiliation}</td>
                <td style={{ fontSize: '9px', color: '#555' }}>{p.family_id ?? '—'}</td>
                <td style={{ color: p.stats.heat > 60 ? '#cc3333' : '#cc9900' }}>
                  {p.stats.heat}
                </td>
                <td className="text-cash">{fmt(p.stats.cash)}</td>
                <td style={{ color: '#5580bb' }}>{fmt(p.stats.stash)}</td>
                <td>
                  <span style={{
                    fontSize: '8px',
                    color: p.player_status === 'ACTIVE' ? '#4a9a4a' : '#cc3333',
                  }}>
                    {p.player_status}
                  </span>
                  {p.death_state !== 'ALIVE' && (
                    <span style={{ fontSize: '8px', color: '#cc3333', marginLeft: '4px' }}>
                      {p.death_state}
                    </span>
                  )}
                </td>
                <td>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: '9px' }}
                    onClick={() => fixState(p.id)}
                  >
                    Fix State
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionPanel>
  );
}

// ─────────────────────────────────────────────
// Economy tab
// ─────────────────────────────────────────────

function EconomyTab() {
  const dailySinkTotal = getEconomySinkTotal();

  return (
    <div>
      <div className="ml-grid-4" style={{ marginBottom: '12px' }}>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Daily Sink (Max Family)</div>
          <div className="stat-val text-danger">{fmt(dailySinkTotal)}</div>
        </div>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Active Sinks</div>
          <div className="stat-val">{ECONOMY_SINKS.length}</div>
        </div>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Fam-1 Treasury</div>
          <div className="stat-val text-cash">{fmt(MOCK_FAMILY.treasury)}</div>
        </div>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Top Earner</div>
          <div className="stat-val" style={{ fontSize: '11px' }}>
            {(() => {
              const top = MOCK_CONTRIBUTION_SCORES.sort((a, b) => b.moneyEarned - a.moneyEarned)[0];
              return MOCK_PLAYERS[top.playerId]?.alias ?? top.playerId;
            })()}
          </div>
        </div>
      </div>

      <SectionPanel title="Economy Sinks">
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sink</th>
                <th>Category</th>
                <th>Payer</th>
                <th>Base Cost</th>
                <th>Recurring</th>
              </tr>
            </thead>
            <tbody>
              {ECONOMY_SINKS.map(s => (
                <tr key={s.id}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '10px' }}>{s.name}</div>
                    <div style={{ fontSize: '8px', color: '#444' }}>{s.description}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '8px', color: '#5580bb' }}>{s.category}</span>
                  </td>
                  <td style={{ fontSize: '9px', color: '#888' }}>{s.payer}</td>
                  <td className="text-cash">{s.baseCost > 0 ? fmt(s.baseCost) : 'Variable'}</td>
                  <td style={{ fontSize: '9px', color: s.recurring ? '#4a9a4a' : '#333' }}>
                    {s.recurring ? `Every ${s.recurringPeriodHours}h` : 'One-time'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// Events tab
// ─────────────────────────────────────────────

function EventsTab() {
  const { toast } = useToast();
  const [events, setEvents] = useState(LIVE_OPS_EVENTS);

  function toggleEvent(id: string) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, active: !e.active } : e));
    const event = events.find(e => e.id === id);
    if (!event) return;
    toast({
      title: `Event ${event.active ? 'Deactivated' : 'Activated'} (Mock)`,
      description: event.name,
    });
  }

  function createEvent() {
    toast({
      title: 'Create Event (Mock)',
      description: 'In production, this opens the event creation form.',
    });
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <button className="btn btn-primary" onClick={createEvent} style={{ fontSize: '10px' }}>
          + Create Event
        </button>
      </div>

      <SectionPanel title="Live-Ops Events">
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Scope</th>
                <th>Modifiers</th>
                <th>Window</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {events.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '10px' }}>{e.name}</div>
                    <div style={{ fontSize: '8px', color: '#444', fontStyle: 'italic' }}>{e.flavor}</div>
                  </td>
                  <td>
                    <div style={{ fontSize: '9px', color: '#5580bb' }}>{e.scope}</div>
                    {e.scopeTargetId && (
                      <div style={{ fontSize: '8px', color: '#333' }}>{e.scopeTargetId}</div>
                    )}
                  </td>
                  <td>
                    {e.modifiers.map((m, i) => (
                      <div key={i} style={{ fontSize: '8px', color: m.multiplier > 1 ? '#4a9a4a' : '#cc3333' }}>
                        {m.type}: ×{m.multiplier}
                      </div>
                    ))}
                  </td>
                  <td>
                    <div style={{ fontSize: '8px', color: '#555' }}>
                      {new Date(e.startAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '8px', color: '#444' }}>
                      → {new Date(e.endAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '9px',
                      color: e.active ? '#4a9a4a' : '#444',
                      fontWeight: 'bold',
                    }}>
                      {e.active ? 'ACTIVE' : 'inactive'}
                    </span>
                    {e.adminTriggered && (
                      <div style={{ fontSize: '8px', color: '#818cf8' }}>admin</div>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '9px' }}
                      onClick={() => toggleEvent(e.id)}
                    >
                      {e.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// Analytics tab
// ─────────────────────────────────────────────

type AnalyticsFilter = 'ALL' | string;

function AnalyticsTab() {
  const sessionEvents = getSessionEvents();
  const allEvents = [...ANALYTICS_LOG, ...sessionEvents];
  const [eventFilter, setEventFilter] = useState<AnalyticsFilter>('ALL');

  const eventTypes = Array.from(new Set(allEvents.map(e => e.event)));
  const filtered = allEvents.filter(e => eventFilter === 'ALL' || e.event === eventFilter);

  const stats = {
    total: allEvents.length,
    session: sessionEvents.length,
    uniquePlayers: new Set(allEvents.map(e => e.playerId)).size,
    uniqueEvents: eventTypes.length,
  };

  return (
    <div>
      <div className="ml-grid-4" style={{ marginBottom: '12px' }}>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Total Events</div>
          <div className="stat-val">{stats.total}</div>
        </div>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Session Events</div>
          <div className="stat-val" style={{ color: '#818cf8' }}>{stats.session}</div>
        </div>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Unique Players</div>
          <div className="stat-val">{stats.uniquePlayers}</div>
        </div>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Event Types</div>
          <div className="stat-val">{stats.uniqueEvents}</div>
        </div>
      </div>

      {/* Filter */}
      <div style={{ marginBottom: '10px', display: 'flex', gap: '6px', alignItems: 'center' }}>
        <span style={{ fontSize: '9px', color: '#555' }}>Filter:</span>
        <select
          value={eventFilter}
          onChange={e => setEventFilter(e.target.value)}
          style={{ fontSize: '9px', background: '#111', border: '1px solid #222', color: '#e0e0e0', padding: '3px 6px' }}
        >
          <option value="ALL">All Events</option>
          {eventTypes.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      <SectionPanel title={`${filtered.length} Events`}>
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Player</th>
                <th>Family</th>
                <th>Properties</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((e, i) => (
                <tr key={i}>
                  <td>
                    <span style={{ fontSize: '9px', color: '#818cf8', fontFamily: 'monospace' }}>
                      {e.event}
                    </span>
                  </td>
                  <td style={{ fontSize: '9px', color: '#888' }}>{e.playerId}</td>
                  <td style={{ fontSize: '9px', color: '#555' }}>{e.familyId ?? '—'}</td>
                  <td>
                    <div style={{ fontSize: '8px', color: '#444', fontFamily: 'monospace', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {JSON.stringify(e.properties)}
                    </div>
                  </td>
                  <td style={{ fontSize: '8px', color: '#444' }}>
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// Abuse Flags tab
// ─────────────────────────────────────────────

const MOCK_FLAGGED_PLAYERS = [
  { playerId: 'p-associate', alias: 'Luca B',      flag: 'SPAM_APPLICATION',    count: 6,  windowHours: 1, flaggedAt: '2026-04-03T14:00:00Z' },
  { playerId: 'p-recruit',   alias: 'Joey Socks',   flag: 'SLOT_SQUATTING',      count: 1,  windowHours: 72, flaggedAt: '2026-04-02T08:00:00Z' },
  { playerId: 'p-soldier',   alias: 'Vinnie D',     flag: 'HIGH_FREQUENCY_EARNING', count: 32, windowHours: 1, flaggedAt: '2026-04-01T22:00:00Z' },
];

function AbuseFlagsTab() {
  const { toast } = useToast();

  function clearFlag(alias: string) {
    toast({
      title: 'Flag Cleared (Mock)',
      description: `${alias}'s abuse flag has been cleared.`,
    });
  }

  return (
    <div>
      <SectionPanel title="Flagged Players (Mock)">
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Player</th><th>Flag</th><th>Count</th><th>Flagged At</th><th></th></tr>
            </thead>
            <tbody>
              {MOCK_FLAGGED_PLAYERS.map(f => (
                <tr key={f.playerId}>
                  <td style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{f.alias}</td>
                  <td>
                    <span style={{ fontSize: '8px', color: '#cc9900', fontFamily: 'monospace' }}>{f.flag}</span>
                  </td>
                  <td style={{ color: '#cc3333', fontWeight: 'bold' }}>{f.count}</td>
                  <td style={{ fontSize: '9px', color: '#444' }}>
                    {new Date(f.flaggedAt).toLocaleString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '9px' }}
                      onClick={() => clearFlag(f.alias)}
                    >
                      Clear
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>

      <SectionPanel title="Abuse Rule Config">
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Flag</th>
                <th>Threshold</th>
                <th>Window</th>
                <th>Consequence</th>
                <th>Cooldown</th>
              </tr>
            </thead>
            <tbody>
              {ABUSE_RULES.map(r => (
                <tr key={r.flag}>
                  <td>
                    <div style={{ fontSize: '9px', color: '#cc9900', fontFamily: 'monospace' }}>{r.flag}</div>
                    <div style={{ fontSize: '8px', color: '#444' }}>{r.description}</div>
                  </td>
                  <td style={{ fontSize: '9px', color: '#e0e0e0' }}>{r.thresholdValue}</td>
                  <td style={{ fontSize: '9px', color: '#555' }}>{r.thresholdWindowHours}h</td>
                  <td>
                    <span style={{ fontSize: '8px', color: '#5580bb' }}>{r.consequenceType}</span>
                  </td>
                  <td style={{ fontSize: '9px', color: r.cooldownHours > 0 ? '#cc9900' : '#333' }}>
                    {r.cooldownHours > 0 ? `${r.cooldownHours}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// Season tab
// ─────────────────────────────────────────────

function SeasonTab() {
  const { toast } = useToast();

  function triggerSnapshot() {
    toast({
      title: 'Snapshot Triggered (Mock)',
      description: 'Season snapshot would be captured and committed to the leaderboard record.',
    });
  }

  return (
    <div>
      <div className="ml-grid-4" style={{ marginBottom: '12px' }}>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Current Season</div>
          <div className="stat-val">Season 3</div>
        </div>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Days Remaining</div>
          <div className="stat-val text-warn">4</div>
        </div>
        <div className="panel" style={{ padding: '10px' }}>
          <div className="label-caps">Resets Configured</div>
          <div className="stat-val">{SEASON_ROLLOVER_CONFIG.resets.length}</div>
        </div>
        <div className="panel" style={{ padding: '10px', display: 'flex', alignItems: 'flex-end' }}>
          <button className="btn btn-primary" onClick={triggerSnapshot} style={{ fontSize: '10px', width: '100%' }}>
            Trigger Snapshot
          </button>
        </div>
      </div>

      <SectionPanel title="Rollover Config — Season 3">
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr><th>Field</th><th>Reset Type</th><th>Decay %</th><th>Notes</th></tr>
            </thead>
            <tbody>
              {SEASON_ROLLOVER_CONFIG.resets.map(r => (
                <tr key={r.field}>
                  <td>
                    <span style={{ fontSize: '9px', color: '#818cf8', fontFamily: 'monospace' }}>{r.field}</span>
                  </td>
                  <td>
                    <span style={{
                      fontSize: '8px',
                      color: r.type === 'FULL_RESET' ? '#cc3333' : r.type === 'PRESERVE' ? '#4a9a4a' : '#cc9900',
                    }}>
                      {r.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '9px', color: '#888' }}>
                    {r.decayPercent != null ? `${r.decayPercent}%` : '—'}
                  </td>
                  <td style={{ fontSize: '9px', color: '#555' }}>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Admin Panel
// ─────────────────────────────────────────────

export default function AdminPanel() {
  const [tab, setTab] = useState<AdminTab>('FAMILIES');

  return (
    <div>
      <PageHeader
        title="Admin Panel"
        sub="DEV tools — all actions are mocked in this build"
      />

      <div style={{
        padding: '5px 10px',
        background: '#1a0808',
        border: '1px solid #cc333344',
        marginBottom: '12px',
        fontSize: '9px',
        color: '#cc3333',
      }}>
        DEV ENVIRONMENT — No data is persisted. All write actions are mock toasts.
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'FAMILIES'  && <FamiliesTab />}
      {tab === 'PLAYERS'   && <PlayersTab />}
      {tab === 'ECONOMY'   && <EconomyTab />}
      {tab === 'EVENTS'    && <EventsTab />}
      {tab === 'ANALYTICS' && <AnalyticsTab />}
      {tab === 'ABUSE'     && <AbuseFlagsTab />}
      {tab === 'SEASON'    && <SeasonTab />}
    </div>
  );
}
