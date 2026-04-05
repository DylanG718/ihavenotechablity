/**
 * opsData.ts — Mock/seed data for the MafiaLife operating systems layer.
 *
 * Covers:
 *  - Notifications (MOCK_NOTIFICATIONS)
 *  - Family activity feed (MOCK_FAMILY_FEED)
 *  - World activity feed (MOCK_WORLD_FEED)
 *  - Economy sinks (ECONOMY_SINKS)
 *  - Contribution scores (MOCK_CONTRIBUTION_SCORES)
 *  - Promotion history (MOCK_PROMOTION_HISTORY)
 *  - Onboarding states (MOCK_ONBOARDING_STATES)
 *  - Live-ops events (LIVE_OPS_EVENTS)
 *  - Abuse rules (ABUSE_RULES)
 *  - Season rollover config (SEASON_ROLLOVER_CONFIG)
 *  - Analytics log (ANALYTICS_LOG)
 */

import type {
  PlayerNotification,
  FamilyActivityEvent,
  WorldActivityEvent,
  EconomySink,
  ContributionScore,
  PromotionRecord,
  OnboardingState,
  LiveOpEvent,
  AbuseRuleConfig,
  SeasonRolloverConfig,
  AnalyticsEvent,
} from '../../../shared/ops';

// ─────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: PlayerNotification[] = [
  {
    id: 'n-001',
    playerId: 'p-boss',
    type: 'WAR_DECLARED',
    title: 'War Declared',
    body: 'The Ferrante Crew has declared war on the Corrado Family. All members on high alert.',
    read: false,
    createdAt: '2026-04-04T10:00:00Z',
    relatedEntityId: 'fam-2',
    relatedEntityType: 'family',
  },
  {
    id: 'n-002',
    playerId: 'p-boss',
    type: 'TURF_ATTACK_INCOMING',
    title: 'Turf Attack Incoming',
    body: 'South Port district is under threat. Ferrante soldiers spotted in the area.',
    read: false,
    createdAt: '2026-04-04T09:45:00Z',
    relatedEntityId: 'district-south-port',
    relatedEntityType: 'district',
  },
  {
    id: 'n-003',
    playerId: 'p-boss',
    type: 'PASSIVE_INCOME_PAYOUT',
    title: 'Passive Income Payout',
    body: 'The Waterfront Casino generated $12,400 in passive income. Deposited to family treasury.',
    read: false,
    createdAt: '2026-04-04T06:00:00Z',
    relatedEntityId: 'front-casino-1',
    relatedEntityType: 'front',
  },
  {
    id: 'n-004',
    playerId: 'p-boss',
    type: 'NEW_CHAIN_MESSAGE',
    title: 'New Message from Sal the Fist',
    body: 'The Underboss sent a chain message regarding territory coverage during the conflict.',
    read: false,
    createdAt: '2026-04-03T22:15:00Z',
    relatedEntityId: 'msg-chain-001',
    relatedEntityType: 'message',
  },
  {
    id: 'n-005',
    playerId: 'p-boss',
    type: 'RANK_ELIGIBLE',
    title: 'Promotion Eligible: Tommy Two-Times',
    body: 'Tommy Two-Times has met all thresholds for promotion to Underboss. Awaiting your appointment.',
    read: false,
    createdAt: '2026-04-03T18:00:00Z',
    relatedEntityId: 'p-capo',
    relatedEntityType: 'player',
  },
  {
    id: 'n-006',
    playerId: 'p-boss',
    type: 'DIPLOMACY_STATE_CHANGED',
    title: 'Diplomacy: Truce Expired',
    body: 'The truce with the West Side Outfit has expired. Diplomatic status reverted to Neutral.',
    read: true,
    createdAt: '2026-04-03T00:00:00Z',
    relatedEntityId: 'fam-3',
    relatedEntityType: 'family',
  },
  {
    id: 'n-007',
    playerId: 'p-boss',
    type: 'NEW_FAMILY_BOARD_POST',
    title: 'New Post on Family Board',
    body: 'The Counselor posted a strategic update: "Priority targets for this week identified."',
    read: true,
    createdAt: '2026-04-02T14:30:00Z',
    relatedEntityId: 'post-board-042',
    relatedEntityType: 'board_post',
  },
  {
    id: 'n-008',
    playerId: 'p-boss',
    type: 'SEASON_ENDING_SOON',
    title: 'Season 3 Ending in 4 Days',
    body: 'The current season ends in 4 days. Snapshot rankings will lock. Secure your position.',
    read: true,
    createdAt: '2026-04-01T08:00:00Z',
    relatedEntityId: 'season-3',
    relatedEntityType: 'season',
  },
  {
    id: 'n-009',
    playerId: 'p-boss',
    type: 'BUSINESS_ASSIGNMENT_ADDED',
    title: 'Luca B Assigned to Numbers Parlor',
    body: 'Sal the Fist assigned Luca B to Slot 2 of the South Side Numbers Parlor.',
    read: true,
    createdAt: '2026-03-31T11:00:00Z',
    relatedEntityId: 'front-numbers-1',
    relatedEntityType: 'front',
  },
  {
    id: 'n-010',
    playerId: 'p-boss',
    type: 'STASH_ROBBERY_ATTEMPTED',
    title: 'Stash Robbery Attempted',
    body: 'An unknown player attempted to rob your stash. Security measures held — no loss.',
    read: true,
    createdAt: '2026-03-30T03:22:00Z',
    relatedEntityId: null,
    relatedEntityType: null,
  },
  // Associate player notifications (for mid-onboarding state)
  {
    id: 'n-011',
    playerId: 'p-associate',
    type: 'FAMILY_APPLICATION_ACCEPTED',
    title: 'Welcome to the Corrado Family',
    body: 'Your application has been accepted. You are now an Associate. Prove your worth.',
    read: false,
    createdAt: '2026-01-15T10:00:00Z',
    relatedEntityId: 'fam-1',
    relatedEntityType: 'family',
  },
  {
    id: 'n-012',
    playerId: 'p-associate',
    type: 'BUSINESS_ASSIGNMENT_ADDED',
    title: 'Assigned to South Side Numbers Parlor',
    body: 'You have been assigned to a business slot. Report for your first shift.',
    read: false,
    createdAt: '2026-01-16T08:00:00Z',
    relatedEntityId: 'front-numbers-1',
    relatedEntityType: 'front',
  },
];

