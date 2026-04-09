/**
 * The Last Firm — Job Board
 * Mobile-first rewrite: ChipBar filter + new JobCard layout.
 * All logic, data, hooks, and modals preserved.
 */

import { useState, useEffect } from 'react';
import { useGame } from '../lib/gameContext';
import { PageHeader, SectionPanel, InfoAlert } from '../components/layout/AppShell';
import {
  ALL_JOBS, RANKED_JOBS, UNIVERSAL_JOBS, JOBS_BY_ID, getPlayerJobStates,
} from '../lib/jobsData';
import {
  canStartJob, getScaledRewardBand, isOnCooldown, cooldownRemainingSeconds,
  formatCooldown, jailRiskLabel, JAIL_RISK_COLORS, JAIL_RISK_DISPLAY,
  getFeaturedJobs, familyRoleToJobRank, RANK_ORDER,
  getLockReason, getRiskProfile, cooldownProgress, isNearReady, cooldownAvailableAt,
  RISK_LEVEL_COLOR, RISK_LEVEL_LABEL,
  sortJobs, applyFilters, getRecommendedJobs, getJobStatusCounts,
  getArchetypeFit, getRecommendScore,
  SORT_OPTIONS, DEFAULT_FILTERS, countActiveFilters,
} from '../../../shared/jobs';
import type {
  JobDefinition, PlayerJobState, LockReason, RiskProfile,
  SortKey, JobFilters, JobRecommendation,
} from '../../../shared/jobs';
import type { FamilyRole } from '../../../shared/schema';
import { fmt } from '../lib/mockData';
import {
  BUSINESS_ASSIGNMENTS_SEED, BIZ_JOBS_BY_FRONT, BUSINESS_SLOT_DEFINITIONS,
} from '../lib/worldConfig';
import { MOCK_FRONT_INSTANCES, FAMILY_NAMES } from '../lib/worldSeed';
import {
  Lock, Zap, Users, User, Clock, Skull, Star, ChevronDown, ChevronUp, X, ChevronRight,
  Flame, Shield, AlertTriangle, TrendingUp, SlidersHorizontal, RotateCcw, ArrowUpDown,
  CheckCircle2, ThumbsUp,
} from 'lucide-react';
import { getJobNarrative, pickOutcome, PLACEHOLDER_NARRATIVE } from '../lib/jobNarratives';
import { getJobBaseImage, getJobResultImage } from '../lib/jobImages';

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  GAMBLING:    '#a855f7',
  EXTORTION:   '#ef4444',
  FENCING:     '#f59e0b',
  ECONOMY:     '#22c55e',
  HUSTLE:      '#fb923c',
  INTEL:       '#38bdf8',
  INFLUENCE:   '#818cf8',
  SPECIAL:     '#e11d48',
  CONTRABAND:  '#84cc16',
  ENFORCEMENT: '#f97316',
  CORRUPTION:  '#64748b',
  SABOTAGE:    '#dc2626',
  LOGISTICS:   '#6b7280',
};

const MODE_LABEL: Record<string, string> = {
  SOLO:         'Solo',
  CREW:         'Crew Required',
  SOLO_OR_CREW: 'Solo or Crew',
};

const MODE_ICON = (mode: string) => {
  if (mode === 'SOLO') return <User size={10} />;
  if (mode === 'CREW') return <Users size={10} />;
  return <User size={10} />;
};

const RANK_DISPLAY: Record<string, string> = {
  ASSOCIATE:   'Associate',
  SOLDIER:     'Soldier',
  CAPO:        'Capo',
  CONSIGLIERE: 'Consigliere',
  UNDERBOSS:   'Underboss',
  RUNNER:      'Runner',
};

// ─────────────────────────────────────────────
// STATUS BAR — top summary of job counts by state
// ─────────────────────────────────────────────

function StatusBar({
  ready, cooling, locked, onFilterReady,
}: { ready: number; cooling: number; locked: number; onFilterReady: () => void }) {
  return (
    <div style={{
      display: 'flex', gap: '8px', marginBottom: '10px',
      alignItems: 'center', flexWrap: 'wrap',
    }}>
      <button
        onClick={onFilterReady}
        style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          background: ready > 0 ? 'rgba(74,154,74,0.1)' : '#111',
          border: `1px solid ${ready > 0 ? 'rgba(74,154,74,0.3)' : '#1e1e1e'}`,
          color: ready > 0 ? '#4a9a4a' : '#444',
          padding: '5px 10px', borderRadius: '3px', cursor: 'pointer',
          fontSize: '10px', fontWeight: 600, minHeight: '32px',
        }}
      >
        <Zap size={9} />
        <span>{ready} Ready</span>
      </button>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        background: '#111', border: '1px solid #1e1e1e',
        color: cooling > 0 ? '#888' : '#333',
        padding: '5px 10px', borderRadius: '3px',
        fontSize: '10px', fontWeight: 500,
      }}>
        <Clock size={9} color={cooling > 0 ? '#666' : '#2a2a2a'} />
        <span>{cooling} Cooling</span>
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '5px',
        background: '#111', border: '1px solid #1e1e1e',
        color: '#333', padding: '5px 10px', borderRadius: '3px',
        fontSize: '10px', fontWeight: 500,
      }}>
        <Lock size={9} color="#2a2a2a" />
        <span>{locked} Locked</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// SORT BAR — single-select dropdown / chips
// ─────────────────────────────────────────────

