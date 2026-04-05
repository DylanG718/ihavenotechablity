/**
 * WorldAdmin.tsx — DEV: World Config Explorer
 *
 * Browsable view of all seed/config data:
 *   Districts → Turfs → Business Definitions → Slot Definitions → Exclusive Jobs
 *
 * Tabs:
 *   Districts & Turfs | Business Definitions | Slot Definitions | Exclusive Jobs | Assignments | Summary
 */

import { useState } from 'react';
import { PageHeader } from '../components/layout/AppShell';
import {
  DISTRICTS, TURFS, TURFS_BY_DISTRICT,
  BUSINESS_DEFINITIONS, BUSINESS_SLOT_DEFINITIONS, SLOT_DEFS_BY_FRONT,
  BUSINESS_EXCLUSIVE_JOBS, BIZ_JOBS_BY_FRONT,
  BUSINESS_ASSIGNMENTS_SEED,
  WORLD_STATS,
} from '../lib/worldConfig';
import { fmt } from '../lib/mockData';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const QUALITY_COLORS: Record<string, string> = {
  PRIME:     '#ffcc33',
  SOLID:     '#4a9a4a',
  ROUGH:     '#888',
  CONTESTED: '#cc5500',
};

const SCALE_COLORS: Record<string, string> = {
  SMALL: '#4a9a4a',
  LARGE: '#cc9900',
  HQ:    '#cc3333',
};

const RISK_COLOR = (r: number) =>
  r <= 0.05 ? '#4a9a4a' : r <= 0.12 ? '#6aaa4a' : r <= 0.22 ? '#cc9900' : r <= 0.3 ? '#cc5500' : '#cc3333';

const RANK_COLORS: Record<string, string> = {
  ASSOCIATE:   '#888',
  SOLDIER:     '#4a9a4a',
  CAPO:        '#cc9900',
  CONSIGLIERE: '#818cf8',
  UNDERBOSS:   '#cc6600',
  DON:         '#cc3333',
};

const PILL = (label: string, color: string) => (
  <span style={{ fontSize: '9px', fontWeight: 600, background: '#1a1a1a', border: `1px solid ${color}`, color, padding: '1px 5px', whiteSpace: 'nowrap' }}>
    {label}
  </span>
);

// ─────────────────────────────────────────────
// TAB: DISTRICTS & TURFS
// ─────────────────────────────────────────────