// ─────────────────────────────────────────────
// FAMILY ACTIVITY FEED
// ─────────────────────────────────────────────

export const MOCK_FAMILY_FEED: FamilyActivityEvent[] = [
  {
    id: 'faf-001',
    familyId: 'fam-1',
    type: 'WAR_STARTED',
    actorAlias: 'Don Corrado',
    actorRole: 'BOSS',
    description: 'Don Corrado declared war on the Ferrante Crew after repeated turf incursions.',
    timestamp: '2026-04-04T10:05:00Z',
    metadata: { targetFamilyId: 'fam-2', targetFamilyName: 'Ferrante Crew' },
  },
  {
    id: 'faf-002',
    familyId: 'fam-1',
    type: 'TURF_PURCHASED',
    actorAlias: 'Don Corrado',
    actorRole: 'BOSS',
    description: 'South Port docks district added to family holdings. Cost: $85,000.',
    timestamp: '2026-04-03T14:00:00Z',
    metadata: { districtId: 'district-south-port', cost: 85000 },
  },
  {
    id: 'faf-003',
    familyId: 'fam-1',
    type: 'MEMBER_PROMOTED',
    actorAlias: 'Sal the Fist',
    actorRole: 'UNDERBOSS',
    description: 'Vinnie D promoted from Associate to Soldier after consistent performance.',
    timestamp: '2026-04-02T18:00:00Z',
    metadata: { targetPlayerId: 'p-soldier', fromRank: 'ASSOCIATE', toRank: 'SOLDIER' },
  },
  {
    id: 'faf-004',
    familyId: 'fam-1',
    type: 'FRONT_UPGRADED',
    actorAlias: 'Sal the Fist',
    actorRole: 'UNDERBOSS',
    description: 'Waterfront Casino upgraded to Tier 3. Passive income increased by $4,200/day.',
    timestamp: '2026-04-02T11:30:00Z',
    metadata: { frontId: 'front-casino-1', newTier: 3, incomeGain: 4200 },
  },
  {
    id: 'faf-005',
    familyId: 'fam-1',
    type: 'BUSINESS_JOB_COMPLETED',
    actorAlias: 'Tommy Two-Times',
    actorRole: 'CAPO',
    description: 'Completed exclusive job "Fix the Slot Machines" at the Waterfront Casino. Earned $18,500.',
    timestamp: '2026-04-01T20:00:00Z',
    metadata: { frontId: 'front-casino-1', jobName: 'Fix the Slot Machines', earnings: 18500 },
  },
  {
    id: 'faf-006',
    familyId: 'fam-1',
    type: 'CREW_CREATED',
    actorAlias: 'Sal the Fist',
    actorRole: 'UNDERBOSS',
    description: 'New crew "South Port Soldiers" established under Sal the Fist.',
    timestamp: '2026-04-01T09:00:00Z',
    metadata: { crewId: 'crew-south-port', crewName: 'South Port Soldiers' },
  },
  {
    id: 'faf-007',
    familyId: 'fam-1',
    type: 'MEMBER_JOINED',
    actorAlias: 'Joey Socks',
    actorRole: 'RECRUIT',
    description: 'Joey Socks accepted into the family as a Recruit. Sponsored by Tommy Two-Times.',
    timestamp: '2026-04-01T08:00:00Z',
    metadata: { sponsorAlias: 'Tommy Two-Times', newPlayerId: 'p-recruit' },
  },
  {
    id: 'faf-008',
    familyId: 'fam-1',
    type: 'FRONT_BUILT',
    actorAlias: 'Don Corrado',
    actorRole: 'BOSS',
    description: 'New front "Harbor Freight Co." established on South Port turf.',
    timestamp: '2026-03-30T16:00:00Z',
    metadata: { frontId: 'front-freight-1', districtId: 'district-south-port', cost: 45000 },
  },
  {
    id: 'faf-009',
    familyId: 'fam-1',
    type: 'DIPLOMACY_CHANGED',
    actorAlias: 'The Counselor',
    actorRole: 'CONSIGLIERE',
    description: 'Truce with West Side Outfit has expired. Status returned to Neutral.',
    timestamp: '2026-03-28T00:00:00Z',
    metadata: { targetFamilyId: 'fam-3', previousStatus: 'TRUCE', newStatus: 'NEUTRAL' },
  },
  {
    id: 'faf-010',
    familyId: 'fam-1',
    type: 'TREASURY_LARGE_WITHDRAWAL',
    actorAlias: 'Sal the Fist',
    actorRole: 'UNDERBOSS',
    description: 'Large treasury withdrawal of $50,000. Purpose: front upgrade financing.',
    timestamp: '2026-03-27T14:00:00Z',
    metadata: { amount: 50000, approvedBy: 'Don Corrado' },
  },
  {
    id: 'faf-011',
    familyId: 'fam-1',
    type: 'MEMBER_LEFT',
    actorAlias: 'Frankie Nails',
    actorRole: 'SOLDIER',
    description: 'Frankie Nails left the family. Went unaffiliated.',
    timestamp: '2026-03-25T20:00:00Z',
    metadata: { playerId: 'p-frankie', reason: 'VOLUNTARY' },
  },
  {
    id: 'faf-012',
    familyId: 'fam-1',
    type: 'LEADERSHIP_CHANGED',
    actorAlias: 'Don Corrado',
    actorRole: 'BOSS',
    description: 'The Counselor appointed as Consigliere by Don Corrado.',
    timestamp: '2026-03-20T12:00:00Z',
    metadata: { targetPlayerId: 'p-consigliere', newRole: 'CONSIGLIERE' },
  },
];

