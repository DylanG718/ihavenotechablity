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
} from '../../../shared/jobs';
import type { JobDefinition, PlayerJobState } from '../../../shared/jobs';
import type { FamilyRole } from '../../../shared/schema';
import { fmt } from '../lib/mockData';
import {
  BUSINESS_ASSIGNMENTS_SEED, BIZ_JOBS_BY_FRONT, BUSINESS_SLOT_DEFINITIONS,
} from '../lib/worldConfig';
import { MOCK_FRONT_INSTANCES, FAMILY_NAMES } from '../lib/worldSeed';
import {
  Lock, Zap, Users, User, Clock, Skull, Star, ChevronDown, ChevronUp, X, ChevronRight,
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
// COUNTDOWN HOOK — re-renders every second
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
  const scaled     = getScaledRewardBand(job, playerRole);
  const riskLabel  = jailRiskLabel(job.jail_chance_base);
  const riskColor  = JAIL_RISK_COLORS[riskLabel];
  const catColor   = CATEGORY_COLORS[job.category] ?? '#888';
  const isLocked   = !canStart;

  // Narrative
  const narrative   = getJobNarrative(job.id) ?? PLACEHOLDER_NARRATIVE;
  const baseImage   = getJobBaseImage(narrative.art_key);
  const rewardText  = `${fmt(scaled.min)}–${fmt(scaled.max)}`;
  const rewardSuffix = job.reward_types.includes('RESPECT') ? '+Rep' :
                       job.reward_types.includes('INFLUENCE') ? '+Inf' :
                       job.reward_types.includes('INTEL') ? '+Intel' : '';

  const borderColor = featured ? '#ffcc33' : catColor;

  return (
    <div
      className={`job-card${isLocked ? ' job-card--locked' : ''}`}
      data-testid={`job-card-${job.id}`}
    >
      <div className="job-card__inner" style={{ borderLeftColor: borderColor, paddingLeft: 0, paddingTop: 0 }}>

        {/* ── IMAGE BANNER ────────────────────── */}
        <div style={{ position: 'relative', width: '100%', height: '120px', overflow: 'hidden', background: '#0a0a0a', borderRadius: '4px 4px 0 0' }}>
          {baseImage && (
            <img
              src={baseImage}
              alt={job.name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
            />
          )}
          {/* Gradient overlay for text legibility */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(8,8,8,0.75) 100%)',
            pointerEvents: 'none',
          }} />
          {/* Category pill — top-left */}
          <div style={{
            position: 'absolute', top: '8px', left: '10px',
            fontSize: '8px', fontWeight: '700', letterSpacing: '0.07em',
            color: catColor, background: `${catColor}22`,
            border: `1px solid ${catColor}44`,
            padding: '2px 7px', borderRadius: '3px',
          }}>
            {job.category}
          </div>
          {/* Featured badge — top-right */}
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
            {isLocked ? (
              <span style={{ fontSize: '8px', color: '#666', background: '#111', border: '1px solid #2a2a2a', padding: '2px 6px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Lock size={7} /> {RANK_DISPLAY[job.min_rank]}
              </span>
            ) : onCooldown ? (
              <span style={{ fontSize: '8px', color: '#888', background: '#111', border: '1px solid #252525', padding: '2px 6px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={7} /> {formatCooldown(secsLeft)}
              </span>
            ) : (
              <span style={{ fontSize: '8px', color: '#4a9a4a', background: '#0a1a0a', border: '1px solid #1a3a1a', padding: '2px 6px', borderRadius: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Zap size={7} /> Ready
              </span>
            )}
          </div>
        </div>

        {/* ── CARD BODY ────────────────────── */}
        <div style={{ padding: '10px 14px 12px' }}>

          {/* Title row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3px' }}>
            <span className="job-card__name" style={{ fontSize: '13px', fontWeight: '700', color: isLocked ? '#555' : '#e0e0e0', letterSpacing: '-0.01em', lineHeight: 1.25 }}>
              {job.name}
            </span>
            <span style={{ fontSize: '12px', fontWeight: '700', color: '#ffcc33', flexShrink: 0, marginLeft: '8px' }}>
              {rewardText}
              {rewardSuffix && <span style={{ fontSize: '9px', color: '#888', marginLeft: '3px' }}>{rewardSuffix}</span>}
            </span>
          </div>

          {/* Summary line */}
          <div style={{ fontSize: '11px', color: '#777', lineHeight: '1.45', marginBottom: '8px' }}>
            {narrative.summary}
          </div>

          {/* Expandable description */}
          {expanded && (
            <div style={{
              fontSize: '11px', color: '#888', lineHeight: '1.65',
              marginBottom: '10px', paddingTop: '8px',
              borderTop: '1px solid #151515',
              fontStyle: 'italic',
            }}>
              {narrative.flavor || job.description}
            </div>
          )}

          {/* Meta row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '9px', color: riskColor, fontWeight: '600' }}>
              {JAIL_RISK_DISPLAY[riskLabel]} risk
            </span>
            <span style={{ fontSize: '9px', color: '#444', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <Clock size={9} /> {formatCooldown(job.cooldown_seconds)}
            </span>
            <span style={{ fontSize: '9px', color: '#444', display: 'flex', alignItems: 'center', gap: '3px' }}>
              {MODE_ICON(job.mode)}<span style={{ marginLeft: '2px' }}>{MODE_LABEL[job.mode]}</span>
            </span>
            {job.universal && (
              <span style={{ fontSize: '8px', color: '#4a9a4a', background: '#0a1a0a', border: '1px solid #1a3a1a', padding: '1px 5px', borderRadius: '2px' }}>Any Rank</span>
            )}
            {job.war_context_only && (
              <span style={{ fontSize: '8px', color: '#cc3333', background: '#1a0000', border: '1px solid #3a0000', padding: '1px 5px', borderRadius: '2px' }}>WAR</span>
            )}
            {job.hitman_eligible && (
              <span style={{ fontSize: '8px', color: '#5580bb', background: '#0d1020', border: '1px solid #1e2840', padding: '1px 5px', borderRadius: '2px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Skull size={7} /> Hitman
              </span>
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

          {/* Hitman banner */}
          {job.hitman_eligible && !job.universal && canStart && (
            <div className="job-card__hitman-banner" style={{ marginBottom: '8px' }}>
              <Skull size={11} />
              <span>Optional Hitman slot available for increased success odds.</span>
            </div>
          )}

          {/* CTA row */}
          <div className="job-card__cta">
            {isLocked ? (
              <button disabled className="job-card__cta-btn"
                style={{ background: '#111', borderColor: '#2a2a2a', color: '#555', cursor: 'not-allowed' }}>
                <Lock size={12} /> {RANK_DISPLAY[job.min_rank]} required
              </button>
            ) : onCooldown ? (
              <button disabled className="job-card__cta-btn"
                style={{ background: '#111', borderColor: '#2a2a2a', color: '#666', cursor: 'not-allowed', opacity: 0.7 }}>
                <Clock size={12} /> {formatCooldown(secsLeft)}
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

// ─────────────────────────────────────────────
// CHIP BAR
// ─────────────────────────────────────────────

function ChipBar({
  categories,
  catFilter, setCatFilter,
  modeFilter, setModeFilter,
  showReadyOnly, setShowReadyOnly,
}: {
  categories: string[];
  catFilter: string; setCatFilter: (c: string) => void;
  modeFilter: string; setModeFilter: (m: string) => void;
  showReadyOnly: boolean; setShowReadyOnly: (v: boolean) => void;
}) {
  return (
    <div className="chip-bar" style={{ marginBottom: '12px' }}>
      {/* Category chips */}
      {['ALL', ...categories].map(c => (
        <button
          key={c}
          onClick={() => setCatFilter(c)}
          className={`chip${catFilter === c ? ' active' : ''}`}
        >
          {c === 'ALL' ? 'All' : c.charAt(0) + c.slice(1).toLowerCase()}
        </button>
      ))}

      {/* Separator */}
      <div className="chip-separator" />

      {/* Mode chips */}
      {[
        { key: 'ALL', label: 'Any Mode' },
        { key: 'SOLO', label: 'Solo' },
        { key: 'CREW', label: 'Crew' },
        { key: 'SOLO_OR_CREW', label: 'Solo/Crew' },
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setModeFilter(key)}
          className={`chip${modeFilter === key ? ' active' : ''}`}
        >
          {label}
        </button>
      ))}

      {/* Separator */}
      <div className="chip-separator" />

      {/* Ready only chip */}
      <button
        onClick={() => setShowReadyOnly(r => !r)}
        className={`chip${showReadyOnly ? ' active' : ''}`}
        style={showReadyOnly ? { background: 'rgba(74,154,74,0.15)', borderColor: 'rgba(74,154,74,0.4)', color: '#4a9a4a' } : {}}
      >
        <Zap size={10} style={{ marginRight: '3px' }} /> Ready only
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────

export default function JobsPage() {
  const { player, gameRole } = useGame();
  const playerRole = player.family_role as FamilyRole | null;

  // Per-player job states (mock)
  const jobStates = getPlayerJobStates(player.id);

  // Outcome state
  const [activeOutcome, setActiveOutcome] = useState<{ result: OutcomeResult; job: JobDefinition } | null>(null);
  const [runCount, setRunCount] = useState<Record<string, number>>({});

  // Filter state
  const [catFilter, setCatFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<string>('ALL');
  const [showReadyOnly, setShowReadyOnly] = useState(false);

  // Compute featured
  const featured = getFeaturedJobs(ALL_JOBS, jobStates, playerRole, 4);

  // Filtered ranked jobs — all visible, some locked
  const filteredRanked = RANKED_JOBS.filter(j => {
    if (catFilter !== 'ALL' && j.category !== catFilter) return false;
    if (modeFilter !== 'ALL' && j.mode !== modeFilter) return false;
    if (showReadyOnly) {
      const s = jobStates[j.id];
      if (s && isOnCooldown(s, j)) return false;
    }
    return true;
  });

  // Filtered universal jobs
  const filteredUniversal = UNIVERSAL_JOBS.filter(j => {
    if (catFilter !== 'ALL' && j.category !== catFilter) return false;
    if (modeFilter !== 'ALL' && j.mode !== modeFilter) return false;
    if (showReadyOnly) {
      const s = jobStates[j.id];
      if (s && isOnCooldown(s, j)) return false;
    }
    return true;
  });

  const allCategories = Array.from(new Set(ALL_JOBS.map(j => j.category))).sort();

  function handleRun(job: JobDefinition) {
    const scaled = getScaledRewardBand(job, playerRole);
    const result = resolveJob(job, scaled.max);
    setRunCount(c => ({ ...c, [job.id]: (c[job.id] ?? 0) + 1 }));
    setActiveOutcome({ result, job });
  }

  return (
    <div className="page-stack">
      <PageHeader
        title="Job Board"
        sub="Solo and crew operations. Rank-based jobs unlock as you rise. Universal jobs scale with your rank."
      />

      {/* Chip bar filter */}
      <ChipBar
        categories={allCategories}
        catFilter={catFilter} setCatFilter={setCatFilter}
        modeFilter={modeFilter} setModeFilter={setModeFilter}
        showReadyOnly={showReadyOnly} setShowReadyOnly={setShowReadyOnly}
      />

      {/* ── FEATURED ── */}
      {catFilter === 'ALL' && modeFilter === 'ALL' && !showReadyOnly && (
        <CollapsibleSection title="Featured / Recommended" count={featured.length}>
          {featured.map(job => (
            <JobCard
              key={job.id}
              job={job}
              playerRole={playerRole}
              jobState={jobStates[job.id]}
              onRun={handleRun}
              featured
            />
          ))}
        </CollapsibleSection>
      )}

      {/* ── RANKED JOBS ── */}
      <CollapsibleSection title="Ranked Jobs" count={filteredRanked.length}>
        {filteredRanked.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '10px' }}>
            No ranked jobs match the current filters.
          </div>
        ) : filteredRanked.map(job => (
          <JobCard
            key={job.id}
            job={job}
            playerRole={playerRole}
            jobState={jobStates[job.id]}
            onRun={handleRun}
          />
        ))}
      </CollapsibleSection>

      {/* ── UNIVERSAL JOBS ── */}
      <CollapsibleSection title="Universal Jobs (Any Rank)" count={filteredUniversal.length}>
        <div style={{ marginBottom: '8px', fontSize: '10px', color: '#5580bb', background: '#0d1020', border: '1px solid #1e2840', padding: '6px 10px', borderRadius: '3px' }}>
          These jobs are available at all ranks. Reward scales automatically based on your rank (
          {playerRole ? `current multiplier: ${(['BOSS','UNDERBOSS','CONSIGLIERE'].includes(playerRole) ? '2.5–2.9' : playerRole === 'CAPO' ? '1.85' : playerRole === 'SOLDIER' ? '1.35' : '1.0')}×` : '1.0×'}
          ).
        </div>
        {filteredUniversal.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '10px' }}>
            No universal jobs match the current filters.
          </div>
        ) : filteredUniversal.map(job => (
          <JobCard
            key={job.id}
            job={job}
            playerRole={playerRole}
            jobState={jobStates[job.id]}
            onRun={handleRun}
          />
        ))}
      </CollapsibleSection>

      {/* ── BUSINESS JOBS ── */}
      <BusinessJobsSection
        playerId={player.id}
        playerRole={playerRole}
        onRun={handleRun}
        jobStates={jobStates}
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
