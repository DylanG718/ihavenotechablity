/**
 * jail.ts — Prison system schema for regular players.
 *
 * Separate from the hitman-only Blacksite (The Box).
 * Regular jail applies to all non-hitman archetypes on failed jobs.
 *
 * CORE DESIGN:
 *   Arrest chance = f(job tier, player rank, family heat)
 *   Sentence length = f(job tier, heat at time of arrest)
 *   In prison: reduced action set, chat + kites still available
 *   Family can run outside "bail missions" to reduce sentence
 *
 * CANON LOCKED:
 *   - Hitmen go to Blacksite (The Box) — see shared/schema.ts BlacksiteState
 *   - Regular players go to regular jail (this file)
 *   - Both use the same /jail route, differentiated by player archetype
 */

import type { MissionTier, FamilyRole } from './schema';

// ─────────────────────────────────────────────
// ARREST CHANCE FORMULA
// ─────────────────────────────────────────────

/**
 * Base arrest chance by job tier (before modifiers).
 * Higher tier = more risky = higher base chance.
 */
export const BASE_ARREST_CHANCE: Record<MissionTier, number> = {
  STARTER:  0.10,   // 10% base on a starter job fail
  STANDARD: 0.20,   // 20%
  ADVANCED: 0.35,   // 35%
  ELITE:    0.55,   // 55%
};

/**
 * Rank modifier — higher rank = more street savvy = lower arrest chance.
 * Subtracted from base chance.
 */
export const RANK_ARREST_REDUCTION: Record<FamilyRole | 'UNAFFILIATED', number> = {
  BOSS:        0.25,   // Boss: −25% arrest chance (knows how to insulate)
  UNDERBOSS:   0.20,
  CONSIGLIERE: 0.18,
  CAPO:        0.15,
  SOLDIER:     0.08,
  ASSOCIATE:   0.04,
  RECRUIT:     0.00,   // No reduction — rookie mistakes
  UNAFFILIATED: -0.05, // +5% penalty for no family backing
};

/**
 * Heat multiplier — family heat 0-100 increases arrest chance.
 * Every 10 points of heat above 30 adds 2% to arrest chance.
 */
export function heatArrестBonus(familyHeat: number): number {
  const above30 = Math.max(0, familyHeat - 30);
  return (above30 / 10) * 0.02;   // e.g. heat 80 → +10%
}

/**
 * Final arrest chance computation.
 * Returns 0–1 probability.
 */
export function computeArrestChance(params: {
  tier: MissionTier;
  role: FamilyRole | 'UNAFFILIATED';
  familyHeat: number;
}): number {
  const base    = BASE_ARREST_CHANCE[params.tier];
  const rankMod = RANK_ARREST_REDUCTION[params.role] ?? 0;
  const heatMod = heatArrестBonus(params.familyHeat);
  return Math.max(0.02, Math.min(0.95, base - rankMod + heatMod));
}

// ─────────────────────────────────────────────
// SENTENCE LENGTH
// ─────────────────────────────────────────────

/**
 * Base sentence in hours by job tier.
 */
export const BASE_SENTENCE_HOURS: Record<MissionTier, number> = {
  STARTER:  2,
  STANDARD: 6,
  ADVANCED: 12,
  ELITE:    24,
};

/**
 * Heat multiplier on sentence length.
 * High heat = DA is aggressive = longer sentence.
 */
export function computeSentenceHours(tier: MissionTier, familyHeat: number): number {
  const base = BASE_SENTENCE_HOURS[tier];
  const heatMultiplier = 1 + (familyHeat / 100) * 1.5; // up to 2.5× at max heat
  return Math.round(base * heatMultiplier);
}

// ─────────────────────────────────────────────
// JAIL RECORD (one per incarceration)
// ─────────────────────────────────────────────

export type JailTier =
  | 'COUNTY'       // Starter/Standard jobs — lighter sentence, more actions
  | 'STATE'        // Advanced jobs — moderate
  | 'FEDERAL';     // Elite jobs or repeat offender — heavy, fewer actions

export function jailTierFromMissionTier(t: MissionTier): JailTier {
  if (t === 'STARTER' || t === 'STANDARD') return 'COUNTY';
  if (t === 'ADVANCED') return 'STATE';
  return 'FEDERAL';
}

export type JailStatus =
  | 'PROCESSING'      // Just booked, 1h before actions available
  | 'SERVING'         // Active sentence — actions available
  | 'RELEASE_ELIGIBLE'// Sentence over, can walk or wait
  | 'RELEASED';       // Out — record kept for history

export interface JailRecord {
  id: string;
  player_id: string;
  family_id: string | null;
  tier: JailTier;
  status: JailStatus;
  /** Why they got arrested */
  arrested_for: string;        // e.g. "Failed ADVANCED heist: Pier 7 Job"
  mission_tier: MissionTier;
  /** Wall-clock sentence */
  arrested_at: string;
  sentence_ends_at: string;
  actual_released_at: string | null;
  /** Heat at time of arrest */
  heat_at_arrest: number;
  /** Sentence modifications from actions */
  sentence_delta_hours: number;  // Negative = reduced, positive = extended
  /** Times they've tried to bribe/lawyer (rate-limited) */
  bribe_attempts: number;
  lawyer_attempts: number;
  /** Bail missions status — family running to help */
  bail_mission_active: boolean;
  bail_mission_progress: number; // 0-100
}