// ─────────────────────────────────────────────
// WORLD ACTIVITY FEED
// ─────────────────────────────────────────────

export const MOCK_WORLD_FEED: WorldActivityEvent[] = [
  {
    id: 'waf-001',
    type: 'OBITUARY',
    headline: 'Frankie "The Nail" Deluca — Eliminated',
    detail: 'Contract fulfilled. The Nail was found at Pier 17. No witnesses. The Cardinal collects.',
    timestamp: '2026-04-04T08:00:00Z',
    familyId: 'fam-2',
    districtId: 'district-south-port',
  },
  {
    id: 'waf-002',
    type: 'MAJOR_WAR_ENDED',
    headline: 'War Concluded: Corrado vs. Moretti',
    detail: 'After 11 days of conflict, the Moretti Faction has surrendered. Corrado Family claims Eastside turf.',
    timestamp: '2026-04-03T22:00:00Z',
    familyId: 'fam-1',
    districtId: 'district-eastside',
  },
  {
    id: 'waf-003',
    type: 'FAMILY_RANK_CHANGE',
    headline: 'Corrado Family Claims #1 Rank',
    detail: 'With the Eastside victory, The Corrado Family now leads all season rankings with 8,420 power.',
    timestamp: '2026-04-03T22:05:00Z',
    familyId: 'fam-1',
    districtId: null,
  },
  {
    id: 'waf-004',
    type: 'DISTRICT_CONTROL_CHANGE',
    headline: 'South Port District: Corrado Control Established',
    detail: 'Following turf acquisition, the Corrado Family now controls the South Port district.',
    timestamp: '2026-04-03T14:30:00Z',
    familyId: 'fam-1',
    districtId: 'district-south-port',
  },
  {
    id: 'waf-005',
    type: 'WITNESS_PROTECTION',
    headline: 'Player "Ghost" Entered Witness Protection',
    detail: 'An unaffiliated player has entered witness protection and been erased from the record.',
    timestamp: '2026-04-02T03:00:00Z',
    familyId: null,
    districtId: null,
  },
  {
    id: 'waf-006',
    type: 'FAMILY_DISSOLVED',
    headline: 'The Moretti Faction Dissolved',
    detail: 'With their boss eliminated and treasury seized, the Moretti Faction has disbanded.',
    timestamp: '2026-04-01T16:00:00Z',
    familyId: null,
    districtId: null,
  },
  {
    id: 'waf-007',
    type: 'SEASON_STARTED',
    headline: 'Season 3 Underway',
    detail: 'A new season has begun. Rankings reset. The streets are open — who will claim the top?',
    timestamp: '2026-03-01T00:00:00Z',
    familyId: null,
    districtId: null,
  },
  {
    id: 'waf-008',
    type: 'SEASON_ENDED',
    headline: 'Season 2 Concluded — Ferrante Crew Won',
    detail: 'The Ferrante Crew dominated Season 2 with 11,200 final power. All rankings have been snapshotted.',
    timestamp: '2026-02-28T23:59:00Z',
    familyId: 'fam-2',
    districtId: null,
  },
];

// ─────────────────────────────────────────────
// ECONOMY SINKS
// ─────────────────────────────────────────────

