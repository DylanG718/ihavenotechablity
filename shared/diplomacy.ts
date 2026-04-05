/**
 * diplomacy.ts — All diplomacy, sitdown, status effect, and political tag types.
 *
 * CORE CANON — never change without updating diplomacyEngine.ts:
 *   Relationship states: NEUTRAL → NAP → ALLIED, NEUTRAL → AT_WAR → NEUTRAL/NAP
 *   Sitdown: max 3 proposal rounds, timed, Don-only commit
 *   Snub debuffs: scoped to proposal type (ALLIANCE / PEACE / NAP)
 *   Political tags: derived from active effects + recent history
 */

// ─────────────────────────────────────────────
// DIPLOMATIC RELATIONSHIP STATES
// ─────────────────────────────────────────────

export type DiplomaticState =
  | 'NEUTRAL'        // Default — no formal agreement
  | 'NAP'            // Non-Aggression Pact — no hostile jobs between them
  | 'ALLIED'         // Full alliance — joint missions enabled
  | 'AT_WAR';        // Active war — war jobs enabled, buffs/debuffs active

/** All valid state transitions (enforced in diplomacyEngine) */
export const VALID_TRANSITIONS: Record<DiplomaticState, DiplomaticState[]> = {
  NEUTRAL:  ['NAP', 'AT_WAR'],
  NAP:      ['NEUTRAL', 'ALLIED'],
  ALLIED:   ['NAP'],
  AT_WAR:   ['NEUTRAL', 'NAP'],
};

/** Minimum hours in current state before transition is allowed */
export const MIN_STATE_HOURS: Record<DiplomaticState, number> = {
  NEUTRAL:  0,    // Can declare war or propose NAP immediately
  NAP:      24,   // Must hold NAP for 24h before escalating/de-escalating
  ALLIED:   48,   // Must be allied 48h before breaking to NAP
  AT_WAR:   6,    // Can offer peace after 6h of war
};

/** Influence cost to initiate each transition (paid by initiating family) */
export const TRANSITION_INFLUENCE_COST: Record<string, number> = {
  'NEUTRAL→NAP':    50,
  'NEUTRAL→AT_WAR': 100,
  'NAP→NEUTRAL':    25,
  'NAP→ALLIED':     150,
  'ALLIED→NAP':     75,
  'AT_WAR→NEUTRAL': 50,
  'AT_WAR→NAP':     75,
};

// ─────────────────────────────────────────────
// DIPLOMATIC RELATIONSHIP RECORD
// ─────────────────────────────────────────────

export interface DiplomaticRelation {
  id: string;
  family_a_id: string;    // Always lexicographically first for dedup
  family_b_id: string;
  state: DiplomaticState;
  initiated_by: string;   // family_id that last changed the state
  state_changed_at: string; // ISO timestamp
  /** ISO timestamp when the next change is allowed (based on MIN_STATE_HOURS) */
  next_change_allowed_at: string;
  influence_spent: number; // running total
}

// ─────────────────────────────────────────────
// SITDOWN
// ─────────────────────────────────────────────

export type SitdownState =
  | 'PENDING'    // Initiated, waiting for other Don to accept the room
  | 'ACTIVE'     // Both Dons present — timer running
  | 'AGREED'     // Both accepted a proposal — state change applied
  | 'DECLINED'   // A Don declined — no state change
  | 'EXPIRED'    // Session timer ran out — treated as snub by receiving side
  | 'SNUBBED';   // Receiving family never joined within 24h window

export type SitdownProposalType =
  | 'NAP'        // Propose Non-Aggression Pact
  | 'ALLIANCE'   // Propose full Alliance
  | 'PEACE'      // Propose ending war (→ NEUTRAL or NAP)
  | 'WAR'        // Declare war
  | 'BREAK_NAP'  // Dissolve existing NAP back to NEUTRAL
  | 'BREAK_ALLIANCE'; // Dissolve alliance back to NAP

