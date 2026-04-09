// ═══════════════════════════════════════════════════════════════════
// THE LAST FIRM — Jobs Data Model
// Source of truth for all job definitions, engine logic, and seeding.
// ═══════════════════════════════════════════════════════════════════

import type { FamilyRole } from './schema';

// ─────────────────────────────────────────────
// ENUMS & TYPES
// ─────────────────────────────────────────────

export type JobTier = 1 | 1.5 | 2 | 3 | 3.5 | 4 | 5;

export type JobCategory =
  | 'GAMBLING'
  | 'EXTORTION'
  | 'FENCING'
  | 'ECONOMY'
  | 'HUSTLE'
  | 'INTEL'
  | 'INFLUENCE'
  | 'SPECIAL'
  | 'CONTRABAND'
  | 'ENFORCEMENT'
  | 'CORRUPTION'
  | 'SABOTAGE'
  | 'LOGISTICS';

/** Rank gate — which family rank is required to see/start this job */
export type JobMinRank =
  | 'ASSOCIATE'   // Tier 1  (includes Recruit)
  | 'SOLDIER'     // Tier 2
  | 'CAPO'        // Tier 3
  | 'CONSIGLIERE' // Tier 3.5
  | 'UNDERBOSS'   // Tier 4
  | 'BOSS';       // Tier 5

export type JobMode = 'SOLO' | 'CREW' | 'SOLO_OR_CREW';

export type RewardType = 'CASH' | 'XP' | 'INTEL' | 'INFLUENCE' | 'HEAT_CHANGE' | 'RESPECT';

export type JailRiskLabel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

/**
 * Effect scope guardrail.
 * SELF: only affects the acting player's stats (cash, heat, respect, etc.)
 * FAMILY_ABSTRACT: affects abstract family metrics (influence, treasury, war score)
 * PVP: direct change to another specific player — NOT USED in these jobs
 */
export type JobEffectScope = 'SELF' | 'FAMILY_ABSTRACT';

// ─────────────────────────────────────────────
// JOB DEFINITION
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// NARRATIVE CONTENT — side-car per job.
// Stored in jobNarratives.ts, keyed by job_id.
// Kept separate from JobDefinition so the core
// data model stays lean and backend-compatible.
// ─────────────────────────────────────────────

/** A pool of outcome narratives — one is randomly selected at runtime */
export interface OutcomeNarrativePool {
  /** 2-5 distinct narrative strings. One is picked at runtime. */
  narratives: string[];
}

export interface JobNarrative {
  job_id: string;

  // ── Card content fields ──────────────────────────────────
  /** 1-line hook. Max ~60 chars. Replaces/supplements lore_tagline. */
  summary: string;

  /** 2-3 sentence job brief. Max ~180 chars. Flavor + context. */
  flavor: string;

  // ── Outcome narratives (pick one randomly from pool) ────
  /** Short win narratives. Max ~80 chars each. */
  success: OutcomeNarrativePool;

  /** Short fail narratives. Max ~80 chars each. */
  failure: OutcomeNarrativePool;

  /** Busted narratives (only for high jail-risk jobs). Max ~80 chars each. */
  busted?: OutcomeNarrativePool;

  // ── Art / image asset ────────────────────────────────────
  /** Slug matching the generated image filename. e.g. 'protection_rounds' */
  art_key: string;

  /** Whether a busted image variant exists for this job */
  has_busted_image: boolean;
}

export interface JobDefinition {
  id: string;
  name: string;
  lore_tagline: string;
  description: string;

  tier: JobTier;
  category: JobCategory;
  min_rank: JobMinRank;

  /** universal = true → any rank can do it (min_rank still = ASSOCIATE) */
  universal: boolean;

  mode: JobMode;
  min_crew_size: number; // 0 = SOLO only; 1+ = needs crew

  cooldown_seconds: number; // wall-clock; no energy bar

  reward_band_min: number; // base cash (before rank multiplier)
  reward_band_max: number;
  reward_types: RewardType[];

  /** 0–1 probability of jail on failure */
  jail_chance_base: number;

