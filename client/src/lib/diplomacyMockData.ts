/**
 * diplomacyMockData.ts — Mock data for all diplomacy systems.
 *
 * Provides realistic test data covering every state:
 *   - Relations: one of each diplomatic state
 *   - Sitdowns: one ACTIVE (in progress), one AGREED, one SNUBBED, one PENDING
 *   - Status effects: alliance-snub debuff, peace-snub buff, NAP-snub debuff
 *   - Political tags: derived from effects
 *   - Invite trackers: one player in full reward, one decayed
 *
 * DEV MODE: Use fastForward() in diplomacyEngine to skip timers.
 */

import type {
  DiplomaticRelation, Sitdown, FamilyStatusEffect, PoliticalTag,
  InviteTracker, SitdownParticipant, SitdownProposal,
} from '../../../shared/diplomacy';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const minsFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

// Family IDs (matching mockData.ts)
export const FAM_CORRADO  = 'fam-1'; // Player's family
export const FAM_FERRANTE = 'fam-2';
export const FAM_WESTSIDE = 'fam-3';
export const FAM_RIZZO    = 'fam-4'; // New family for test

// Player IDs (Don roles)
export const DON_CORRADO  = 'p-boss';
export const DON_FERRANTE = 'p-rival-boss';
export const DON_WESTSIDE = 'p-rival-boss-2';

// ─────────────────────────────────────────────
// DIPLOMATIC RELATIONS
// ─────────────────────────────────────────────

export const MOCK_RELATIONS: DiplomaticRelation[] = [
  {
    id: 'rel-1',
    family_a_id: FAM_CORRADO,
    family_b_id: FAM_FERRANTE,
    state: 'ALLIED',
    initiated_by: FAM_CORRADO,
    state_changed_at: hoursAgo(72),
    next_change_allowed_at: hoursAgo(24), // 48h hold elapsed — can change now
    influence_spent: 200,
  },
  {
    id: 'rel-2',
    family_a_id: FAM_CORRADO,
    family_b_id: FAM_WESTSIDE,
    state: 'NAP',
    initiated_by: FAM_WESTSIDE,
    state_changed_at: hoursAgo(36),
    next_change_allowed_at: hoursAgo(12), // 24h hold elapsed — can change
    influence_spent: 50,
  },
  {
    id: 'rel-3',
    family_a_id: FAM_FERRANTE,
    family_b_id: FAM_WESTSIDE,
    state: 'AT_WAR',
    initiated_by: FAM_FERRANTE,
    state_changed_at: hoursAgo(18),
    next_change_allowed_at: hoursAgo(12), // 6h hold elapsed — can offer peace
    influence_spent: 100,
  },
  {
    id: 'rel-4',
    family_a_id: FAM_CORRADO,
    family_b_id: FAM_RIZZO,
    state: 'NEUTRAL',
    initiated_by: FAM_CORRADO,
    state_changed_at: hoursAgo(48),
    next_change_allowed_at: hoursAgo(48), // No minimum on NEUTRAL
    influence_spent: 0,
  },
];

// ─────────────────────────────────────────────
// SITDOWNS
// ─────────────────────────────────────────────

const activeParticipants: SitdownParticipant[] = [
  { player_id: DON_CORRADO,  family_id: FAM_CORRADO,  role: 'DON',         joined_at: minsAgo(3) },
  { player_id: 'p-consigliere', family_id: FAM_CORRADO, role: 'CONSIGLIERE', joined_at: minsAgo(2) },
  { player_id: DON_FERRANTE, family_id: FAM_FERRANTE, role: 'DON',         joined_at: minsAgo(2) },
];

const activeProposals: SitdownProposal[] = [
  {
    round: 1,
    proposal_type: 'NAP',
    proposed_by_family: FAM_CORRADO,
    proposed_at: minsAgo(2),
    terms_text: 'Non-Aggression Pact for 72 hours. No hostile jobs between our territories.',
    clauses: { duration_hours: 72 },
    response: 'COUNTERED',
    responded_at: minsAgo(1),
  },
  {
    round: 2,
    proposal_type: 'NAP',
    proposed_by_family: FAM_FERRANTE,
    proposed_at: minsAgo(1),
    terms_text: 'Counter: NAP for 48 hours, plus $25K tribute from Corrado.',
    clauses: { duration_hours: 48, tribute_amount: 25000 },
    response: null,
    responded_at: null,
  },
];