export const ECONOMY_SINKS: EconomySink[] = [
  {
    id: 'sink-turf-purchase',
    name: 'Turf Purchase',
    description: 'One-time cost to claim an unclaimed or enemy district.',
    category: 'EXPANSION',
    baseCost: 50000,
    costFormula: '50,000 base + 10,000 per contested defense round',
    payer: 'FAMILY',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Largest single spend for early-game families. Scales with district prestige.',
  },
  {
    id: 'sink-front-build',
    name: 'Front Construction',
    description: 'Build a new front business on owned turf.',
    category: 'EXPANSION',
    baseCost: 25000,
    costFormula: '25,000 base × front_type_multiplier (1x–2.5x)',
    payer: 'FAMILY',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Casino fronts cost up to 2.5x base. Pawn shop at 1x.',
  },
  {
    id: 'sink-front-upgrade',
    name: 'Front Upgrade (Tier +1)',
    description: 'Upgrade an existing front to the next income tier.',
    category: 'EXPANSION',
    baseCost: 15000,
    costFormula: '15,000 × current_tier (Tier 1→2: $15K, Tier 2→3: $30K)',
    payer: 'FAMILY',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Max tier 3. Each upgrade increases passive income by ~40%.',
  },
  {
    id: 'sink-front-maintenance',
    name: 'Front Daily Maintenance',
    description: 'Daily operating cost to keep fronts generating income.',
    category: 'OPERATIONS',
    baseCost: 500,
    costFormula: '500 × tier_level per front, deducted from treasury daily',
    payer: 'FAMILY',
    recurring: true,
    recurringPeriodHours: 24,
    notes: 'Neglecting maintenance for 3+ days pauses income generation.',
  },
  {
    id: 'sink-jail-bribe',
    name: 'Jail Bribe',
    description: 'Pay a bribe to reduce sentence or secure early release.',
    category: 'OPERATIONS',
    baseCost: 5000,
    costFormula: '5,000 base + (sentence_hours × 200)',
    payer: 'PLAYER',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Higher tiers require exponentially more. County Jail min $5K, Federal $50K+.',
  },
  {
    id: 'sink-wp-penalty',
    name: 'Witness Protection Entry',
    description: 'Cost to enter witness protection (player-triggered reset).',
    category: 'PENALTY',
    baseCost: 0,
    costFormula: '50% of current stash forfeited as fee',
    payer: 'PLAYER',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Identity reset, family ties severed. Major economic drain to discourage abuse.',
  },
  {
    id: 'sink-hitman-contract',
    name: 'Hitman Contract Posting',
    description: 'Cost to post a kill contract on a target player.',
    category: 'OPERATIONS',
    baseCost: 10000,
    costFormula: '10,000 minimum + negotiated price with hitman',
    payer: 'FAMILY',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Escrow held until contract outcome. On failure, partial refund.',
  },
  {
    id: 'sink-diplomacy-proposal',
    name: 'Diplomacy Proposal Fee',
    description: 'Nominal fee to initiate a formal diplomatic action.',
    category: 'DIPLOMACY',
    baseCost: 2000,
    costFormula: 'Flat $2,000 per proposal. Refunded if accepted.',
    payer: 'FAMILY',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Discourages spam proposals. Truce, alliance, and peace all require this.',
  },
  {
    id: 'sink-war-declaration',
    name: 'War Declaration Bond',
    description: 'Bond posted when declaring war, forfeited if you lose.',
    category: 'DIPLOMACY',
    baseCost: 20000,
    costFormula: 'Flat $20,000 bond per war declaration',
    payer: 'FAMILY',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Losing family forfeits bond to winning family. Incentivizes careful escalation.',
  },
  {
    id: 'sink-crew-creation',
    name: 'Crew Creation',
    description: 'Administrative cost to formally register a new crew.',
    category: 'OPERATIONS',
    baseCost: 5000,
    costFormula: 'Flat $5,000 per crew',
    payer: 'FAMILY',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Sinks treasury on expansion. Max 3 crews per family.',
  },
  {
    id: 'sink-stash-insurance',
    name: 'Stash Insurance',
    description: 'Optional weekly premium to insure stash against robbery attempts.',
    category: 'PROTECTION',
    baseCost: 1000,
    costFormula: '2% of stash value per week (min $1,000)',
    payer: 'PLAYER',
    recurring: true,
    recurringPeriodHours: 168,
    notes: 'Covers 80% of losses from successful stash robbery. Opt-in only.',
  },
  {
    id: 'sink-armory-restock',
    name: 'Armory Restock',
    description: 'Player cost to restock weapons and armor after PvP.',
    category: 'OPERATIONS',
    baseCost: 3000,
    costFormula: 'Varies by loadout. Standard restock: $3K–$12K.',
    payer: 'PLAYER',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Prevents weapon hoarding. All loadouts degrade after combat.',
  },
  {
    id: 'sink-treasury-withdrawal-fee',
    name: 'Treasury Withdrawal Fee',
    description: 'Small fee on large treasury withdrawals to prevent draining.',
    category: 'PENALTY',
    baseCost: 0,
    costFormula: '3% fee on withdrawals over $25,000',
    payer: 'FAMILY',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Applied to Underboss/Boss withdrawals. Encourages operational spending.',
  },
  {
    id: 'sink-sleep-mode',
    name: 'Sleep Mode Activation',
    description: 'Cost to put a player account in sleep/vacation mode.',
    category: 'PROTECTION',
    baseCost: 500,
    costFormula: 'Flat $500 activation fee per session',
    payer: 'PLAYER',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Prevents abuse cycling. Provides protection at small cost.',
  },
  {
    id: 'sink-district-defense',
    name: 'District Defense Upkeep',
    description: 'Ongoing cost to maintain active defenses on controlled turf.',
    category: 'PROTECTION',
    baseCost: 2000,
    costFormula: '2,000 per district per day. Scales with defense tier.',
    payer: 'FAMILY',
    recurring: true,
    recurringPeriodHours: 24,
    notes: 'Dropping below maintenance threshold exposes turf to cheaper attacks.',
  },
  {
    id: 'sink-black-market',
    name: 'Black Market Purchases',
    description: 'Variable player spend on black market items (weapons, intel, forged papers).',
    category: 'OPERATIONS',
    baseCost: 2000,
    costFormula: 'Item-dependent. Range: $2,000–$80,000.',
    payer: 'PLAYER',
    recurring: false,
    recurringPeriodHours: null,
    notes: 'Major sink for mid-game cash. Items depreciate over time.',
  },
];

// ─────────────────────────────────────────────
// CONTRIBUTION SCORES
// ─────────────────────────────────────────────