  /** Only true for explicit high-stakes rank-based jobs */
  hitman_eligible: boolean;

  /** Only appears when family is at war */
  war_context_only: boolean;

  /** See JobEffectScope — default SELF for all jobs here */
  effect_scope: JobEffectScope;

  /**
   * Optional inline narrative. If present, the UI uses this directly.
   * If absent, the UI looks up the job_id in the jobNarratives registry.
   * Prefer the registry for new jobs — keep JobDefinition focused on
   * gameplay data.
   */
  narrative?: Omit<JobNarrative, 'job_id'>;
}

// ─────────────────────────────────────────────
// PER-PLAYER JOB STATE (in-memory / mock)
// ─────────────────────────────────────────────

export interface PlayerJobState {
  job_id: string;
  last_completed_at: string | null; // ISO
  last_failed_at: string | null;    // ISO
}

// ─────────────────────────────────────────────
// RANK ORDER — used for comparison
// ─────────────────────────────────────────────

export const RANK_ORDER: Record<JobMinRank, number> = {
  ASSOCIATE:   1,
  SOLDIER:     2,
  CAPO:        3,
  CONSIGLIERE: 3,  // same tier band as CAPO; Consigliere-specific jobs use tier 3.5
  UNDERBOSS:   4,
  BOSS:        5,
};

/** Map FamilyRole → JobMinRank for gate comparisons */
export function familyRoleToJobRank(role: FamilyRole | null | undefined): JobMinRank {
  switch (role) {
    case 'BOSS':        return 'BOSS';
    case 'UNDERBOSS':   return 'UNDERBOSS';
    case 'CONSIGLIERE': return 'CONSIGLIERE';
    case 'CAPO':        return 'CAPO';
    case 'SOLDIER':     return 'SOLDIER';
    case 'ASSOCIATE':   return 'ASSOCIATE';
    case 'RECRUIT':     return 'ASSOCIATE'; // Recruits get Associate-tier access
    default:            return 'ASSOCIATE';
  }
}

/**
 * Can the player's rank access this job?
 * All jobs are VISIBLE regardless; only STARTABLE is gated.
 */
export function canStartJob(playerRole: FamilyRole | null, job: JobDefinition): boolean {
  const pRank = RANK_ORDER[familyRoleToJobRank(playerRole)];
  const jRank = RANK_ORDER[job.min_rank];
  return pRank >= jRank;
}

// ─────────────────────────────────────────────
// RANK REWARD MULTIPLIER (universal jobs)
// ─────────────────────────────────────────────

export const RANK_REWARD_MULTIPLIER: Record<JobMinRank, number> = {
  ASSOCIATE:   1.0,
  SOLDIER:     1.35,
  CAPO:        1.85,
  CONSIGLIERE: 2.35,
  UNDERBOSS:   2.5,
  BOSS:        2.9,
};

export function getScaledRewardBand(
  job: JobDefinition,
  playerRole: FamilyRole | null
): { min: number; max: number } {
  if (!job.universal) return { min: job.reward_band_min, max: job.reward_band_max };
  const mult = RANK_REWARD_MULTIPLIER[familyRoleToJobRank(playerRole)];
  return {
    min: Math.round((job.reward_band_min * mult) / 100) * 100,
    max: Math.round((job.reward_band_max * mult) / 100) * 100,
  };
}

// ─────────────────────────────────────────────
// COOLDOWN HELPERS
// ─────────────────────────────────────────────

export function isOnCooldown(state: PlayerJobState, job: JobDefinition): boolean {
  const last = state.last_completed_at ?? state.last_failed_at;
  if (!last) return false;
  const elapsed = (Date.now() - new Date(last).getTime()) / 1000;
  return elapsed < job.cooldown_seconds;
}

export function cooldownRemainingSeconds(state: PlayerJobState, job: JobDefinition): number {
  const last = state.last_completed_at ?? state.last_failed_at;
  if (!last) return 0;
  const elapsed = (Date.now() - new Date(last).getTime()) / 1000;
  return Math.max(0, job.cooldown_seconds - elapsed);
}

