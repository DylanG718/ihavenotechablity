// ═══════════════════════════════════════════════
// THE LAST FIRM — Canonical Schema
// Aligned to spec object v1.0.
// All enum values match spec string identifiers exactly where specified.
// Extended values (e.g. additional contract states) are clearly marked.
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// GAME CONSTANTS — LOCKED CANON
// ─────────────────────────────────────────────

/** Spec: failure_logic.on_failed_traced.retaliation_window_days */
export const RETALIATION_WINDOW_DAYS = 7;

/** Spec: failure_logic.on_failed_traced.economy_effect.target_family_receives_total_compensation_multiple */
export const BLOWBACK_COMPENSATION_MULTIPLE = 2.0;

// ─────────────────────────────────────────────
// ARCHETYPES — 7 canonical types
// Note: CONSIGLIERE is a FamilyRole only, NOT an archetype.
// Note: BOSS removed — Boss is a family rank, not a playstyle.
//       RUNNER added as beginner-friendly generalist archetype.
// Migration: existing BOSS archetype players → RUNNER
// ─────────────────────────────────────────────

export type Archetype =
  | 'RUNNER'      // generalist / jack-of-all-trades (beginner-friendly)
  | 'EARNER'
  | 'MUSCLE'
  | 'SHOOTER'
  | 'SCHEMER'
  | 'RACKETEER'
  | 'HITMAN';

// ─────────────────────────────────────────────
// AFFILIATIONS — LOCKED CANON
// Spec: affiliations.states
// ─────────────────────────────────────────────

export type Affiliation =
  | 'UNAFFILIATED'   // no family, no hitman status
  | 'RECRUIT'        // probationary family member
  | 'ASSOCIATE'      // junior full member (spec: associate)
  | 'MEMBER'         // full member / Soldier
  | 'LEADERSHIP'     // Capo / Underboss / Consigliere / Boss
  | 'SOLO_HITMAN';   // never joins families

// Spec: affiliations.family_roles
export type FamilyRole =
  | 'BOSS'
  | 'UNDERBOSS'
  | 'CONSIGLIERE'   // family role only — NOT an archetype
  | 'CAPO'
  | 'SOLDIER'
  | 'ASSOCIATE'
  | 'RECRUIT';

// ─────────────────────────────────────────────
// CONTRACT STATES — aligned to spec
// Spec: hitman_system.contract_board.status_values
// Extended: DRAFT, EXPIRED, CANCELLED — operational states not in spec but needed
// ─────────────────────────────────────────────

export type ContractState =
  | 'POSTED'               // spec: posted (was OPEN)
  | 'ACCEPTED'             // spec: accepted — hitman has taken the job
  | 'IN_PROGRESS'          // spec: in_progress — active execution phases
  | 'SUCCESS_CLEAN'        // spec: success_clean (was COMPLETED_CLEAN)
  | 'SUCCESS_MESSY'        // spec: success_messy (was COMPLETED_MESSY)
  | 'FAILED_UNTRACED'      // spec: failed_untraced (was FAILED_CLEAN)
  | 'FAILED_TRACED'        // spec: failed_traced ✓ unchanged
  | 'CATASTROPHIC_BLOWBACK'// spec: catastrophic_blowback (was FAILED_CATASTROPHIC)
  | 'DRAFT'                // extended: not yet posted
  | 'EXPIRED'              // extended: no hitman accepted before deadline
  | 'CANCELLED';           // extended: hiring family pulled it

export type ContractOutcome =
  | 'SUCCESS_CLEAN'
  | 'SUCCESS_MESSY'
  | 'FAILED_UNTRACED'
  | 'FAILED_TRACED'
  | 'CATASTROPHIC_BLOWBACK';

// ─────────────────────────────────────────────
// HITMAN AVAILABILITY / PRISON STATES — LOCKED CANON
// Spec: hitman_system.prison.states
// ─────────────────────────────────────────────

export type HitmanPrisonState =
  | 'FREE'          // spec: free
  | 'WATCHED'       // spec: watched — higher trace risk
  | 'BURNED'        // spec: burned — too many failures/exposure
  | 'IN_PRISON';    // spec: in_prison — in The Box