export const MOCK_CONTRIBUTION_SCORES: ContributionScore[] = [
  {
    playerId: 'p-boss',
    jobsCompleted: 142,
    missionsCompleted: 48,
    moneyEarned: 1250000,
    businessJobsCompleted: 62,
    passiveIncomeGenerated: 420000,
    loyaltyDays: 93,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-04-04T12:00:00Z',
  },
  {
    playerId: 'p-underboss',
    jobsCompleted: 98,
    missionsCompleted: 35,
    moneyEarned: 680000,
    businessJobsCompleted: 44,
    passiveIncomeGenerated: 210000,
    loyaltyDays: 91,
    createdAt: '2026-01-03T00:00:00Z',
    updatedAt: '2026-04-04T12:00:00Z',
  },
  {
    playerId: 'p-consigliere',
    jobsCompleted: 55,
    missionsCompleted: 22,
    moneyEarned: 310000,
    businessJobsCompleted: 28,
    passiveIncomeGenerated: 95000,
    loyaltyDays: 90,
    createdAt: '2026-01-04T00:00:00Z',
    updatedAt: '2026-04-04T12:00:00Z',
  },
  {
    playerId: 'p-capo',
    jobsCompleted: 72,
    missionsCompleted: 28,
    moneyEarned: 420000,
    businessJobsCompleted: 38,
    passiveIncomeGenerated: 140000,
    loyaltyDays: 89,
    createdAt: '2026-01-05T00:00:00Z',
    updatedAt: '2026-04-04T12:00:00Z',
  },
  {
    playerId: 'p-soldier',
    jobsCompleted: 38,
    missionsCompleted: 14,
    moneyEarned: 185000,
    businessJobsCompleted: 18,
    passiveIncomeGenerated: 42000,
    loyaltyDays: 84,
    createdAt: '2026-01-10T00:00:00Z',
    updatedAt: '2026-04-04T12:00:00Z',
  },
  {
    playerId: 'p-associate',
    jobsCompleted: 12,
    missionsCompleted: 5,
    moneyEarned: 42000,
    businessJobsCompleted: 6,
    passiveIncomeGenerated: 8500,
    loyaltyDays: 79,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-04-04T12:00:00Z',
  },
  {
    playerId: 'p-recruit',
    jobsCompleted: 2,
    missionsCompleted: 1,
    moneyEarned: 4200,
    businessJobsCompleted: 0,
    passiveIncomeGenerated: 0,
    loyaltyDays: 63,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-04-04T12:00:00Z',
  },
];

// ─────────────────────────────────────────────
// PROMOTION HISTORY
// ─────────────────────────────────────────────

export const MOCK_PROMOTION_HISTORY: PromotionRecord[] = [
  {
    id: 'promo-001',
    playerId: 'p-underboss',
    fromRank: 'CAPO',
    toRank: 'UNDERBOSS',
    reason: 'LEADERSHIP_APPOINTMENT',
    grantedByPlayerId: 'p-boss',
    note: 'Sal proven in war. Made Underboss after the Eastside campaign.',
    timestamp: '2026-02-15T18:00:00Z',
  },
  {
    id: 'promo-002',
    playerId: 'p-consigliere',
    fromRank: 'SOLDIER',
    toRank: 'CONSIGLIERE',
    reason: 'LEADERSHIP_APPOINTMENT',
    grantedByPlayerId: 'p-boss',
    note: 'Enzo has the mind for strategy. Appointed Consigliere by Don Corrado.',
    timestamp: '2026-03-20T12:00:00Z',
  },
  {
    id: 'promo-003',
    playerId: 'p-capo',
    fromRank: 'SOLDIER',
    toRank: 'CAPO',
    reason: 'MERIT_APPROVED',
    grantedByPlayerId: 'p-underboss',
    note: 'Tommy ran the South Side operation without oversight. Earned the rank.',
    timestamp: '2026-02-01T09:00:00Z',
  },
  {
    id: 'promo-004',
    playerId: 'p-soldier',
    fromRank: 'ASSOCIATE',
    toRank: 'SOLDIER',
    reason: 'THRESHOLD_REACHED',
    grantedByPlayerId: 'p-capo',
    note: 'Vinnie hit all thresholds. Straightforward promotion.',
    timestamp: '2026-03-15T14:00:00Z',
  },
  {
    id: 'promo-005',
    playerId: 'p-associate',
    fromRank: 'RECRUIT',
    toRank: 'ASSOCIATE',
    reason: 'THRESHOLD_REACHED',
    grantedByPlayerId: 'p-capo',
    note: 'Luca completed probation requirements. Welcomed as Associate.',
    timestamp: '2026-02-10T10:00:00Z',
  },
];

// ─────────────────────────────────────────────
// ONBOARDING STATES
// ─────────────────────────────────────────────

export const MOCK_ONBOARDING_STATES: Record<string, OnboardingState> = {
  'p-associate': {
    playerId: 'p-associate',
    currentStep: 'STASH_INTRO',
    completedSteps: ['INTRO', 'ARCHETYPE_CHOICE', 'FIRST_JOB', 'FAMILY_INTRO', 'APPLY_OR_INVITED'],
    startedAt: '2026-01-15T09:00:00Z',
    completedAt: null,
    skipped: false,
  },
  'p-boss': {
    playerId: 'p-boss',
    currentStep: 'COMPLETED',
    completedSteps: [
      'INTRO', 'ARCHETYPE_CHOICE', 'FIRST_JOB', 'FAMILY_INTRO',
      'APPLY_OR_INVITED', 'STASH_INTRO', 'DASHBOARD_TOUR', 'COMPLETED',
    ],
    startedAt: '2026-01-01T09:00:00Z',
    completedAt: '2026-01-01T09:45:00Z',
    skipped: false,
  },
};

// ─────────────────────────────────────────────
// LIVE-OPS EVENTS
// ─────────────────────────────────────────────

