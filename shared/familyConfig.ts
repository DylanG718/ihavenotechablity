/**
 * familyConfig.ts — Data-driven family bootstrap and configuration.
 *
 * All tunable values live here. Never hardcode family defaults in business logic.
 *
 * To change bootstrap cash, starting items, protection window, or stabilization
 * requirements — edit the NEW_FAMILY_CONFIG object below.
 */

import type { ItemDefinition } from './schema';

// ─────────────────────────────────────────────
// ITEM CATALOG
// Master list of all items in the game.
// ─────────────────────────────────────────────

export const ITEM_CATALOG: Record<string, ItemDefinition> = {
  '9mm_pistol': {
    id: '9mm_pistol',
    name: '9mm Pistol',
    category: 'WEAPON',
    tier: 'STANDARD',
    description: 'Standard sidearm. Reliable, concealable, easy to acquire.',
    grants_job_tags: ['armed_robbery', 'intimidation', 'armed_hit'],
    is_stackable: false,
    base_value: 1500,
  },
  'burner_phone': {
    id: 'burner_phone',
    name: 'Burner Phone',
    category: 'MISC',
    tier: 'STANDARD',
    description: 'Untraceable communication. Essential for coordination.',
    grants_job_tags: ['communications', 'coordination'],
    is_stackable: true,
    base_value: 200,
  },
  'lockpick_kit': {
    id: 'lockpick_kit',
    name: 'Lockpick Kit',
    category: 'TOOL',
    tier: 'STANDARD',
    description: 'Opens most residential and commercial locks silently.',
    grants_job_tags: ['burglary', 'infiltration'],
    is_stackable: false,
    base_value: 800,
  },
  'bulletproof_vest': {
    id: 'bulletproof_vest',
    name: 'Bulletproof Vest',
    category: 'ARMOR',
    tier: 'STANDARD',
    description: 'Reduces combat damage. Mandatory in hot zones.',
    grants_job_tags: ['protection'],
    is_stackable: false,
    base_value: 2500,
  },
  'getaway_car': {
    id: 'getaway_car',
    name: 'Getaway Car',
    category: 'VEHICLE',
    tier: 'STANDARD',
    description: 'Clean plates, fast engine. Required for heist exits.',
    grants_job_tags: ['heist', 'armed_robbery'],
    is_stackable: false,
    base_value: 8000,
  },
  'safecracking_kit': {
    id: 'safecracking_kit',
    name: 'Safecracking Kit',
    category: 'TOOL',
    tier: 'ADVANCED',
    description: 'Professional-grade. Required for bank vault operations.',
    grants_job_tags: ['bank_job', 'safe_cracking'],
    is_stackable: false,
    base_value: 4500,
  },
};

// ─────────────────────────────────────────────
// FAMILY RANK DEFINITIONS
// Canonical rank hierarchy, order, and descriptions.
// Used in UI, permissions checks, and onboarding.
// ─────────────────────────────────────────────

export interface FamilyRankDefinition {
  rank: string;         // matches FamilyRole enum value
  order: number;        // 1 = lowest, 6 = highest
  display_name: string;
  short_name: string;   // for compact badges
  description: string;  // player-facing explanation
  responsibilities: string[];
}

