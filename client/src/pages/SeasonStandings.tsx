/**
 * MafiaLife — Season Standings
 * Route: /season
 *
 * Shows current season standings, historical snapshots, season rules.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { fmt } from '../lib/mockData';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import {
  CURRENT_SEASON,
  SEASON_HISTORY,
  ALL_SEASONS,
  CURRENT_SEASON_STANDINGS,
  LEADERBOARD_SNAPSHOTS,
  getSeasonSnapshots,
  FAMILY_NAMES,
  FAMILY_DON_ALIASES,
} from '../lib/worldSeed';
import type { Season } from '../../../shared/world';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function daysRemaining(endsAt: string): number {
  const end = new Date(endsAt).getTime();
  const now = Date.now();
  return Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE:   '#4a9a4a',
  ENDED:    '#666',
  UPCOMING: '#5580bb',
};

// ─────────────────────────────────────────────
// Score Bar
// ─────────────────────────────────────────────

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div style={{ height: '3px', background: '#1a1a1a', borderRadius: '2px', overflow: 'hidden', marginTop: '2px' }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px' }} />
    </div>
  );
}

// ─────────────────────────────────────────────
// Current Standings Table
// ─────────────────────────────────────────────

function StandingsTable({ playerFamilyId }: { playerFamilyId: string | null }) {
  const standings = CURRENT_SEASON_STANDINGS;
  const maxScore = Math.max(...standings.map(s => s.compositeScore));

  return (
    <SectionPanel
      title="Season 3 — Current Standings"
      right="Composite Score = Turf + Income + Treasury + Prestige + Member Strength"
    >
      <table className="data-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: '30px' }}>#</th>
            <th>Family</th>
            <th>Don</th>
            <th>Score</th>
            <th>Turf</th>
            <th>Income</th>
            <th>Treasury</th>
          </tr>
        </thead>
        <tbody>
          {standings.map(s => {
            const isPlayer = s.familyId === playerFamilyId;
            return (
              <tr key={s.familyId} style={{
                background: isPlayer ? '#0d1400' : undefined,
              }}>
                <td style={{
                  color: s.rank === 1 ? '#ffcc33' : s.rank === 2 ? '#aaa' : s.rank === 3 ? '#cc7733' : '#555',
                  fontWeight: s.rank <= 3 ? 700 : 400,
                }}>
                  #{s.rank}
                </td>
                <td>
                  <span style={{ color: isPlayer ? '#ccff33' : '#ccc', fontWeight: isPlayer ? 700 : 400 }}>
                    {s.familyName}
                    {isPlayer && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#ccff33' }}>[YOU]</span>}
                  </span>
                </td>
                <td style={{ color: '#888', fontSize: '10px' }}>{s.donAlias}</td>
                <td>
                  <span style={{ color: '#ffcc33', fontWeight: 600 }}>{s.compositeScore.toLocaleString()}</span>
                  <ScoreBar value={s.compositeScore} max={maxScore} color="#ffcc33" />
                </td>
                <td style={{ color: '#818cf8' }}>{s.turfScore.toLocaleString()}</td>
                <td style={{ color: '#4a9a4a' }}>{s.incomeScore.toLocaleString()}</td>
                <td style={{ color: '#5580bb' }}>{s.treasuryScore.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div style={{ padding: '6px 10px', borderTop: '1px solid #111' }}>
        <div style={{ fontSize: '9px', color: '#333', fontStyle: 'italic' }}>
          DEV: Standings are mock data. Formula: Turf×1 + Income×1 + Treasury×1 + Prestige×1 + MemberStrength×1
        </div>
      </div>
    </SectionPanel>
  );
}

// ─────────────────────────────────────────────
// Historical Tab
// ─────────────────────────────────────────────

function HistoryTab({ playerFamilyId }: { playerFamilyId: string | null }) {
  const [activeSeason, setActiveSeason] = useState<string>('season-2');

  const endedSeasons = ALL_SEASONS.filter(s => s.status === 'ENDED');
  const snapshots = getSeasonSnapshots(activeSeason);

  return (
    <div>
      {/* Season selector */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {endedSeasons.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSeason(s.id)}
            style={{
              padding: '4px 10px', fontSize: '10px', cursor: 'pointer',
              background: activeSeason === s.id ? '#1a1500' : '#111',
              border: `1px solid ${activeSeason === s.id ? '#3a2a00' : '#222'}`,
              color: activeSeason === s.id ? '#ffcc33' : '#666',
              borderRadius: '2px',
            }}
          >
            Season {s.number} — {s.name}
          </button>
        ))}
      </div>

      {/* Selected season info */}
      {(() => {
        const season = endedSeasons.find(s => s.id === activeSeason);
        if (!season) return null;
        return (
          <div className="panel" style={{ padding: '8px 10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '4px' }}>
              <div>
                <span className="label-caps block">Season</span>
                <span style={{ fontSize: '11px', color: '#ccc' }}>Season {season.number} — {season.name}</span>
              </div>
              <div>
                <span className="label-caps block">Period</span>
                <span style={{ fontSize: '11px', color: '#ccc' }}>
                  {formatDate(season.startedAt)} → {formatDate(season.endsAt)}
                </span>
              </div>
              <div>
                <span className="label-caps block">Status</span>
                <span style={{ fontSize: '11px', color: STATUS_COLORS[season.status] }}>{season.status}</span>
              </div>
            </div>
            <p style={{ fontSize: '10px', color: '#666', fontStyle: 'italic' }}>{season.description}</p>
          </div>
        );
      })()}

      {/* Final rankings */}
      <SectionPanel title="Final Rankings">
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ width: '30px' }}>#</th>
              <th>Family</th>
              <th>Don</th>
              <th>Score</th>
              <th>Turf</th>
              <th>Income</th>
              <th>Treasury</th>
            </tr>
          </thead>
          <tbody>
            {snapshots.map(s => {
              const isPlayer = s.familyId === playerFamilyId;
              return (
                <tr key={s.id} style={{ background: isPlayer ? '#0d1400' : undefined }}>
                  <td style={{
                    color: s.rank === 1 ? '#ffcc33' : s.rank === 2 ? '#aaa' : s.rank === 3 ? '#cc7733' : '#555',
                    fontWeight: s.rank <= 3 ? 700 : 400,
                  }}>
                    #{s.rank}
                  </td>
                  <td>
                    <span style={{ color: isPlayer ? '#ccff33' : '#ccc', fontWeight: isPlayer ? 700 : 400 }}>
                      {s.familyName}
                      {isPlayer && <span style={{ marginLeft: '4px', fontSize: '9px', color: '#ccff33' }}>[YOU]</span>}
                    </span>
                  </td>
                  <td style={{ color: '#888', fontSize: '10px' }}>{s.donAlias}</td>
                  <td style={{ color: '#ffcc33', fontWeight: 600 }}>{s.compositeScore.toLocaleString()}</td>
                  <td style={{ color: '#818cf8' }}>{s.turfScore.toLocaleString()}</td>
                  <td style={{ color: '#4a9a4a' }}>{s.incomeScore.toLocaleString()}</td>
                  <td style={{ color: '#5580bb' }}>{s.treasuryScore.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </SectionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// Season Rules Tab
// ─────────────────────────────────────────────

function RulesTab({ season }: { season: Season }) {
  return (
    <div>
      <SectionPanel title="Season Rules — What Resets">
        <div style={{ padding: '10px' }}>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '11px', color: '#cc3333', fontWeight: 600, marginBottom: '6px' }}>
              ⚠ Soft Reset — Cleared at Season End
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {season.softResetFields.map(f => (
                <span key={f} style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '2px',
                  background: '#1a0808', border: '1px solid #3a1010', color: '#cc3333',
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#4a9a4a', fontWeight: 600, marginBottom: '6px' }}>
              ✓ Preserved — Carries Forward
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {season.preservedFields.map(f => (
                <span key={f} style={{
                  fontSize: '10px', padding: '2px 8px', borderRadius: '2px',
                  background: '#0d1a0d', border: '1px solid #1a3a1a', color: '#4a9a4a',
                }}>
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </SectionPanel>

      <SectionPanel title="Scoring Formula">
        <div style={{ padding: '10px' }}>
          <p style={{ fontSize: '10px', color: '#888', marginBottom: '10px' }}>
            Composite Score = Sum of all component scores. Higher is better. Standings are calculated daily.
          </p>
          {[
            { component: 'Turf Score', desc: 'Points per owned turf × quality multiplier', color: '#818cf8' },
            { component: 'Income Score', desc: 'Based on total daily front income across all turfs', color: '#4a9a4a' },
            { component: 'Treasury Score', desc: 'Family treasury balance at snapshot time', color: '#5580bb' },
            { component: 'Prestige Score', desc: 'Accumulated prestige from missions, contracts, and operations', color: '#ffcc33' },
            { component: 'Member Strength Score', desc: 'Combined stat scores of all active family members', color: '#cc7733' },
          ].map(({ component, desc, color }) => (
            <div key={component} style={{
              padding: '6px 8px', marginBottom: '4px',
              background: '#111', border: '1px solid #1a1a1a', borderRadius: '2px',
            }}>
              <div style={{ fontSize: '10px', color, fontWeight: 600 }}>{component}</div>
              <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{desc}</div>
            </div>
          ))}
        </div>
      </SectionPanel>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

const TABS = ['Current', 'History', 'Season Rules'] as const;
type Tab = typeof TABS[number];

export default function SeasonStandings() {
  const { player } = useGame();
  const [tab, setTab] = useState<Tab>('Current');

  const daysLeft = daysRemaining(CURRENT_SEASON.endsAt);
  const playerFamilyId = player.family_id;

  return (
    <div>
      <PageHeader
        title={`Season ${CURRENT_SEASON.number} — ${CURRENT_SEASON.name}`}
        sub={CURRENT_SEASON.description}
        action={
          <span style={{
            fontSize: '9px', padding: '2px 7px', borderRadius: '2px',
            background: '#0d1a0d', border: '1px solid #1a3a1a', color: '#4a9a4a',
            fontWeight: 600,
          }}>
            ACTIVE
          </span>
        }
      />

      {/* Current season info card */}
      <div className="panel" style={{ padding: '10px', marginBottom: '10px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {[
            { l: 'Season', v: `#${CURRENT_SEASON.number}` },
            { l: 'Started', v: formatDate(CURRENT_SEASON.startedAt) },
            { l: 'Ends', v: formatDate(CURRENT_SEASON.endsAt) },
            { l: 'Days Remaining', v: `${daysLeft} days`, c: daysLeft < 14 ? '#cc3333' : '#4a9a4a' },
          ].map(({ l, v, c }) => (
            <div key={l}>
              <span className="label-caps block">{l}</span>
              <span style={{ fontSize: '12px', color: c ?? '#ccc', fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', marginBottom: '2px', flexWrap: 'wrap' }}>
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '5px 10px', fontSize: '10px', cursor: 'pointer',
              background: tab === t ? '#1a1500' : '#111',
              border: `1px solid ${tab === t ? '#3a2a00' : '#222'}`,
              color: tab === t ? '#ffcc33' : '#666',
              borderRadius: '2px 2px 0 0',
              fontWeight: tab === t ? 600 : 400,
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <div style={{ borderRadius: '0 2px 2px 2px' }}>
        {tab === 'Current' && (
          <StandingsTable playerFamilyId={playerFamilyId} />
        )}
        {tab === 'History' && (
          <HistoryTab playerFamilyId={playerFamilyId} />
        )}
        {tab === 'Season Rules' && (
          <RulesTab season={CURRENT_SEASON} />
        )}
      </div>

      <div style={{ fontSize: '9px', color: '#333', marginTop: '12px', fontStyle: 'italic', textAlign: 'center' }}>
        DEV: Season standings and snapshots are mock data
      </div>
    </div>
  );
}