export const LIVE_OPS_EVENTS: LiveOpEvent[] = [
  {
    id: 'lop-001',
    name: 'Casino Weekend',
    description: 'All casino-type fronts generate 50% more passive income through Sunday.',
    flavor: 'The chips are hot. The tables are packed. Cash flows like water.',
    scope: 'FRONT_TYPE',
    scopeTargetId: 'CASINO',
    modifiers: [
      { type: 'INCOME_MULTIPLIER', multiplier: 1.5, targetId: 'CASINO' },
    ],
    startAt: '2026-04-04T00:00:00Z',
    endAt: '2026-04-06T23:59:00Z',
    active: true,
    adminTriggered: false,
    createdAt: '2026-04-01T10:00:00Z',
  },
  {
    id: 'lop-002',
    name: 'Waterfront Crackdown',
    description: 'Police presence in the South Port district is surging. Jail risk up 75%, income down 30%.',
    flavor: 'Feds are everywhere at the docks. Keep your head down.',
    scope: 'DISTRICT',
    scopeTargetId: 'district-south-port',
    modifiers: [
      { type: 'JAIL_RISK_MULTIPLIER', multiplier: 1.75, targetId: 'district-south-port' },
      { type: 'INCOME_MULTIPLIER', multiplier: 0.7, targetId: 'district-south-port' },
    ],
    startAt: '2026-04-03T00:00:00Z',
    endAt: '2026-04-07T23:59:00Z',
    active: true,
    adminTriggered: true,
    createdAt: '2026-04-02T20:00:00Z',
  },
  {
    id: 'lop-003',
    name: 'Blood Moon Weekend',
    description: 'All PvP actions generate 2x prestige. War declarations discounted 50%.',
    flavor: 'Something in the air. Old debts get settled under a blood moon.',
    scope: 'WORLD',
    scopeTargetId: null,
    modifiers: [
      { type: 'PRESTIGE_BONUS', multiplier: 2.0, targetId: null },
      { type: 'BUILD_COST_MULTIPLIER', multiplier: 0.5, targetId: null },
    ],
    startAt: '2026-03-28T00:00:00Z',
    endAt: '2026-03-30T23:59:00Z',
    active: false,
    adminTriggered: false,
    createdAt: '2026-03-25T10:00:00Z',
  },
  {
    id: 'lop-004',
    name: 'XP Boost: Season Push',
    description: 'All job completions grant 1.5x XP for the final week of the season.',
    flavor: 'The finish line is in sight. Earn your place.',
    scope: 'WORLD',
    scopeTargetId: null,
    modifiers: [
      { type: 'XP_MULTIPLIER', multiplier: 1.5, targetId: null },
    ],
    startAt: '2026-02-21T00:00:00Z',
    endAt: '2026-02-28T23:59:00Z',
    active: false,
    adminTriggered: false,
    createdAt: '2026-02-18T10:00:00Z',
  },
  {
    id: 'lop-005',
    name: 'Heat Reduction Week',
    description: 'Heat accumulation reduced by 50% for all players. Good week to run hot jobs.',
    flavor: 'The cops are distracted. Now is the time.',
    scope: 'WORLD',
    scopeTargetId: null,
    modifiers: [
      { type: 'HEAT_MULTIPLIER', multiplier: 0.5, targetId: null },
    ],
    startAt: '2026-03-10T00:00:00Z',
    endAt: '2026-03-16T23:59:00Z',
    active: false,
    adminTriggered: true,
    createdAt: '2026-03-09T16:00:00Z',
  },
  {
    id: 'lop-006',
    name: 'Numbers Racket Surge',
    description: 'All gambling-type fronts earn 40% more for 48 hours.',
    flavor: 'The numbers are hot. Every parlor is printing money.',
    scope: 'FRONT_TYPE',
    scopeTargetId: 'NUMBERS_PARLOR',
    modifiers: [
      { type: 'INCOME_MULTIPLIER', multiplier: 1.4, targetId: 'NUMBERS_PARLOR' },
    ],
    startAt: '2026-02-14T00:00:00Z',
    endAt: '2026-02-15T23:59:00Z',
    active: false,
    adminTriggered: false,
    createdAt: '2026-02-12T10:00:00Z',
  },
];

// ─────────────────────────────────────────────
// ABUSE RULES
// ─────────────────────────────────────────────

export const ABUSE_RULES: AbuseRuleConfig[] = [
  {
    flag: 'SPAM_INVITE',
    description: 'Player sends excessive family invitations in a short window.',
    thresholdValue: 10,
    thresholdWindowHours: 1,
    consequenceType: 'RATE_LIMIT',
    cooldownHours: 24,
    notes: 'Rate limit invite-sending. 10 per hour max. Prevents new-player spam campaigns.',
  },
  {
    flag: 'SPAM_APPLICATION',
    description: 'Player submits excessive family applications in a short window.',
    thresholdValue: 5,
    thresholdWindowHours: 1,
    consequenceType: 'COOLDOWN',
    cooldownHours: 6,
    notes: 'No more than 5 applications per hour. Prevent trolling family boards.',
  },
  {
    flag: 'SPAM_MESSAGE',
    description: 'Player sends excessive chain messages in a short window.',
    thresholdValue: 20,
    thresholdWindowHours: 1,
    consequenceType: 'RATE_LIMIT',
    cooldownHours: 4,
    notes: 'Max 20 messages per hour. Comms are asynchronous — this is generous.',
  },
  {
    flag: 'TREASURY_INSTANT_DRAIN',
    description: 'Family treasury drained rapidly in a single session (possible rogue Underboss).',
    thresholdValue: 75,
    thresholdWindowHours: 1,
    consequenceType: 'FLAG_FOR_REVIEW',
    cooldownHours: 0,
    notes: 'Flag if >75% of treasury withdrawn in <1h. Admin reviews and can reverse.',
  },
  {
    flag: 'HIGH_FREQUENCY_EARNING',
    description: 'Player completing jobs at suspicious speed (possible automation).',
    thresholdValue: 30,
    thresholdWindowHours: 1,
    consequenceType: 'FLAG_FOR_REVIEW',
    cooldownHours: 0,
    notes: 'More than 30 job completions in 1 hour is physically impossible without bots.',
  },
  {
    flag: 'WITNESS_PROTECTION_CYCLING',
    description: 'Player repeatedly entering/exiting witness protection to reset state.',
    thresholdValue: 3,
    thresholdWindowHours: 168,
    consequenceType: 'BLOCK',
    cooldownHours: 336,
    notes: 'More than 3 WP entries per week triggers a 2-week block. Prevents cycle abuse.',
  },
  {
    flag: 'SLEEP_ABUSE',
    description: 'Player using sleep mode to dodge PvP consequences repeatedly.',
    thresholdValue: 5,
    thresholdWindowHours: 168,
    consequenceType: 'COOLDOWN',
    cooldownHours: 48,
    notes: 'Max 5 sleep mode activations per week. Penalizes war-dodging behavior.',
  },
  {
    flag: 'SLOT_SQUATTING',
    description: 'Player occupying a business slot without performing any business jobs.',
    thresholdValue: 72,
    thresholdWindowHours: 72,
    consequenceType: 'FLAG_FOR_REVIEW',
    cooldownHours: 0,
    notes: 'If a player holds a slot for 72h with zero business job activity, flag for removal.',
  },
  {
    flag: 'INACTIVE_DON_BLOCK',
    description: 'Family Don has been inactive for extended period, blocking family operations.',
    thresholdValue: 5,
    thresholdWindowHours: 120,
    consequenceType: 'FLAG_FOR_REVIEW',
    cooldownHours: 0,
    notes: '5 days of Don inactivity triggers admin review. May trigger succession rules.',
  },
];