function DistrictsTurfsTab() {
  const [openDistrict, setOpenDistrict] = useState<string | null>(null);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        {[
          ['Districts', WORLD_STATS.districtCount, '#5580bb'],
          ['Total Turfs', WORLD_STATS.turfCount, '#888'],
          ['Owned', WORLD_STATS.turfOwnedCount, '#4a9a4a'],
          ['Unowned', WORLD_STATS.turfUnownedCount, '#cc5500'],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="panel" style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{l}</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: c as string }}>{v}</div>
          </div>
        ))}
      </div>

      {DISTRICTS.map(d => {
        const turfs = TURFS_BY_DISTRICT[d.id] ?? [];
        const isOpen = openDistrict === d.id;
        return (
          <div key={d.id} className="panel" style={{ marginBottom: '8px', overflow: 'hidden' }}>
            <button
              onClick={() => setOpenDistrict(isOpen ? null : d.id)}
              style={{
                width: '100%', background: '#181818', padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', border: 'none', textAlign: 'left',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '12px', color: '#e0e0e0' }}>{d.name}</span>
                  {PILL(d.slug, '#5580bb')}
                  {PILL(d.theme, '#818cf8')}
                  {d.influenceBonusType !== 'NONE' && PILL(`+${d.influenceBonusType}`, '#4a9a4a')}
                </div>
                <div style={{ fontSize: '10px', color: '#555', fontStyle: 'italic' }}>{d.tagline}</div>
              </div>
              <div style={{ fontSize: '10px', color: '#555', flexShrink: 0, marginLeft: '12px' }}>
                {turfs.length} turfs — {turfs.filter(t => t.familyId).length} owned
              </div>
            </button>

            {isOpen && (
              <div style={{ padding: '10px 14px' }}>
                <div style={{ fontSize: '10px', color: '#888', marginBottom: '10px', lineHeight: 1.5 }}>{d.description}</div>
                <div style={{ fontSize: '9px', color: '#555', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Allowed Fronts: {d.allowedFrontTypes.join(', ')}
                </div>
                <table className="data-table" style={{ fontSize: '10px' }}>
                  <thead>
                    <tr>
                      <th>ID</th><th>Name</th><th>Slots</th><th>Quality</th><th>Cost</th><th>Status</th><th>Location Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {turfs.map(t => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'monospace', color: '#555', fontSize: '9px' }}>{t.id}</td>
                        <td style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{t.name}</td>
                        <td style={{ textAlign: 'center' }}>{t.slotCount}</td>
                        <td>{PILL(t.qualityTier, QUALITY_COLORS[t.qualityTier] ?? '#888')}</td>
                        <td style={{ color: '#ffcc33' }}>{fmt(t.purchaseCost)}</td>
                        <td>
                          {t.familyId
                            ? <span style={{ color: '#4a9a4a', fontWeight: 600 }}>● Owned</span>
                            : <span style={{ color: '#555' }}>Available</span>}
                        </td>
                        <td style={{ color: '#666', fontStyle: 'italic', fontSize: '9px', maxWidth: '260px' }}>{t.locationNote}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: BUSINESS DEFINITIONS
// ─────────────────────────────────────────────

function BizDefsTab() {
  return (
    <div>
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="ml-table-scroll">
          <table className="data-table" style={{ fontSize: '10px' }}>
            <thead>
              <tr>
                <th>ID</th><th>Name</th><th>Scale</th><th>Min Manager Rank</th>
                <th>Build Cost</th><th>Daily Income</th><th>Base Risk</th>
                <th>Districts</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {BUSINESS_DEFINITIONS.map(b => (
                <tr key={b.id} style={{ opacity: b.implemented ? 1 : 0.5 }}>
                  <td style={{ fontFamily: 'monospace', color: '#555', fontSize: '9px' }}>{b.id}</td>
                  <td style={{ fontWeight: 'bold', color: '#e0e0e0' }}>
                    {b.displayName}
                    <div style={{ fontSize: '9px', color: '#555', fontStyle: 'italic', fontWeight: 'normal', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.lore}</div>
                  </td>
                  <td>{PILL(b.scale, SCALE_COLORS[b.scale] ?? '#888')}</td>
                  <td>{PILL(b.recommendedManagerRank, RANK_COLORS[b.recommendedManagerRank] ?? '#888')}</td>
                  <td style={{ color: '#ffcc33' }}>{fmt(b.buildCost)}</td>
                  <td style={{ color: '#4a9a4a' }}>{fmt(b.baseProfitPerTick)}/day</td>
                  <td style={{ color: RISK_COLOR(b.baseRisk) }}>{Math.round(b.baseRisk * 100)}%</td>
                  <td style={{ fontSize: '9px', color: '#888' }}>{b.allowedDistricts.map(s => s.replace('_', ' ')).join(', ')}</td>
                  <td>
                    {b.implemented
                      ? <span style={{ color: '#4a9a4a', fontWeight: 600 }}>✓ Live</span>
                      : <span style={{ color: '#555' }}>Placeholder</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div style={{ marginTop: '12px', fontSize: '10px', color: '#555' }}>
        {BUSINESS_DEFINITIONS.filter(b => b.implemented).length} implemented · {BUSINESS_DEFINITIONS.filter(b => !b.implemented).length} placeholder
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: SLOT DEFINITIONS
// ─────────────────────────────────────────────

function SlotDefsTab() {
  const frontTypes = Array.from(new Set(BUSINESS_SLOT_DEFINITIONS.map(s => s.businessType)));
  const [front, setFront] = useState(frontTypes[0]);

  const slots = SLOT_DEFS_BY_FRONT[front] ?? [];

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {frontTypes.map(f => (
          <button key={f} onClick={() => setFront(f)}
            className={`btn ${front === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '9px', padding: '3px 8px' }}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '6px', fontSize: '10px', color: '#5580bb' }}>
        {slots.length} role slots defined for {front.replace('_', ' ')}
      </div>

      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="ml-table-scroll">
          <table className="data-table" style={{ fontSize: '10px' }}>
            <thead>
              <tr>
                <th>Slot ID</th><th>Display Name</th><th>Role Type</th>
                <th>Min Rank</th><th>Preferred Skill</th><th>One per Business</th>
              </tr>
            </thead>
            <tbody>
              {slots.map(s => (
                <tr key={s.id} data-testid={`slot-def-${s.id}`}>
                  <td style={{ fontFamily: 'monospace', color: '#555', fontSize: '9px' }}>{s.id}</td>
                  <td style={{ fontWeight: 'bold', color: '#e0e0e0' }}>{s.displayName}</td>
                  <td style={{ color: '#888' }}>{s.roleType}</td>
                  <td>{PILL(s.requiredMinRank, RANK_COLORS[s.requiredMinRank] ?? '#888')}</td>
                  <td>{s.preferredSkill ? PILL(s.preferredSkill, '#5580bb') : <span style={{ color: '#333' }}>—</span>}</td>
                  <td style={{ textAlign: 'center' }}>
                    {s.maxOnePerBusiness
                      ? <span style={{ color: '#4a9a4a', fontWeight: 'bold' }}>✓</span>
                      : <span style={{ color: '#888' }}>Stackable</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: EXCLUSIVE JOBS
// ─────────────────────────────────────────────

const RISK_LABEL = (r: number) =>
  r <= 0.05 ? 'Very Low' : r <= 0.12 ? 'Low' : r <= 0.22 ? 'Medium' : r <= 0.3 ? 'High' : 'Extreme';

function ExclusiveJobsTab() {
  const frontTypes = Array.from(new Set(BUSINESS_EXCLUSIVE_JOBS.map(j => j.businessType)));
  const [front, setFront] = useState(frontTypes[0]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const jobs = BIZ_JOBS_BY_FRONT[front] ?? [];

  return (
    <div>
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
        {frontTypes.map(f => (
          <button key={f} onClick={() => { setFront(f); setExpanded(null); }}
            className={`btn ${front === f ? 'btn-primary' : 'btn-ghost'}`}
            style={{ fontSize: '9px', padding: '3px 8px' }}>
            {f.replace('_', ' ')} ({BIZ_JOBS_BY_FRONT[f]?.length ?? 0})
          </button>
        ))}
      </div>

      {jobs.map(j => (
        <div key={j.id} className="panel" style={{ marginBottom: '6px', overflow: 'hidden' }}>
          <button
            onClick={() => setExpanded(expanded === j.id ? null : j.id)}
            style={{ width: '100%', background: 'none', border: 'none', padding: '10px 14px', textAlign: 'left', cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0' }}>{j.name}</span>
                  {PILL(j.mode, '#5580bb')}
                  {PILL(j.minRank, RANK_COLORS[j.minRank] ?? '#888')}
                  {j.primarySkill && PILL(j.primarySkill, '#818cf8')}
                </div>
                <div style={{ fontSize: '9px', fontFamily: 'monospace', color: '#444' }}>{j.id}</div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '10px', flexShrink: 0 }}>
                <div style={{ color: '#ffcc33', fontWeight: 'bold' }}>{fmt(j.rewardCashMin)}–{fmt(j.rewardCashMax)}</div>
                <div style={{ color: RISK_COLOR(j.baseJailRisk) }}>{RISK_LABEL(j.baseJailRisk)} risk</div>
              </div>
            </div>
          </button>

          {expanded === j.id && (
            <div style={{ padding: '0 14px 12px', borderTop: '1px solid #1a1a1a' }}>
              <div style={{ fontSize: '10px', color: '#888', lineHeight: 1.6, margin: '10px 0' }}>{j.description}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '8px', marginBottom: '10px' }}>
                {[
                  ['Cooldown', j.cooldownSeconds >= 3600 ? `${j.cooldownSeconds/3600}h` : `${j.cooldownSeconds/60}m`],
                  ['Crew', j.minCrewSize === j.maxCrewSize ? `exactly ${j.minCrewSize}` : `${j.minCrewSize}–${j.maxCrewSize ?? '∞'}`],
                  ['Family %', `${j.rewardFamilySharePercent}%`],
                  ['Manager %', `${j.rewardManagerSharePercent}%`],
                  ['Staff %', `${j.rewardStaffSharePercent}%`],
                  ['Jail Risk', `${Math.round(j.baseJailRisk * 100)}%`],
                ].map(([l, v]) => (
                  <div key={String(l)} style={{ background: '#111', border: '1px solid #1a1a1a', padding: '5px 8px' }}>
                    <div style={{ fontSize: '8px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '1px' }}>{l}</div>
                    <div style={{ fontSize: '11px', color: '#ccc', fontWeight: 'bold' }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '9px', color: '#555' }}>
                Allowed slots: {j.allowedSlotDefinitionIds.join(', ')}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: ASSIGNMENTS
// ─────────────────────────────────────────────

function AssignmentsTab() {
  const fronts = Array.from(new Set(
    BUSINESS_ASSIGNMENTS_SEED.map(a => a.businessId.replace(/BUSINESS_|_\d+/g, '').replace(/_/g, ' ').trim())
  ));
  return (
    <div>
      <div style={{ marginBottom: '8px', fontSize: '10px', color: '#5580bb', background: '#0d1020', border: '1px solid #1e2840', padding: '6px 10px' }}>
        Dev-seed assignments using dummy businessId / playerId references. {BUSINESS_ASSIGNMENTS_SEED.length} total records.
      </div>
      <div className="panel" style={{ overflow: 'hidden' }}>
        <div className="ml-table-scroll">
          <table className="data-table" style={{ fontSize: '10px' }}>
            <thead>
              <tr><th>ID</th><th>Business</th><th>Slot Definition</th><th>Player</th><th>Assigned At</th></tr>
            </thead>
            <tbody>
              {BUSINESS_ASSIGNMENTS_SEED.map(a => (
                <tr key={a.id}>
                  <td style={{ fontFamily: 'monospace', color: '#444', fontSize: '9px' }}>{a.id}</td>
                  <td style={{ color: '#cc9900' }}>{a.businessId}</td>
                  <td style={{ color: '#5580bb', fontSize: '9px' }}>{a.slotDefinitionId}</td>
                  <td style={{ color: '#e0e0e0' }}>{a.playerId}</td>
                  <td style={{ color: '#555', fontSize: '9px' }}>{new Date(a.assignedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB: SUMMARY
// ─────────────────────────────────────────────

function SummaryTab() {
  return (
    <div>
      <div style={{ background: '#0d1020', border: '1px solid #1e2840', padding: '12px 14px', marginBottom: '14px', fontSize: '10px', color: '#5580bb', lineHeight: '1.7' }}>
        <strong style={{ color: '#8899cc', display: 'block', marginBottom: '4px' }}>WORLD CONFIG — DEVELOPER NOTES</strong>

        <strong style={{ color: '#aaa' }}>DATA HIERARCHY:</strong><br />
        City → District → Turf (world parcel) → Front Instance → Business Assignment<br /><br />

        <strong style={{ color: '#aaa' }}>HOW TO ADD A DISTRICT:</strong><br />
        Add DistrictSlug variant to <code style={{ color: '#aaa' }}>shared/world.ts</code>, then an entry to <code style={{ color: '#aaa' }}>DISTRICTS</code> in worldConfig.ts.<br /><br />

        <strong style={{ color: '#aaa' }}>HOW TO ADD A TURF:</strong><br />
        Add an entry to <code style={{ color: '#aaa' }}>TURFS</code> in worldConfig.ts with the correct districtId. slotCount: 4/6/8.<br /><br />

        <strong style={{ color: '#aaa' }}>HOW TO ADD A FRONT TYPE:</strong><br />
        1. Add to FrontType in shared/world.ts<br />
        2. Add BusinessDefinition entry to BUSINESS_DEFINITIONS<br />
        3. Add BusinessSlotDefinition entries to BUSINESS_SLOT_DEFINITIONS<br />
        4. Add BusinessExclusiveJob entries to BUSINESS_EXCLUSIVE_JOBS<br /><br />

        <strong style={{ color: '#aaa' }}>REWARD SCALING:</strong><br />
        LARGE fronts (Casino/Construction/Nightclub): rewardCashMin 8K–20K, Max 25K–90K<br />
        SMALL fronts (Car Repair/Pizzeria/Bar): rewardCashMin 2K–6K, Max 6K–14K<br />
        Family share: 50–70% | Manager share: 25–40% | Staff share: 0–15%<br /><br />

        <strong style={{ color: '#aaa' }}>JAIL RISK BANDS:</strong><br />
        Very Low ≤5% | Low 6–12% | Medium 13–22% | High 23–30% | Extreme &gt;30%<br /><br />

        <strong style={{ color: '#aaa' }}>DEV ASSIGNMENT IDs:</strong><br />
        businessId: BUSINESS_{"{TYPE}"}_{"{N}"} | playerId: p-underboss, p-capo, p-soldier, p-soldier-2, p-soldier-3, p-associate, p-capo-2
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
        {[
          ['Districts', WORLD_STATS.districtCount, '#5580bb'],
          ['Total Turfs', WORLD_STATS.turfCount, '#888'],
          ['Owned Turfs', WORLD_STATS.turfOwnedCount, '#4a9a4a'],
          ['Unowned Turfs', WORLD_STATS.turfUnownedCount, '#cc5500'],
          ['Front Definitions', WORLD_STATS.bizDefCount, '#cc9900'],
          ['Implemented', WORLD_STATS.bizDefImplemented, '#4a9a4a'],
          ['Slot Definitions', WORLD_STATS.slotDefCount, '#5580bb'],
          ['Exclusive Jobs', WORLD_STATS.exclusiveJobCount, '#818cf8'],
          ['Dev Assignments', WORLD_STATS.assignmentCount, '#888'],
        ].map(([l, v, c]) => (
          <div key={String(l)} className="panel" style={{ padding: '8px 12px' }}>
            <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>{l}</div>
            <div style={{ fontSize: '22px', fontWeight: 'bold', color: c as string }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

const TABS = [
  { id: 'districts', label: 'Districts & Turfs' },
  { id: 'defs',      label: 'Business Defs' },
  { id: 'slots',     label: 'Slot Defs' },
  { id: 'jobs',      label: 'Exclusive Jobs' },
  { id: 'assigns',   label: 'Dev Assignments' },
  { id: 'summary',   label: 'Docs & Summary' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function WorldAdmin() {
  const [tab, setTab] = useState<TabId>('districts');

  return (
    <div>
      <PageHeader
        title="DEV: World Config Explorer"
        sub={`${WORLD_STATS.districtCount} districts · ${WORLD_STATS.turfCount} turfs · ${WORLD_STATS.bizDefCount} fronts · ${WORLD_STATS.slotDefCount} slot defs · ${WORLD_STATS.exclusiveJobCount} exclusive jobs`}
      />

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #1a1a1a', marginBottom: '14px', flexWrap: 'wrap', gap: '2px' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              background: 'none', border: 'none', padding: '8px 14px',
              fontSize: '11px', cursor: 'pointer',
              color: tab === t.id ? '#e0e0e0' : '#555',
              borderBottom: tab === t.id ? '2px solid #cc3333' : '2px solid transparent',
              fontWeight: tab === t.id ? 600 : 400,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'districts' && <DistrictsTurfsTab />}
      {tab === 'defs'      && <BizDefsTab />}
      {tab === 'slots'     && <SlotDefsTab />}
      {tab === 'jobs'      && <ExclusiveJobsTab />}
      {tab === 'assigns'   && <AssignmentsTab />}
      {tab === 'summary'   && <SummaryTab />}
    </div>
  );
}
