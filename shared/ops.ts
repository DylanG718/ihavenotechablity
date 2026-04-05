/**
 * ops.ts — Operating Systems Layer
 *
 * Covers:
 *  - Permissions matrix (WorldAction / MinFamilyRank)
 *  - Progression system (ContributionScore, PromotionThreshold, etc.)
 *  - Onboarding (OnboardingStep, OnboardingState)
 *  - Notifications (NotificationType, PlayerNotification)
 *  - Activity feeds (FamilyActivityEvent, WorldActivityEvent)
 *  - Economy sinks (EconomySink)
 *  - Analytics events (AnalyticsEventName, AnalyticsEvent)
 *  - Live-ops events (LiveOpEvent)
 *  - Anti-abuse rules (AbuseFlag, AbuseRuleConfig)
 *  - Season rollover (SeasonRolloverConfig)
 */

// ── PERMISSIONS MATRIX ─────────────────────────────────────────────

export type WorldAction =
  // Recruitment
  | 'INVITE_PLAYER'
  | 'APPROVE_APPLICANT'
  | 'REJECT_APPLICANT'
  | 'APPLY_TO_FAMILY'
  // Crew management
  | 'ASSIGN_TO_CREW'
  | 'REMOVE_FROM_CREW'
  | 'CREATE_CREW'
  | 'DISSOLVE_CREW'
  // Business management
  | 'ASSIGN_TO_BUSINESS_SLOT'
  | 'REMOVE_FROM_BUSINESS_SLOT'
  | 'PLACE_FRONT_ON_TURF'
  | 'UPGRADE_FRONT'
  | 'REMOVE_FRONT'
  // Turf
  | 'PURCHASE_TURF'
  | 'VIEW_TURF_INCOME'
  // Treasury
  | 'VIEW_TREASURY'
  | 'WITHDRAW_TREASURY'
  | 'APPROVE_TREASURY_SPEND'
  | 'DEPOSIT_TREASURY'
  // Family board + comms
  | 'POST_FAMILY_BOARD'
  | 'PIN_ANNOUNCEMENT'
  | 'ESCALATE_MESSAGE'
  | 'SEND_CHAIN_MESSAGE'
  // Diplomacy
  | 'VIEW_DISTRICT_INFLUENCE'
  | 'PROPOSE_DIPLOMACY'
  | 'ACCEPT_DIPLOMACY'
  | 'DECLARE_WAR'
  | 'PROPOSE_PEACE'
  // Promotions
  | 'PROMOTE_TO_ASSOCIATE'
  | 'PROMOTE_TO_SOLDIER'
  | 'PROMOTE_TO_CAPO'
  | 'APPOINT_CONSIGLIERE'
  | 'APPOINT_UNDERBOSS'
  | 'DEMOTE_MEMBER'
  | 'KICK_MEMBER'
  | 'TRANSFER_DON'
  // Protection + exits
  | 'TRIGGER_WITNESS_PROTECTION'
  | 'OVERRIDE_JAIL_STATE'
  | 'OVERRIDE_PROTECTION_STATE'
  // Inventory management
  | 'VIEW_FAMILY_INVENTORY'
  | 'ADD_ITEM_TO_VAULT'
  | 'ISSUE_ITEM_TO_MEMBER'
  | 'RETURN_ITEM_FROM_MEMBER'
  | 'MARK_ITEM_LOST'
  | 'REMOVE_ITEM_FROM_VAULT'
  // Treasury management
  | 'SET_TAX_RATE'
  | 'SET_KICKUP_RATE'
  | 'VIEW_TREASURY_HISTORY'
  // Family lifecycle
  | 'CREATE_FAMILY'
  | 'DISSOLVE_FAMILY'
  | 'OVERRIDE_BOOTSTRAP_STATE'
  // Admin
  | 'ACCESS_ADMIN_TOOLS'
  | 'VIEW_ALL_FAMILIES'
  | 'FIX_STUCK_STATE';

// Matrix: WorldAction -> minimum rank required
// 'NONE' means available to all members (but maybe just your own data)
export type MinFamilyRank =
  | 'ASSOCIATE'
  | 'SOLDIER'
  | 'CAPO'
  | 'CONSIGLIERE'
  | 'UNDERBOSS'
  | 'BOSS'
  | 'ADMIN_ONLY';