// ─────────────────────────────────────────────
// SEASON ROLLOVER CONFIG
// ─────────────────────────────────────────────

export const SEASON_ROLLOVER_CONFIG: SeasonRolloverConfig = {
  seasonId: 'season-3',
  resets: [
    { field: 'player.stats.cash', type: 'PARTIAL_DECAY', decayPercent: 70, notes: 'Players keep 30% of their cash into the new season.' },
    { field: 'player.stats.stash', type: 'PARTIAL_DECAY', decayPercent: 50, notes: 'Stash partially preserved to reward savers.' },
    { field: 'player.stats.heat', type: 'FULL_RESET', notes: 'Heat cleared completely. Fresh slate.' },
    { field: 'player.stats.respect', type: 'PARTIAL_DECAY', decayPercent: 60, notes: 'Respect partially preserved as legacy prestige.' },
    { field: 'player.stats.hp', type: 'FULL_RESET', notes: 'HP restored to 100.' },
    { field: 'family.treasury', type: 'PARTIAL_DECAY', decayPercent: 60, notes: 'Family treasury decays 60% — forces economic restart.' },
    { field: 'family.power_score', type: 'FULL_RESET', notes: 'Power score resets. Rankings start fresh.' },
    { field: 'family.turf', type: 'PRESERVE', notes: 'Turf holdings carry over between seasons.' },
    { field: 'family.fronts', type: 'PRESERVE', notes: 'Front structures carry over. Tier levels preserved.' },
    { field: 'family.crew_structure', type: 'PRESERVE', notes: 'Crew assignments preserved.' },
    { field: 'player.family_role', type: 'PRESERVE', notes: 'Family ranks preserved across seasons.' },
    { field: 'contribution_scores', type: 'FULL_RESET', notes: 'Contribution scores reset. New ranking period begins.' },
    { field: 'hitman.contracts_completed', type: 'FULL_RESET', notes: 'Contract count resets for leaderboard purposes.' },
    { field: 'hitman.prison_state', type: 'FULL_RESET', notes: 'Hitman prison cleared on season rollover.' },
    { field: 'jail_records', type: 'FULL_RESET', notes: 'All active sentences cleared on rollover.' },
  ],
};

// ─────────────────────────────────────────────
// ANALYTICS LOG (dev testing)
// ─────────────────────────────────────────────