export function formatCooldown(seconds: number): string {
  if (seconds <= 0) return 'Ready';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─────────────────────────────────────────────
// JAIL RISK LABEL
// ─────────────────────────────────────────────

export function jailRiskLabel(chance: number): JailRiskLabel {
  if (chance <= 0.04) return 'VERY_LOW';
  if (chance <= 0.12) return 'LOW';
  if (chance <= 0.25) return 'MEDIUM';
  if (chance <= 0.45) return 'HIGH';
  return 'EXTREME';
}

export const JAIL_RISK_COLORS: Record<JailRiskLabel, string> = {
  VERY_LOW: '#4a9a4a',
  LOW:      '#6aaa4a',
  MEDIUM:   '#cc9900',
  HIGH:     '#cc5500',
  EXTREME:  '#cc3333',
};

export const JAIL_RISK_DISPLAY: Record<JailRiskLabel, string> = {
  VERY_LOW: 'Very Low',
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  EXTREME:  'Extreme',
};

// ─────────────────────────────────────────────
// FEATURED JOBS LOGIC
// Returns top N jobs sorted by: ready (not on cooldown) > highest reward
// ─────────────────────────────────────────────

export function getFeaturedJobs(
  jobs: JobDefinition[],
  playerStates: Record<string, PlayerJobState>,
  playerRole: FamilyRole | null,
  count = 4
): JobDefinition[] {
  return jobs
    .filter(j => canStartJob(playerRole, j))
    .sort((a, b) => {
      const aState = playerStates[a.id] ?? { job_id: a.id, last_completed_at: null, last_failed_at: null };
      const bState = playerStates[b.id] ?? { job_id: b.id, last_completed_at: null, last_failed_at: null };
      const aReady = !isOnCooldown(aState, a) ? 1 : 0;
      const bReady = !isOnCooldown(bState, b) ? 1 : 0;
      if (bReady !== aReady) return bReady - aReady;
      return b.reward_band_max - a.reward_band_max;
    })
    .slice(0, count);
}

// ─────────────────────────────────────────────
// LOCK REASON SYSTEM
// Plain-language lock reasons for the UI.
// ─────────────────────────────────────────────

export type LockReasonCode =
  | 'RANK_TOO_LOW'
  | 'WAR_CONTEXT_ONLY'
  | 'HITMAN_ONLY'
  | 'FAMILY_REQUIRED'
  | 'ON_COOLDOWN'
  | 'LOCATION_REQUIRED'    // placeholder — future expansion
  | 'ITEM_REQUIRED'         // placeholder — future expansion
  | 'STAT_REQUIREMENT'      // placeholder — future expansion
  | 'WORLD_STATE';          // placeholder — future expansion

export interface LockReason {
  code: LockReasonCode;
  /** Short label shown in badge, e.g. "Capo Required" */
  label: string;
  /** Full plain-language explanation shown in the locked-state panel */
  explanation: string;
  /** Whether this lock is temporary (can be resolved) vs permanent until rank-up */
  temporary: boolean;
}

const RANK_LABEL_DISPLAY: Record<string, string> = {
  ASSOCIATE:   'Associate',
  SOLDIER:     'Soldier',
  CAPO:        'Capo',
  CONSIGLIERE: 'Consigliere',
  UNDERBOSS:   'Underboss',
  BOSS:        'Boss',
};

/**
 * Returns the primary lock reason for a job, or null if the job is accessible.
 * Checks in priority order: cooldown → rank gate → context restrictions.
 * Cooldown is NOT considered a lock — it is a separate state handled by the card.
 */
export function getLockReason(
  playerRole: FamilyRole | null,
  job: JobDefinition,
  jobState?: PlayerJobState
): LockReason | null {
  // Rank gate — primary lock
  if (!canStartJob(playerRole, job)) {
    const required = RANK_LABEL_DISPLAY[job.min_rank] ?? job.min_rank;
    return {
      code: 'RANK_TOO_LOW',
      label: `${required} Required`,
      explanation: `This operation requires ${required} rank or higher. Rise through the family to unlock it.`,
      temporary: false,
    };
  }

  // War context — only available during active family war
  if (job.war_context_only) {
    return {
      code: 'WAR_CONTEXT_ONLY',
      label: 'War Only',
      explanation: 'This operation is only authorized during an active family war. Stand by.',
      temporary: true,
    };
  }

  return null;
}

// ─────────────────────────────────────────────
// RISK PROFILE SYSTEM
// Aggregated risk display for cards.
// ─────────────────────────────────────────────

export type RiskLevel = 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface RiskProfile {
  /** Heat generated on success */
  heat: RiskLevel;
  /** Chance of arrest on failure */
  jail: RiskLevel;
  /** Crew viability — solo or needs backup */
  solo: boolean;
  /** True if job is hitman-eligible (high personal risk) */
  highProfile: boolean;
  /** Composite risk score 0–4 for color coding */
  composite: 0 | 1 | 2 | 3 | 4;
}

export function getRiskProfile(job: JobDefinition): RiskProfile {
  const jailRisk = jailRiskLabel(job.jail_chance_base);

  // Heat is correlated to jail risk and tier
  const heatScore =
    job.jail_chance_base <= 0.04 ? 0 :
    job.jail_chance_base <= 0.12 ? 1 :
    job.jail_chance_base <= 0.25 ? 2 :
    job.jail_chance_base <= 0.45 ? 3 : 4;

  const heatLevel: RiskLevel[] = ['VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'EXTREME'];
  const heat = heatLevel[heatScore] as RiskLevel;

  const jailScore =
    jailRisk === 'VERY_LOW' ? 0 :
    jailRisk === 'LOW'      ? 1 :
    jailRisk === 'MEDIUM'   ? 2 :
    jailRisk === 'HIGH'     ? 3 : 4;

  const composite = Math.max(heatScore, jailScore) as 0 | 1 | 2 | 3 | 4;

  return {
    heat,
    jail: jailRisk,
    solo: job.mode !== 'CREW',
    highProfile: job.hitman_eligible,
    composite,
  };
}

export const RISK_LEVEL_COLOR: Record<RiskLevel, string> = {
  VERY_LOW: '#4a9a4a',
  LOW:      '#6aaa4a',
  MEDIUM:   '#cc9900',
  HIGH:     '#cc5500',
  EXTREME:  '#cc3333',
};

export const RISK_LEVEL_LABEL: Record<RiskLevel, string> = {
  VERY_LOW: 'Minimal',
  LOW:      'Low',
  MEDIUM:   'Medium',
  HIGH:     'High',
  EXTREME:  'Critical',
};

// ─────────────────────────────────────────────
// COOLDOWN PROGRESS
// 0–1 float for arc/bar rendering.
// ─────────────────────────────────────────────

/** Returns 0 (just started) → 1 (fully ready). */
export function cooldownProgress(state: PlayerJobState, job: JobDefinition): number {
  const remaining = cooldownRemainingSeconds(state, job);
  if (remaining <= 0) return 1;
  return Math.max(0, 1 - remaining / job.cooldown_seconds);
}

/** True if cooldown is in final 20% — triggers visual urgency treatment */
export function isNearReady(state: PlayerJobState, job: JobDefinition): boolean {
  const progress = cooldownProgress(state, job);
  return progress >= 0.8 && progress < 1;
}

/** Formats the wall-clock "available at" time */
export function cooldownAvailableAt(state: PlayerJobState, job: JobDefinition): string {
  const last = state.last_completed_at ?? state.last_failed_at;
  if (!last) return '';
  const available = new Date(new Date(last).getTime() + job.cooldown_seconds * 1000);
  return available.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ═══════════════════════════════════════════════════════════
// SORT / FILTER / RECOMMENDATION ENGINE
// ═══════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// SORT
// ─────────────────────────────────────────────

export type SortKey =
  | 'RECOMMENDED'     // default — composite score: ready × payout × archetype fit × low risk
  | 'READY_FIRST'     // ready now → cooling down → locked; within group: by payout desc
  | 'PAYOUT_HIGH'     // scaled reward_band_max desc
  | 'RISK_LOW'        // jail_chance_base asc
  | 'COOLDOWN_SHORT'  // cooldown_seconds asc (ready jobs first)
  | 'XP_VALUE'        // tier desc (proxy for XP yield)
  | 'CATEGORY_AZ';    // category alphabetical

export interface SortOption {
  key: SortKey;
  label: string;
}

export const SORT_OPTIONS: SortOption[] = [
  { key: 'RECOMMENDED',    label: 'Recommended'     },
  { key: 'READY_FIRST',   label: 'Ready Now'        },
  { key: 'PAYOUT_HIGH',   label: 'Highest Payout'   },
  { key: 'RISK_LOW',      label: 'Lowest Risk'      },
  { key: 'COOLDOWN_SHORT',label: 'Shortest Cooldown' },
  { key: 'XP_VALUE',      label: 'Best Progression' },
  { key: 'CATEGORY_AZ',   label: 'Category A–Z'     },
];

function getJobReadyScore(
  job: JobDefinition,
  playerRole: FamilyRole | null,
  jobState: PlayerJobState | undefined
): number {
  if (!canStartJob(playerRole, job)) return 0; // locked
  if (jobState && isOnCooldown(jobState, job)) return 1; // cooling
  return 2; // ready
}

export function sortJobs(
  jobs: JobDefinition[],
  key: SortKey,
  playerRole: FamilyRole | null,
  jobStates: Record<string, PlayerJobState>,
  archetype?: string
): JobDefinition[] {
  const arr = [...jobs];
  switch (key) {
    case 'READY_FIRST':
      return arr.sort((a, b) => {
        const ra = getJobReadyScore(a, playerRole, jobStates[a.id]);
        const rb = getJobReadyScore(b, playerRole, jobStates[b.id]);
        if (rb !== ra) return rb - ra;
        return b.reward_band_max - a.reward_band_max;
      });

    case 'PAYOUT_HIGH':
      return arr.sort((a, b) => {
        const sa = getScaledRewardBand(a, playerRole);
        const sb = getScaledRewardBand(b, playerRole);
        return sb.max - sa.max;
      });

    case 'RISK_LOW':
      return arr.sort((a, b) => {
        // Ready jobs first, then by risk asc
        const ra = getJobReadyScore(a, playerRole, jobStates[a.id]);
        const rb = getJobReadyScore(b, playerRole, jobStates[b.id]);
        if (rb !== ra) return rb - ra;
        return a.jail_chance_base - b.jail_chance_base;
      });

    case 'COOLDOWN_SHORT':
      return arr.sort((a, b) => {
        const ra = getJobReadyScore(a, playerRole, jobStates[a.id]);
        const rb = getJobReadyScore(b, playerRole, jobStates[b.id]);
        if (rb !== ra) return rb - ra;
        const remA = jobStates[a.id] ? cooldownRemainingSeconds(jobStates[a.id], a) : 0;
        const remB = jobStates[b.id] ? cooldownRemainingSeconds(jobStates[b.id], b) : 0;
        return remA - remB;
      });

    case 'XP_VALUE':
      return arr.sort((a, b) => {
        const ra = getJobReadyScore(a, playerRole, jobStates[a.id]);
        const rb = getJobReadyScore(b, playerRole, jobStates[b.id]);
        if (rb !== ra) return rb - ra;
        return b.tier - a.tier;
      });

    case 'CATEGORY_AZ':
      return arr.sort((a, b) => a.category.localeCompare(b.category));

    case 'RECOMMENDED':
    default:
      return arr.sort((a, b) => {
        const scoreA = getRecommendScore(a, playerRole, jobStates[a.id], archetype);
        const scoreB = getRecommendScore(b, playerRole, jobStates[b.id], archetype);
        return scoreB - scoreA;
      });
  }
}

// ─────────────────────────────────────────────
// FILTER
// ─────────────────────────────────────────────

export type AvailabilityFilter = 'ALL' | 'READY' | 'COOLING' | 'LOCKED';
export type RiskFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface JobFilters {
  availability: AvailabilityFilter;
  risk: RiskFilter;
  category: string;        // 'ALL' or category name
  mode: string;            // 'ALL' | 'SOLO' | 'CREW' | 'SOLO_OR_CREW'
  archetype: string;       // 'ALL' or archetype name
  soloOnly: boolean;
}

export const DEFAULT_FILTERS: JobFilters = {
  availability: 'ALL',
  risk: 'ALL',
  category: 'ALL',
  mode: 'ALL',
  archetype: 'ALL',
  soloOnly: false,
};

export function countActiveFilters(f: JobFilters): number {
  let n = 0;
  if (f.availability !== 'ALL') n++;
  if (f.risk !== 'ALL') n++;
  if (f.category !== 'ALL') n++;
  if (f.mode !== 'ALL') n++;
  if (f.archetype !== 'ALL') n++;
  if (f.soloOnly) n++;
  return n;
}

export function applyFilters(
  jobs: JobDefinition[],
  filters: JobFilters,
  playerRole: FamilyRole | null,
  jobStates: Record<string, PlayerJobState>
): JobDefinition[] {
  return jobs.filter(job => {
    // Availability
    if (filters.availability !== 'ALL') {
      const canStart = canStartJob(playerRole, job);
      const onCD = jobStates[job.id] ? isOnCooldown(jobStates[job.id], job) : false;
      if (filters.availability === 'READY'   && (!canStart || onCD)) return false;
      if (filters.availability === 'COOLING' && (!onCD || !canStart)) return false;
      if (filters.availability === 'LOCKED'  && canStart) return false;
    }

    // Risk
    if (filters.risk !== 'ALL') {
      const risk = jailRiskLabel(job.jail_chance_base);
      if (filters.risk === 'LOW'    && !['VERY_LOW','LOW'].includes(risk)) return false;
      if (filters.risk === 'MEDIUM' && risk !== 'MEDIUM') return false;
      if (filters.risk === 'HIGH'   && !['HIGH','EXTREME'].includes(risk)) return false;
    }

    // Category
    if (filters.category !== 'ALL' && job.category !== filters.category) return false;

    // Mode
    if (filters.mode !== 'ALL' && job.mode !== filters.mode) return false;

    // Archetype fit
    if (filters.archetype !== 'ALL') {
      const fit = getArchetypeFit(job, filters.archetype);
      if (fit === 'NONE') return false;
    }

    // Solo only
    if (filters.soloOnly && job.mode === 'CREW') return false;

    return true;
  });
}

// ─────────────────────────────────────────────
// ARCHETYPE → CATEGORY FIT TABLE
// ─────────────────────────────────────────────

export type ArchetypeFitLevel = 'STRONG' | 'GOOD' | 'NEUTRAL' | 'NONE';

const ARCHETYPE_CATEGORY_FIT: Record<string, Record<string, ArchetypeFitLevel>> = {
  EARNER: {
    ECONOMY:   'STRONG', FENCING:    'STRONG', GAMBLING:   'STRONG',
    HUSTLE:    'GOOD',   CONTRABAND: 'GOOD',   LOGISTICS:  'GOOD',
    EXTORTION: 'NEUTRAL',CORRUPTION: 'NEUTRAL',INTEL:      'NEUTRAL',
    ENFORCEMENT:'NONE',  INFLUENCE:  'NEUTRAL',SABOTAGE:   'NONE', SPECIAL: 'NEUTRAL',
  },
  MUSCLE: {
    ENFORCEMENT:'STRONG',EXTORTION:  'STRONG', SABOTAGE:   'STRONG',
    CONTRABAND: 'GOOD',  HUSTLE:     'GOOD',   SPECIAL:    'GOOD',
    FENCING:    'NEUTRAL',GAMBLING:  'NEUTRAL',ECONOMY:    'NEUTRAL',
    LOGISTICS:  'NEUTRAL',INTEL:     'NEUTRAL',CORRUPTION: 'NEUTRAL',INFLUENCE: 'NEUTRAL',
  },
  SHOOTER: {
    ENFORCEMENT:'STRONG',SPECIAL:    'STRONG', SABOTAGE:   'STRONG',
    EXTORTION:  'GOOD',  CONTRABAND: 'GOOD',
    HUSTLE:     'NEUTRAL',FENCING:   'NEUTRAL',GAMBLING:   'NEUTRAL',
    ECONOMY:    'NEUTRAL',LOGISTICS: 'NEUTRAL',INTEL:      'NEUTRAL',CORRUPTION:'NEUTRAL',INFLUENCE:'NEUTRAL',
  },
  SCHEMER: {
    INTEL:      'STRONG',CORRUPTION: 'STRONG', INFLUENCE:  'STRONG',
    ECONOMY:    'GOOD',  GAMBLING:   'GOOD',   HUSTLE:     'GOOD',
    FENCING:    'NEUTRAL',LOGISTICS: 'NEUTRAL',EXTORTION:  'NEUTRAL',
    CONTRABAND: 'NEUTRAL',ENFORCEMENT:'NONE',  SABOTAGE:   'NONE', SPECIAL: 'NEUTRAL',
  },
  RACKETEER: {
    EXTORTION:  'STRONG',ECONOMY:    'STRONG', GAMBLING:   'STRONG',
    FENCING:    'GOOD',  CONTRABAND: 'GOOD',   LOGISTICS:  'GOOD',  HUSTLE: 'GOOD',
    ENFORCEMENT:'NEUTRAL',INTEL:     'NEUTRAL',CORRUPTION: 'NEUTRAL',
    INFLUENCE:  'NEUTRAL',SABOTAGE:  'NEUTRAL',SPECIAL:    'NEUTRAL',
  },
  RUNNER: {
    // Generalist — good at everything, strong at nothing specific
    ECONOMY: 'GOOD', FENCING: 'GOOD', GAMBLING: 'GOOD', HUSTLE: 'GOOD',
    LOGISTICS:'GOOD',EXTORTION:'GOOD',ENFORCEMENT:'NEUTRAL',INTEL:'NEUTRAL',
    INFLUENCE:'NEUTRAL',CONTRABAND:'NEUTRAL',CORRUPTION:'NEUTRAL',SABOTAGE:'NEUTRAL',SPECIAL:'NEUTRAL',
  },
  HITMAN: {
    SPECIAL:    'STRONG',ENFORCEMENT:'STRONG',
    SABOTAGE:   'GOOD',  EXTORTION:  'GOOD',
    FENCING:    'NEUTRAL',GAMBLING:  'NEUTRAL',ECONOMY:'NEUTRAL',HUSTLE:'NEUTRAL',
    LOGISTICS:  'NEUTRAL',INTEL:     'NEUTRAL',CORRUPTION:'NEUTRAL',INFLUENCE:'NEUTRAL',CONTRABAND:'NEUTRAL',
  },
};

export function getArchetypeFit(job: JobDefinition, archetype: string): ArchetypeFitLevel {
  const table = ARCHETYPE_CATEGORY_FIT[archetype];
  if (!table) return 'NEUTRAL';
  // Hitman-eligible jobs get a bonus for HITMAN archetype
  if (archetype === 'HITMAN' && job.hitman_eligible) return 'STRONG';
  return table[job.category] ?? 'NEUTRAL';
}

// ─────────────────────────────────────────────
// RECOMMENDATION ENGINE
// ─────────────────────────────────────────────

export interface JobRecommendation {
  job: JobDefinition;
  score: number;
  reasons: string[];   // 1-3 short reason strings
}

/**
 * Score 0–100 — higher = more recommended.
 * Factors: ready state, archetype fit, payout, risk, cooldown recency
 */
export function getRecommendScore(
  job: JobDefinition,
  playerRole: FamilyRole | null,
  jobState: PlayerJobState | undefined,
  archetype?: string
): number {
  if (!canStartJob(playerRole, job)) return 0;

  let score = 40; // base for unlocked jobs

  // Ready bonus
  const onCD = jobState ? isOnCooldown(jobState, job) : false;
  if (!onCD) score += 30;
  else {
    // Partial bonus for near-ready
    const prog = jobState ? cooldownProgress(jobState, job) : 0;
    score += Math.round(prog * 10);
  }

  // Archetype fit
  if (archetype) {
    const fit = getArchetypeFit(job, archetype);
    if (fit === 'STRONG')  score += 20;
    else if (fit === 'GOOD') score += 10;
    else if (fit === 'NONE') score -= 15;
  }

  // Payout: tier as proxy (1–5 → 0–10)
  score += Math.round(job.tier * 2);

  // Risk penalty (high risk = lower score for recommendation)
  const risk = jailRiskLabel(job.jail_chance_base);
  if (risk === 'VERY_LOW') score += 5;
  else if (risk === 'LOW')  score += 2;
  else if (risk === 'HIGH') score -= 5;
  else if (risk === 'EXTREME') score -= 12;

  return Math.max(0, Math.min(100, score));
}

/** Generates human-readable reason strings for a recommendation */
export function getRecommendReasons(
  job: JobDefinition,
  playerRole: FamilyRole | null,
  jobState: PlayerJobState | undefined,
  archetype?: string,
  playerHeat?: number
): string[] {
  const reasons: string[] = [];

  // Readiness
  const onCD = jobState ? isOnCooldown(jobState, job) : false;
  if (!onCD) {
    reasons.push('Ready now');
  } else if (jobState && isNearReady(jobState, job)) {
    reasons.push('Almost ready');
  }

  // Archetype fit
  if (archetype) {
    const fit = getArchetypeFit(job, archetype);
    if (fit === 'STRONG') {
      reasons.push(`Strong fit for ${archetype.charAt(0) + archetype.slice(1).toLowerCase()}`);
    } else if (fit === 'GOOD') {
      reasons.push(`Good fit for ${archetype.charAt(0) + archetype.slice(1).toLowerCase()}`);
    }
  }

  // Risk level
  const risk = jailRiskLabel(job.jail_chance_base);
  if (risk === 'VERY_LOW') reasons.push('Minimal arrest risk');
  else if (risk === 'LOW') reasons.push('Low heat risk');
  else if (risk === 'HIGH') reasons.push('High risk — use caution');
  else if (risk === 'EXTREME') reasons.push('Extreme risk');

  // Heat context (if player heat is high, recommend low-risk jobs)
  if (playerHeat !== undefined && playerHeat > 60 && job.jail_chance_base < 0.1) {
    reasons.push('Safe while heat is high');
  }

  // Payout tier
  const scaled = getScaledRewardBand(job, playerRole);
  if (scaled.max >= 50000) reasons.push('Strong payout');
  else if (scaled.max >= 10000) reasons.push('Good payout for your rank');

  // Progression
  if (job.tier >= 3) reasons.push('High progression value');
  else if (job.tier >= 2) reasons.push('Good progression value');

  // Trim to 3 most relevant
  return reasons.slice(0, 3);
}

/** Returns top N recommended jobs with scores and reasons */
export function getRecommendedJobs(
  jobs: JobDefinition[],
  playerRole: FamilyRole | null,
  jobStates: Record<string, PlayerJobState>,
  archetype?: string,
  playerHeat?: number,
  count = 4
): JobRecommendation[] {
  return jobs
    .filter(j => canStartJob(playerRole, j))
    .map(j => ({
      job: j,
      score: getRecommendScore(j, playerRole, jobStates[j.id], archetype),
      reasons: getRecommendReasons(j, playerRole, jobStates[j.id], archetype, playerHeat),
    }))
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

// ─────────────────────────────────────────────
// STATUS COUNTS — for the top summary bar
// ─────────────────────────────────────────────

export interface JobStatusCounts {
  ready:   number;
  cooling: number;
  locked:  number;
  total:   number;
}

export function getJobStatusCounts(
  jobs: JobDefinition[],
  playerRole: FamilyRole | null,
  jobStates: Record<string, PlayerJobState>
): JobStatusCounts {
  let ready = 0, cooling = 0, locked = 0;
  for (const job of jobs) {
    if (!canStartJob(playerRole, job)) { locked++; continue; }
    const s = jobStates[job.id];
    if (s && isOnCooldown(s, job)) { cooling++; }
    else { ready++; }
  }
  return { ready, cooling, locked, total: jobs.length };
}