// Extended availability (superset of prison states)
export type HitmanAvailability =
  | 'FREE'
  | 'ON_CONTRACT'   // extended: actively working a contract
  | 'WATCHED'
  | 'BURNED'
  | 'IN_PRISON'
  | 'FREE_REBUILT'; // extended: released, reputation rebuilding

// The Box (hitman-only prison) sub-states
export type BlacksiteState =
  | 'BLACKSITE_INTAKE'
  | 'BLACKSITE_CONFINED'
  | 'BLACKSITE_MAX_SECURITY'
  | 'BLACKSITE_RELEASE_ELIGIBLE';

// ─────────────────────────────────────────────
// HITMAN SPECIALIST SLOT EFFECTS — LOCKED CANON
// Spec: missions_and_heists.family_missions.hitman_specialist_slot.effects_examples
// ─────────────────────────────────────────────

export type HitmanSlotEffect =
  | 'REDUCED_DETECTION_RISK'        // spec: reduced_detection_risk
  | 'GUARD_CAPTAIN_REMOVED'         // spec: guard_captain_removed
  | 'HIGHER_ESCAPE_SUCCESS_CHANCE'  // spec: higher_escape_success_chance
  | 'REDUCED_EVIDENCE_LEFT_BEHIND'  // spec: reduced_evidence_left_behind
  | 'ONE_RIVAL_DEFENDER_DISABLED'   // spec: one_rival_defender_disabled
  | 'BETTER_LOOT_RETENTION';        // spec: better_loot_retention

export const HITMAN_SLOT_EFFECT_LABELS: Record<HitmanSlotEffect, string> = {
  REDUCED_DETECTION_RISK:       'Silent Entry — Reduced detection risk',
  GUARD_CAPTAIN_REMOVED:        'Target Pin — Guard captain removed before approach',
  HIGHER_ESCAPE_SUCCESS_CHANCE: 'Ghost Exit — Higher escape success chance',
  REDUCED_EVIDENCE_LEFT_BEHIND: 'Cleanup — Less evidence left behind',
  ONE_RIVAL_DEFENDER_DISABLED:  'Overwatch — One rival defender disabled',
  BETTER_LOOT_RETENTION:        'Witness Control — Better loot retention, lower repercussions',
};

// ─────────────────────────────────────────────
// HITMAN SLOT (mission specialist)
// ─────────────────────────────────────────────

export type HitmanSlotState = 'OPEN' | 'ACCEPTED' | 'FILLED' | 'UNUSED';

export interface HitmanSlot {
  effect: HitmanSlotEffect;
  filled_by: string | null;
  price_offered: number;
  required: false;          // LOCKED CANON: always optional
  state: HitmanSlotState;
  bonus_description: string; // human-readable bonus summary
}

// ─────────────────────────────────────────────
// DOWNTIME ACTIVITIES — aligned to spec
// Spec: hitman_downtime.activities[].id
// ─────────────────────────────────────────────

export type DowntimeActivityType =
  | 'SURVEILLANCE'       // spec: surveillance
  | 'CLEANUP'            // spec: cleanup
  | 'SIDE_MERCENARY'     // spec: side_mercenary (was MERCENARY)
  | 'TRAINING'           // spec: training
  | 'INFORMANT_NETWORK'  // spec: informant_network (was INFORMANT)
  | 'SAFEHOUSE';         // spec: safehouse

// ─────────────────────────────────────────────
// LEADERBOARD TYPES — aligned to spec
// Spec: hitman_system.leaderboard.leaderboards
// ─────────────────────────────────────────────

export type LeaderboardId =
  | 'ROUND_TOP_HITMEN'   // spec: round_top_hitmen
  | 'ALL_TIME_LEGENDS'   // spec: all_time_legends
  | 'CLEAN_OPERATORS'    // spec: clean_operators
  | 'HIGHEST_PAID';      // spec: highest_paid

export const LEADERBOARD_LABELS: Record<LeaderboardId, string> = {
  ROUND_TOP_HITMEN: 'Top Hitmen — This Round',
  ALL_TIME_LEGENDS: 'All-Time Legends',
  CLEAN_OPERATORS:  'Cleanest Operators',
  HIGHEST_PAID:     'Highest Paid',
};

