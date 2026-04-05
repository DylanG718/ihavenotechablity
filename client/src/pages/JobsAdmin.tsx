/**
 * MafiaLife — DEV: Job Catalog Admin View
 *
 * Lists all jobs in the database with:
 *  - id, name, rank requirement, category, tier, mode
 *  - cooldown, base reward band, jail chance, hitman eligible
 *  - universal flag, effect scope
 *
 * HOW TO ADD JOBS:
 *   Edit /client/src/lib/jobsData.ts → RANKED_JOBS or UNIVERSAL_JOBS arrays.
 *   Fields: id, name, tier, category, min_rank, universal, mode, cooldown_seconds,
 *           reward_band_min/max, reward_types, jail_chance_base, hitman_eligible,
 *           war_context_only, effect_scope, description, lore_tagline.
 *   Rebuild and redeploy.
 *
 * REWARD SCALING (universal only):
 *   Associate 1.0× | Soldier 1.35× | Capo 1.85× | Consigliere/UB 2.35–2.5× | Boss 2.9×
 *
 * JAIL CHANCE BANDS:
 *   Very Low ≤4% | Low ≤12% | Medium ≤25% | High ≤45% | Extreme >45%
 */

import { useState } from 'react';
import { ALL_JOBS, RANKED_JOBS, UNIVERSAL_JOBS } from '../lib/jobsData';
import { PageHeader } from '../components/layout/AppShell';
import { jailRiskLabel, JAIL_RISK_DISPLAY, JAIL_RISK_COLORS } from '../../../shared/jobs';
import type { JobDefinition } from '../../../shared/jobs';
import { fmt } from '../lib/mockData';

const RANK_ORDER_DISPLAY = ['ASSOCIATE', 'SOLDIER', 'CAPO', 'CONSIGLIERE', 'UNDERBOSS', 'BOSS'];
const TIER_COLOR: Record<string | number, string> = {
  1: '#4a9a4a', 1.5: '#5a9a5a', 2: '#cc9900', 3: '#cc6600', 3.5: '#cc5500', 4: '#cc3333', 5: '#e00',
};

function TierPill({ tier }: { tier: number }) {
  return (
    <span style={{
      fontSize: '9px', fontWeight: 'bold', background: '#1a1a1a',
      border: `1px solid ${TIER_COLOR[tier] ?? '#555'}`,
      color: TIER_COLOR[tier] ?? '#888', padding: '1px 5px',
    }}>
      T{tier}
    </span>
  );
}

function ScopePill({ scope }: { scope: string }) {
  return (
    <span style={{
      fontSize: '8px', background: scope === 'FAMILY_ABSTRACT' ? '#0d1a0d' : '#1a1a1a',
      border: `1px solid ${scope === 'FAMILY_ABSTRACT' ? '#2a4a2a' : '#2a2a2a'}`,
      color: scope === 'FAMILY_ABSTRACT' ? '#4a9a4a' : '#888', padding: '1px 4px',
    }}>
      {scope}
    </span>
  );
}