export type SitdownRole = 'DON' | 'CONSIGLIERE' | 'UNDERBOSS';

export interface SitdownParticipant {
  player_id: string;
  family_id: string;
  role: SitdownRole;
  joined_at: string | null;
}

export interface SitdownProposal {
  round: 1 | 2 | 3;    // Max 3 rounds
  proposal_type: SitdownProposalType;
  proposed_by_family: string;
  proposed_at: string;
  terms_text: string;   // Human-readable summary
  /** Structured optional clauses for future extension */
  clauses: {
    tribute_amount?: number;       // $ tribute per round
    joint_jobs_enabled?: boolean;  // Allow joint ops
    duration_hours?: number;       // How long the agreement lasts
  };
  /** null until responded to */
  response: 'ACCEPTED' | 'DECLINED' | 'COUNTERED' | null;
  responded_at: string | null;
}

export interface Sitdown {
  id: string;
  family_a_id: string;   // Initiating family
  family_b_id: string;   // Receiving family
  state: SitdownState;
  proposal_type: SitdownProposalType; // Primary intent
  initiated_by: string;  // player_id of Don who started it
  /** ISO timestamp — receiving family must join within 24h */
  invite_expires_at: string;
  /** ISO timestamp — session starts when both Dons join */
  session_started_at: string | null;
  /** ISO timestamp — session expires (10 min from session start) */
  session_expires_at: string | null;
  participants: SitdownParticipant[];
  proposals: SitdownProposal[];
  /** Set on AGREED to record which proposal was accepted */
  agreed_proposal_round: number | null;
  /** Snub info — who was supposed to act and didn't */
  snubbed_by_family: string | null;
  created_at: string;
  resolved_at: string | null;
}

// ─────────────────────────────────────────────
// STATUS EFFECTS (timed debuffs/buffs on families)
// ─────────────────────────────────────────────

export type StatusEffectType =
  // SNUB debuffs
  | 'SNUBBED_ALLIANCE_DEBUFF'   // B snubbed A's alliance — income/influence penalty on B
  | 'SNUBBED_PEACE_DEBUFF'      // B snubbed A's peace — defensive penalty on B vs A
  | 'SNUBBED_NAP_DEBUFF'        // B snubbed A's NAP — influence gain penalty on B
  // SNUB buffs (on the snubbed family A)
  | 'PEACE_SNUB_OFFENSIVE_BUFF' // A gets offensive buff vs B after B snubs peace
  | 'NAP_SNUB_RETALIATION_DISCOUNT' // A gets war contract cost reduction vs B
  // War effects
  | 'WAR_WEARINESS'             // Scaling penalty for prolonged war
  | 'ALLIANCE_BONUS';           // Passive bonus while allied

export interface FamilyStatusEffect {
  id: string;
  family_id: string;             // Family this effect applies to
  effect_type: StatusEffectType;
  /** For targeted effects: which family is this scoped to */
  target_family_id: string | null;
  /** Human-readable description for UI */
  description: string;
  /** Effect magnitudes */
  modifiers: {
    cash_income_pct?: number;      // e.g. -0.15 = -15% income
    influence_gain_pct?: number;   // e.g. -0.20 = -20% influence gain
    alliance_cost_pct?: number;    // e.g. +0.25 = +25% cost to form alliances
    attack_success_pct?: number;   // e.g. +0.20 = +20% attack success vs target
    defense_pct?: number;          // e.g. -0.10 = -10% defense vs attacker
    contract_cost_pct?: number;    // e.g. -0.25 = -25% war contract cost vs target
  };
  /** When the effect expires */
  expires_at: string;
  created_at: string;
  /** Which sitdown triggered this */
  source_sitdown_id: string | null;
}

// ─────────────────────────────────────────────
// POLITICAL TAGS (derived, computed from effects + history)
// ─────────────────────────────────────────────