// Spec: hitman_system.leaderboard.ranking_metrics
export interface HitmanLeaderboardEntry {
  player_id: string;
  alias: string;
  rep_tier: RepTier;
  availability: HitmanAvailability;
  // Spec-named metrics:
  contracts_completed: number;          // spec: contracts_completed
  weighted_contract_difficulty: number; // spec: weighted_contract_difficulty
  success_rate: number;                 // spec: success_rate
  clean_success_ratio: number;          // spec: clean_success_ratio
  streak_score: number;                 // spec: streak_score
  high_value_target_count: number;      // spec: high_value_target_count
  low_trace_rate_score: number;         // spec: low_trace_rate_score
  // Composite
  hitman_score: number;
  // Display extras
  recent_form: ContractOutcome[];
  price_min: number;
  price_max: number;
  avg_payout: number;
  blacksite_state: BlacksiteState | null;
}

// ─────────────────────────────────────────────
// PLAYER STATS — 11 canonical (LOCKED CANON)
// Spec: stats.primary
// ─────────────────────────────────────────────

export interface PlayerStats {
  // Spec: stats.primary (all 11)
  respect: number;
  intimidation: number;
  strength: number;
  charisma: number;
  intelligence: number;
  clout: number;
  luck: number;
  leadership: number;
  suspicion: number;
  business: number;
  accuracy: number;
  // Derived/secondary (not in spec primary list but operationally required)
  cash: number;
  stash: number;
  heat: number;    // current law exposure level 0-100
  hp: number;      // health points 0-100
}

// ─────────────────────────────────────────────
// PLAYER
// ─────────────────────────────────────────────

export type PlayerStatus =
  | 'ACTIVE' | 'IN_JAIL' | 'IN_BLACKSITE' | 'DEAD' | 'RETIRED' | 'SUSPENDED';

export type DeathState = 'ALIVE' | 'DEAD_ONCE' | 'PERMANENTLY_DEAD';

export interface Player {
  id: string;
  username: string;
  alias: string;
  archetype: Archetype;
  affiliation: Affiliation;
  family_id: string | null;
  family_role: FamilyRole | null;
  crew_id: string | null;
  crew_role: 'LEADER' | 'MEMBER' | null;
  player_status: PlayerStatus;
  death_state: DeathState;
  stats: PlayerStats;
  blacksite_state: BlacksiteState | null;
  created_at: string;
}

// ─────────────────────────────────────────────
// FAMILY
// ─────────────────────────────────────────────

export type FamilyStatus = 'ACTIVE' | 'AT_WAR' | 'WEAKENED' | 'DISSOLVED';

export interface FamilyMember {
  player_id: string;
  family_id: string;
  role: FamilyRole;
  affiliation: Affiliation;
  joined_at: string;
  promoted_at: string | null;
  invited_by: string;
  missions_completed: number;
  money_earned: number;
}

// ─────────────────────────────────────────────
// FAMILY LIFECYCLE STATES
// ─────────────────────────────────────────────

/** Bootstrap state: NEW = within 10-day window; STABLE = milestones met; VULNERABLE = expired without meeting milestones */
export type FamilyBootstrapState = 'NEW' | 'STABLE' | 'VULNERABLE';

export interface Family {
  id: string;
  name: string;
  motto: string | null;
  boss_id: string;          // ID of the Don / founder
  treasury: number;         // current cash balance (snapshot; full ledger in treasury_transactions)
  power_score: number;
  territory: string[];
  status: FamilyStatus;
  members: FamilyMember[];
  underboss_ids: string[];
  consigliere_ids: string[];
  prestige: number;
  crew_ids: string[];
  // ── Lifecycle / Protection fields (new) ──────────────────────
  created_at: string;                   // ISO8601 timestamp
  protection_expires_at: string | null; // null after protection expires or waived
  bootstrap_state: FamilyBootstrapState;
  // ── Treasury config (new) ────────────────────────────
  tax_rate_pct: number;     // 0–50: % of member job earnings deposited to treasury automatically
  kickup_rate_pct: number;  // 0–30: % of crew earnings paid to underboss/boss as tribute
}

