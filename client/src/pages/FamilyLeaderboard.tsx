/**
 * FamilyLeaderboard.tsx — Top Families
 * Ranked by composite score: turf, income, treasury, member strength, power score.
 */

import { useState } from 'react';
import { useGame } from '../lib/gameContext';
import { MOCK_FAMILY, fmt } from '../lib/mockData';
import { PageHeader, SectionPanel } from '../components/layout/AppShell';
import {
  ALL_FAMILIES,
  FAMILY_BOSS_ALIAS,
  FAMILY_TURF_COUNT,
  FAMILY_DAILY_INCOME,
  FAMILY_MEMBER_RESPECT,
  calcFamilyScore,
} from '../lib/worldData';
import type { Family, FamilyStatus } from '../../../shared/schema';
import { Crown, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';

// ── Score breakdown ───────────────────────────

function calcBreakdown(familyId: string, family: Family) {
  const turfScore    = (FAMILY_TURF_COUNT[familyId] ?? 0) * 1000;
  const incomeScore  = (FAMILY_DAILY_INCOME[familyId] ?? 0) * 10;
  const treasuryScore = Math.floor(family.treasury / 100);
  const memberScore  = FAMILY_MEMBER_RESPECT[familyId] ?? 0;
  const powerScore   = family.power_score;
  const total = turfScore + incomeScore + treasuryScore + memberScore + powerScore;
  return { turfScore, incomeScore, treasuryScore, memberScore, powerScore, total };
}

// ── Status badge ──────────────────────────────

function FamilyStatusBadge({ status }: { status: FamilyStatus }) {
  const map: Record<FamilyStatus, { label: string; cls: string }> = {
    ACTIVE:    { label: 'Active',    cls: 'badge-green' },
    AT_WAR:    { label: 'At War',    cls: 'badge-red' },
    WEAKENED:  { label: 'Weakened',  cls: 'badge-yellow' },
    DISSOLVED: { label: 'Dissolved', cls: 'badge-gray' },
  };
  const { label, cls } = map[status] ?? { label: status, cls: 'badge-gray' };
  return <span className={cls}>{label}</span>;
}

// ── Rank medal ─────────────────────────────────

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ color: '#ffcc33', fontWeight: 'bold', fontSize: '14px' }}>①</span>;
  if (rank === 2) return <span style={{ color: '#aaaaaa', fontWeight: 'bold', fontSize: '14px' }}>②</span>;
  if (rank === 3) return <span style={{ color: '#cc6633', fontWeight: 'bold', fontSize: '14px' }}>③</span>;
  return <span className="text-muted-foreground text-sm">#{rank}</span>;
}

// ── Breakdown row ─────────────────────────────

