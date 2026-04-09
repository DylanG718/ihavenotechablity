/**
 * The Last Firm — Front Detail
 * Route: /front/:frontId
 *
 * Shows P&L, staffing, exclusive jobs, and upgrade path for a specific front.
 */

import { ENABLE_DEV_TOOLS } from '../lib/env';
import { useState } from 'react';
import { useRoute } from 'wouter';
import { useGame } from '../lib/gameContext';
import { fmt } from '../lib/mockData';
import { SectionPanel, InfoAlert, EmptySlate } from '../components/layout/AppShell';
import {
  BUSINESS_DEFINITIONS,
  BUSINESS_SLOT_DEFINITIONS,
  BIZ_JOBS_BY_FRONT,
  BUSINESS_ASSIGNMENTS_SEED,
  TURFS,
  DISTRICTS,
} from '../lib/worldConfig';
import {
  MOCK_FRONT_INSTANCES_BY_ID,
  calcFrontDailyIncome,
  UPGRADE_INCOME_MULTIPLIER,
  FAMILY_NAMES,
} from '../lib/worldSeed';
import { MOCK_PLAYERS as ALL_MOCK_PLAYERS } from '../lib/mockData';

// ─────────────────────────────────────────────
// Mock P&L data (7 days)
// ─────────────────────────────────────────────

function generatePnL(baseIncome: number): Array<{ day: string; income: number; heat: number; event?: string }> {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const result = days.map((day, i) => {
    const variance = 0.85 + Math.random() * 0.3; // ±15%
    const income = Math.round(baseIncome * variance);
    const heat = Math.round(2 + Math.random() * 4);
    const entry: { day: string; income: number; heat: number; event?: string } = { day, income, heat };
    if (i === 3) entry.event = 'Heat Spike — local patrol increase';
    return entry;
  });
  return result;
}

// ─────────────────────────────────────────────
// Upgrade cost table
// ─────────────────────────────────────────────

const UPGRADE_COSTS: Record<number, number> = {
  1: 0,
  2: 50000,
  3: 120000,
};

// ─────────────────────────────────────────────
// Tab components
// ─────────────────────────────────────────────

function TabOverview({
  frontType, upgradeLevel, dailyIncome, baseProfit,
}: {
  frontType: string;
  upgradeLevel: 1 | 2 | 3;
  dailyIncome: number;
  baseProfit: number;
}) {
  const multiplier = UPGRADE_INCOME_MULTIPLIER[upgradeLevel];
  const familyCut = Math.round(dailyIncome * 0.30);
  const managerCut = Math.round(dailyIncome * 0.15);
  const staffCut = Math.round(dailyIncome * 0.20);
  const heatPerDay = Math.round(3 + upgradeLevel * 1.5);

  const nextLevel = upgradeLevel < 3 ? ((upgradeLevel + 1) as 1 | 2 | 3) : null;
  const nextMultiplier = nextLevel ? UPGRADE_INCOME_MULTIPLIER[nextLevel] : null;
  const nextIncome = nextLevel ? Math.round(baseProfit * (nextMultiplier ?? 0)) : null;
  const upgradeCost = nextLevel ? UPGRADE_COSTS[nextLevel] : null;

  return (
    <div style={{ padding: '10px' }}>
      <SectionPanel title="Income Breakdown">
        <div style={{ padding: '8px 10px' }}>
          {[
            { l: 'Base Income (Lv1)', v: fmt(baseProfit), c: '#ccc' },
            { l: `Upgrade Multiplier (Lv${upgradeLevel})`, v: `×${multiplier.toFixed(1)}`, c: '#5580bb' },
            { l: 'Total Daily Income', v: fmt(dailyIncome), c: '#ffcc33' },
            { l: '— Family Cut (30%)', v: fmt(familyCut), c: '#818cf8' },
            { l: '— Manager Cut (15%)', v: fmt(managerCut), c: '#4a9a4a' },
            { l: '— Staff Cut (20%)', v: fmt(staffCut), c: '#888' },
            { l: 'Heat per Day', v: `+${heatPerDay}`, c: '#cc3333' },
          ].map(({ l, v, c }) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #111' }}>
              <span style={{ fontSize: '10px', color: '#888' }}>{l}</span>
              <span style={{ fontSize: '11px', color: c, fontWeight: 600 }}>{v}</span>
            </div>
          ))}
        </div>
      </SectionPanel>

      {nextLevel ? (
        <SectionPanel title={`Upgrade Path — Lv${upgradeLevel} → Lv${nextLevel}`}>
          <div style={{ padding: '8px 10px' }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '8px' }}>
              <div>
                <span className="label-caps block">Current Income</span>
                <span style={{ fontSize: '13px', color: '#ffcc33', fontWeight: 700 }}>{fmt(dailyIncome)}/day</span>
              </div>
              <div>
                <span className="label-caps block">After Upgrade</span>
                <span style={{ fontSize: '13px', color: '#4a9a4a', fontWeight: 700 }}>{fmt(nextIncome ?? 0)}/day</span>
              </div>
              <div>
                <span className="label-caps block">Increase</span>
                <span style={{ fontSize: '13px', color: '#4a9a4a', fontWeight: 700 }}>+{fmt((nextIncome ?? 0) - dailyIncome)}</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', color: '#888' }}>Upgrade Cost</span>
              <span style={{ fontSize: '11px', color: '#cc9900', fontWeight: 600 }}>{fmt(upgradeCost ?? 0)}</span>
            </div>
            <button className="btn btn-primary" style={{ marginTop: '8px', width: '100%', fontSize: '10px', padding: '6px' }}>
              Upgrade to Level {nextLevel} — {fmt(upgradeCost ?? 0)}
            </button>
            <div style={{ fontSize: '9px', color: '#444', marginTop: '4px', textAlign: 'center' }}>
              DEV: Upgrade is simulated — no actual state change
            </div>
          </div>
        </SectionPanel>
      ) : (
        <InfoAlert variant="warn">
          This front is already at maximum upgrade level (Lv3).
        </InfoAlert>
      )}
    </div>
  );
}