// ─────────────────────────────────────────────
// TREASURY LEDGER
// Full audit-trail for all treasury movements
// ─────────────────────────────────────────────

export type TreasuryTxType =
  | 'BOOTSTRAP_DEPOSIT'  // initial seed on family creation
  | 'JOB_TAX'            // automatic % cut from member job earnings
  | 'KICKUP'             // tribute payment from crew to Don
  | 'MEMBER_DEPOSIT'     // voluntary deposit by a member
  | 'DON_DEPOSIT'        // deposit by Don/Underboss
  | 'DON_WITHDRAWAL'     // withdrawal by authorized leadership
  | 'ITEM_PURCHASE'      // family bought an item from market
  | 'ITEM_ISSUED'        // item transferred to member inventory (valued at cost)
  | 'ITEM_RETURNED'      // member returned item, credited back
  | 'MISSION_REWARD'     // mission payout deposited
  | 'WAR_REPARATION'     // compensation received/paid
  | 'TURF_INCOME'        // passive turf income
  | 'ADMIN_ADJUSTMENT';  // admin correction

export interface TreasuryTransaction {
  id: string;
  family_id: string;
  type: TreasuryTxType;
  amount: number;            // positive = deposit, negative = withdrawal
  balance_after: number;     // running balance snapshot
  actor_player_id: string;   // who initiated
  note: string | null;       // human-readable memo
  metadata: Record<string, unknown> | null; // e.g. { job_id, mission_id }
  created_at: string;
}

// ─────────────────────────────────────────────
// FAMILY INVENTORY & ITEM ISSUANCE
// ─────────────────────────────────────────────

export type ItemCategory =
  | 'WEAPON'    // firearms, blades, etc.
  | 'VEHICLE'   // getaway cars, utility
  | 'TOOL'      // safecracking kit, wire, etc.
  | 'ARMOR'     // vests, etc.
  | 'CURRENCY'  // cash bundles (rarely)
  | 'MISC';     // burner phones, documents, etc.

export type ItemTier = 'STANDARD' | 'ADVANCED' | 'ELITE';

/** Catalog definition (the type of item, not an instance) */
export interface ItemDefinition {
  id: string;           // e.g. '9mm_pistol'
  name: string;         // '9mm Pistol'
  category: ItemCategory;
  tier: ItemTier;
  description: string;
  // job / mission requirements where this item is used
  grants_job_tags: string[];  // e.g. ['armed_robbery', 'assassination']
  // quantity/stack rules
  is_stackable: boolean;
  // value for treasury ledger purposes
  base_value: number;
}

/** A specific item instance held in family or personal inventory */
export type ItemInstanceState =
  | 'IN_FAMILY_VAULT'     // held in family inventory, not assigned
  | 'ISSUED'              // issued to a member (see FamilyItemIssuance)
  | 'IN_USE'              // actively used in a job/mission/hit
  | 'CONSUMED'            // destroyed/used up
  | 'RETURNED'            // returned after use
  | 'LOST'                // lost in a failed operation
  | 'CONFISCATED';        // seized by authorities (jail)

export interface FamilyItemInstance {
  id: string;               // unique instance ID
  family_id: string;
  item_definition_id: string;
  state: ItemInstanceState;
  acquired_at: string;
  acquired_by: string;      // player_id of who added it to family vault
  current_holder_id: string | null;  // null if in vault
  notes: string | null;
}

/** Record of an item being issued from the family vault to a member */
export type IssuancePurpose =
  | 'JOB'           // for a specific job run
  | 'HIT'           // for a contract / assassination
  | 'MISSION'       // for a family mission slot
  | 'PROTECTION'    // personal protection
  | 'GENERAL';      // general allocation

export type IssuanceStatus =
  | 'ACTIVE'      // item is currently issued/in-use
  | 'RETURNED'    // item came back
  | 'CONSUMED'    // item was used up
  | 'LOST'        // item was lost
  | 'OVERDUE';    // item not returned within expected window

export interface FamilyItemIssuance {
  id: string;
  family_id: string;
  item_instance_id: string;
  item_definition_id: string;   // denormalized for query convenience
  issued_to_player_id: string;
  issued_by_player_id: string;
  issued_at: string;
  purpose: IssuancePurpose;
  purpose_reference_id: string | null;  // e.g. job_id, mission_id, contract_id
  status: IssuanceStatus;
  returned_at: string | null;
  notes: string | null;
}