function SortBar({
  activeSort, onSort,
}: { activeSort: SortKey; onSort: (k: SortKey) => void }) {
  const active = SORT_OPTIONS.find(o => o.key === activeSort);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
      <ArrowUpDown size={11} color="#444" style={{ flexShrink: 0 }} />
      <span style={{ fontSize: '9px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Sort</span>
      <div style={{ flex: 1, overflowX: 'auto', display: 'flex', gap: '6px', scrollbarWidth: 'none' }}>
        {SORT_OPTIONS.map(opt => (
          <button
            key={opt.key}
            onClick={() => onSort(opt.key)}
            style={{
              flexShrink: 0,
              fontSize: '9px', padding: '4px 10px', borderRadius: '3px',
              border: `1px solid ${activeSort === opt.key ? 'rgba(200,169,110,0.5)' : '#1e1e1e'}`,
              background: activeSort === opt.key ? 'rgba(200,169,110,0.1)' : 'transparent',
              color: activeSort === opt.key ? '#c8a96e' : '#555',
              cursor: 'pointer', fontWeight: activeSort === opt.key ? 700 : 400,
              whiteSpace: 'nowrap', minHeight: '28px',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// FILTER TRAY — bottom sheet on mobile, side overlay on desktop
// ─────────────────────────────────────────────

function FilterTray({
  open, onClose, filters, onChange, categories, activeCount,
}: {
  open: boolean;
  onClose: () => void;
  filters: JobFilters;
  onChange: (f: JobFilters) => void;
  categories: string[];
  activeCount: number;
}) {
  if (!open) return null;

  const set = <K extends keyof JobFilters>(key: K, val: JobFilters[K]) =>
    onChange({ ...filters, [key]: val });

  const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '8px' }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        {children}
      </div>
    </div>
  );

  const Chip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
    <button
      onClick={onClick}
      style={{
        fontSize: '10px', padding: '5px 12px', borderRadius: '3px',
        border: `1px solid ${active ? 'rgba(200,169,110,0.5)' : '#2a2a2a'}`,
        background: active ? 'rgba(200,169,110,0.1)' : 'transparent',
        color: active ? '#c8a96e' : '#888',
        cursor: 'pointer', fontWeight: active ? 700 : 400,
        minHeight: '36px',
      }}
    >
      {label}
    </button>
  );

  return (
    <div className="bottom-sheet open" style={{ zIndex: 200 }}>
      <div className="bottom-sheet__panel" style={{ maxHeight: '80vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 10px', borderBottom: '1px solid #1a1a1a',
          position: 'sticky', top: 0, background: '#141210', zIndex: 1,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <SlidersHorizontal size={14} color="#888" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#e0e0e0' }}>Filters</span>
            {activeCount > 0 && (
              <span style={{
                fontSize: '9px', background: 'rgba(200,169,110,0.15)',
                border: '1px solid rgba(200,169,110,0.3)', color: '#c8a96e',
                padding: '1px 6px', borderRadius: '10px', fontWeight: 700,
              }}>{activeCount}</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {activeCount > 0 && (
              <button
                onClick={() => onChange({ ...DEFAULT_FILTERS })}
                style={{ fontSize: '10px', color: '#888', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <RotateCcw size={10} /> Reset
              </button>
            )}
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '16px', lineHeight: 1 }}
            >✕</button>
          </div>
        </div>

        <div style={{ padding: '16px' }}>

          <Section label="Availability">
            <Chip label="All" active={filters.availability === 'ALL'} onClick={() => set('availability', 'ALL')} />
            <Chip label="⚡ Ready now" active={filters.availability === 'READY'} onClick={() => set('availability', 'READY')} />
            <Chip label="🕐 Cooling down" active={filters.availability === 'COOLING'} onClick={() => set('availability', 'COOLING')} />
            <Chip label="🔒 Locked" active={filters.availability === 'LOCKED'} onClick={() => set('availability', 'LOCKED')} />
          </Section>

          <Section label="Risk Level">
            <Chip label="Any risk" active={filters.risk === 'ALL'} onClick={() => set('risk', 'ALL')} />
            <Chip label="Low risk" active={filters.risk === 'LOW'} onClick={() => set('risk', 'LOW')} />
            <Chip label="Medium risk" active={filters.risk === 'MEDIUM'} onClick={() => set('risk', 'MEDIUM')} />
            <Chip label="High risk" active={filters.risk === 'HIGH'} onClick={() => set('risk', 'HIGH')} />
          </Section>

          <Section label="Mode">
            <Chip label="Any mode" active={filters.mode === 'ALL'} onClick={() => set('mode', 'ALL')} />
            <Chip label="Solo" active={filters.mode === 'SOLO'} onClick={() => set('mode', 'SOLO')} />
            <Chip label="Solo or Crew" active={filters.mode === 'SOLO_OR_CREW'} onClick={() => set('mode', 'SOLO_OR_CREW')} />
            <Chip label="Crew" active={filters.mode === 'CREW'} onClick={() => set('mode', 'CREW')} />
          </Section>

          <Section label="Category">
            <Chip label="All categories" active={filters.category === 'ALL'} onClick={() => set('category', 'ALL')} />
            {categories.map(c => (
              <Chip
                key={c}
                label={c.charAt(0) + c.slice(1).toLowerCase()}
                active={filters.category === c}
                onClick={() => set('category', c)}
              />
            ))}
          </Section>

        </div>

        <div style={{ padding: '0 16px 24px' }}>
          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontWeight: 700, minHeight: '48px' }}
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// ACTIVE FILTER CHIPS — shown when filters are applied
// ─────────────────────────────────────────────

function ActiveFilters({
  filters, onChange,
}: { filters: JobFilters; onChange: (f: JobFilters) => void }) {
  const chips: { label: string; clear: () => void }[] = [];

  if (filters.availability !== 'ALL') {
    const labels: Record<string, string> = { READY: 'Ready', COOLING: 'Cooling', LOCKED: 'Locked' };
    chips.push({ label: labels[filters.availability] ?? filters.availability, clear: () => onChange({ ...filters, availability: 'ALL' }) });
  }
  if (filters.risk !== 'ALL') {
    const labels: Record<string, string> = { LOW: 'Low risk', MEDIUM: 'Medium risk', HIGH: 'High risk' };
    chips.push({ label: labels[filters.risk], clear: () => onChange({ ...filters, risk: 'ALL' }) });
  }
  if (filters.category !== 'ALL') {
    chips.push({ label: filters.category.charAt(0) + filters.category.slice(1).toLowerCase(), clear: () => onChange({ ...filters, category: 'ALL' }) });
  }
  if (filters.mode !== 'ALL') {
    const labels: Record<string, string> = { SOLO: 'Solo', CREW: 'Crew', SOLO_OR_CREW: 'Solo/Crew' };
    chips.push({ label: labels[filters.mode], clear: () => onChange({ ...filters, mode: 'ALL' }) });
  }
  if (filters.soloOnly) {
    chips.push({ label: 'Solo only', clear: () => onChange({ ...filters, soloOnly: false }) });
  }

  if (chips.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', alignItems: 'center' }}>
      <span style={{ fontSize: '9px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0 }}>Filters:</span>
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={chip.clear}
          style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '9px', padding: '3px 8px', borderRadius: '10px',
            background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)',
            color: '#c8a96e', cursor: 'pointer', fontWeight: 600,
          }}
        >
          {chip.label} <X size={8} />
        </button>
      ))}
      <button
        onClick={() => onChange({ ...DEFAULT_FILTERS })}
        style={{ fontSize: '9px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
      >
        <RotateCcw size={8} /> Clear all
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// RECOMMENDED CARD — a card + why panel
// ─────────────────────────────────────────────

function ReasonPill({ text }: { text: string }) {
  return (
    <span style={{
      fontSize: '9px', padding: '2px 7px', borderRadius: '10px',
      background: 'rgba(200,169,110,0.08)', border: '1px solid rgba(200,169,110,0.2)',
      color: '#a08040', fontWeight: 500,
    }}>{text}</span>
  );
}

function RecommendedJobCard({
  rec, playerRole, jobState, onRun, isPrimary,
}: {
  rec: JobRecommendation;
  playerRole: import('../../../shared/schema').FamilyRole | null;
  jobState: PlayerJobState | undefined;
  onRun: (job: JobDefinition) => void;
  isPrimary?: boolean;
}) {
  return (
    <div style={{
      marginBottom: '8px',
      border: isPrimary ? '1px solid rgba(200,169,110,0.25)' : '1px solid transparent',
      borderRadius: '5px',
      background: isPrimary ? 'rgba(200,169,110,0.03)' : 'transparent',
    }}>
      {isPrimary && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '5px',
          padding: '5px 14px 0',
          fontSize: '9px', color: '#c8a96e', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <ThumbsUp size={9} /> Best match
        </div>
      )}
      <JobCard
        job={rec.job}
        playerRole={playerRole}
        jobState={jobState}
        onRun={onRun}
        featured={isPrimary}
      />
      {rec.reasons.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '5px',
          padding: '0 14px 10px',
        }}>
          {rec.reasons.map((r, i) => <ReasonPill key={i} text={r} />)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// EMPTY STATE
// ─────────────────────────────────────────────

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div style={{
      padding: '32px 20px', textAlign: 'center',
      background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px',
      marginBottom: '12px',
    }}>
      <div style={{ fontSize: '22px', marginBottom: '8px', opacity: 0.4 }}>🔍</div>
      <div style={{ fontSize: '13px', color: '#666', marginBottom: '6px', fontWeight: 600 }}>No jobs match</div>
      <div style={{ fontSize: '11px', color: '#444', marginBottom: '14px', lineHeight: 1.5 }}>
        Try adjusting the filters or changing the sort order.
      </div>
      <button
        onClick={onReset}
        style={{
          fontSize: '11px', color: '#888', background: 'none',
          border: '1px solid #2a2a2a', padding: '8px 16px',
          borderRadius: '3px', cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', gap: '5px',
        }}
      >
        <RotateCcw size={10} /> Reset filters
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// RISK DOT — concise visual indicator
// ─────────────────────────────────────────────

const RISK_DOT_COUNT: Record<string, number> = {
  VERY_LOW: 1, LOW: 2, MEDIUM: 3, HIGH: 4, EXTREME: 5,
};

function RiskDots({ level, color }: { level: string; color: string }) {
  const count = RISK_DOT_COUNT[level] ?? 1;
  return (
    <span style={{ display: 'inline-flex', gap: '2px', alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{
          width: '5px', height: '5px', borderRadius: '50%',
          background: i <= count ? color : '#2a2a2a',
        }} />
      ))}
    </span>
  );
}

// ─────────────────────────────────────────────
// RISK STRIP — concise 2-row strip below meta
// ─────────────────────────────────────────────

function RiskStrip({ risk, mode }: { risk: RiskProfile; mode: string }) {
  const jailColor = RISK_LEVEL_COLOR[risk.jail];
  const heatColor = RISK_LEVEL_COLOR[risk.heat];

  // Composite background tint
  const compTints = ['transparent', 'rgba(74,154,74,0.04)', 'rgba(204,153,0,0.06)', 'rgba(204,85,0,0.08)', 'rgba(204,51,51,0.1)'];
  const tint = compTints[risk.composite] ?? 'transparent';

  return (
    <div style={{
      background: tint,
      border: '1px solid #1a1a1a',
      borderRadius: '3px',
      padding: '7px 10px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '6px 12px',
      marginBottom: '10px',
    }}>
      {/* Heat */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Flame size={9} color={heatColor} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Heat</span>
        <span style={{ fontSize: '9px', color: heatColor, fontWeight: 600, marginLeft: 'auto' }}>{RISK_LEVEL_LABEL[risk.heat]}</span>
      </div>
      {/* Jail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        <Shield size={9} color={jailColor} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Arrest</span>
        <span style={{ fontSize: '9px', color: jailColor, fontWeight: 600, marginLeft: 'auto' }}>{RISK_LEVEL_LABEL[risk.jail]}</span>
      </div>
      {/* Mode */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
        {mode === 'CREW' ? <Users size={9} color="#888" /> : <User size={9} color="#888" />}
        <span style={{ fontSize: '9px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode</span>
        <span style={{ fontSize: '9px', color: '#888', fontWeight: 500, marginLeft: 'auto' }}>
          {mode === 'SOLO' ? 'Solo' : mode === 'CREW' ? 'Crew' : 'Solo / Crew'}
        </span>
      </div>
      {/* High-profile indicator */}
      {risk.highProfile ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Skull size={9} color="#5580bb" />
          <span style={{ fontSize: '9px', color: '#5580bb', fontWeight: 500 }}>Hitman eligible</span>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <TrendingUp size={9} color="#444" />
          <span style={{ fontSize: '9px', color: '#444' }}>Standard profile</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// LOCKED PANEL — explains why a card is gated
// ─────────────────────────────────────────────

function LockedPanel({ reason }: { reason: LockReason }) {
  const isTemp = reason.temporary;
  const accent = isTemp ? '#cc9900' : '#555';
  const bg     = isTemp ? 'rgba(204,153,0,0.06)' : 'rgba(0,0,0,0)';
  const border = isTemp ? 'rgba(204,153,0,0.2)'  : '#1e1e1e';

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: '3px',
      padding: '9px 11px',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '8px',
    }}>
      {isTemp
        ? <AlertTriangle size={12} color={accent} style={{ flexShrink: 0, marginTop: '1px' }} />
        : <Lock size={12} color={accent} style={{ flexShrink: 0, marginTop: '1px' }} />
      }
      <div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: accent, letterSpacing: '0.04em', marginBottom: '2px' }}>
          {reason.label}
        </div>
        <div style={{ fontSize: '10px', color: '#666', lineHeight: 1.5 }}>
          {reason.explanation}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COOLDOWN PANEL — shows timer and arc progress
// ─────────────────────────────────────────────

function CooldownPanel({
  secsLeft, job, jobState,
}: { secsLeft: number; job: JobDefinition; jobState: PlayerJobState }) {
  const progress  = cooldownProgress(jobState, job);
  const nearReady = isNearReady(jobState, job);
  const availAt   = cooldownAvailableAt(jobState, job);

  // SVG arc
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = circ * progress;
  const accent = nearReady ? '#ffcc33' : '#3a3a3a';
  const fill   = nearReady ? '#cc9900' : '#444';

  return (
    <div style={{
      background: nearReady ? 'rgba(204,153,0,0.06)' : 'rgba(0,0,0,0)',
      border: `1px solid ${nearReady ? 'rgba(204,153,0,0.25)' : '#1e1e1e'}`,
      borderRadius: '3px',
      padding: '9px 11px',
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    }}>
      {/* Progress arc */}
      <svg width={32} height={32} style={{ flexShrink: 0, transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={16} cy={16} r={r} fill="none" stroke="#1e1e1e" strokeWidth={3} />
        {/* Fill */}
        <circle
          cx={16} cy={16} r={r}
          fill="none"
          stroke={fill}
          strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '11px', fontWeight: 700,
          color: nearReady ? '#ffcc33' : '#888',
          letterSpacing: '0.02em', marginBottom: '1px',
        }}>
          {nearReady ? 'Almost Ready' : 'On Cooldown'}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: nearReady ? '#ffcc33' : '#555', fontVariantNumeric: 'tabular-nums' }}>
            {formatCooldown(secsLeft)}
          </span>
          {availAt && (
            <span style={{ fontSize: '9px', color: '#444' }}>avail. {availAt}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COOLDOWN HOOK — re-renders every second
// ─────────────────────────────────────────────

function useCooldownTick(state: PlayerJobState | undefined, job: JobDefinition) {
  const [secs, setSecs] = useState(
    state ? cooldownRemainingSeconds(state, job) : 0
  );
  useEffect(() => {
    if (!state) { setSecs(0); return; }
    setSecs(cooldownRemainingSeconds(state, job));
    const t = setInterval(() => {
      const r = cooldownRemainingSeconds(state, job);
      setSecs(r);
      if (r <= 0) clearInterval(t);
    }, 1000);
    return () => clearInterval(t);
  }, [state, job]);
  return secs;
}

// ─────────────────────────────────────────────
// JOB OUTCOME MODAL — stub execution
// ─────────────────────────────────────────────

interface OutcomeResult {
  success: boolean;
  cashEarned: number;
  heatGained: number;
  xpEarned: number;
  notes: string;
  jailed: boolean;
}

function resolveJob(job: JobDefinition, scaledMax: number): OutcomeResult {
  const roll = Math.random();
  const success = roll > 0.25;
  const cashEarned = success
    ? Math.round((job.reward_band_min + Math.random() * (scaledMax - job.reward_band_min)) / 100) * 100
    : 0;
  const heatGained = success ? Math.ceil(job.jail_chance_base * 50) : Math.ceil(job.jail_chance_base * 80);
  const xpEarned   = success ? Math.floor(10 + job.tier * 8) : Math.floor(job.tier * 3);
  const jailed     = !success && Math.random() < job.jail_chance_base;

  const notes = success
    ? ['Job completed clean.', 'No complications.', 'Smooth operation.', 'Paid out without incident.'][Math.floor(Math.random() * 4)]
    : ['Ran into complications.', 'Bad timing — pulled out early.', 'Contact got cold feet.', 'Heat was too high.'][Math.floor(Math.random() * 4)];

  return { success, cashEarned, heatGained, xpEarned, notes, jailed };
}

function OutcomeModal({
  result, job, onClose,
}: { result: OutcomeResult; job: JobDefinition; onClose: () => void }) {
  const narrative   = getJobNarrative(job.id) ?? PLACEHOLDER_NARRATIVE;
  const resultImage = getJobResultImage(narrative.art_key, result.success, result.jailed, narrative.has_busted_image);

  // Pick narrative text
  const outcomeText = result.jailed
    ? (narrative.busted ? pickOutcome(narrative.busted) : pickOutcome(narrative.failure))
    : result.success
      ? pickOutcome(narrative.success)
      : pickOutcome(narrative.failure);

  const outcomeLabel = result.jailed ? 'ARRESTED' : result.success ? 'SUCCESS' : 'FAILED';
  const outcomeColor = result.jailed ? '#cc7700' : result.success ? '#4a9a4a' : '#cc3333';
  const outcomeBg    = result.jailed ? '#1a1200' : result.success ? '#0a1a0a' : '#1a0808';
  const outcomeBdr   = result.jailed ? '#3a2800' : result.success ? '#2a4a2a' : '#3a1010';

  return (
    <div className="bottom-sheet open">
      <div className="bottom-sheet__panel">

        {/* Result image — full width, no padding */}
        {resultImage && (
          <div style={{ position: 'relative', width: '100%', height: '160px', overflow: 'hidden', background: '#0a0a0a' }}>
            <img
              src={resultImage}
              alt={job.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {/* Gradient overlay for outcome label readability */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, transparent 40%, rgba(8,8,8,0.9) 100%)',
            }} />
            {/* Outcome label bottom-left */}
            <div style={{
              position: 'absolute', bottom: '10px', left: '14px',
              fontSize: '10px', fontWeight: '900', letterSpacing: '0.1em',
              color: outcomeColor,
            }}>
              {outcomeLabel}
            </div>
            {/* Close */}
            <button
              onClick={onClose}
              style={{
                position: 'absolute', top: '10px', right: '10px',
                background: 'rgba(0,0,0,0.6)', border: '1px solid #333',
                color: '#888', cursor: 'pointer', width: '28px', height: '28px',
                borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >✕</button>
          </div>
        )}

        {/* Header row (no image) */}
        {!resultImage && (
          <div className="panel-header">
            <span className="panel-title" style={{ color: outcomeColor }}>{outcomeLabel}</span>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>✕</button>
          </div>
        )}

        <div style={{ padding: '14px 16px 20px' }}>

          {/* Job name */}
          <div style={{ fontSize: '14px', fontWeight: '800', color: '#e0e0e0', marginBottom: '4px', letterSpacing: '-0.01em' }}>
            {job.name}
          </div>

          {/* Narrative text */}
          <div style={{
            background: outcomeBg, border: `1px solid ${outcomeBdr}`,
            borderRadius: '4px', padding: '10px 12px',
            fontSize: '12px', color: result.success ? '#c8e8c8' : result.jailed ? '#e8c878' : '#e8c8c8',
            lineHeight: '1.65', marginBottom: '14px', fontStyle: 'italic',
          }}>
            {outcomeText}
          </div>

          {/* Stats table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', marginBottom: '12px' }}>
            <tbody>
              {([
                ['Payout',     result.cashEarned > 0 ? fmt(result.cashEarned) : '—',  result.cashEarned > 0 ? '#ffcc33' : '#444'],
                ['Heat',       `+${result.heatGained}`,                                 '#cc7700'],
                ['Experience', `+${result.xpEarned} XP`,                                '#5580bb'],
              ] as [string, string, string][]).map(([l, v, c]) => (
                <tr key={l}>
                  <td style={{ padding: '6px 0', color: '#666', borderBottom: '1px solid #151515', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</td>
                  <td style={{ padding: '6px 0', fontWeight: '700', color: c, textAlign: 'right', borderBottom: '1px solid #151515' }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {result.jailed && (
            <div style={{
              background: '#1a0a00', border: '1px solid #3a1e00',
              padding: '8px 12px', marginBottom: '12px',
              fontSize: '11px', color: '#cc7700', lineHeight: '1.5', borderRadius: '3px',
            }}>
              ⚠ Taken in. You\'re in County Jail until bail is arranged or your time runs out.
            </div>
          )}

          <button
            onClick={onClose}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', minHeight: '48px', fontWeight: '700' }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// JOB CARD — narrative-led, image-first layout
// ─────────────────────────────────────────────

function JobCard({
  job,
  playerRole,
  jobState,
  onRun,
  featured,
}: {
  job: JobDefinition;
  playerRole: FamilyRole | null;
  jobState: PlayerJobState | undefined;
  onRun: (job: JobDefinition) => void;
  featured?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const canStart   = canStartJob(playerRole, job);
  const onCooldown = jobState ? isOnCooldown(jobState, job) : false;
  const secsLeft   = useCooldownTick(jobState, job);
  const nearReady  = jobState ? isNearReady(jobState, job) : false;
  const scaled     = getScaledRewardBand(job, playerRole);
  const lockReason = getLockReason(playerRole, job, jobState);
  const risk       = getRiskProfile(job);
  const catColor   = CATEGORY_COLORS[job.category] ?? '#888';
  const isLocked   = !canStart || !!lockReason;

  // Card visual state
  const cardState: 'locked' | 'cooldown' | 'near-ready' | 'ready' =
    isLocked    ? 'locked'     :
    onCooldown  ? (nearReady ? 'near-ready' : 'cooldown') :
    'ready';

  // Narrative
  const narrative   = getJobNarrative(job.id) ?? PLACEHOLDER_NARRATIVE;
  const baseImage   = getJobBaseImage(narrative.art_key);
  const rewardText  = `${fmt(scaled.min)}–${fmt(scaled.max)}`;
  const rewardSuffix = job.reward_types.includes('RESPECT') ? '+Rep' :
                       job.reward_types.includes('INFLUENCE') ? '+Inf' :
                       job.reward_types.includes('INTEL') ? '+Intel' : '';

  // Visual treatment per state
  const imageTreatment = isLocked
    ? { filter: 'grayscale(80%) brightness(0.4)', transition: 'filter 0.3s' }
    : onCooldown
      ? { filter: 'brightness(0.65) saturate(0.5)', transition: 'filter 0.3s' }
      : { filter: 'none', transition: 'filter 0.3s' };

  const borderLeft = featured ? '#ffcc33' :
    cardState === 'locked'    ? '#2a2a2a' :
    cardState === 'cooldown'  ? '#2a2a2a' :
    cardState === 'near-ready'? '#cc9900' :
    catColor;

  // Status badge in the image
  const StatusBadge = () => {
    if (isLocked && lockReason) return (
      <span style={{
        fontSize: '8px', color: '#555', background: '#0d0d0d',
        border: '1px solid #222', padding: '2px 6px', borderRadius: '3px',
        display: 'flex', alignItems: 'center', gap: '3px',
      }}>
        <Lock size={7} /> {lockReason.label}
      </span>
    );
    if (cardState === 'near-ready') return (
      <span style={{
        fontSize: '8px', color: '#ffcc33', background: 'rgba(204,153,0,0.15)',
        border: '1px solid rgba(204,153,0,0.4)', padding: '2px 6px', borderRadius: '3px',
        display: 'flex', alignItems: 'center', gap: '3px', animation: 'tlf-pulse 1.5s ease-in-out infinite',
      }}>
        <Clock size={7} /> {formatCooldown(secsLeft)}
      </span>
    );
    if (onCooldown) return (
      <span style={{
        fontSize: '8px', color: '#666', background: '#111',
        border: '1px solid #222', padding: '2px 6px', borderRadius: '3px',
        display: 'flex', alignItems: 'center', gap: '3px',
      }}>
        <Clock size={7} /> {formatCooldown(secsLeft)}
      </span>
    );
    return (
      <span style={{
        fontSize: '8px', color: '#4a9a4a', background: '#0a1a0a',
        border: '1px solid #1a3a1a', padding: '2px 6px', borderRadius: '3px',
        display: 'flex', alignItems: 'center', gap: '3px',
      }}>
        <Zap size={7} /> Ready
      </span>
    );
  };

  return (
    <div
      className={`job-card${isLocked ? ' job-card--locked' : onCooldown ? ' job-card--cooldown' : ''}`}
      data-testid={`job-card-${job.id}`}
    >
      <div className="job-card__inner" style={{ borderLeftColor: borderLeft, paddingLeft: 0, paddingTop: 0 }}>

        {/* ── IMAGE BANNER ─────────────────────────────── */}
        <div style={{
          position: 'relative', width: '100%', height: '120px',
          overflow: 'hidden', background: '#0a0a0a', borderRadius: '4px 4px 0 0',
        }}>
          {baseImage && (
            <img
              src={baseImage}
              alt={job.name}
              loading="lazy"
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'center', display: 'block',
                ...imageTreatment,
              }}
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
          )}

          {/* Gradient — heavier for locked/cooldown */}
          <div style={{
            position: 'absolute', inset: 0,
            background: isLocked
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(8,8,8,0.92) 100%)'
              : 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(8,8,8,0.75) 100%)',
            pointerEvents: 'none',
          }} />

          {/* Category pill — top-left */}
          <div style={{
            position: 'absolute', top: '8px', left: '10px',
            fontSize: '8px', fontWeight: '700', letterSpacing: '0.07em',
            color: isLocked ? '#444' : catColor,
            background: isLocked ? '#111' : `${catColor}22`,
            border: `1px solid ${isLocked ? '#222' : catColor + '44'}`,
            padding: '2px 7px', borderRadius: '3px',
          }}>
            {job.category}
          </div>

          {/* Featured star — top-right */}
          {featured && (
            <div style={{
              position: 'absolute', top: '8px', right: '10px',
              fontSize: '8px', fontWeight: '700', color: '#ffcc33',
              display: 'flex', alignItems: 'center', gap: '3px',
            }}>
              <Star size={9} />
            </div>
          )}

          {/* Status badge — bottom-right */}
          <div style={{ position: 'absolute', bottom: '8px', right: '10px' }}>
            <StatusBadge />
          </div>

          {/* Risk corner — bottom-left, only show when active */}
          {!isLocked && !onCooldown && risk.composite >= 3 && (
            <div style={{
              position: 'absolute', bottom: '8px', left: '10px',
              fontSize: '8px', color: RISK_LEVEL_COLOR[risk.jail],
              display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600,
            }}>
              <AlertTriangle size={8} />
              {RISK_LEVEL_LABEL[risk.jail]}
            </div>
          )}
        </div>

        {/* ── CARD BODY ─────────────────────────────────── */}
        <div style={{ padding: '10px 14px 12px' }}>

          {/* Title + reward row */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-start', marginBottom: '3px',
          }}>
            <span className="job-card__name" style={{
              fontSize: '13px', fontWeight: '700', letterSpacing: '-0.01em', lineHeight: 1.25,
              color: isLocked ? '#444' : onCooldown ? '#888' : '#e0e0e0',
            }}>
              {job.name}
            </span>
            <span style={{
              fontSize: '12px', fontWeight: '700', flexShrink: 0, marginLeft: '8px',
              color: isLocked ? '#333' : onCooldown ? '#666' : '#ffcc33',
            }}>
              {rewardText}
              {rewardSuffix && <span style={{ fontSize: '9px', color: '#888', marginLeft: '3px' }}>{rewardSuffix}</span>}
            </span>
          </div>

          {/* Summary */}
          <div style={{
            fontSize: '11px', color: isLocked ? '#555' : '#777',
            lineHeight: '1.45', marginBottom: '8px',
          }}>
            {narrative.summary}
          </div>

          {/* Expandable flavor */}
          {expanded && (
            <div style={{
              fontSize: '11px', color: '#888', lineHeight: '1.65',
              marginBottom: '10px', paddingTop: '8px',
              borderTop: '1px solid #151515', fontStyle: 'italic',
            }}>
              {narrative.flavor || job.description}
            </div>
          )}

          {/* ── STATE AREA ────────────────────────────── */}

          {/* LOCKED panel */}
          {isLocked && lockReason && <LockedPanel reason={lockReason} />}

          {/* COOLDOWN panel */}
          {!isLocked && onCooldown && jobState && (
            <CooldownPanel secsLeft={secsLeft} job={job} jobState={jobState} />
          )}

          {/* RISK STRIP — show on ready state, and collapsed on cooldown */}
          {!isLocked && (
            <RiskStrip risk={risk} mode={job.mode} />
          )}

          {/* Meta chips */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            marginBottom: '10px', flexWrap: 'wrap',
          }}>
            <span style={{ fontSize: '9px', color: '#444', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={9} color="#333" />
              <span style={{ color: '#3a3a3a' }}>CD:</span> {formatCooldown(job.cooldown_seconds)}
            </span>
            {job.universal && (
              <span style={{
                fontSize: '8px', color: '#4a9a4a', background: '#0a1a0a',
                border: '1px solid #1a3a1a', padding: '1px 5px', borderRadius: '2px',
              }}>Any Rank</span>
            )}
            {job.war_context_only && (
              <span style={{
                fontSize: '8px', color: '#cc3333', background: '#1a0000',
                border: '1px solid #3a0000', padding: '1px 5px', borderRadius: '2px',
              }}>WAR</span>
            )}
            {/* Expand toggle */}
            <button
              onClick={() => setExpanded(e => !e)}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: '#444', cursor: 'pointer', fontSize: '9px',
                display: 'flex', alignItems: 'center', gap: '2px', padding: '0',
              }}
            >
              {expanded ? 'Less' : 'Brief'}
              {expanded ? <ChevronUp size={9} /> : <ChevronRight size={9} />}
            </button>
          </div>

          {/* Hitman banner — only on ready state */}
          {job.hitman_eligible && !job.universal && canStart && !onCooldown && (
            <div className="job-card__hitman-banner" style={{ marginBottom: '8px' }}>
              <Skull size={11} />
              <span>Optional Hitman slot available for increased success odds.</span>
            </div>
          )}

          {/* ── CTA ─────────────────────────────────────── */}
          <div className="job-card__cta">
            {isLocked ? (
              <button disabled className="job-card__cta-btn" style={{
                background: '#0d0d0d', borderColor: '#1e1e1e',
                color: '#444', cursor: 'not-allowed',
              }}>
                <Lock size={12} />
                {lockReason?.code === 'WAR_CONTEXT_ONLY' ? 'War Only' : `${lockReason?.label ?? 'Locked'}`}
              </button>
            ) : onCooldown ? (
              <button disabled className="job-card__cta-btn" style={{
                background: nearReady ? 'rgba(204,153,0,0.08)' : '#0d0d0d',
                borderColor: nearReady ? 'rgba(204,153,0,0.3)' : '#1e1e1e',
                color: nearReady ? '#cc9900' : '#555',
                cursor: 'not-allowed',
              }}>
                <Clock size={12} />
                {nearReady ? `Ready in ${formatCooldown(secsLeft)}` : formatCooldown(secsLeft)}
              </button>
            ) : job.mode === 'CREW' ? (
              <button onClick={() => onRun(job)} className="job-card__cta-btn btn-primary"
                style={{ background: 'rgba(204,51,51,0.12)', borderColor: 'rgba(204,51,51,0.35)', color: '#cc3333' }}
                data-testid={`start-job-${job.id}`}>
                <Users size={13} /> Assemble Crew
              </button>
            ) : job.mode === 'SOLO_OR_CREW' ? (
              <>
                <button onClick={() => onRun(job)} className="job-card__cta-btn btn-primary"
                  style={{ background: 'rgba(204,51,51,0.12)', borderColor: 'rgba(204,51,51,0.35)', color: '#cc3333' }}
                  data-testid={`start-solo-${job.id}`}>
                  Run Solo
                </button>
                <button onClick={() => onRun(job)} className="job-card__cta-btn btn-ghost"
                  style={{ background: 'transparent', borderColor: '#252525', color: '#888' }}
                  data-testid={`invite-start-${job.id}`}>
                  <Users size={13} /> Crew
                </button>
              </>
            ) : (
              <button onClick={() => onRun(job)} className="job-card__cta-btn btn-primary"
                style={{ background: 'rgba(204,51,51,0.12)', borderColor: 'rgba(204,51,51,0.35)', color: '#cc3333' }}
                data-testid={`start-job-${job.id}`}>
                Run It
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// COLLAPSIBLE SECTION
// ─────────────────────────────────────────────

function CollapsibleSection({
  title, count, children, defaultOpen = true,
}: { title: string; count: number; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ marginBottom: '16px' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: '#181818', border: '1px solid #2a2a2a',
          padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', marginBottom: open ? '8px' : 0, borderRadius: '4px 4px 0 0',
          minHeight: '44px',
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#e0e0e0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {title} <span style={{ color: '#555', fontWeight: 'normal' }}>({count})</span>
        </span>
        {open ? <ChevronUp size={14} color="#555" /> : <ChevronDown size={14} color="#555" />}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────
// BUSINESS JOBS SECTION
// ─────────────────────────────────────────────

function BusinessJobsSection({
  playerId, playerRole, onRun, jobStates,
}: {
  playerId: string;
  playerRole: FamilyRole | null;
  onRun: (job: JobDefinition) => void;
  jobStates: Record<string, PlayerJobState>;
}) {
  const playerAssignments = BUSINESS_ASSIGNMENTS_SEED.filter(a => a.playerId === playerId);

  if (playerAssignments.length === 0) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          width: '100%', background: '#181818', border: '1px solid #2a2a2a',
          padding: '8px 12px', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderRadius: '4px',
        }}>
          <span style={{ fontWeight: 'bold', fontSize: '11px', color: '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Business Jobs <span style={{ fontWeight: 'normal' }}>(0)</span>
          </span>
        </div>
        <div style={{
          background: '#111', border: '1px solid #1a1a1a',
          padding: '12px 14px', fontSize: '10px', color: '#555', fontStyle: 'italic',
          borderRadius: '4px',
        }}>
          Get assigned to a front to unlock business jobs. Ask your Underboss for an assignment.
        </div>
      </div>
    );
  }

  const assignmentsByBiz = playerAssignments.reduce<Record<string, string[]>>((acc, a) => {
    const bizType = a.businessId.replace(/^BUSINESS_/, '').replace(/_\d+$/, '');
    (acc[bizType] ??= []).push(a.slotDefinitionId);
    return acc;
  }, {});

  const allBizJobs = Object.entries(assignmentsByBiz).flatMap(([bizType, slotIds]) => {
    const jobs = BIZ_JOBS_BY_FRONT[bizType] ?? [];
    return jobs.map(j => ({ job: j, bizType, slotIds }));
  });

  const totalJobs = allBizJobs.length;

  return (
    <CollapsibleSection title="Business Jobs — Unlocked by Your Assignments" count={totalJobs} defaultOpen={true}>
      <div style={{ marginBottom: '8px', fontSize: '10px', color: '#818cf8', background: '#15091a', border: '1px solid #3a1a5a', padding: '6px 10px', borderRadius: '3px' }}>
        These jobs are unlocked by your front assignments. Only players holding qualifying slot roles can run them.
      </div>
      {Object.entries(assignmentsByBiz).map(([bizType, slotIds]) => {
        const slotDefs = BUSINESS_SLOT_DEFINITIONS.filter(s => slotIds.includes(s.id));
        const bizJobs = BIZ_JOBS_BY_FRONT[bizType] ?? [];
        const frontInstances = MOCK_FRONT_INSTANCES.filter(f => f.frontType === bizType);
        const frontName = frontInstances[0] ? `${bizType.replace(/_/g, ' ')}` : bizType;

        return (
          <div key={bizType} style={{ marginBottom: '12px' }}>
            <div style={{
              padding: '6px 10px', marginBottom: '6px',
              background: '#0d1a0d', border: '1px solid #1a3a1a', borderRadius: '2px',
            }}>
              <div style={{ fontSize: '11px', color: '#4a9a4a', fontWeight: 600, marginBottom: '2px' }}>
                {frontName}
              </div>
              <div style={{ fontSize: '9px', color: '#555' }}>
                Your slots: {slotDefs.map(s => s.displayName).join(', ') || slotIds.join(', ')}
              </div>
            </div>
            {bizJobs.map(job => {
              const canRunJob = job.allowedSlotDefinitionIds.some(id => slotIds.includes(id));
              if (!canRunJob) return null;
              return (
                <div key={job.id} style={{
                  padding: '10px 12px', marginBottom: '6px',
                  background: '#0d1a0d', border: '1px solid #1a3a1a',
                  borderLeft: '3px solid #4a9a4a', borderRadius: '3px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                    <div>
                      <div style={{ fontSize: '12px', color: '#e0e0e0', fontWeight: 'bold' }}>{job.name}</div>
                      <div style={{ fontSize: '10px', color: '#666', fontStyle: 'italic', marginTop: '2px' }}>{job.description}</div>
                    </div>
                    <button
                      onClick={() => {
                        const fakeJobDef = {
                          id: job.id, name: job.name,
                          reward_band_min: job.rewardCashMin, reward_band_max: job.rewardCashMax,
                          jail_chance_base: job.baseJailRisk,
                          tier: 2, mode: job.mode,
                        };
                        onRun(fakeJobDef as unknown as JobDefinition);
                      }}
                      className="btn btn-primary"
                      style={{ fontSize: '10px', flexShrink: 0, minHeight: '44px' }}
                    >
                      Run Job
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '11px', flexWrap: 'wrap' }}>
                    <div>
                      <span style={{ color: '#666', fontSize: '9px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reward</span>
                      <span style={{ color: '#ffcc33', fontWeight: 'bold' }}>
                        ${job.rewardCashMin.toLocaleString()}–${job.rewardCashMax.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#666', fontSize: '9px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Mode</span>
                      <span style={{ color: '#aaa' }}>{job.mode}</span>
                    </div>
                    <div>
                      <span style={{ color: '#666', fontSize: '9px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Jail Risk</span>
                      <span style={{ color: job.baseJailRisk > 0.2 ? '#cc3333' : '#888' }}>
                        {Math.round(job.baseJailRisk * 100)}%
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#666', fontSize: '9px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Family Cut</span>
                      <span style={{ color: '#818cf8' }}>{job.rewardFamilySharePercent}%</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {bizJobs.filter(j => j.allowedSlotDefinitionIds.some(id => slotIds.includes(id))).length === 0 && (
              <div style={{ fontSize: '10px', color: '#444', fontStyle: 'italic', padding: '6px 10px' }}>
                No exclusive jobs available for your slot in this front.
              </div>
            )}
          </div>
        );
      })}
    </CollapsibleSection>
  );
}

// Keeping ChipBar as a quick-access category strip for DEV UI
function CategoryChipBar({
  categories, catFilter, setCatFilter,
}: {
  categories: string[];
  catFilter: string;
  setCatFilter: (c: string) => void;
}) {
  return (
    <div className="chip-bar" style={{ marginBottom: '8px' }}>
      {['ALL', ...categories].map(c => (
        <button
          key={c}
          onClick={() => setCatFilter(c)}
          className={`chip${catFilter === c ? ' active' : ''}`}
        >
          {c === 'ALL' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
        </button>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function JobsPage() {
  const { player, gameRole } = useGame();
  const playerRole = player.family_role as FamilyRole | null;
  const archetype  = player.archetype as string | undefined;
  const playerHeat = player.stats?.heat as number | undefined;

  // Per-player job states (mock)
  const jobStates = getPlayerJobStates(player.id);

  // Outcome state
  const [activeOutcome, setActiveOutcome] = useState<{ result: OutcomeResult; job: JobDefinition } | null>(null);
  const [runCount, setRunCount] = useState<Record<string, number>>({});

  // Sort & filter state
  const [activeSort, setActiveSort] = useState<SortKey>('RECOMMENDED');
  const [filters, setFilters]       = useState<JobFilters>({ ...DEFAULT_FILTERS });
  const [filterOpen, setFilterOpen] = useState(false);

  // Category chip (quick access — DEV UI)
  const [catFilter, setCatFilter] = useState<string>('ALL');

  // View tab
  const [view, setView] = useState<'recommended' | 'all'>('recommended');

  const allCategories = Array.from(new Set(ALL_JOBS.map(j => j.category))).sort();
  const activeFilterCount = countActiveFilters(filters) + (catFilter !== 'ALL' ? 1 : 0);

  // Status counts (full list, no filter)
  const statusCounts = getJobStatusCounts(ALL_JOBS, playerRole, jobStates);

  // Recommended jobs (top 4)
  const recommended = getRecommendedJobs(ALL_JOBS, playerRole, jobStates, archetype, playerHeat, 4);

  // Merged filters: catFilter overrides filters.category for quick-access strip
  const effectiveFilters: JobFilters = catFilter !== 'ALL'
    ? { ...filters, category: catFilter }
    : filters;

  // Apply filters to all jobs
  const filteredAll = applyFilters(ALL_JOBS, effectiveFilters, playerRole, jobStates);
  const sortedAll   = sortJobs(filteredAll, activeSort, playerRole, jobStates, archetype);

  // Segment for sections
  const sortedRanked    = sortedAll.filter(j => !j.universal);
  const sortedUniversal = sortedAll.filter(j => j.universal);

  const hasResults = sortedAll.length > 0;

  function handleRun(job: JobDefinition) {
    const scaled = getScaledRewardBand(job, playerRole);
    const result = resolveJob(job, scaled.max);
    setRunCount(c => ({ ...c, [job.id]: (c[job.id] ?? 0) + 1 }));
    setActiveOutcome({ result, job });
  }

  function resetAll() {
    setFilters({ ...DEFAULT_FILTERS });
    setCatFilter('ALL');
    setActiveSort('RECOMMENDED');
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Job Board"
        sub="Operations available to your rank. Sort and filter to find the right move."
      />

      {/* ── STATUS BAR ── */}
      <StatusBar
        ready={statusCounts.ready}
        cooling={statusCounts.cooling}
        locked={statusCounts.locked}
        onFilterReady={() => {
          setFilters(f => ({ ...f, availability: f.availability === 'READY' ? 'ALL' : 'READY' }));
          setView('all');
        }}
      />

      {/* ── VIEW TABS ── */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '10px', borderBottom: '1px solid #1a1a1a' }}>
        {([
          { key: 'recommended', label: 'Recommended' },
          { key: 'all',         label: `All Jobs (${statusCounts.total})` },
        ] as { key: 'recommended' | 'all'; label: string }[]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            style={{
              padding: '8px 14px', fontSize: '11px', fontWeight: 700,
              background: 'none', border: 'none', cursor: 'pointer',
              color: view === tab.key ? '#e0e0e0' : '#555',
              borderBottom: `2px solid ${view === tab.key ? '#c8a96e' : 'transparent'}`,
              marginBottom: '-1px', letterSpacing: '0.02em',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── RECOMMENDED VIEW ── */}
      {view === 'recommended' && (
        <>
          {/* Archetype badge */}
          {archetype && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              marginBottom: '10px', fontSize: '10px', color: '#777',
            }}>
              <CheckCircle2 size={11} color="#555" />
              Personalized for <span style={{ color: '#c8a96e', fontWeight: 700 }}>{archetype.charAt(0) + archetype.slice(1).toLowerCase()}</span> archetype
              {playerHeat !== undefined && playerHeat > 40 && (
                <span style={{ color: '#cc5500', marginLeft: '6px', fontSize: '9px' }}>
                  · Heat {playerHeat} — low-risk jobs prioritized
                </span>
              )}
            </div>
          )}

          {recommended.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '11px', background: '#111', border: '1px solid #1a1a1a', borderRadius: '4px', marginBottom: '12px' }}>
              No recommended jobs available right now. Check back after some cooldowns clear.
            </div>
          ) : recommended.map((rec, i) => (
            <RecommendedJobCard
              key={rec.job.id}
              rec={rec}
              playerRole={playerRole}
              jobState={jobStates[rec.job.id]}
              onRun={handleRun}
              isPrimary={i === 0}
            />
          ))}

          {/* Separator + link to all */}
          <div style={{ textAlign: 'center', padding: '8px 0 12px', borderTop: '1px solid #1a1a1a', marginTop: '4px' }}>
            <button
              onClick={() => setView('all')}
              style={{ fontSize: '10px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.04em' }}
            >
              View all jobs →
            </button>
          </div>
        </>
      )}

      {/* ── ALL JOBS VIEW ── */}
      {view === 'all' && (
        <>
          {/* Sort bar */}
          <SortBar activeSort={activeSort} onSort={setActiveSort} />

          {/* Filter button + active filter chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '10px', padding: '5px 12px', borderRadius: '3px',
                border: `1px solid ${activeFilterCount > 0 ? 'rgba(200,169,110,0.4)' : '#2a2a2a'}`,
                background: activeFilterCount > 0 ? 'rgba(200,169,110,0.08)' : 'transparent',
                color: activeFilterCount > 0 ? '#c8a96e' : '#666',
                cursor: 'pointer', fontWeight: 600, minHeight: '32px',
              }}
            >
              <SlidersHorizontal size={10} />
              Filters
              {activeFilterCount > 0 && (
                <span style={{
                  fontSize: '9px', background: '#c8a96e', color: '#0a0908',
                  borderRadius: '10px', padding: '0 5px', fontWeight: 700,
                }}>{activeFilterCount}</span>
              )}
            </button>

            {activeFilterCount > 0 && (
              <button
                onClick={resetAll}
                style={{ fontSize: '9px', color: '#555', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
              >
                <RotateCcw size={9} /> Reset
              </button>
            )}
          </div>

          {/* Active filter chips */}
          <ActiveFilters filters={effectiveFilters} onChange={f => {
            setCatFilter('ALL');
            setFilters(f);
          }} />

          {/* Category quick strip (DEV UI — always shown) */}
          <CategoryChipBar
            categories={allCategories}
            catFilter={catFilter}
            setCatFilter={setCatFilter}
          />

          {/* Result count */}
          {activeFilterCount > 0 && (
            <div style={{ fontSize: '10px', color: '#555', marginBottom: '8px' }}>
              {sortedAll.length} job{sortedAll.length !== 1 ? 's' : ''} match
            </div>
          )}

          {/* Empty state */}
          {!hasResults && <EmptyState onReset={resetAll} />}

          {/* Ranked jobs */}
          {hasResults && (
            <CollapsibleSection title="Ranked Operations" count={sortedRanked.length}>
              {sortedRanked.length === 0 ? (
                <div style={{ padding: '12px', color: '#555', fontSize: '10px', fontStyle: 'italic' }}>No ranked jobs match.</div>
              ) : sortedRanked.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  playerRole={playerRole}
                  jobState={jobStates[job.id]}
                  onRun={handleRun}
                />
              ))}
            </CollapsibleSection>
          )}

          {/* Universal jobs */}
          {hasResults && (
            <CollapsibleSection title="Universal (Any Rank)" count={sortedUniversal.length}>
              <div style={{ marginBottom: '8px', fontSize: '10px', color: '#5580bb', background: '#0d1020', border: '1px solid #1e2840', padding: '6px 10px', borderRadius: '3px' }}>
                Available at all ranks. Reward scales with your rank ({playerRole && (['BOSS','UNDERBOSS','CONSIGLIERE'].includes(playerRole)) ? '2.5–2.9' : playerRole === 'CAPO' ? '1.85' : playerRole === 'SOLDIER' ? '1.35' : '1.0'}× multiplier).
              </div>
              {sortedUniversal.length === 0 ? (
                <div style={{ padding: '12px', color: '#555', fontSize: '10px', fontStyle: 'italic' }}>No universal jobs match.</div>
              ) : sortedUniversal.map(job => (
                <JobCard
                  key={job.id}
                  job={job}
                  playerRole={playerRole}
                  jobState={jobStates[job.id]}
                  onRun={handleRun}
                />
              ))}
            </CollapsibleSection>
          )}

          {/* Business jobs always shown regardless of filter */}
          <BusinessJobsSection
            playerId={player.id}
            playerRole={playerRole}
            onRun={handleRun}
            jobStates={jobStates}
          />
        </>
      )}

      {/* Filter tray */}
      <FilterTray
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        categories={allCategories}
        activeCount={countActiveFilters(filters)}
      />

      {/* Outcome modal */}
      {activeOutcome && (
        <OutcomeModal
          result={activeOutcome.result}
          job={activeOutcome.job}
          onClose={() => setActiveOutcome(null)}
        />
      )}
    </div>
  );
}
