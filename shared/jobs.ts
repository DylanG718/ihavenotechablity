// ═══════════════════════════════════════════════════════════════════
// MAFIALIFE — Jobs Data Model
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