export const WORLD_ACTION_PERMISSIONS: Record<WorldAction, MinFamilyRank> = {
  INVITE_PLAYER:                'CAPO',
  APPROVE_APPLICANT:            'CAPO',
  REJECT_APPLICANT:             'CAPO',
  APPLY_TO_FAMILY:              'ASSOCIATE',  // for unaffiliated
  ASSIGN_TO_CREW:               'UNDERBOSS',
  REMOVE_FROM_CREW:             'UNDERBOSS',
  CREATE_CREW:                  'UNDERBOSS',
  DISSOLVE_CREW:                'BOSS',
  ASSIGN_TO_BUSINESS_SLOT:      'UNDERBOSS',
  REMOVE_FROM_BUSINESS_SLOT:    'UNDERBOSS',
  PLACE_FRONT_ON_TURF:          'BOSS',
  UPGRADE_FRONT:                'UNDERBOSS',
  REMOVE_FRONT:                 'BOSS',
  PURCHASE_TURF:                'BOSS',
  VIEW_TURF_INCOME:             'CAPO',
  VIEW_TREASURY:                'CAPO',
  WITHDRAW_TREASURY:            'UNDERBOSS',
  APPROVE_TREASURY_SPEND:       'BOSS',
  DEPOSIT_TREASURY:             'ASSOCIATE',
  POST_FAMILY_BOARD:            'ASSOCIATE',
  PIN_ANNOUNCEMENT:             'UNDERBOSS',
  ESCALATE_MESSAGE:             'CAPO',
  SEND_CHAIN_MESSAGE:           'ASSOCIATE',
  VIEW_DISTRICT_INFLUENCE:      'CAPO',
  PROPOSE_DIPLOMACY:            'CONSIGLIERE',
  ACCEPT_DIPLOMACY:             'BOSS',
  DECLARE_WAR:                  'BOSS',
  PROPOSE_PEACE:                'UNDERBOSS',
  PROMOTE_TO_ASSOCIATE:         'CAPO',
  PROMOTE_TO_SOLDIER:           'CAPO',
  PROMOTE_TO_CAPO:              'UNDERBOSS',
  APPOINT_CONSIGLIERE:          'BOSS',
  APPOINT_UNDERBOSS:            'BOSS',
  DEMOTE_MEMBER:                'UNDERBOSS',
  KICK_MEMBER:                  'CAPO',
  TRANSFER_DON:                 'BOSS',
  TRIGGER_WITNESS_PROTECTION:   'ASSOCIATE',  // player can do to self
  OVERRIDE_JAIL_STATE:          'ADMIN_ONLY',
  OVERRIDE_PROTECTION_STATE:    'ADMIN_ONLY',
  ACCESS_ADMIN_TOOLS:           'ADMIN_ONLY',
  VIEW_ALL_FAMILIES:            'ADMIN_ONLY',
  FIX_STUCK_STATE:              'ADMIN_ONLY',
  // Inventory
  VIEW_FAMILY_INVENTORY:        'ASSOCIATE',
  ADD_ITEM_TO_VAULT:            'UNDERBOSS',
  ISSUE_ITEM_TO_MEMBER:         'UNDERBOSS',
  RETURN_ITEM_FROM_MEMBER:      'UNDERBOSS',
  MARK_ITEM_LOST:               'UNDERBOSS',
  REMOVE_ITEM_FROM_VAULT:       'BOSS',
  // Treasury
  SET_TAX_RATE:                 'BOSS',
  SET_KICKUP_RATE:              'BOSS',
  VIEW_TREASURY_HISTORY:        'CAPO',
  // Family lifecycle
  CREATE_FAMILY:                'ASSOCIATE',  // any unaffiliated player can found a family
  DISSOLVE_FAMILY:              'BOSS',
  OVERRIDE_BOOTSTRAP_STATE:     'ADMIN_ONLY',
};

export function canPerformAction(familyRole: string | null, action: WorldAction): boolean {
  const required = WORLD_ACTION_PERMISSIONS[action];
  if (required === 'ADMIN_ONLY') return false;
  const RANK_ORDER: Record<string, number> = {
    ASSOCIATE: 1, SOLDIER: 2, CAPO: 3, CONSIGLIERE: 3, UNDERBOSS: 4, BOSS: 5,
  };
  return (RANK_ORDER[familyRole ?? ''] ?? 0) >= (RANK_ORDER[required] ?? 99);
}