export type PoliticalTagId =
  | 'NEUTRAL'                  // No active ties or recent events
  | 'HONORED_ALLY'             // Maintained alliances, responded to sitdowns
  | 'RELIABLE_NEGOTIATOR'      // Responds, rarely snubs
  | 'SNUBBED_ALLIANCE'         // Under alliance-snub debuff
  | 'IGNORED_PEACE_OFFER'      // Under peace-snub debuff (scoped to target)
  | 'POLITICAL_INSTABILITY'    // Rapid alliance flips or frequent betrayals
  | 'ISOLATED'                 // No allies, no NAPs, at war with multiple
  | 'WAR_MONGER'               // Declared war without prior diplomacy attempts
  | 'PEACEMAKER'               // Ended wars, proposed NAPs
  | 'BACKSTABBER';             // Broke alliance or NAP unexpectedly

export interface PoliticalTag {
  id: PoliticalTagId;
  label: string;
  description: string;         // One-line tooltip explanation
  /** null = permanent (positive tags); set = expires with debuff */
  expires_at: string | null;
  /** Which family this tag is scoped to (for targeted tags like IGNORED_PEACE_OFFER) */
  target_family_name?: string;
  is_negative: boolean;
}

// ─────────────────────────────────────────────
// EXTERNAL INVITE TRACKER (anti-farming)
// ─────────────────────────────────────────────

/** Per-player tracking of invited jobs completed in rolling 12h windows */
export interface InviteTracker {
  player_id: string;
  /** Timestamps of each invited job completion in the last 12h */
  completions_12h: string[];    // ISO timestamps, auto-pruned
  /** How many invited jobs completed this 12h window */
  count_12h: number;
  /** Current reward multiplier (1.0, 0.5, 0.25, 0.1) */
  reward_multiplier: number;
}

/** Full reward above this count in a 12h window → rewards decay */
export const INVITE_CAP_FULL_REWARD = 3;    // First 3 get 100%
export const INVITE_CAP_HALF_REWARD = 6;    // 4–6 get 50%
export const INVITE_CAP_QUARTER_REWARD = 9; // 7–9 get 25%
export const INVITE_CAP_FLOOR = 0.1;        // 10+ get 10% (floor)

export function computeInviteMultiplier(count: number): number {
  if (count <= INVITE_CAP_FULL_REWARD)    return 1.0;
  if (count <= INVITE_CAP_HALF_REWARD)    return 0.5;
  if (count <= INVITE_CAP_QUARTER_REWARD) return 0.25;
  return INVITE_CAP_FLOOR;
}

// ─────────────────────────────────────────────
// INTER-FAMILY JOB ACCESS RULES
// ─────────────────────────────────────────────

/** Which job/mission types are gated by diplomatic state */
export type DiplomaticJobGate =
  | 'JOINT_MISSION'       // Requires ALLIED
  | 'WAR_SABOTAGE'        // Requires AT_WAR
  | 'WAR_CONTRACT'        // Requires AT_WAR
  | 'TURF_BATTLE'         // Requires AT_WAR
  | 'NEUTRAL_TERRITORY'   // Available at NAP or NEUTRAL
  | 'INTEL_SHARE';        // Available when ALLIED

export const JOB_GATE_REQUIREMENTS: Record<DiplomaticJobGate, DiplomaticState[]> = {
  JOINT_MISSION:     ['ALLIED'],
  WAR_SABOTAGE:      ['AT_WAR'],
  WAR_CONTRACT:      ['AT_WAR'],
  TURF_BATTLE:       ['AT_WAR'],
  NEUTRAL_TERRITORY: ['NEUTRAL', 'NAP'],
  INTEL_SHARE:       ['ALLIED'],
};

export function isJobAvailable(gate: DiplomaticJobGate, state: DiplomaticState): boolean {
  return JOB_GATE_REQUIREMENTS[gate].includes(state);
}