function TabStaffing({
  frontType, frontId, playerRole, playerFamilyRole,
}: {
  frontType: string;
  frontId: string;
  playerRole: string | null;
  playerFamilyRole: string | null;
}) {
  const slots = BUSINESS_SLOT_DEFINITIONS.filter(s => s.businessType === frontType);
  // Match by convention: BUSINESS_{FRONTTYPE}_1
  const frontTypeKey = frontType.toUpperCase();
  const legacyAssignments = BUSINESS_ASSIGNMENTS_SEED.filter(a =>
    a.businessId.includes(frontTypeKey)
  );

  const canAssign = playerFamilyRole === 'UNDERBOSS' || playerFamilyRole === 'BOSS' || playerFamilyRole === 'CONSIGLIERE';

  return (
    <div style={{ padding: '10px' }}>
      {slots.length === 0 && <EmptySlate msg="No slot definitions for this front type." />}
      {slots.map(slot => {
        const assignment = legacyAssignments.find(a => a.slotDefinitionId === slot.id);
        const assignedPlayer = assignment ? ALL_MOCK_PLAYERS[assignment.playerId] : null;
        return (
          <div key={slot.id} style={{
            padding: '8px 10px', marginBottom: '6px', borderRadius: '3px',
            background: '#111', border: '1px solid #222',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '11px', color: '#ccc', fontWeight: 600 }}>{slot.displayName}</div>
                <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>
                  {slot.roleType} · Min Rank: {slot.requiredMinRank} · Skill: {slot.preferredSkill ?? 'Any'}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                {assignedPlayer ? (
                  <>
                    <div style={{ fontSize: '10px', color: '#4a9a4a', fontWeight: 600 }}>{assignedPlayer.alias}</div>
                    <div style={{ fontSize: '9px', color: '#555' }}>{assignedPlayer.family_role}</div>
                    {canAssign && (
                      <button className="btn btn-ghost" style={{ fontSize: '9px', padding: '2px 6px', marginTop: '3px', color: '#cc3333' }}>
                        Remove
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '10px', color: '#444', fontStyle: 'italic' }}>Vacant</div>
                    {canAssign && (
                      <button className="btn btn-ghost" style={{ fontSize: '9px', padding: '2px 6px', marginTop: '3px', color: '#5580bb' }}>
                        Assign
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {!canAssign && (
        <InfoAlert>
          Only Underboss+ can assign or remove staff from fronts.
        </InfoAlert>
      )}
      <div style={{ fontSize: '9px', color: '#333', marginTop: '8px', fontStyle: 'italic' }}>
        DEV: Assign/Remove are simulated — no persistent state change
      </div>
    </div>
  );
}

function TabExclusiveJobs({
  frontType, playerSlots,
}: {
  frontType: string;
  playerSlots: string[];
}) {
  const jobs = BIZ_JOBS_BY_FRONT[frontType] ?? [];
  const hasAssignment = playerSlots.length > 0;

  if (!hasAssignment) {
    return (
      <div style={{ padding: '10px' }}>
        <InfoAlert>
          You need to be assigned to a slot in this front to unlock business jobs.
        </InfoAlert>
        <EmptySlate msg="No assignments — no jobs unlocked." sub="Get assigned by your Underboss." />
      </div>
    );
  }

  return (
    <div style={{ padding: '10px' }}>
      {jobs.length === 0 && <EmptySlate msg="No exclusive jobs for this front type." />}
      {jobs.map(job => {
        const canRun = job.allowedSlotDefinitionIds.some(id => playerSlots.includes(id));
        return (
          <div key={job.id} style={{
            padding: '8px 10px', marginBottom: '6px', borderRadius: '3px',
            background: canRun ? '#0d1a0d' : '#111',
            border: `1px solid ${canRun ? '#1a3a1a' : '#222'}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '11px', color: canRun ? '#4a9a4a' : '#888', fontWeight: 600 }}>
                  {job.name}
                  {canRun && <span style={{ marginLeft: '6px', fontSize: '9px', color: '#4a9a4a' }}>[UNLOCKED]</span>}
                </div>
                <div style={{ fontSize: '9px', color: '#555', marginTop: '2px', lineHeight: '1.4' }}>{job.description}</div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '9px', color: '#ffcc33' }}>
                    {fmt(job.rewardCashMin)} – {fmt(job.rewardCashMax)}
                  </span>
                  <span style={{ fontSize: '9px', color: job.baseJailRisk > 0.2 ? '#cc3333' : '#888' }}>
                    Jail: {Math.round(job.baseJailRisk * 100)}%
                  </span>
                  <span style={{ fontSize: '9px', color: '#666' }}>
                    {job.mode} · Min: {job.minRank}
                  </span>
                </div>
                <div style={{ fontSize: '9px', color: '#444', marginTop: '3px' }}>
                  Requires: {job.allowedSlotDefinitionIds.join(', ')}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                {canRun ? (
                  <button className="btn btn-primary" style={{ fontSize: '9px', padding: '4px 8px' }}>
                    Run Job
                  </button>
                ) : (
                  <button className="btn btn-ghost" style={{ fontSize: '9px', padding: '4px 8px', color: '#444', cursor: 'not-allowed' }} disabled>
                    Locked
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TabPnL({ dailyIncome }: { dailyIncome: number }) {
  const pnl = generatePnL(dailyIncome);
  const thisWeek = pnl.reduce((s, d) => s + d.income, 0);
  const lastWeek = Math.round(thisWeek * (0.9 + Math.random() * 0.2));
  const diff = thisWeek - lastWeek;

  return (
    <div style={{ padding: '10px' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {[
          { l: 'This Week', v: fmt(thisWeek), c: '#ffcc33' },
          { l: 'Last Week', v: fmt(lastWeek), c: '#888' },
          { l: 'Change', v: `${diff >= 0 ? '+' : ''}${fmt(diff)}`, c: diff >= 0 ? '#4a9a4a' : '#cc3333' },
        ].map(({ l, v, c }) => (
          <div key={l} className="panel" style={{ padding: '6px 10px', flex: 1, minWidth: '80px' }}>
            <span className="label-caps block">{l}</span>
            <span style={{ fontSize: '13px', color: c, fontWeight: 700 }}>{v}</span>
          </div>
        ))}
      </div>

      <SectionPanel title="Last 7 Days">
        <table className="data-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>Day</th>
              <th>Income</th>
              <th>Heat</th>
              <th>Events</th>
            </tr>
          </thead>
          <tbody>
            {pnl.map(row => (
              <tr key={row.day}>
                <td>{row.day}</td>
                <td style={{ color: '#ffcc33' }}>{fmt(row.income)}</td>
                <td style={{ color: row.heat > 5 ? '#cc3333' : '#888' }}>+{row.heat}</td>
                <td style={{ color: '#cc9900', fontSize: '9px' }}>{row.event ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </SectionPanel>

      <div style={{ fontSize: '9px', color: '#333', marginTop: '8px', fontStyle: 'italic' }}>
        DEV: P&L data is randomly generated per render with ±15% variance
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Front Identity Card
// ─────────────────────────────────────────────

function FrontIdentityCard({
  frontName,
  frontType,
  districtName,
  turfName,
  upgradeLevel,
  dailyIncome,
  managerAlias,
  staffed,
  totalSlots,
  familyName,
}: {
  frontName: string;
  frontType: string;
  districtName: string;
  turfName: string;
  upgradeLevel: number;
  dailyIncome: number;
  managerAlias: string | null;
  staffed: number;
  totalSlots: number;
  familyName: string;
}) {
  return (
    <div className="hero-card">
      <div className="hero-card__top">
        <div style={{ minWidth: 0 }}>
          <div className="hero-card__name">{frontName}</div>
          <div className="hero-card__sub">
            <span style={{ marginRight: '8px' }}>{districtName} / {turfName}</span>
          </div>
        </div>
        {/* Type badge */}
        <span style={{
          fontSize: '9px', padding: '3px 8px', borderRadius: '2px',
          background: '#1a1500', color: '#ffcc33', border: '1px solid #3a2a00',
          fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          whiteSpace: 'nowrap', alignSelf: 'flex-start',
        }}>
          {frontType}
        </span>
      </div>

      {/* Status bar */}
      <div className="summary-bar">
        <div className="summary-bar__item">
          <span className="label-caps">Level</span>
          <span className="stat-val">Lv{upgradeLevel} / 3</span>
        </div>
        <div className="summary-bar__item">
          <span className="label-caps">Daily Income</span>
          <span className="stat-val text-cash">{fmt(dailyIncome)}</span>
        </div>
        <div className="summary-bar__item">
          <span className="label-caps">Manager</span>
          <span className="stat-val" style={{ color: managerAlias ? '#4a9a4a' : '#cc3333' }}>
            {managerAlias ?? 'Vacant'}
          </span>
        </div>
        <div className="summary-bar__item">
          <span className="label-caps">Staff</span>
          <span className="stat-val">{staffed} / {totalSlots}</span>
        </div>
        <div className="summary-bar__item">
          <span className="label-caps">Family</span>
          <span className="stat-val" style={{ fontSize: '10px' }}>{familyName}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

const TABS = ['Overview', 'Staffing', 'Exclusive Jobs', 'P&L'] as const;
type Tab = typeof TABS[number];

export default function FrontDetail() {
  const [, params] = useRoute('/front/:frontId');
  const { player } = useGame();
  const [tab, setTab] = useState<Tab>('Overview');

  const frontId = params?.frontId ?? '';
  const front = MOCK_FRONT_INSTANCES_BY_ID[frontId];

  if (!front) {
    return (
      <div className="page-stack">
        <InfoAlert variant="danger">
          No front instance found with ID: {frontId}
        </InfoAlert>
        <div style={{ fontSize: '10px', color: '#555', padding: '10px' }}>
          Available front IDs: {Object.keys(MOCK_FRONT_INSTANCES_BY_ID).join(', ')}
        </div>
      </div>
    );
  }

  const def = BUSINESS_DEFINITIONS.find(b => b.id === front.frontType);
  const turf = TURFS.find(t => t.id === front.turfId);
  const district = turf ? DISTRICTS.find(d => d.id === turf.districtId) : null;
  const dailyIncome = calcFrontDailyIncome(front.frontType, front.upgradeLevel);

  // Player assignments to this front
  const legacyBizId = `BUSINESS_${front.frontType}_1`;
  const playerAssignments = BUSINESS_ASSIGNMENTS_SEED.filter(
    a => a.businessId === legacyBizId && a.playerId === player.id
  );
  const playerSlots = playerAssignments.map(a => a.slotDefinitionId);

  // Staffed slots count
  const totalSlots = BUSINESS_SLOT_DEFINITIONS.filter(s => s.businessType === front.frontType).length;
  const frontAssignments = BUSINESS_ASSIGNMENTS_SEED.filter(a => a.businessId === legacyBizId);

  const managerPlayer = front.managerPlayerId ? ALL_MOCK_PLAYERS[front.managerPlayerId] : null;

  return (
    <div className="page-stack">

      {/* Front Identity Card */}
      <FrontIdentityCard
        frontName={def?.displayName ?? front.frontType}
        frontType={front.frontType}
        districtName={district?.name ?? 'Unknown District'}
        turfName={turf?.name ?? front.turfId}
        upgradeLevel={front.upgradeLevel}
        dailyIncome={dailyIncome}
        managerAlias={managerPlayer?.alias ?? null}
        staffed={frontAssignments.length}
        totalSlots={totalSlots}
        familyName={FAMILY_NAMES[front.familyId] ?? front.familyId}
      />

      {/* Tab bar */}
      <div className="chip-bar chip-bar--tabs">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`chip${tab === t ? ' active' : ''}`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="panel" style={{ borderRadius: '0 2px 2px 2px' }}>
        {tab === 'Overview' && (
          <TabOverview
            frontType={front.frontType}
            upgradeLevel={front.upgradeLevel}
            dailyIncome={dailyIncome}
            baseProfit={def?.baseProfitPerTick ?? 0}
          />
        )}
        {tab === 'Staffing' && (
          <TabStaffing
            frontType={front.frontType}
            frontId={front.id}
            playerRole={player.crew_role}
            playerFamilyRole={player.family_role}
          />
        )}
        {tab === 'Exclusive Jobs' && (
          <TabExclusiveJobs
            frontType={front.frontType}
            playerSlots={playerSlots}
          />
        )}
        {tab === 'P&L' && (
          <TabPnL dailyIncome={dailyIncome} />
        )}
      </div>
    </div>
  );
}