// ── PROGRESSION SYSTEM ─────────────────────────────────────────────

export interface ContributionScore {
  playerId: string;
  jobsCompleted: number;
  missionsCompleted: number;
  moneyEarned: number;
  businessJobsCompleted: number;
  passiveIncomeGenerated: number;
  loyaltyDays: number;           // days in family
  createdAt: string;
  updatedAt: string;
}

export type PromotionReason =
  | 'LEADERSHIP_APPOINTMENT'     // Don/UB appointed
  | 'THRESHOLD_REACHED'          // Automatic at threshold
  | 'MERIT_APPROVED'             // Capo recommended + approved
  | 'DEV_OVERRIDE';

export type DemotionReason =
  | 'INACTIVITY'
  | 'DISCIPLINARY'
  | 'FAMILY_RESTRUCTURE'
  | 'DEV_OVERRIDE';

export interface PromotionRecord {
  id: string;
  playerId: string;
  fromRank: string;
  toRank: string;
  reason: PromotionReason;
  grantedByPlayerId: string;
  note: string;
  timestamp: string;
}

export interface DemotionRecord {
  id: string;
  playerId: string;
  fromRank: string;
  toRank: string;
  reason: DemotionReason;
  grantedByPlayerId: string;
  note: string;
  timestamp: string;
}

// Thresholds to be ELIGIBLE for promotion (still requires appointment above Soldier)
export interface PromotionThreshold {
  targetRank: string;
  minJobsCompleted: number;
  minMoneyEarned: number;
  minLoyaltyDays: number;
  minMissionsCompleted: number;
  requiresLeadershipApproval: boolean;
  notes: string;
}

export const PROMOTION_THRESHOLDS: Record<string, PromotionThreshold> = {
  ASSOCIATE: {
    targetRank: 'ASSOCIATE',
    minJobsCompleted: 3,
    minMoneyEarned: 5000,
    minLoyaltyDays: 1,
    minMissionsCompleted: 2,
    requiresLeadershipApproval: false,
    notes: 'Recruit completes basic missions and earns threshold money. Auto-eligible.',
  },
  SOLDIER: {
    targetRank: 'SOLDIER',
    minJobsCompleted: 15,
    minMoneyEarned: 25000,
    minLoyaltyDays: 7,
    minMissionsCompleted: 5,
    requiresLeadershipApproval: false,
    notes: 'Associate proves consistent activity over at least a week.',
  },
  CAPO: {
    targetRank: 'CAPO',
    minJobsCompleted: 30,
    minMoneyEarned: 75000,
    minLoyaltyDays: 14,
    minMissionsCompleted: 10,
    requiresLeadershipApproval: true,
    notes: 'Soldier must be promoted by Underboss or Boss. Thresholds gate eligibility.',
  },
  UNDERBOSS: {
    targetRank: 'UNDERBOSS',
    minJobsCompleted: 60,
    minMoneyEarned: 200000,
    minLoyaltyDays: 30,
    minMissionsCompleted: 20,
    requiresLeadershipApproval: true,
    notes: 'Boss appointment only. Thresholds gate eligibility. Only 1 Underboss per family.',
  },
  CONSIGLIERE: {
    targetRank: 'CONSIGLIERE',
    minJobsCompleted: 20,
    minMoneyEarned: 50000,
    minLoyaltyDays: 14,
    minMissionsCompleted: 8,
    requiresLeadershipApproval: true,
    notes: 'Boss appointment only. Advisory role — does not need combat stats.',
  },
};

export function checkPromotionEligibility(
  targetRank: string,
  contribution: ContributionScore
): { eligible: boolean; missingRequirements: string[] } {
  const threshold = PROMOTION_THRESHOLDS[targetRank];
  if (!threshold) return { eligible: true, missingRequirements: [] };
  const missing: string[] = [];
  if (contribution.jobsCompleted < threshold.minJobsCompleted)
    missing.push(`${threshold.minJobsCompleted - contribution.jobsCompleted} more jobs needed`);
  if (contribution.moneyEarned < threshold.minMoneyEarned)
    missing.push(`$${(threshold.minMoneyEarned - contribution.moneyEarned).toLocaleString()} more earned`);
  if (contribution.loyaltyDays < threshold.minLoyaltyDays)
    missing.push(`${threshold.minLoyaltyDays - contribution.loyaltyDays} more days`);
  if (contribution.missionsCompleted < threshold.minMissionsCompleted)
    missing.push(`${threshold.minMissionsCompleted - contribution.missionsCompleted} more missions`);
  return { eligible: missing.length === 0, missingRequirements: missing };
}