// ─────────────────────────────────────────────
// JAIL ACTIONS
// ─────────────────────────────────────────────

export type JailActionType =
  | 'LAY_LOW'       // Reduce heat, no cash, small rep gain — always available
  | 'PRISON_JOBS'   // Earn small cash, reduce sentence by 1h — available in COUNTY/STATE
  | 'BRIBE_GUARD'   // Immediate early release attempt, high cost, rate-limited
  | 'HIRE_LAWYER'   // Sentence reduction, moderate cost, rate-limited
  | 'REQUEST_BAIL'; // Asks family to run bail mission — one active at a time

export interface JailActionDef {
  id: JailActionType;
  label: string;
  description: string;
  cooldown_hours: number;
  /** null = free */
  cash_cost: number | null;
  /** Which jail tiers this is available in */
  available_tiers: JailTier[];
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export const JAIL_ACTIONS: JailActionDef[] = [
  {
    id: 'LAY_LOW',
    label: 'Lay Low',
    description: 'Keep your head down. Heat −5, small rep gain. No cost. Does not reduce sentence.',
    cooldown_hours: 4,
    cash_cost: null,
    available_tiers: ['COUNTY', 'STATE', 'FEDERAL'],
    risk: 'LOW',
  },
  {
    id: 'PRISON_JOBS',
    label: 'Prison Work',
    description: 'Take on assigned work. Earn $2,000–$8,000 and reduce sentence by 1 hour.',
    cooldown_hours: 6,
    cash_cost: null,
    available_tiers: ['COUNTY', 'STATE'],
    risk: 'LOW',
  },
  {
    id: 'BRIBE_GUARD',
    label: 'Bribe a Guard',
    description: 'Pay $40,000 for early release. 60% success rate. Heat +10 on success. Limit: 2 attempts.',
    cooldown_hours: 0,
    cash_cost: 40000,
    available_tiers: ['COUNTY', 'STATE'],
    risk: 'HIGH',
  },
  {
    id: 'HIRE_LAWYER',
    label: 'Hire a Lawyer',
    description: 'Pay $25,000 to negotiate. Sentence −3 to −6 hours. Works on all tiers. Limit: 3 uses.',
    cooldown_hours: 12,
    cash_cost: 25000,
    available_tiers: ['COUNTY', 'STATE', 'FEDERAL'],
    risk: 'MEDIUM',
  },
  {
    id: 'REQUEST_BAIL',
    label: 'Request Family Bail',
    description: 'Signal your family to run a bail mission outside. One active at a time. Sends a kite automatically.',
    cooldown_hours: 0,
    cash_cost: null,
    available_tiers: ['COUNTY', 'STATE', 'FEDERAL'],
    risk: 'LOW',
  },
];

export interface JailActionResult {
  success: boolean;
  action: JailActionType;
  sentence_delta_hours: number;  // negative = reduced
  heat_delta: number;
  cash_gained: number;           // negative = spent
  rep_delta: number;
  notes: string;
  released: boolean;             // true if this action causes immediate release
}

// ─────────────────────────────────────────────
// KITES (in-prison messages)
// ─────────────────────────────────────────────

/**
 * A "kite" is prison slang for a smuggled note.
 * Jailed players send kites to their family — family replies normally.
 */
export type KiteStatus = 'SENT' | 'DELIVERED' | 'READ' | 'REPLIED';

export interface Kite {
  id: string;
  /** Who wrote it */
  from_player_id: string;
  from_player_alias: string;
  /** Recipient: a specific player or 'FAMILY_LEADERSHIP' broadcast */
  to_player_id: string | 'FAMILY_LEADERSHIP';
  to_player_alias: string;
  family_id: string;
  subject: string;
  body: string;
  status: KiteStatus;
  sent_at: string;
  read_at: string | null;
  reply_body: string | null;
  reply_at: string | null;
}

// ─────────────────────────────────────────────
// JAIL CHAT CHANNELS
// ─────────────────────────────────────────────

export type JailChatChannel =
  | 'GLOBAL_JAIL'    // All jailed players across all families
  | 'FAMILY_BLOCK';  // Jailed members of the same family only

export interface JailChatMessage {
  id: string;
  channel: JailChatChannel;
  player_id: string;
  player_alias: string;
  family_name: string | null;
  jail_tier: JailTier;
  body: string;
  sent_at: string;
  /** Inline reply thread */
  reply_to_id: string | null;
}

// ─────────────────────────────────────────────
// BAIL MISSION (run by free family members)
// ─────────────────────────────────────────────

export interface BailMission {
  id: string;
  jail_record_id: string;
  jailed_player_id: string;
  family_id: string;
  status: 'OPEN' | 'ACTIVE' | 'SUCCESS' | 'FAILED';
  /** Sentence reduction on success */
  sentence_reduction_hours: number;
  progress: number;   // 0–100
  created_at: string;
  resolved_at: string | null;
}