// ─────────────────────────────────────────────
// FAMILY AUDIT LOG
// Human-readable log of major family actions
// ─────────────────────────────────────────────

export type FamilyAuditAction =
  | 'RANK_ASSIGNED'           // member rank changed
  | 'MEMBER_KICKED'           // member removed
  | 'MEMBER_LEFT'             // member voluntarily left
  | 'TREASURY_DEPOSITED'      // funds added
  | 'TREASURY_WITHDRAWN'      // funds removed
  | 'TAX_RATE_CHANGED'        // tax/kickup rate updated
  | 'ITEM_ISSUED'             // item given to member
  | 'ITEM_RETURNED'           // item returned by member
  | 'ITEM_LOST'               // item lost
  | 'FAMILY_CREATED'          // bootstrap event
  | 'PROTECTION_EXPIRED'      // 10-day window closed
  | 'FAMILY_STABILIZED'       // milestones all met
  | 'FAMILY_BECAME_VULNERABLE' // milestones not met by deadline
  | 'WAR_DECLARED'
  | 'PEACE_SIGNED'
  | 'SETTINGS_CHANGED';

export interface FamilyAuditEntry {
  id: string;
  family_id: string;
  action: FamilyAuditAction;
  actor_player_id: string;   // who performed the action
  target_player_id: string | null;  // who was affected (if applicable)
  summary: string;           // human-readable one-liner
  metadata: Record<string, unknown> | null;
  created_at: string;
}

// ─────────────────────────────────────────────
// MISSIONS
// ─────────────────────────────────────────────

export type MissionType =
  | 'HEIST' | 'EXTORTION' | 'ASSASSINATION' | 'SURVEILLANCE'
  | 'TERRITORY_GRAB' | 'SUPPLY_RUN' | 'AMBUSH' | 'BANK_JOB';

export type MissionTier = 'STARTER' | 'STANDARD' | 'ADVANCED' | 'ELITE';

export type MissionState =
  | 'DRAFT' | 'OPEN' | 'ACTIVE' | 'SUCCESS'
  | 'PARTIAL_SUCCESS' | 'FAILURE' | 'COMPROMISED' | 'ABANDONED';

export type MissionOutcome = 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE' | 'COMPROMISED';

export type SlotRole =
  | 'LEAD' | 'ENFORCER' | 'SHOOTER' | 'WHEELMAN' | 'INSIDE_MAN' | 'MONEY_MAN';

export interface MissionSlot {
  role: SlotRole;
  filled_by: string | null;
  required: boolean;
}

export interface Mission {
  id: string;
  family_id: string;
  title: string;
  description: string;
  type: MissionType;
  tier: MissionTier;
  required_slots: MissionSlot[];
  optional_hitman_slot: HitmanSlot | null;  // LOCKED CANON: always optional
  state: MissionState;
  outcome: MissionOutcome | null;
  outcome_notes: string | null;
  payout: number;
  heat_cost: number;
  recruit_eligible: boolean;
  stat_requirements: Partial<PlayerStats>;
  created_by: string;
  starts_at: string | null;
  resolved_at: string | null;
}

// ─────────────────────────────────────────────
// CONTRACTS
// ─────────────────────────────────────────────

export type ContractType = 'ASSASSINATION' | 'SUPPORT';

export interface ContractPhase {
  phase: 'SCOUTING' | 'PREPARATION' | 'EXECUTION';
  label: string;
  description: string;
  completed: boolean;
  actions: string[];
}

export interface Contract {
  id: string;
  // Spec: anonymity_rules.hitman_does_not_see_hiring_family
  hiring_family_id: string;         // never shown to hitman
  anonymized_poster_id: string;     // what hitman sees: e.g. "Client #4471"
  target_player_id: string;
  target_alias: string;
  target_difficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  hitman_id: string | null;
  price: number;
  escrow_locked: number;
  contract_type: ContractType;
  state: ContractState;
  outcome: ContractOutcome | null;
  traced: boolean;
  // Spec: retaliation_window_days = RETALIATION_WINDOW_DAYS
  blowback_expires_at: string | null;
  // Spec: economy_effect — 2× compensation
  blowback_compensation: number;     // = price * BLOWBACK_COMPENSATION_MULTIPLE
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  secrecy: 'LOW' | 'MEDIUM' | 'HIGH';
  notes: string | null;
  phases: ContractPhase[];
  posted_at: string;
  accepted_at: string | null;
  resolved_at: string | null;
}