export const MOCK_SITDOWNS: Sitdown[] = [
  // ACTIVE — in progress, round 2 awaiting Corrado response
  {
    id: 'sit-1',
    family_a_id: FAM_CORRADO,
    family_b_id: FAM_FERRANTE,
    state: 'ACTIVE',
    proposal_type: 'NAP',
    initiated_by: DON_CORRADO,
    invite_expires_at: hoursFromNow(20),
    session_started_at: minsAgo(3),
    session_expires_at: minsFromNow(7), // 7 mins left in 10-min session
    participants: activeParticipants,
    proposals: activeProposals,
    agreed_proposal_round: null,
    snubbed_by_family: null,
    created_at: minsAgo(5),
    resolved_at: null,
  },
  // AGREED — completed successfully
  {
    id: 'sit-2',
    family_a_id: FAM_CORRADO,
    family_b_id: FAM_WESTSIDE,
    state: 'AGREED',
    proposal_type: 'ALLIANCE',
    initiated_by: DON_WESTSIDE,
    invite_expires_at: hoursAgo(46),
    session_started_at: hoursAgo(48),
    session_expires_at: hoursAgo(47.83),
    participants: [
      { player_id: DON_WESTSIDE, family_id: FAM_WESTSIDE, role: 'DON', joined_at: hoursAgo(48) },
      { player_id: DON_CORRADO,  family_id: FAM_CORRADO,  role: 'DON', joined_at: hoursAgo(48) },
    ],
    proposals: [
      {
        round: 1,
        proposal_type: 'ALLIANCE',
        proposed_by_family: FAM_WESTSIDE,
        proposed_at: hoursAgo(47.9),
        terms_text: 'Full Alliance — joint missions, shared intel.',
        clauses: { joint_jobs_enabled: true },
        response: 'ACCEPTED',
        responded_at: hoursAgo(47.8),
      },
    ],
    agreed_proposal_round: 1,
    snubbed_by_family: null,
    created_at: hoursAgo(48),
    resolved_at: hoursAgo(47.8),
  },
  // SNUBBED — Rizzo never joined
  {
    id: 'sit-3',
    family_a_id: FAM_CORRADO,
    family_b_id: FAM_RIZZO,
    state: 'SNUBBED',
    proposal_type: 'ALLIANCE',
    initiated_by: DON_CORRADO,
    invite_expires_at: hoursAgo(1),
    session_started_at: null,
    session_expires_at: null,
    participants: [
      { player_id: DON_CORRADO, family_id: FAM_CORRADO, role: 'DON', joined_at: hoursAgo(25) },
    ],
    proposals: [],
    agreed_proposal_round: null,
    snubbed_by_family: FAM_RIZZO,
    created_at: hoursAgo(26),
    resolved_at: hoursAgo(1),
  },
  // PENDING — Waiting for Ferrante to accept room for a PEACE offer
  {
    id: 'sit-4',
    family_a_id: FAM_WESTSIDE,
    family_b_id: FAM_FERRANTE,
    state: 'PENDING',
    proposal_type: 'PEACE',
    initiated_by: DON_WESTSIDE,
    invite_expires_at: hoursFromNow(22),
    session_started_at: null,
    session_expires_at: null,
    participants: [
      { player_id: DON_WESTSIDE, family_id: FAM_WESTSIDE, role: 'DON', joined_at: minsAgo(30) },
    ],
    proposals: [],
    agreed_proposal_round: null,
    snubbed_by_family: null,
    created_at: minsAgo(30),
    resolved_at: null,
  },
];

// ─────────────────────────────────────────────
// STATUS EFFECTS
// ─────────────────────────────────────────────