export const ANALYTICS_LOG: AnalyticsEvent[] = [
  {
    event: 'account_created',
    playerId: 'p-recruit',
    familyId: null,
    familyRole: null,
    districtId: null,
    entityId: null,
    entityType: null,
    properties: { referrer: 'organic', archetype: 'MUSCLE' },
    timestamp: '2026-02-01T08:00:00Z',
  },
  {
    event: 'onboarding_started',
    playerId: 'p-recruit',
    familyId: null,
    familyRole: null,
    districtId: null,
    entityId: null,
    entityType: null,
    properties: { step: 'INTRO' },
    timestamp: '2026-02-01T08:01:00Z',
  },
  {
    event: 'onboarding_step_completed',
    playerId: 'p-recruit',
    familyId: null,
    familyRole: null,
    districtId: null,
    entityId: null,
    entityType: null,
    properties: { step: 'ARCHETYPE_CHOICE', archetype: 'MUSCLE', timeSpentSeconds: 45 },
    timestamp: '2026-02-01T08:02:00Z',
  },
  {
    event: 'first_job_started',
    playerId: 'p-recruit',
    familyId: null,
    familyRole: null,
    districtId: null,
    entityId: 'j-univ-01',
    entityType: 'job',
    properties: { jobName: 'Run a Sports Book', tier: 1 },
    timestamp: '2026-02-01T08:05:00Z',
  },
  {
    event: 'first_job_completed',
    playerId: 'p-recruit',
    familyId: null,
    familyRole: null,
    districtId: null,
    entityId: 'j-univ-01',
    entityType: 'job',
    properties: { jobName: 'Run a Sports Book', outcome: 'SUCCESS', reward: 1800 },
    timestamp: '2026-02-01T08:06:00Z',
  },
  {
    event: 'family_applied',
    playerId: 'p-recruit',
    familyId: 'fam-1',
    familyRole: null,
    districtId: null,
    entityId: 'fam-1',
    entityType: 'family',
    properties: { familyName: 'The Corrado Family' },
    timestamp: '2026-02-01T08:15:00Z',
  },
  {
    event: 'family_joined',
    playerId: 'p-recruit',
    familyId: 'fam-1',
    familyRole: 'RECRUIT',
    districtId: null,
    entityId: 'fam-1',
    entityType: 'family',
    properties: { familyName: 'The Corrado Family', onboarding: true },
    timestamp: '2026-02-01T09:00:00Z',
  },
  {
    event: 'promotion_eligible',
    playerId: 'p-soldier',
    familyId: 'fam-1',
    familyRole: 'ASSOCIATE',
    districtId: null,
    entityId: null,
    entityType: null,
    properties: { targetRank: 'SOLDIER', jobsCompleted: 16, moneyEarned: 27000, loyaltyDays: 8 },
    timestamp: '2026-03-14T18:00:00Z',
  },
  {
    event: 'promotion_granted',
    playerId: 'p-soldier',
    familyId: 'fam-1',
    familyRole: 'SOLDIER',
    districtId: null,
    entityId: 'p-capo',
    entityType: 'player',
    properties: { fromRank: 'ASSOCIATE', toRank: 'SOLDIER', reason: 'THRESHOLD_REACHED' },
    timestamp: '2026-03-15T14:00:00Z',
  },
  {
    event: 'jail_entered',
    playerId: 'p-soldier',
    familyId: 'fam-1',
    familyRole: 'SOLDIER',
    districtId: 'district-south-port',
    entityId: null,
    entityType: null,
    properties: { tier: 'COUNTY', reason: 'Job failure traced', sentenceHours: 12 },
    timestamp: '2026-03-20T22:00:00Z',
  },
  {
    event: 'jail_released',
    playerId: 'p-soldier',
    familyId: 'fam-1',
    familyRole: 'SOLDIER',
    districtId: null,
    entityId: null,
    entityType: null,
    properties: { tier: 'COUNTY', method: 'NATURAL_RELEASE' },
    timestamp: '2026-03-21T10:00:00Z',
  },
  {
    event: 'turf_purchased',
    playerId: 'p-boss',
    familyId: 'fam-1',
    familyRole: 'BOSS',
    districtId: 'district-south-port',
    entityId: 'district-south-port',
    entityType: 'district',
    properties: { districtName: 'South Port', cost: 85000 },
    timestamp: '2026-04-03T14:00:00Z',
  },
  {
    event: 'front_built',
    playerId: 'p-boss',
    familyId: 'fam-1',
    familyRole: 'BOSS',
    districtId: 'district-south-port',
    entityId: 'front-freight-1',
    entityType: 'front',
    properties: { frontType: 'FREIGHT_CO', tier: 1, cost: 45000 },
    timestamp: '2026-03-30T16:00:00Z',
  },
  {
    event: 'diplomatic_action_proposed',
    playerId: 'p-consigliere',
    familyId: 'fam-1',
    familyRole: 'CONSIGLIERE',
    districtId: null,
    entityId: 'fam-3',
    entityType: 'family',
    properties: { actionType: 'TRUCE', targetFamily: 'West Side Outfit' },
    timestamp: '2026-03-01T10:00:00Z',
  },
  {
    event: 'admin_action',
    playerId: 'p-boss',
    familyId: null,
    familyRole: null,
    districtId: null,
    entityId: 'lop-002',
    entityType: 'live_op_event',
    properties: { action: 'ACTIVATE_LIVE_OP', eventName: 'Waterfront Crackdown', triggeredBy: 'ADMIN' },
    timestamp: '2026-04-02T20:00:00Z',
  },
];

// ─────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────

/** Returns count of unread notifications for a player */
export function getUnreadNotifications(playerId: string): number {
  return MOCK_NOTIFICATIONS.filter(n => n.playerId === playerId && !n.read).length;
}

/** Returns all notifications for a player, newest first */
export function getPlayerNotifications(playerId: string): PlayerNotification[] {
  return MOCK_NOTIFICATIONS
    .filter(n => n.playerId === playerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

/** Returns family activity events, newest first */
export function getFamilyFeed(familyId: string): FamilyActivityEvent[] {
  return MOCK_FAMILY_FEED
    .filter(e => e.familyId === familyId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

/** Returns currently active live-ops events */
export function getActiveEvents(): LiveOpEvent[] {
  return LIVE_OPS_EVENTS.filter(e => e.active);
}

/** Calculates total expected daily cost for a maxed family (all sinks) */
export function getEconomySinkTotal(): number {
  return ECONOMY_SINKS
    .filter(s => s.recurring && s.recurringPeriodHours !== null && s.recurringPeriodHours <= 24)
    .reduce((total, sink) => {
      // Assume max family: 3 districts, 9 fronts (3 per district, tier 2 avg)
      if (sink.id === 'sink-front-maintenance') return total + sink.baseCost * 9 * 2;
      if (sink.id === 'sink-district-defense') return total + sink.baseCost * 3;
      return total + sink.baseCost;
    }, 0);
}

/** Check if a specific abuse flag threshold has been exceeded */
export function checkAbuseFlag(
  flag: AbuseRuleConfig['flag'],
  history: { timestamp: string }[]
): boolean {
  const rule = ABUSE_RULES.find(r => r.flag === flag);
  if (!rule) return false;
  const windowStart = new Date(Date.now() - rule.thresholdWindowHours * 3600 * 1000);
  const count = history.filter(h => new Date(h.timestamp) > windowStart).length;
  return count >= rule.thresholdValue;
}