// ─────────────────────────────────────────────
// HITMAN PROFILE — spec-aligned field names
// Spec: hitman_system.hitman_profile.fields
//       hitman_system.leaderboard.ranking_metrics
// ─────────────────────────────────────────────

export type RepTier = 'ROOKIE' | 'PROFESSIONAL' | 'ELITE' | 'LEGENDARY';

export interface HitmanProfile {
  player_id: string;
  // Spec: hitman_profile.fields
  alias: string;
  archetype: 'HITMAN';            // always HITMAN
  reputation_tier: RepTier;       // spec: reputation_tier (was rep_tier)
  success_count: number;          // kept for backward compat
  failure_count: number;
  success_rate: number;           // spec: success_rate ✓
  recent_form: ContractOutcome[]; // spec: recent_form (last 10)
  price_range: { min: number; max: number }; // spec: price_range
  availability_status: HitmanAvailability;   // spec: availability_status
  heat_status: number;            // spec: heat_status (0-100)
  // Spec: leaderboard.ranking_metrics
  contracts_completed: number;          // spec: contracts_completed
  weighted_contract_difficulty: number; // spec: weighted_contract_difficulty
  clean_success_ratio: number;          // spec: clean_success_ratio
  streak_score: number;                 // spec: streak_score
  high_value_target_count: number;      // spec: high_value_target_count
  low_trace_rate_score: number;         // spec: low_trace_rate_score
  // Computed composite
  hitman_score: number;
  // Operational extras
  blacksite_state: BlacksiteState | null;
  safehouse_level: number;   // 0-5
  informant_level: number;   // 0-5
  avg_payout: number;
}

// ─────────────────────────────────────────────
// DOWNTIME
// ─────────────────────────────────────────────

export interface DowntimeJob {
  id: string;
  activity: DowntimeActivityType;
  title: string;
  description: string;
  duration_hours: number;
  reward_cash: number;
  reward_rep: number;
  reward_readiness: number;
  reward_intel: number;
  reward_heat_reduction: number;
  next_contract_bonus: string | null;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  stat_req: Partial<PlayerStats>;
  // Spec reward type tags
  reward_types: Array<
    'cash' | 'intel_tokens' | 'future_contract_bonus' | 'lower_trace_chance'
    | 'heat_reduction' | 'reputation_recovery' | 'xp'
    | 'small_stat_gains' | 'temporary_next_contract_bonuses'
    | 'intel' | 'access_to_better_contracts' | 'shorter_prep_times'
    | 'lower_prison_time' | 'better_recovery'
  >;
}

// ─────────────────────────────────────────────
// PERMISSIONS
// ─────────────────────────────────────────────

export type GameRole =
  | 'UNAFFILIATED' | 'RECRUIT' | 'ASSOCIATE' | 'SOLDIER'
  | 'CAPO' | 'UNDERBOSS' | 'CONSIGLIERE' | 'BOSS' | 'SOLO_HITMAN';