export const FAMILY_RANKS: FamilyRankDefinition[] = [
  {
    rank: 'RECRUIT',
    order: 0,
    display_name: 'Recruit',
    short_name: 'RECRUIT',
    description: 'Probationary period. The family is watching you.',
    responsibilities: [
      'Run starter missions to prove yourself',
      'Deposit earnings to the family treasury',
      'Earn your way to Associate rank',
    ],
  },
  {
    rank: 'ASSOCIATE',
    order: 1,
    display_name: 'Associate',
    short_name: 'ASSOC',
    description: 'Committed but not yet a full member. You work with the family, not for it.',
    responsibilities: [
      'Run normal missions and street jobs',
      'Pay regular kick-ups to your crew captain',
      'Prove reliability to earn Soldier rank',
    ],
  },
  {
    rank: 'SOLDIER',
    order: 2,
    display_name: 'Soldier',
    short_name: 'SOLDIER',
    description: 'Full member of the family. You are officially "with us."',
    responsibilities: [
      'Defend family turf if called upon',
      'Run missions and generate income',
      'Follow directives from Capos and above',
    ],
  },
  {
    rank: 'CAPO',
    order: 3,
    display_name: 'Capo',
    short_name: 'CAPO',
    description: 'Crew captain. You manage a group of Soldiers and Associates.',
    responsibilities: [
      'Manage your crew\'s operations',
      'Recommend promotions to leadership',
      'Collect and forward kick-ups',
      'Invite and vet new recruits',
    ],
  },
  {
    rank: 'CONSIGLIERE',
    order: 3,  // same tier as Capo — advisory peer, not directly above
    display_name: 'Consigliere',
    short_name: 'CONSIG',
    description: 'Advisor and diplomat. The Don\'s most trusted counsel.',
    responsibilities: [
      'Advise the Don on strategy and disputes',
      'Lead diplomatic negotiations with other families',
      'Mediate internal family conflicts',
      'Access organizational intelligence',
    ],
  },
  {
    rank: 'UNDERBOSS',
    order: 4,
    display_name: 'Underboss',
    short_name: 'UB',
    description: 'Second-in-command. Runs day-to-day operations when the Don is unavailable.',
    responsibilities: [
      'Oversee all crews and Capos',
      'Approve high-value operations',
      'Manage family treasury (can withdraw)',
      'Issue family inventory to members',
      'Handle discipline and enforcement',
    ],
  },
  {
    rank: 'BOSS',
    order: 5,
    display_name: 'Don',
    short_name: 'DON',
    description: 'The Don. Strategic control and final authority on all decisions.',
    responsibilities: [
      'Set the family\'s direction and alliances',
      'Control tax and kick-up rates',
      'Declare war or negotiate peace',
      'Appoint Underboss and Consigliere',
      'Full treasury authority',
      'Final say on all family matters',
    ],
  },
];

export const FAMILY_RANK_MAP = Object.fromEntries(
  FAMILY_RANKS.map(r => [r.rank, r])
) as Record<string, FamilyRankDefinition>;

// ─────────────────────────────────────────────
// FAMILY BOOTSTRAP CONFIG
// Single source of truth for new-family defaults.
// ─────────────────────────────────────────────

export interface StartingItemSpec {
  item_definition_id: string;
  quantity: number;  // how many instances to create in the vault
}

export interface StabilizationMilestones {
  require_underboss: boolean;
  require_consigliere: boolean;
  require_minimum_treasury: number;  // minimum cash in treasury
  evaluation_deadline_days: number;  // window before protection expires and milestones are checked
}

export interface NewFamilyConfig {
  starting_cash: number;                   // deposited to treasury at creation
  starting_items: StartingItemSpec[];      // items pre-loaded into family vault
  protection_window_days: number;          // days the new family cannot be attacked by larger families
  // What "larger" means for protection eligibility checks
  protection_attack_threshold_members: number; // attacker must have > this many members to be blocked
  // Tax / kick-up defaults for a new family
  default_tax_rate_pct: number;            // % of member job earnings auto-deposited
  default_kickup_rate_pct: number;         // % of crew earnings paid to Don as tribute
  // Stabilization requirements
  stabilization: StabilizationMilestones;
}

export const NEW_FAMILY_CONFIG: NewFamilyConfig = {
  starting_cash: 5_000,
  starting_items: [
    { item_definition_id: '9mm_pistol', quantity: 2 },
  ],
  protection_window_days: 10,
  protection_attack_threshold_members: 3,  // families with > 3 members cannot attack a protected new family
  default_tax_rate_pct: 10,
  default_kickup_rate_pct: 5,
  stabilization: {
    require_underboss: true,
    require_consigliere: true,
    require_minimum_treasury: 10_000,
    evaluation_deadline_days: 10,  // aligns with protection window
  },
};

// ─────────────────────────────────────────────
// PROTECTION ELIGIBILITY CHECK
// Server-side logic — determines if an attacker is
// blocked by the target family's protection window.
// ─────────────────────────────────────────────

export interface ProtectionCheckInput {
  target_family_created_at: string;       // ISO8601
  target_family_protection_expires_at: string | null;
  attacker_member_count: number;
  now: string;                            // ISO8601 current time
}