function ScoreBreakdown({ familyId, family }: { familyId: string; family: Family }) {
  const { turfScore, incomeScore, treasuryScore, memberScore, powerScore, total } = calcBreakdown(familyId, family);

  const rows = [
    { label: 'Turf Score',          value: turfScore,     note: `${FAMILY_TURF_COUNT[familyId] ?? 0} blocks × 1,000` },
    { label: 'Business Income',     value: incomeScore,   note: `${fmt(FAMILY_DAILY_INCOME[familyId] ?? 0)}/day × 10` },
    { label: 'Treasury',            value: treasuryScore, note: `${fmt(family.treasury)} ÷ 100` },
    { label: 'Member Strength',     value: memberScore,   note: 'Top-5 member respect sum' },
    { label: 'Power Score',         value: powerScore,    note: 'Family power_score' },
  ];

  return (
    <div className="px-4 pb-3 border-t border-border/40" style={{ background: '#080808' }}>
      <div className="pt-3 space-y-1.5">
        {rows.map(r => (
          <div key={r.label} className="flex items-center justify-between text-xs">
            <div className="text-muted-foreground">
              {r.label}
              <span className="ml-2 text-muted-foreground/50">({r.note})</span>
            </div>
            <span className="text-cash font-semibold">{r.value.toLocaleString()}</span>
          </div>
        ))}
        <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-border/40">
          <span className="text-foreground">Composite Score</span>
          <span className="text-cash text-sm">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

// ── Family row ────────────────────────────────

function FamilyRow({
  rank,
  family,
  isCurrentFamily,
}: {
  rank: number;
  family: Family;
  isCurrentFamily: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const score    = calcFamilyScore(family.id, family);
  const bossName = FAMILY_BOSS_ALIAS[family.id] ?? 'Unknown';
  const turf     = FAMILY_TURF_COUNT[family.id] ?? 0;
  const income   = FAMILY_DAILY_INCOME[family.id] ?? 0;

  const rowBg = isCurrentFamily
    ? { borderColor: 'rgba(255,204,51,0.35)', background: 'hsl(45 40% 5%)' }
    : {};

  return (
    <div className="panel mb-2 overflow-hidden" style={rowBg}>
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/10 transition-colors"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Rank */}
        <div className="w-8 text-center shrink-0">
          <RankMedal rank={rank} />
        </div>

        {/* Family info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`font-bold text-sm ${isCurrentFamily ? 'text-cash' : 'text-foreground'}`}>
              {family.name}
            </span>
            {isCurrentFamily && (
              <span className="text-xs px-1 rounded" style={{ background: 'rgba(255,204,51,0.2)', color: '#ffcc33' }}>
                Your Family
              </span>
            )}
            <FamilyStatusBadge status={family.status} />
          </div>
          <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
            <span>Don: <span className="text-foreground">{bossName}</span></span>
            <span>{family.members.length} members</span>
            <span>{turf} turf blocks</span>
            <span className="text-cash">{fmt(income)}/day</span>
          </div>
          {family.motto && (
            <p className="text-xs text-muted-foreground mt-0.5 italic truncate">"{family.motto}"</p>
          )}
        </div>

        {/* Score + expand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div className="text-xs text-muted-foreground">Score</div>
            <div className="font-bold text-cash">{score.toLocaleString()}</div>
          </div>
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </div>
      </div>

      {expanded && (
        <ScoreBreakdown familyId={family.id} family={family} />
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────

export default function FamilyLeaderboard() {
  const { player } = useGame();

  // Merge current player's family data
  const families = ALL_FAMILIES.map(f =>
    f.id === 'fam-1' ? { ...f, members: MOCK_FAMILY.members, treasury: MOCK_FAMILY.treasury, power_score: MOCK_FAMILY.power_score } : f
  );

  // Sort by composite score descending
  const ranked = [...families].sort(
    (a, b) => calcFamilyScore(b.id, b) - calcFamilyScore(a.id, a)
  );

  const myFamilyId = player.family_id;
  const myRank = ranked.findIndex(f => f.id === myFamilyId) + 1;

  return (
    <div>
      <PageHeader
        title="Top Families"
        sub="Ranked by composite score: turf control, business income, treasury, member strength, and power."
      />

      {/* Score formula info */}
      <div className="panel p-4 mb-5" style={{ background: '#0a0a0a' }}>
        <div className="label-caps mb-2 flex items-center gap-2">
          <TrendingUp size={11} />
          Scoring Formula
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs text-muted-foreground">
          <div><span className="text-cash font-semibold">Turf:</span> blocks × 1,000</div>
          <div><span className="text-cash font-semibold">Income:</span> daily × 10</div>
          <div><span className="text-cash font-semibold">Treasury:</span> balance ÷ 100</div>
          <div><span className="text-cash font-semibold">Strength:</span> top-5 respect</div>
          <div><span className="text-cash font-semibold">Power:</span> power_score</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Click any family to see score breakdown.</p>
      </div>

      {/* Current player's family highlight */}
      {myFamilyId && myRank > 0 && (
        <div className="panel p-3 mb-4" style={{ background: 'rgba(255,204,51,0.05)', borderColor: 'rgba(255,204,51,0.2)' }}>
          <div className="flex items-center gap-2 text-xs">
            <Crown size={11} style={{ color: '#ffcc33' }} />
            <span className="text-muted-foreground">Your family</span>
            <span className="font-semibold text-cash">{MOCK_FAMILY.name}</span>
            <span className="text-muted-foreground">is ranked</span>
            <span className="font-bold text-foreground">#{myRank}</span>
            <span className="text-muted-foreground">with score</span>
            <span className="font-bold text-cash">{calcFamilyScore('fam-1', ranked.find(f => f.id === 'fam-1')!).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Rankings */}
      {ranked.map((family, idx) => (
        <FamilyRow
          key={family.id}
          rank={idx + 1}
          family={family}
          isCurrentFamily={family.id === myFamilyId}
        />
      ))}
    </div>
  );
}