export type Permission =
  | 'JOIN_FAMILY' | 'LEAVE_FAMILY' | 'INVITE_RECRUIT'
  | 'VIEW_FAMILY_DASHBOARD' | 'VIEW_FAMILY_ROSTER' | 'VIEW_FAMILY_CHAT'
  | 'VIEW_FAMILY_TREASURY' | 'VIEW_FAMILY_STRATEGY'
  | 'SPEND_TREASURY' | 'DEPOSIT_TREASURY'
  | 'VIEW_MISSION_BOARD' | 'JOIN_STARTER_MISSION' | 'JOIN_MISSION'
  | 'START_MISSION' | 'CREATE_MISSION' | 'EDIT_MISSION'
  | 'APPROVE_RECRUIT' | 'PROMOTE_TO_ASSOCIATE' | 'PROMOTE_TO_SOLDIER'
  | 'PROMOTE_TO_CAPO' | 'PROMOTE_TO_UNDERBOSS' | 'KICK_MEMBER'
  | 'MANAGE_OPERATIONS' | 'VIEW_OPERATIONS'
  | 'OFFER_TRUCE' | 'ACCEPT_TRUCE' | 'DECLARE_WAR'
  | 'VIEW_HITMAN_PROFILES' | 'POST_CONTRACT' | 'VIEW_CONTRACT_HISTORY'
  | 'ACCEPT_CONTRACT' | 'ACCEPT_SUPPORT_SLOT'
  | 'VIEW_ROUND_STATS' | 'MANAGE_ROUND_REWARDS'
  | 'ACCESS_HITMAN_DASHBOARD' | 'ACCESS_HITMAN_DOWNTIME'
  | 'ACCESS_HITMAN_PRISON' | 'ACCESS_HITMAN_LEADERBOARD';

// ─────────────────────────────────────────────
// TURF BLOCKS & BUSINESSES
// ─────────────────────────────────────────────

export type BusinessType =
  | 'NUMBERS_SPOT'
  | 'LOAN_OFFICE'
  | 'CHOP_SHOP'
  | 'PAWN_SHOP'
  | 'RESTAURANT_FRONT'
  | 'LAUNDROMAT'
  | 'NIGHTCLUB'
  | 'WAREHOUSE';

export interface FamilyBusiness {
  id: string;
  type: BusinessType;
  owner_player_id: string;
  turf_block_id: string;
  slot_number: number;
  upgrade_level: number;       // 1-3
  daily_income_base: number;
  family_cut_pct: number;      // 0.3 = 30% to treasury
  heat_per_day: number;
  built_at: string;
}

export interface BusinessSlot {
  slot_number: number;   // 1-16
  business: FamilyBusiness | null;
}

export interface TurfBlock {
  id: string;
  family_id: string;
  name: string;           // "South Port Block A"
  location: string;       // "South Port"
  purchase_cost: number;
  purchased_at: string;
  slots: BusinessSlot[];  // always 16
}

// ─────────────────────────────────────────────
// FAMILY BOARD
// ─────────────────────────────────────────────

export interface BoardReply {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
}

export interface FamilyBoardPost {
  id: string;
  family_id: string;
  author_id: string;
  content: string;
  pinned: boolean;
  pinned_by?: string;
  created_at: string;
  replies: BoardReply[];
}

// ─────────────────────────────────────────────
// CHAIN-OF-COMMAND MAILBOX
// ─────────────────────────────────────────────

export type MessageStatus = 'OPEN' | 'ESCALATED' | 'RESOLVED';

export interface ChainMessage {
  id: string;
  family_id: string;
  from_player_id: string;
  to_player_id: string;       // immediate superior
  subject: string;
  body: string;
  status: MessageStatus;
  escalated_to?: string;      // player_id of who it was forwarded to
  created_at: string;
  updated_at: string;
}

// ─────────────────────────────────────────────
// SLEEP / VACATION MODE
// ─────────────────────────────────────────────

export type ProtectionMode = 'NONE' | 'SLEEP' | 'VACATION';

export interface PlayerProtection {
  player_id: string;
  mode: ProtectionMode;
  activated_at: string | null;
  expires_at: string | null;       // SLEEP: 8h max; VACATION: 7 days max
  last_sleep_at: string | null;    // cooldown: 1 sleep per 24h
  last_vacation_at: string | null; // cooldown: 1 vacation per 30 days
}

// ─────────────────────────────────────────────
// OBITUARIES
// ─────────────────────────────────────────────

export type ObituaryEventType =
  | 'DEATH'
  | 'WITNESS_PROTECTION'
  | 'RETIREMENT'
  | 'FAMILY_DISSOLVED'
  | 'LEADERSHIP_CHANGE';

export interface ObituaryEntry {
  id: string;
  event_type: ObituaryEventType;
  player_id: string | null;
  player_alias: string;
  family_id: string | null;
  family_name: string | null;
  note: string;         // flavor text
  created_at: string;
}