export const MOCK_STATUS_EFFECTS: FamilyStatusEffect[] = [
  // Rizzo snubbed Corrado's alliance → Rizzo gets debuff
  {
    id: 'eff-1',
    family_id: FAM_RIZZO,
    effect_type: 'SNUBBED_ALLIANCE_DEBUFF',
    target_family_id: null,
    description: 'Snubbed Alliance offer from The Corrado Family. Income and influence reduced.',
    modifiers: {
      cash_income_pct: -0.15,
      influence_gain_pct: -0.20,
      alliance_cost_pct: +0.25,
    },
    expires_at: hoursFromNow(36),
    created_at: hoursAgo(12),
    source_sitdown_id: 'sit-3',
  },
  // Corrado gets offensive buff vs Rizzo (A gets buff after B snubs alliance)
  {
    id: 'eff-2',
    family_id: FAM_CORRADO,
    effect_type: 'PEACE_SNUB_OFFENSIVE_BUFF',
    target_family_id: FAM_RIZZO,
    description: 'Rizzo snubbed your Alliance offer. Offensive contracts vs Rizzo are discounted.',
    modifiers: {
      contract_cost_pct: -0.25,
      attack_success_pct: +0.10,
    },
    expires_at: hoursFromNow(36),
    created_at: hoursAgo(12),
    source_sitdown_id: 'sit-3',
  },
];

// ─────────────────────────────────────────────
// POLITICAL TAGS (per family, computed)
// ─────────────────────────────────────────────

export const MOCK_POLITICAL_TAGS: Record<string, PoliticalTag[]> = {
  [FAM_CORRADO]: [
    {
      id: 'HONORED_ALLY',
      label: 'Honored Ally',
      description: 'Has honored alliances and responded to every Sitdown.',
      expires_at: null,
      is_negative: false,
    },
    {
      id: 'RELIABLE_NEGOTIATOR',
      label: 'Reliable Negotiator',
      description: 'Responded to all Sitdown invitations within 24 hours.',
      expires_at: null,
      is_negative: false,
    },
  ],
  [FAM_FERRANTE]: [
    {
      id: 'WAR_MONGER',
      label: 'War Monger',
      description: 'Declared war on West Side Outfit without prior diplomatic engagement.',
      expires_at: hoursFromNow(48),
      is_negative: true,
    },
  ],
  [FAM_WESTSIDE]: [
    {
      id: 'PEACEMAKER',
      label: 'Peacemaker',
      description: 'Offered peace terms despite being at war. Shows willingness to negotiate.',
      expires_at: null,
      is_negative: false,
    },
  ],
  [FAM_RIZZO]: [
    {
      id: 'SNUBBED_ALLIANCE',
      label: 'Snubbed Alliance',
      description: 'Ignored an Alliance Sitdown from The Corrado Family. Income and influence penalized.',
      expires_at: hoursFromNow(36),
      target_family_name: 'The Corrado Family',
      is_negative: true,
    },
    {
      id: 'POLITICAL_INSTABILITY',
      label: 'Political Instability',
      description: 'Recent diplomatic snubs indicate unreliable leadership.',
      expires_at: hoursFromNow(48),
      is_negative: true,
    },
  ],
};

// ─────────────────────────────────────────────
// INVITE TRACKERS (per player)
// ─────────────────────────────────────────────

export const MOCK_INVITE_TRACKERS: Record<string, InviteTracker> = {
  'p-soldier': {
    player_id: 'p-soldier',
    completions_12h: [hoursAgo(1), hoursAgo(2), hoursAgo(3)],
    count_12h: 3,
    reward_multiplier: 1.0, // Still full reward
  },
  'p-capo': {
    player_id: 'p-capo',
    completions_12h: [hoursAgo(0.5), hoursAgo(1), hoursAgo(2), hoursAgo(3), hoursAgo(4)],
    count_12h: 5,
    reward_multiplier: 0.5, // Decayed to 50%
  },
  'p-associate': {
    player_id: 'p-associate',
    completions_12h: [],
    count_12h: 0,
    reward_multiplier: 1.0, // Fresh
  },
};

// ─────────────────────────────────────────────
// DEV MODE shortcuts
// ─────────────────────────────────────────────

/** Dev-only: spawn two families with the current player as Don in both (for testing) */
export const DEV_TEST_FAMILIES = [
  { id: FAM_CORRADO,  name: 'The Corrado Family', don_id: DON_CORRADO },
  { id: FAM_FERRANTE, name: 'The Ferrante Crew',  don_id: DON_FERRANTE },
];
