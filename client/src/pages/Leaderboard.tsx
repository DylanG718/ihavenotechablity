/**
 * HitmanLeaderboard — spec aligned
 *
 * Spec: hitman_system.leaderboard.leaderboards
 *   ROUND_TOP_HITMEN / ALL_TIME_LEGENDS / CLEAN_OPERATORS / HIGHEST_PAID
 *
 * Spec: hitman_system.leaderboard.ranking_metrics
 *   contracts_completed / weighted_contract_difficulty / success_rate /
 *   clean_success_ratio / streak_score / high_value_target_count / low_trace_rate_score
 */

import { useState } from 'react';
import { MOCK_LEADERBOARDS, fmt } from '../lib/mockData';
import { PageHeader, SectionPanel } from '../components/layout/AppShell';
import { RepBadge, AvailBadge } from '../components/ui/Badges';
import type { LeaderboardId, HitmanLeaderboardEntry, ContractOutcome } from '../../../shared/schema';
import { LEADERBOARD_LABELS } from '../../../shared/schema';

function FormDots({ form }: { form: ContractOutcome[] }) {
  const colorMap: Record<ContractOutcome, string> = {
    SUCCESS_CLEAN:         '#4a9a4a',
    SUCCESS_MESSY:         '#cc9900',
    FAILED_UNTRACED:       '#cc3333',
    FAILED_TRACED:         '#990000',
    CATASTROPHIC_BLOWBACK: '#660000',
  };
  return (
    <span style={{ display: 'flex', gap: '2px' }}>
      {form.slice(0, 8).map((r, i) => (
        <span key={i} title={r.replace(/_/g,' ')} style={{
          display: 'inline-block', width: '7px', height: '7px', borderRadius: '50%',
          background: colorMap[r] ?? '#555',
        }} />
      ))}
    </span>
  );
}

const LEADERBOARD_IDS: LeaderboardId[] = [
  'ROUND_TOP_HITMEN', 'ALL_TIME_LEGENDS', 'CLEAN_OPERATORS', 'HIGHEST_PAID',
];