export default function JobsAdmin() {
  const [rankFilter, setRankFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RANKED' | 'UNIVERSAL'>('ALL');
  const [hitmanFilter, setHitmanFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [search, setSearch] = useState('');

  const jobs = ALL_JOBS.filter(j => {
    if (typeFilter === 'RANKED' && j.universal) return false;
    if (typeFilter === 'UNIVERSAL' && !j.universal) return false;
    if (rankFilter !== 'ALL' && j.min_rank !== rankFilter) return false;
    if (hitmanFilter === 'YES' && !j.hitman_eligible) return false;
    if (hitmanFilter === 'NO' && j.hitman_eligible) return false;
    if (search && !j.name.toLowerCase().includes(search.toLowerCase()) && !j.id.includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="DEV: Job Catalog"
        sub={`${ALL_JOBS.length} total jobs — ${RANKED_JOBS.length} ranked + ${UNIVERSAL_JOBS.length} universal. Filters below.`}
      />

      {/* How-to box */}
      <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '10px 14px', marginBottom: '12px', fontSize: '10px', color: '#5580bb', lineHeight: '1.6' }}>
        <strong style={{ color: '#8899cc' }}>How to add / edit jobs:</strong>{' '}
        Edit <code style={{ color: '#aaa' }}>client/src/lib/jobsData.ts</code>.
        Add entries to <code style={{ color: '#aaa' }}>RANKED_JOBS</code> or <code style={{ color: '#aaa' }}>UNIVERSAL_JOBS</code>.
        Universal jobs auto-scale reward by rank (Associate 1×, Soldier 1.35×, Capo 1.85×, UB/Consigliere 2.35–2.5×, Boss 2.9×).
        Jail risk bands: Very Low ≤4% | Low ≤12% | Medium ≤25% | High ≤45% | Extreme &gt;45%.
        Set <code style={{ color: '#aaa' }}>hitman_eligible: true</code> only for explicit high-stakes ranked jobs.
        Rebuild and redeploy after changes.
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px', alignItems: 'center' }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name or id..."
          style={{ background: '#111', border: '1px solid #333', color: '#e0e0e0', fontSize: '10px', padding: '4px 8px', width: '160px' }}
        />
        <span style={{ color: '#333' }}>|</span>
        {['ALL', 'RANKED', 'UNIVERSAL'].map(f => (
          <button key={f} onClick={() => setTypeFilter(f as any)} className={`btn ${typeFilter === f ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '9px', padding: '3px 7px' }}>
            {f}
          </button>
        ))}
        <span style={{ color: '#333' }}>|</span>
        <span style={{ fontSize: '9px', color: '#555' }}>Rank:</span>
        {['ALL', ...RANK_ORDER_DISPLAY].map(r => (
          <button key={r} onClick={() => setRankFilter(r)} className={`btn ${rankFilter === r ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '9px', padding: '3px 7px' }}>
            {r === 'ALL' ? 'All' : r.charAt(0) + r.slice(1).toLowerCase()}
          </button>
        ))}
        <span style={{ color: '#333' }}>|</span>
        <span style={{ fontSize: '9px', color: '#555' }}>Hitman:</span>
        {['ALL', 'YES', 'NO'].map(h => (
          <button key={h} onClick={() => setHitmanFilter(h as any)} className={`btn ${hitmanFilter === h ? 'btn-primary' : 'btn-ghost'}`} style={{ fontSize: '9px', padding: '3px 7px' }}>
            {h}
          </button>
        ))}
      </div>

      <div style={{ fontSize: '10px', color: '#555', marginBottom: '8px' }}>
        Showing {jobs.length} of {ALL_JOBS.length} jobs
      </div>

      {/* Table */}
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="ml-table-scroll">
          <table className="data-table" style={{ fontSize: '10px' }}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Tier</th>
                <th>Category</th>
                <th>Min Rank</th>
                <th>Universal</th>
                <th>Mode</th>
                <th>Cooldown</th>
                <th>Base Reward</th>
                <th>Jail Risk</th>
                <th>Hitman OK</th>
                <th>War Only</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map(j => {
                const risk = jailRiskLabel(j.jail_chance_base);
                return (
                  <tr key={j.id} data-testid={`admin-job-${j.id}`}>
                    <td style={{ color: '#555', fontSize: '9px', fontFamily: 'monospace' }}>{j.id}</td>
                    <td style={{ fontWeight: 'bold', color: '#e0e0e0' }}>
                      {j.name}
                      <div style={{ fontSize: '9px', color: '#555', fontWeight: 'normal', fontStyle: 'italic' }}>{j.lore_tagline}</div>
                    </td>
                    <td><TierPill tier={j.tier} /></td>
                    <td style={{ color: '#888' }}>{j.category}</td>
                    <td style={{ color: j.min_rank === 'BOSS' ? '#cc3333' : j.min_rank === 'UNDERBOSS' ? '#cc5500' : j.min_rank === 'CAPO' ? '#cc9900' : '#888' }}>
                      {j.min_rank}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {j.universal
                        ? <span style={{ color: '#4a9a4a', fontWeight: 'bold' }}>✓</span>
                        : <span style={{ color: '#333' }}>—</span>}
                    </td>
                    <td style={{ color: '#888' }}>{j.mode}</td>
                    <td style={{ color: '#888' }}>
                      {j.cooldown_seconds >= 3600
                        ? `${j.cooldown_seconds / 3600}h`
                        : `${j.cooldown_seconds / 60}m`}
                    </td>
                    <td>
                      <span style={{ color: '#ffcc33' }}>{fmt(j.reward_band_min)}–{fmt(j.reward_band_max)}</span>
                    </td>
                    <td>
                      <span style={{ color: JAIL_RISK_COLORS[risk], fontWeight: 'bold', fontSize: '9px' }}>
                        {JAIL_RISK_DISPLAY[risk]} ({Math.round(j.jail_chance_base * 100)}%)
                      </span>
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {j.hitman_eligible
                        ? <span style={{ color: '#5580bb', fontWeight: 'bold' }}>✓</span>
                        : <span style={{ color: '#333' }}>—</span>}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {j.war_context_only
                        ? <span style={{ color: '#cc3333', fontWeight: 'bold' }}>WAR</span>
                        : <span style={{ color: '#333' }}>—</span>}
                    </td>
                    <td><ScopePill scope={j.effect_scope} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary stats */}
      <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px' }}>
        {[
          ['Total Jobs', ALL_JOBS.length],
          ['Ranked Jobs', RANKED_JOBS.length],
          ['Universal Jobs', UNIVERSAL_JOBS.length],
          ['Hitman Eligible', ALL_JOBS.filter(j => j.hitman_eligible).length],
          ['War Context Only', ALL_JOBS.filter(j => j.war_context_only).length],
          ['Solo Only', ALL_JOBS.filter(j => j.mode === 'SOLO').length],
          ['Crew Required', ALL_JOBS.filter(j => j.mode === 'CREW').length],
          ['Solo or Crew', ALL_JOBS.filter(j => j.mode === 'SOLO_OR_CREW').length],
        ].map(([l, v]) => (
          <div key={String(l)} className="panel" style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{l}</div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e0e0e0' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