// ── ONBOARDING ─────────────────────────────────────────────────────

export type OnboardingStep =
  // ── Standard path
  | 'INTRO'
  | 'ARCHETYPE_CHOICE'
  | 'FAMILY_PATH_CHOICE'    // branch: join/unaffiliated vs create family
  | 'FIRST_JOB'
  | 'FAMILY_INTRO'
  | 'APPLY_OR_INVITED'
  | 'STASH_INTRO'
  | 'DASHBOARD_TOUR'
  // ── Founder / Don path
  | 'FOUNDER_FAMILY_NAME'
  | 'FOUNDER_RESPONSIBILITY_WARN'
  | 'FOUNDER_TREASURY_INTRO'
  | 'FOUNDER_KICKUPS_TAXES'
  | 'FOUNDER_RANKS_OVERVIEW'
  | 'FOUNDER_PROTECTION_INTRO'
  | 'FOUNDER_STABILIZE_INTRO'
  | 'FOUNDER_INVENTORY_INTRO'
  | 'FOUNDER_DASHBOARD'
  | 'COMPLETED';

export interface OnboardingState {
  playerId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  startedAt: string;
  completedAt: string | null;
  skipped: boolean;
  path: 'standard' | 'founder';
}

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  INTRO:                      'Welcome to MafiaLife',
  ARCHETYPE_CHOICE:           'Choose Your Archetype',
  FAMILY_PATH_CHOICE:         'Your Path',
  FIRST_JOB:                  'Your First Job',
  FAMILY_INTRO:               'How Families Work',
  APPLY_OR_INVITED:           'Join or Stay Independent',
  STASH_INTRO:                'Your Stash',
  DASHBOARD_TOUR:             'Your Dashboard',
  FOUNDER_FAMILY_NAME:        'Name Your Family',
  FOUNDER_RESPONSIBILITY_WARN:'What You Are Taking On',
  FOUNDER_TREASURY_INTRO:     'The Treasury',
  FOUNDER_KICKUPS_TAXES:      'Kick-Ups & Taxes',
  FOUNDER_RANKS_OVERVIEW:     'Family Structure',
  FOUNDER_PROTECTION_INTRO:   'Your Protection Window',
  FOUNDER_STABILIZE_INTRO:    'Stabilization',
  FOUNDER_INVENTORY_INTRO:    'Starting Arsenal',
  FOUNDER_DASHBOARD:          'Your Command Center',
  COMPLETED:                  'Onboarding Complete',
};

// Standard player path (join or stay independent)
export const STANDARD_ONBOARDING_STEPS: OnboardingStep[] = [
  'INTRO', 'ARCHETYPE_CHOICE', 'FAMILY_PATH_CHOICE',
  'FIRST_JOB', 'FAMILY_INTRO', 'APPLY_OR_INVITED',
  'STASH_INTRO', 'DASHBOARD_TOUR',
];

// Founder / Don path (create your own family)
export const FOUNDER_ONBOARDING_STEPS: OnboardingStep[] = [
  'INTRO', 'ARCHETYPE_CHOICE', 'FAMILY_PATH_CHOICE',
  'FOUNDER_FAMILY_NAME', 'FOUNDER_RESPONSIBILITY_WARN',
  'FOUNDER_TREASURY_INTRO', 'FOUNDER_KICKUPS_TAXES',
  'FOUNDER_RANKS_OVERVIEW', 'FOUNDER_PROTECTION_INTRO',
  'FOUNDER_STABILIZE_INTRO', 'FOUNDER_INVENTORY_INTRO',
  'FOUNDER_DASHBOARD',
];

// Legacy export for compatibility
export const ONBOARDING_STEP_ORDER: OnboardingStep[] = STANDARD_ONBOARDING_STEPS;

// ── NOTIFICATIONS ─────────────────────────────────────────────────