export default function HitmanLeaderboard() {
  const [view, setView] = useState<LeaderboardId>('ROUND_TOP_HITMEN');
  const entries = MOCK_LEADERBOARDS[view] ?? [];
  const top = entries[0];

  const METRIC_LABELS: Record<LeaderboardId, { col: string; getter: (e: HitmanLeaderboardEntry) => string | number }> = {
    ROUND_TOP_HITMEN:  { col: 'Score',          getter: e => e.hitman_score.toLocaleString() },
    ALL_TIME_LEGENDS:  { col: 'Difficulty × Vol', getter: e => (e.weighted_contract_difficulty * e.contracts_completed).toFixed(1) },
    CLEAN_OPERATORS:   { col: 'Clean Ratio',     getter: e => `${Math.round(e.clean_success_ratio * 100)}%` },
    HIGHEST_PAID:      { col: 'Avg Payout',      getter: e => fmt(e.avg_payout) },
  };
  const metric = METRIC_LABELS[view];

  return (
    <div>
      <PageHeader
        title="Hitman Leaderboard"
        sub="Ranked by composite score across success rate, quality, streaks, and professionalism."
      />

      {/* View tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', overflowX: 'auto', paddingBottom: '2px', WebkitOverflowScrolling: 'touch' as any }}>
        {LEADERBOARD_IDS.map(id => (
          <button key={id} onClick={() => setView(id)}
            className={`btn ${view === id ? 'btn-primary' : 'btn-ghost'}`}
            style={{ flexShrink: 0 }}
          >
            {LEADERBOARD_LABELS[id]}
          </button>
        ))}
      </div>

      {/* Scoring methodology */}
      <SectionPanel title="Ranking Metrics (Spec)">
        <div style={{ padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '10px', fontSize: '10px', color: '#888', fontFamily: 'Verdana, sans-serif' }}>
          {[
            ['contracts_completed',          '×10'],
            ['weighted_contract_difficulty', '×8'],
            ['success_rate',                 '×40'],
            ['clean_success_ratio',          '×15'],
            ['streak_score',                 '×12'],
            ['high_value_target_count',      '×8'],
            ['low_trace_rate_score',         '×10'],
          ].map(([f, w]) => (
            <div key={f} style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 'bold', color: '#e0e0e0', fontSize: '11px' }}>{w}</div>
              <div style={{ fontSize: '8px' }}>{f}</div>
            </div>
          ))}
        </div>
      </SectionPanel>

      {/* Top card */}
      {top && (
        <div className="panel" style={{ padding: '12px', marginBottom: '10px', borderColor: '#3a2a00', background: '#1a1500' }}>
          <div style={{ fontSize: '9px', color: '#cc9900', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px', fontFamily: 'Verdana, sans-serif' }}>
            ★ Top — {LEADERBOARD_LABELS[view]}
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#e0e0e0', fontFamily: 'Verdana, sans-serif', marginBottom: '4px' }}>{top.alias}</div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <RepBadge tier={top.rep_tier} />
                <AvailBadge avail={top.availability} />
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="label-caps">{metric.col}</div>
              <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#ffcc33', fontFamily: 'Verdana, sans-serif' }}>{metric.getter(top)}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #2a2a00' }}>
            {[
              // spec metric names shown explicitly
              ['contracts_completed',    top.contracts_completed],
              ['success_rate',           `${Math.round(top.success_rate * 100)}%`],
              ['clean_success_ratio',    `${Math.round(top.clean_success_ratio * 100)}%`],
              ['streak_score',           `×${top.streak_score}`],
              ['high_value_targets',     top.high_value_target_count],
              ['low_trace_rate',         `${Math.round(top.low_trace_rate_score * 100)}%`],
            ].map(([l, v]) => (
              <div key={String(l)}>
                <div className="label-caps">{l}</div>
                <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#e0e0e0', fontFamily: 'Verdana, sans-serif' }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full table */}
      <SectionPanel title={`${LEADERBOARD_LABELS[view]} — All Entries`} right={`${entries.length} registered`}>
        <div className="ml-table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Alias</th>
                <th>Tier</th>
                <th>success_rate</th>
                <th>contracts_completed</th>
                <th>clean_success_ratio</th>
                <th>streak_score</th>
                <th>high_value_targets</th>
                <th>low_trace_rate</th>
                <th>Avg Pay</th>
                <th>Form</th>
                <th>Status</th>
                <th>{metric.col}</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr key={e.player_id} data-testid={`lb-row-${e.player_id}`}
                  style={{ opacity: e.availability === 'IN_PRISON' ? 0.55 : 1 }}
                >
                  <td style={{ fontWeight: i < 3 ? 'bold' : 'normal', color: i === 0 ? '#ffcc33' : '#e0e0e0' }}>{i + 1}</td>
                  <td style={{ fontWeight: 'bold', color: '#e0e0e0', whiteSpace: 'nowrap' }}>{e.alias}</td>
                  <td><RepBadge tier={e.rep_tier} /></td>
                  <td style={{ color: e.success_rate >= 0.9 ? '#4a9a4a' : e.success_rate >= 0.8 ? '#cc9900' : '#cc3333', fontWeight: 'bold' }}>
                    {Math.round(e.success_rate * 100)}%
                  </td>
                  <td>{e.contracts_completed}</td>
                  <td style={{ color: e.clean_success_ratio >= 0.9 ? '#4a9a4a' : '#cc9900' }}>
                    {Math.round(e.clean_success_ratio * 100)}%
                  </td>
                  <td style={{ color: e.streak_score > 0 ? '#ffcc33' : '#555', fontWeight: e.streak_score > 0 ? 'bold' : 'normal' }}>
                    {e.streak_score > 0 ? `×${e.streak_score}` : '—'}
                  </td>
                  <td>{e.high_value_target_count}</td>
                  <td style={{ color: e.low_trace_rate_score >= 0.9 ? '#4a9a4a' : '#cc9900' }}>
                    {Math.round(e.low_trace_rate_score * 100)}%
                  </td>
                  <td className="text-cash" style={{ whiteSpace: 'nowrap' }}>{fmt(e.avg_payout)}</td>
                  <td><FormDots form={e.recent_form} /></td>
                  <td><AvailBadge avail={e.availability} /></td>
                  <td style={{ fontWeight: 'bold', color: i === 0 ? '#ffcc33' : '#e0e0e0', whiteSpace: 'nowrap' }}>
                    {metric.getter(e)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ padding: '5px 8px', borderTop: '1px solid #1a1a1a', fontSize: '9px', color: '#444', fontFamily: 'Verdana, sans-serif' }}>
          Metric field names shown exactly as defined in spec object.
          Scores reset each round. In-prison hitmen remain listed but marked unavailable.
        </div>
      </SectionPanel>
    </div>
  );
}