export interface ProtectionCheckResult {
  is_protected: boolean;
  reason: string;
  expires_at: string | null;
  days_remaining: number | null;
}

export function checkFamilyProtection(input: ProtectionCheckInput): ProtectionCheckResult {
  const { target_family_protection_expires_at, attacker_member_count, now } = input;
  const cfg = NEW_FAMILY_CONFIG;

  if (!target_family_protection_expires_at) {
    return { is_protected: false, reason: 'Protection not active or has expired', expires_at: null, days_remaining: null };
  }

  const expiresAt = new Date(target_family_protection_expires_at).getTime();
  const nowMs     = new Date(now).getTime();

  if (nowMs >= expiresAt) {
    return { is_protected: false, reason: 'Protection window has expired', expires_at: target_family_protection_expires_at, days_remaining: 0 };
  }

  const daysRemaining = Math.ceil((expiresAt - nowMs) / (1000 * 60 * 60 * 24));

  // If attacker is small (≤ threshold), they can still attack — protection only blocks larger families
  if (attacker_member_count <= cfg.protection_attack_threshold_members) {
    return {
      is_protected: false,
      reason: `Attacker has ${attacker_member_count} member(s) — at or below the size threshold (${cfg.protection_attack_threshold_members}). Protection does not apply.`,
      expires_at: target_family_protection_expires_at,
      days_remaining: daysRemaining,
    };
  }

  return {
    is_protected: true,
    reason: `New family is under protection for ${daysRemaining} more day(s). Larger families cannot attack.`,
    expires_at: target_family_protection_expires_at,
    days_remaining: daysRemaining,
  };
}

// ─────────────────────────────────────────────
// STABILIZATION EVALUATOR
// ─────────────────────────────────────────────

export interface StabilizationInput {
  family_created_at: string;
  has_underboss: boolean;
  has_consigliere: boolean;
  treasury_balance: number;
  now: string;
}

export interface StabilizationResult {
  is_stable: boolean;
  deadline_passed: boolean;
  milestones: {
    underboss: { required: boolean; met: boolean };
    consigliere: { required: boolean; met: boolean };
    treasury: { required: boolean; met: boolean; current: number; required_amount: number };
  };
  days_remaining: number;
  summary: string;
}

export function evaluateStabilization(input: StabilizationInput): StabilizationResult {
  const { family_created_at, has_underboss, has_consigliere, treasury_balance, now } = input;
  const cfg = NEW_FAMILY_CONFIG.stabilization;

  const createdMs  = new Date(family_created_at).getTime();
  const deadlineMs = createdMs + cfg.evaluation_deadline_days * 24 * 60 * 60 * 1000;
  const nowMs      = new Date(now).getTime();
  const daysRemaining = Math.max(0, Math.ceil((deadlineMs - nowMs) / (1000 * 60 * 60 * 24)));
  const deadline_passed = nowMs >= deadlineMs;

  const milestones = {
    underboss: {
      required: cfg.require_underboss,
      met: !cfg.require_underboss || has_underboss,
    },
    consigliere: {
      required: cfg.require_consigliere,
      met: !cfg.require_consigliere || has_consigliere,
    },
    treasury: {
      required: cfg.require_minimum_treasury > 0,
      met: treasury_balance >= cfg.require_minimum_treasury,
      current: treasury_balance,
      required_amount: cfg.require_minimum_treasury,
    },
  };

  const all_met = milestones.underboss.met && milestones.consigliere.met && milestones.treasury.met;
  const is_stable = all_met;

  let summary = '';
  if (is_stable) {
    summary = 'Family is stabilized. All milestones met.';
  } else if (deadline_passed) {
    summary = 'Stabilization deadline passed without meeting all milestones. Family is vulnerable.';
  } else {
    const missing = [];
    if (!milestones.underboss.met)    missing.push('Underboss');
    if (!milestones.consigliere.met)  missing.push('Consigliere');
    if (!milestones.treasury.met)     missing.push(`Treasury ($${(cfg.require_minimum_treasury / 1000).toFixed(0)}K min)`);
    summary = `${daysRemaining} day(s) remaining. Missing: ${missing.join(', ')}.`;
  }

  return { is_stable, deadline_passed, milestones, days_remaining: daysRemaining, summary };
}