export type NotificationType =
  | 'BUSINESS_ASSIGNMENT_ADDED'
  | 'BUSINESS_ASSIGNMENT_REMOVED'
  | 'PROMOTED'
  | 'DEMOTED'
  | 'NEW_CHAIN_MESSAGE'
  | 'JOB_INVITE_RECEIVED'
  | 'PASSIVE_INCOME_PAYOUT'
  | 'JAIL_ENTERED'
  | 'JAIL_RELEASED'
  | 'STASH_ROBBERY_ATTEMPTED'
  | 'SLEEP_MODE_EXPIRING'
  | 'VACATION_EXPIRING'
  | 'FAMILY_APPLICATION_ACCEPTED'
  | 'FAMILY_APPLICATION_REJECTED'
  | 'NEW_FAMILY_BOARD_POST'
  | 'DIPLOMACY_STATE_CHANGED'
  | 'WAR_DECLARED'
  | 'TURF_ATTACK_INCOMING'
  | 'SEASON_ENDING_SOON'
  | 'RANK_ELIGIBLE';

export interface PlayerNotification {
  id: string;
  playerId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  // Optional context
  relatedEntityId: string | null;    // job id, front id, player id, etc.
  relatedEntityType: string | null;  // 'job' | 'front' | 'player' | 'message' etc.
}

// ── ACTIVITY FEEDS ────────────────────────────────────────────────

export type FamilyActivityType =
  | 'MEMBER_JOINED'
  | 'MEMBER_LEFT'
  | 'MEMBER_PROMOTED'
  | 'MEMBER_DEMOTED'
  | 'MEMBER_KICKED'
  | 'TURF_PURCHASED'
  | 'FRONT_BUILT'
  | 'FRONT_UPGRADED'
  | 'FRONT_REMOVED'
  | 'BUSINESS_JOB_COMPLETED'
  | 'DIPLOMACY_CHANGED'
  | 'WAR_STARTED'
  | 'WAR_ENDED'
  | 'CREW_CREATED'
  | 'LEADERSHIP_CHANGED'
  | 'TREASURY_LARGE_WITHDRAWAL';

export interface FamilyActivityEvent {
  id: string;
  familyId: string;
  type: FamilyActivityType;
  actorAlias: string;
  actorRole: string;
  description: string;
  timestamp: string;
  metadata: Record<string, string | number>;
}

export type WorldActivityType =
  | 'OBITUARY'
  | 'WITNESS_PROTECTION'
  | 'SEASON_STARTED'
  | 'SEASON_ENDED'
  | 'FAMILY_RANK_CHANGE'           // top family changed
  | 'DISTRICT_CONTROL_CHANGE'
  | 'FAMILY_DISSOLVED'
  | 'MAJOR_WAR_ENDED';

export interface WorldActivityEvent {
  id: string;
  type: WorldActivityType;
  headline: string;
  detail: string;
  timestamp: string;
  familyId: string | null;
  districtId: string | null;
}

// ── ECONOMY SINKS ─────────────────────────────────────────────────

export interface EconomySink {
  id: string;
  name: string;
  description: string;
  category: 'EXPANSION' | 'OPERATIONS' | 'PROTECTION' | 'DIPLOMACY' | 'PENALTY';
  // Static cost (for fixed-price sinks) — 0 if variable
  baseCost: number;
  // Variable cost formula description
  costFormula: string | null;
  // Who pays
  payer: 'PLAYER' | 'FAMILY' | 'BOTH';
  // Is this recurring (daily/weekly)?
  recurring: boolean;
  recurringPeriodHours: number | null;
  notes: string;
}

// ── ANALYTICS EVENTS ──────────────────────────────────────────────

export type AnalyticsEventName =
  | 'signup_started'
  | 'account_created'
  // Onboarding branching
  | 'family_path_selected'          // standard or founder
  | 'family_creation_path_chosen'
  | 'family_creation_started'
  | 'family_creation_completed'
  | 'founder_onboarding_step_completed'
  | 'founder_onboarding_completed'
  | 'onboarding_abandoned_at_step'
  // Archetype
  | 'runner_selected'
  | 'archetype_previewed'           // opened detail panel
  // Family lifecycle
  | 'family_created'
  | 'underboss_recruited'
  | 'consigliere_recruited'
  | 'family_protection_started'
  | 'family_protection_expired'
  | 'family_stabilized'
  | 'family_became_vulnerable'
  // Inventory
  | 'family_item_issued'
  | 'family_item_returned'
  | 'family_item_lost'
  // Treasury
  | 'treasury_deposit'
  | 'treasury_withdrawal'
  | 'treasury_tax_changed'
  | 'kickup_changed'
  | 'login_completed'
  | 'archetype_selected'
  | 'job_run'
  | 'payout_claimed'
  | 'error_occurred'
  | 'onboarding_started'
  | 'onboarding_step_completed'
  | 'onboarding_completed'
  | 'first_job_started'
  | 'first_job_completed'
  | 'family_applied'
  | 'family_joined'
  | 'family_left'
  | 'first_business_assignment'
  | 'first_passive_income_payout'
  | 'promotion_eligible'
  | 'promotion_granted'
  | 'demotion'
  | 'jail_entered'
  | 'jail_released'
  | 'stash_deposit'
  | 'stash_withdraw'
  | 'sleep_mode_enabled'
  | 'vacation_mode_enabled'
  | 'turf_purchased'
  | 'front_built'
  | 'front_upgraded'
  | 'business_exclusive_job_completed'
  | 'diplomatic_action_proposed'
  | 'diplomatic_action_resolved'
  | 'witness_protection_started'
  | 'witness_protection_completed'
  | 'season_snapshot_created'
  | 'admin_action';

export interface AnalyticsEvent {
  event: AnalyticsEventName;
  playerId: string;
  familyId: string | null;
  familyRole: string | null;
  districtId: string | null;
  entityId: string | null;   // job id, front id, turf id etc.
  entityType: string | null;
  properties: Record<string, string | number | boolean | null>;
  timestamp: string;
}

// ── LIVE-OPS EVENTS ───────────────────────────────────────────────

export type LiveOpScope = 'WORLD' | 'DISTRICT' | 'FRONT_TYPE' | 'FAMILY';

export type LiveOpModifierType =
  | 'INCOME_MULTIPLIER'
  | 'JAIL_RISK_MULTIPLIER'
  | 'BUILD_COST_MULTIPLIER'
  | 'HEAT_MULTIPLIER'
  | 'PRESTIGE_BONUS'
  | 'XP_MULTIPLIER';

export interface LiveOpModifier {
  type: LiveOpModifierType;
  multiplier: number;         // e.g. 1.5 = 50% boost; 0.5 = 50% reduction
  targetId: string | null;    // district id, front type, etc. if scope is not WORLD
}

export interface LiveOpEvent {
  id: string;
  name: string;
  description: string;
  flavor: string;             // short atmospheric tagline
  scope: LiveOpScope;
  scopeTargetId: string | null;   // district slug, front type, or family id if scoped
  modifiers: LiveOpModifier[];
  startAt: string;            // ISO
  endAt: string;              // ISO
  active: boolean;
  adminTriggered: boolean;    // false = scheduled, true = manually triggered
  createdAt: string;
}

// ── ANTI-ABUSE RULES ──────────────────────────────────────────────

export type AbuseFlag =
  | 'SPAM_INVITE'
  | 'SPAM_APPLICATION'
  | 'SPAM_MESSAGE'
  | 'TREASURY_INSTANT_DRAIN'
  | 'HIGH_FREQUENCY_EARNING'
  | 'WITNESS_PROTECTION_CYCLING'
  | 'SLEEP_ABUSE'
  | 'SLOT_SQUATTING'
  | 'INACTIVE_DON_BLOCK';

export interface AbuseRuleConfig {
  flag: AbuseFlag;
  description: string;
  thresholdValue: number;       // e.g. max invites per hour
  thresholdWindowHours: number;
  consequenceType: 'BLOCK' | 'FLAG_FOR_REVIEW' | 'RATE_LIMIT' | 'COOLDOWN';
  cooldownHours: number;
  notes: string;
}

// ── SEASON ROLLOVER ───────────────────────────────────────────────

export interface SeasonRolloverConfig {
  seasonId: string;
  // Exact fields that reset or partial-reset
  resets: {
    field: string;
    type: 'FULL_RESET' | 'PARTIAL_DECAY' | 'PRESERVE';
    decayPercent?: number;  // for PARTIAL_DECAY
    notes: string;
  }[];
}
