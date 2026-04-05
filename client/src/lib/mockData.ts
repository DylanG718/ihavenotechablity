/**
 * MOCK DATA — spec aligned
 *
 * All enum values match schema.ts which is aligned to the spec object.
 * Contract states: POSTED/ACCEPTED/IN_PROGRESS/SUCCESS_CLEAN/SUCCESS_MESSY/FAILED_UNTRACED/FAILED_TRACED/CATASTROPHIC_BLOWBACK
 * Downtime: SURVEILLANCE/CLEANUP/SIDE_MERCENARY/TRAINING/INFORMANT_NETWORK/SAFEHOUSE
 * HitmanProfile: uses spec-named metric fields
 * Archetypes: 7 only (CONSIGLIERE removed)
 */

import type {
  Player, Family, Mission, Contract, HitmanProfile,
  DowntimeJob, FamilyMember, ContractPhase, HitmanLeaderboardEntry,
  LeaderboardId,
} from '../../../shared/schema';
import { RETALIATION_WINDOW_DAYS, BLOWBACK_COMPENSATION_MULTIPLE } from '../../../shared/schema';

// ── Helpers ─────────────────────────────────

export function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  if (n < 0)          return `-$${Math.abs(n).toLocaleString()}`;
  return `$${n.toLocaleString()}`;
}

const BASE_STATS = {
  cash: 0, stash: 0, heat: 0, hp: 100,
  respect: 0, intimidation: 0, strength: 0, charisma: 0,
  intelligence: 0, clout: 0, luck: 0, leadership: 0,
  suspicion: 0, business: 0, accuracy: 0,
};

// ── Players ──────────────────────────────────

export const MOCK_PLAYERS: Record<string, Player> = {
  'p-boss': {
    id: 'p-boss', username: 'don_corrado', alias: 'Don Corrado',
    archetype: 'RUNNER',  // migrated from BOSS archetype affiliation: 'LEADERSHIP',
    family_id: 'fam-1', family_role: 'BOSS', crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 480000, heat: 22, respect: 940, leadership: 88, charisma: 91, clout: 85, intelligence: 76, business: 72, strength: 42, accuracy: 38, intimidation: 55, luck: 60, suspicion: 18, stash: 250000, hp: 100 },
    created_at: '2026-01-01T00:00:00Z',
  },
  'p-underboss': {
    id: 'p-underboss', username: 'sal_mancini', alias: 'Sal the Fist',
    archetype: 'MUSCLE', affiliation: 'LEADERSHIP',
    family_id: 'fam-1', family_role: 'UNDERBOSS', crew_id: 'crew-south-port', crew_role: 'LEADER',
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 210000, heat: 44, respect: 780, strength: 94, intimidation: 88, accuracy: 62, leadership: 55, charisma: 40, clout: 65, intelligence: 48, business: 30, luck: 50, suspicion: 42, stash: 80000, hp: 120 },
    created_at: '2026-01-03T00:00:00Z',
  },
  'p-consigliere': {
    id: 'p-consigliere', username: 'enzo_romano', alias: 'The Counselor',
    archetype: 'SCHEMER',             // Consigliere role held by a SCHEMER archetype
    affiliation: 'LEADERSHIP',
    family_id: 'fam-1', family_role: 'CONSIGLIERE', crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 165000, heat: 18, respect: 810, intelligence: 92, charisma: 85, clout: 78, leadership: 70, luck: 68, suspicion: 14, business: 62, strength: 30, accuracy: 35, intimidation: 40, stash: 60000, hp: 100 },
    created_at: '2026-01-04T00:00:00Z',
  },
  'p-capo': {
    id: 'p-capo', username: 'tommy_caruso', alias: 'Tommy Two-Times',
    archetype: 'RACKETEER', affiliation: 'LEADERSHIP',
    family_id: 'fam-1', family_role: 'CAPO', crew_id: 'crew-south-port', crew_role: 'MEMBER',
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 95000, heat: 31, respect: 620, business: 78, intimidation: 72, clout: 68, strength: 58, leadership: 52, charisma: 44, intelligence: 55, accuracy: 40, luck: 45, suspicion: 28, stash: 40000, hp: 100 },
    created_at: '2026-01-05T00:00:00Z',
  },
  'p-soldier': {
    id: 'p-soldier', username: 'vinnie_d', alias: 'Vinnie D',
    archetype: 'SHOOTER', affiliation: 'MEMBER',
    family_id: 'fam-1', family_role: 'SOLDIER', crew_id: 'crew-south-port', crew_role: 'MEMBER',
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 42000, heat: 55, respect: 410, accuracy: 82, intimidation: 68, luck: 64, intelligence: 52, strength: 60, charisma: 35, clout: 44, leadership: 28, business: 22, suspicion: 50, stash: 15000, hp: 100 },
    created_at: '2026-01-10T00:00:00Z',
  },
  'p-associate': {
    id: 'p-associate', username: 'luca_b', alias: 'Luca B',
    archetype: 'EARNER', affiliation: 'ASSOCIATE',  // spec: associate affiliation state
    family_id: 'fam-1', family_role: 'ASSOCIATE', crew_id: 'crew-south-port', crew_role: 'MEMBER',
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 18500, heat: 15, respect: 210, charisma: 62, business: 58, intelligence: 55, clout: 44, luck: 50, leadership: 35, strength: 30, accuracy: 28, intimidation: 25, suspicion: 12, stash: 8000, hp: 100 },
    created_at: '2026-01-15T00:00:00Z',
  },
  'p-recruit': {
    id: 'p-recruit', username: 'joey_socks', alias: 'Joey Socks',
    archetype: 'MUSCLE', affiliation: 'RECRUIT',
    family_id: 'fam-1', family_role: 'RECRUIT', crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 4200, heat: 5, respect: 45, strength: 52, intimidation: 44, accuracy: 38, charisma: 28, luck: 40, business: 18, intelligence: 30, clout: 22, leadership: 15, suspicion: 5, stash: 0, hp: 100 },
    created_at: '2026-02-01T00:00:00Z',
  },
  'p-unaffiliated': {
    id: 'p-unaffiliated', username: 'nobody_yet', alias: 'Ghost',
    archetype: 'SCHEMER', affiliation: 'UNAFFILIATED',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 8000, heat: 2, respect: 30, intelligence: 48, luck: 52, business: 38, accuracy: 42, charisma: 35, clout: 28, strength: 22, intimidation: 20, leadership: 18, suspicion: 4, stash: 2000, hp: 100 },
    created_at: '2026-02-10T00:00:00Z',
  },
  'p-street-1': {
    id: 'p-street-1', username: 'tony_nails', alias: 'Tony Nails',
    archetype: 'MUSCLE', affiliation: 'UNAFFILIATED',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 12000, heat: 8, respect: 65, strength: 70, intimidation: 60, accuracy: 50, charisma: 32, luck: 38, business: 20, intelligence: 28, clout: 30, leadership: 14, suspicion: 10, stash: 3000, hp: 100 },
    created_at: '2026-02-15T00:00:00Z',
  },
  'p-street-2': {
    id: 'p-street-2', username: 'frankie_five', alias: 'Frankie Five',
    archetype: 'EARNER', affiliation: 'UNAFFILIATED',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 34000, heat: 5, respect: 80, business: 72, charisma: 58, luck: 62, intelligence: 44, strength: 18, accuracy: 30, intimidation: 22, clout: 38, leadership: 20, suspicion: 6, stash: 10000, hp: 100 },
    created_at: '2026-01-28T00:00:00Z',
  },
  'p-street-3': {
    id: 'p-street-3', username: 'sal_the_nose', alias: 'Sal the Nose',
    archetype: 'SCHEMER', affiliation: 'UNAFFILIATED',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 6500, heat: 12, respect: 48, intelligence: 66, luck: 55, business: 50, accuracy: 36, charisma: 44, clout: 32, strength: 16, intimidation: 18, leadership: 22, suspicion: 14, stash: 1500, hp: 100 },
    created_at: '2026-03-01T00:00:00Z',
  },
  'p-street-4': {
    id: 'p-street-4', username: 'the_irishman', alias: 'Mickey Malone',
    archetype: 'SHOOTER', affiliation: 'UNAFFILIATED',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 21000, heat: 18, respect: 110, accuracy: 78, strength: 55, intimidation: 48, intelligence: 40, luck: 45, business: 16, charisma: 26, clout: 35, leadership: 18, suspicion: 20, stash: 6000, hp: 100 },
    created_at: '2026-02-20T00:00:00Z',
  },
  'p-street-5': {
    id: 'p-street-5', username: 'big_lou_r', alias: 'Big Lou',
    archetype: 'RACKETEER', affiliation: 'UNAFFILIATED',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 48000, heat: 15, respect: 130, business: 80, charisma: 62, luck: 55, intelligence: 50, strength: 30, accuracy: 28, intimidation: 38, clout: 55, leadership: 35, suspicion: 16, stash: 15000, hp: 100 },
    created_at: '2026-01-20T00:00:00Z',
  },
  'p-street-6': {
    id: 'p-street-6', username: 'vinny_d_jr', alias: 'Vinny D Jr.',
    archetype: 'MUSCLE', affiliation: 'UNAFFILIATED',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'INCARCERATED', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 3000, heat: 30, respect: 42, strength: 64, intimidation: 54, accuracy: 44, charisma: 22, luck: 32, business: 14, intelligence: 22, clout: 20, leadership: 10, suspicion: 28, stash: 0, hp: 80 },
    created_at: '2026-03-05T00:00:00Z',
  },
  'p-hitman-1': {
    id: 'p-hitman-1', username: 'iceman_77', alias: 'The Iceman',
    archetype: 'HITMAN', affiliation: 'SOLO_HITMAN',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 320000, heat: 38, respect: 870, accuracy: 91, intelligence: 84, luck: 78, intimidation: 62, strength: 55, clout: 48, charisma: 30, business: 22, leadership: 18, suspicion: 35, stash: 120000, hp: 100 },
    created_at: '2025-12-01T00:00:00Z',
  },
  'p-hitman-2': {
    id: 'p-hitman-2', username: 'pale_ghost', alias: 'Pale Ghost',
    archetype: 'HITMAN', affiliation: 'SOLO_HITMAN',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'IN_BLACKSITE', death_state: 'ALIVE', blacksite_state: 'BLACKSITE_CONFINED',
    stats: { ...BASE_STATS, cash: 95000, heat: 72, respect: 640, accuracy: 78, intelligence: 70, luck: 65, intimidation: 58, strength: 48, clout: 40, charisma: 25, business: 18, leadership: 14, suspicion: 68, stash: 30000, hp: 85 },
    created_at: '2025-12-15T00:00:00Z',
  },
  'p-hitman-3': {
    id: 'p-hitman-3', username: 'cardinal_sin', alias: 'The Cardinal',
    archetype: 'HITMAN', affiliation: 'SOLO_HITMAN',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 510000, heat: 20, respect: 980, accuracy: 96, intelligence: 92, luck: 88, intimidation: 70, strength: 60, clout: 55, charisma: 32, business: 25, leadership: 20, suspicion: 18, stash: 200000, hp: 100 },
    created_at: '2025-11-01T00:00:00Z',
  },
  'p-hitman-4': {
    id: 'p-hitman-4', username: 'rue_the_day', alias: 'Rue',
    archetype: 'HITMAN', affiliation: 'SOLO_HITMAN',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'ACTIVE', death_state: 'ALIVE', blacksite_state: null,
    stats: { ...BASE_STATS, cash: 180000, heat: 45, respect: 720, accuracy: 82, intelligence: 76, luck: 72, intimidation: 60, strength: 50, clout: 44, charisma: 28, business: 20, leadership: 15, suspicion: 42, stash: 60000, hp: 100 },
    created_at: '2025-12-20T00:00:00Z',
  },
  'p-hitman-5': {
    id: 'p-hitman-5', username: 'mr_clean_77', alias: 'Mr. Clean',
    archetype: 'HITMAN', affiliation: 'SOLO_HITMAN',
    family_id: null, family_role: null, crew_id: null, crew_role: null,
    player_status: 'IN_BLACKSITE', death_state: 'ALIVE', blacksite_state: 'BLACKSITE_MAX_SECURITY',
    stats: { ...BASE_STATS, cash: 22000, heat: 95, respect: 310, accuracy: 60, intelligence: 52, luck: 48, intimidation: 45, strength: 40, clout: 30, charisma: 22, business: 15, leadership: 12, suspicion: 88, stash: 5000, hp: 70 },
    created_at: '2026-01-10T00:00:00Z',
  },
};

// ── Family ────────────────────────────────────

export const MOCK_FAMILY: Family = {
  id: 'fam-1',
  name: 'The Corrado Family',
  motto: 'Silenzio è oro.',
  boss_id: 'p-boss',
  treasury: 1240000,
  power_score: 8420,
  territory: ['South Port', 'The Docks', 'Midtown Rackets'],
  status: 'ACTIVE',
  underboss_ids: ['p-underboss'],
  consigliere_ids: ['p-consigliere'],
  prestige: 8420,
  crew_ids: ['crew-south-port', 'crew-dockside'],
  members: [
    { player_id: 'p-boss',         family_id: 'fam-1', role: 'BOSS',        affiliation: 'LEADERSHIP', joined_at: '2026-01-01T00:00:00Z', promoted_at: null,                 invited_by: 'p-boss',         missions_completed: 22, money_earned: 1200000 },
    { player_id: 'p-underboss',    family_id: 'fam-1', role: 'UNDERBOSS',   affiliation: 'LEADERSHIP', joined_at: '2026-01-03T00:00:00Z', promoted_at: '2026-01-20T00:00:00Z', invited_by: 'p-boss',         missions_completed: 18, money_earned: 780000 },
    { player_id: 'p-consigliere',  family_id: 'fam-1', role: 'CONSIGLIERE', affiliation: 'LEADERSHIP', joined_at: '2026-01-04T00:00:00Z', promoted_at: '2026-01-22T00:00:00Z', invited_by: 'p-boss',         missions_completed: 15, money_earned: 540000 },
    { player_id: 'p-capo',         family_id: 'fam-1', role: 'CAPO',        affiliation: 'LEADERSHIP', joined_at: '2026-01-05T00:00:00Z', promoted_at: '2026-02-01T00:00:00Z', invited_by: 'p-underboss',    missions_completed: 14, money_earned: 430000 },
    { player_id: 'p-soldier',      family_id: 'fam-1', role: 'SOLDIER',     affiliation: 'MEMBER',     joined_at: '2026-01-10T00:00:00Z', promoted_at: '2026-02-10T00:00:00Z', invited_by: 'p-capo',         missions_completed: 9,  money_earned: 140000 },
    { player_id: 'p-associate',    family_id: 'fam-1', role: 'ASSOCIATE',   affiliation: 'ASSOCIATE',  joined_at: '2026-01-15T00:00:00Z', promoted_at: '2026-02-20T00:00:00Z', invited_by: 'p-capo',         missions_completed: 5,  money_earned: 62000 },
    { player_id: 'p-recruit',      family_id: 'fam-1', role: 'RECRUIT',     affiliation: 'RECRUIT',    joined_at: '2026-02-01T00:00:00Z', promoted_at: null,                   invited_by: 'p-capo',         missions_completed: 2,  money_earned: 8400 },
  ],
};

// ── Missions ──────────────────────────────────

const PHASES: ContractPhase[] = [
  { phase: 'SCOUTING',     label: 'Scouting',     description: 'Establish target routine and access points.',        completed: false, actions: ['Surveil target location', 'Map entry/exit', 'Identify bodyguards'] },
  { phase: 'PREPARATION',  label: 'Preparation',  description: 'Acquire tools, build plan, secure exit.',            completed: false, actions: ['Source equipment', 'Prepare cover identity', 'Confirm exit route'] },
  { phase: 'EXECUTION',    label: 'Execution',    description: 'Carry out the contract.',                            completed: false, actions: ['Execute approach', 'Complete objective', 'Extract clean'] },
];

export const MOCK_MISSIONS: Mission[] = [
  {
    id: 'm-1', family_id: 'fam-1',
    title: 'The Warehouse Job',
    description: 'Hit the Ferrante crew\'s warehouse on the east docks. Strip the product, leave no witnesses.',
    type: 'HEIST', tier: 'STANDARD', recruit_eligible: false,
    required_slots: [
      { role: 'LEAD',     filled_by: 'p-capo',    required: true },
      { role: 'ENFORCER', filled_by: 'p-soldier', required: true },
      { role: 'WHEELMAN', filled_by: null,        required: true },
    ],
    optional_hitman_slot: {
      effect: 'REDUCED_DETECTION_RISK',
      bonus_description: 'Silent entry reduces detection chance by 30%.',
      filled_by: null, price_offered: 45000, required: false, state: 'OPEN',
    },
    state: 'OPEN', outcome: null, outcome_notes: null,
    payout: 180000, heat_cost: 18, stat_requirements: { strength: 40, intelligence: 30 },
    created_by: 'p-capo', starts_at: null, resolved_at: null,
  },
  {
    id: 'm-2', family_id: 'fam-1',
    title: 'Corner Tax Collection',
    description: 'The Delancey corner hasn\'t paid up. Send a message. Collect what\'s owed.',
    type: 'EXTORTION', tier: 'STARTER', recruit_eligible: true,
    required_slots: [
      { role: 'ENFORCER', filled_by: 'p-recruit', required: true },
      { role: 'MONEY_MAN', filled_by: null, required: true },
    ],
    optional_hitman_slot: null,
    state: 'OPEN', outcome: null, outcome_notes: null,
    payout: 22000, heat_cost: 8, stat_requirements: { strength: 20 },
    created_by: 'p-underboss', starts_at: null, resolved_at: null,
  },
  {
    id: 'm-3', family_id: 'fam-1',
    title: 'City Hall Leverage',
    description: 'A councilman is getting cold feet. Get inside his office, find the leverage.',
    type: 'SURVEILLANCE', tier: 'ADVANCED', recruit_eligible: false,
    required_slots: [
      { role: 'INSIDE_MAN', filled_by: 'p-capo',      required: true },
      { role: 'LEAD',       filled_by: 'p-underboss', required: true },
    ],
    optional_hitman_slot: {
      effect: 'BETTER_LOOT_RETENTION',
      bonus_description: 'Witness control reduces legal repercussions by 50%.',
      filled_by: null, price_offered: 80000, required: false, state: 'OPEN',
    },
    state: 'OPEN', outcome: null, outcome_notes: null,
    payout: 320000, heat_cost: 30, stat_requirements: { intelligence: 55, charisma: 40 },
    created_by: 'p-boss', starts_at: null, resolved_at: null,
  },
  {
    id: 'm-4', family_id: 'fam-1',
    title: 'Midtown Numbers Pickup',
    description: 'Weekly collection from the midtown numbers operation.',
    type: 'SUPPLY_RUN', tier: 'STARTER', recruit_eligible: true,
    required_slots: [
      { role: 'MONEY_MAN', filled_by: null, required: true },
      { role: 'WHEELMAN',  filled_by: null, required: true },
    ],
    optional_hitman_slot: null,
    state: 'ACTIVE', outcome: null, outcome_notes: null,
    payout: 14000, heat_cost: 4, stat_requirements: {},
    created_by: 'p-capo', starts_at: '2026-03-27T14:00:00Z', resolved_at: null,
  },
  {
    id: 'm-5', family_id: 'fam-1',
    title: 'South Port Territory Grab',
    description: 'The Ferrante boys have been creeping on our south port corner. Move them out.',
    type: 'TERRITORY_GRAB', tier: 'ELITE', recruit_eligible: false,
    required_slots: [
      { role: 'LEAD',     filled_by: null, required: true },
      { role: 'ENFORCER', filled_by: null, required: true },
      { role: 'SHOOTER',  filled_by: null, required: true },
      { role: 'WHEELMAN', filled_by: null, required: true },
    ],
    optional_hitman_slot: {
      effect: 'ONE_RIVAL_DEFENDER_DISABLED',
      bonus_description: 'Hitman in overwatch disables one rival defender — improves all member survival by 40%.',
      filled_by: null, price_offered: 120000, required: false, state: 'OPEN',
    },
    state: 'DRAFT', outcome: null, outcome_notes: null,
    payout: 600000, heat_cost: 55, stat_requirements: { strength: 60, accuracy: 50, leadership: 40 },
    created_by: 'p-boss', starts_at: null, resolved_at: null,
  },
  {
    id: 'm-6', family_id: 'fam-1',
    title: 'The Armored Car Hit',
    description: 'Federal Reserve transfer. One shot at the convoy. This goes perfectly or it does not go.',
    type: 'HEIST', tier: 'ELITE', recruit_eligible: false,
    required_slots: [
      { role: 'LEAD',      filled_by: 'p-boss',      required: true },
      { role: 'SHOOTER',   filled_by: 'p-soldier',   required: true },
      { role: 'ENFORCER',  filled_by: 'p-underboss', required: true },
      { role: 'WHEELMAN',  filled_by: 'p-associate', required: true },
      { role: 'INSIDE_MAN',filled_by: 'p-capo',      required: true },
    ],
    optional_hitman_slot: {
      effect: 'GUARD_CAPTAIN_REMOVED',
      bonus_description: 'Hitman neutralizes escort vehicle driver — cleaner entry window, one fewer guard.',
      filled_by: 'p-hitman-1', price_offered: 200000, required: false, state: 'FILLED',
    },
    state: 'SUCCESS', outcome: 'SUCCESS',
    outcome_notes: 'Full payout distributed. Clean exit. The Cardinal delivered.',
    payout: 1400000, heat_cost: 70, stat_requirements: { intelligence: 70, accuracy: 60 },
    created_by: 'p-boss', starts_at: '2026-03-25T03:00:00Z', resolved_at: '2026-03-25T04:30:00Z',
  },
];

// ── Contracts — spec-aligned state names ──────

export const MOCK_CONTRACTS: Contract[] = [
  {
    id: 'c-1', hiring_family_id: 'fam-1', anonymized_poster_id: 'Client #4471',
    target_player_id: 'p-rival-boss', target_alias: 'Marco Ferrante',
    target_difficulty: 'HIGH', hitman_id: null,
    price: 180000, escrow_locked: 180000, contract_type: 'ASSASSINATION',
    state: 'POSTED',       // spec: posted
    outcome: null, traced: false, blowback_expires_at: null,
    blowback_compensation: 0,
    urgency: 'MEDIUM', secrecy: 'HIGH',
    notes: 'Target frequents the Vesuvio restaurant Tuesday evenings. No mess.',
    phases: PHASES.map(p => ({ ...p })),
    posted_at: '2026-03-27T08:00:00Z', accepted_at: null, resolved_at: null,
  },
  {
    id: 'c-2', hiring_family_id: 'fam-2', anonymized_poster_id: 'Client #7793',
    target_player_id: 'p-capo', target_alias: 'Tommy Two-Times',
    target_difficulty: 'MEDIUM', hitman_id: 'p-hitman-4',
    price: 95000, escrow_locked: 95000, contract_type: 'ASSASSINATION',
    state: 'IN_PROGRESS',  // spec: in_progress
    outcome: null, traced: false, blowback_expires_at: null,
    blowback_compensation: 0,
    urgency: 'HIGH', secrecy: 'MEDIUM',
    notes: 'Seen at the barbershop on 5th, Thursdays.',
    phases: [
      { ...PHASES[0], completed: true },
      { ...PHASES[1] },
      { ...PHASES[2] },
    ],
    posted_at: '2026-03-26T12:00:00Z', accepted_at: '2026-03-26T16:00:00Z', resolved_at: null,
  },
  {
    id: 'c-3', hiring_family_id: 'fam-1', anonymized_poster_id: 'Client #2210',
    target_player_id: 'p-rival-underboss', target_alias: 'Enzo Barese',
    target_difficulty: 'HIGH', hitman_id: 'p-hitman-3',
    price: 260000, escrow_locked: 0, contract_type: 'ASSASSINATION',
    state: 'SUCCESS_CLEAN', // spec: success_clean
    outcome: 'SUCCESS_CLEAN', traced: false, blowback_expires_at: null,
    blowback_compensation: 0,
    urgency: 'LOW', secrecy: 'HIGH', notes: null,
    phases: PHASES.map(p => ({ ...p, completed: true })),
    posted_at: '2026-03-20T09:00:00Z', accepted_at: '2026-03-20T11:00:00Z', resolved_at: '2026-03-22T02:14:00Z',
  },
  {
    id: 'c-4', hiring_family_id: 'fam-2', anonymized_poster_id: 'Client #9901',
    target_player_id: 'p-soldier', target_alias: 'Vinnie D',
    target_difficulty: 'MEDIUM', hitman_id: 'p-hitman-2',
    price: 60000, escrow_locked: 0, contract_type: 'ASSASSINATION',
    state: 'FAILED_TRACED', // spec: failed_traced ✓
    outcome: 'FAILED_TRACED', traced: true,
    // blowback: 7-day window from spec constant
    blowback_expires_at: new Date(Date.now() + RETALIATION_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    // spec: target_family_receives_total_compensation_multiple: 2.0
    blowback_compensation: 60000 * BLOWBACK_COMPENSATION_MULTIPLE,
    urgency: 'HIGH', secrecy: 'LOW', notes: null,
    phases: PHASES.map(p => ({ ...p, completed: true })),
    posted_at: '2026-03-18T14:00:00Z', accepted_at: '2026-03-19T10:00:00Z', resolved_at: '2026-03-21T22:00:00Z',
  },
  {
    id: 'c-5', hiring_family_id: 'fam-1', anonymized_poster_id: 'Client #3355',
    target_player_id: 'p-rival-capo', target_alias: 'Nico Russo',
    target_difficulty: 'MEDIUM', hitman_id: null,
    price: 75000, escrow_locked: 75000, contract_type: 'ASSASSINATION',
    state: 'POSTED',         // spec: posted
    outcome: null, traced: false, blowback_expires_at: null,
    blowback_compensation: 0,
    urgency: 'LOW', secrecy: 'HIGH',
    notes: 'Active bodyguard detail. Needs a specialist.',
    phases: PHASES.map(p => ({ ...p })),
    posted_at: '2026-03-28T06:00:00Z', accepted_at: null, resolved_at: null,
  },
  {
    id: 'c-6', hiring_family_id: 'fam-1', anonymized_poster_id: 'Client #2210',
    target_player_id: 'p-rival-boss-2', target_alias: 'Sal Benedetto',
    target_difficulty: 'EXTREME', hitman_id: 'p-hitman-3',
    price: 400000, escrow_locked: 0, contract_type: 'ASSASSINATION',
    state: 'SUCCESS_MESSY',  // spec: success_messy
    outcome: 'SUCCESS_MESSY', traced: false, blowback_expires_at: null,
    blowback_compensation: 0,
    urgency: 'HIGH', secrecy: 'LOW', notes: null,
    phases: PHASES.map(p => ({ ...p, completed: true })),
    posted_at: '2026-03-15T10:00:00Z', accepted_at: '2026-03-15T12:00:00Z', resolved_at: '2026-03-17T03:00:00Z',
  },
];

// ── Hitman Profiles — spec-aligned field names ─

export const MOCK_HITMAN_PROFILES: HitmanProfile[] = [
  {
    player_id: 'p-hitman-3', alias: 'The Cardinal',
    archetype: 'HITMAN',
    reputation_tier: 'LEGENDARY',        // spec: reputation_tier
    success_count: 42, failure_count: 2,
    success_rate: 0.955,                 // spec: success_rate ✓
    recent_form: ['SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_MESSY','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN'],
    price_range: { min: 200000, max: 500000 }, // spec: price_range
    availability_status: 'FREE',         // spec: availability_status
    heat_status: 20,                     // spec: heat_status
    // Spec: leaderboard.ranking_metrics
    contracts_completed: 42,             // spec: contracts_completed
    weighted_contract_difficulty: 8.4,  // spec: weighted_contract_difficulty (avg difficulty × volume)
    clean_success_ratio: 0.952,          // spec: clean_success_ratio (40/42)
    streak_score: 15,                    // spec: streak_score
    high_value_target_count: 18,         // spec: high_value_target_count
    low_trace_rate_score: 0.97,          // spec: low_trace_rate_score
    hitman_score: 9840,
    blacksite_state: null, safehouse_level: 5, informant_level: 5, avg_payout: 285000,
  },
  {
    player_id: 'p-hitman-1', alias: 'The Iceman',
    archetype: 'HITMAN',
    reputation_tier: 'ELITE',
    success_count: 29, failure_count: 2, success_rate: 0.935,
    recent_form: ['SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_MESSY','FAILED_UNTRACED','SUCCESS_CLEAN'],
    price_range: { min: 120000, max: 280000 },
    availability_status: 'FREE',
    heat_status: 38,
    contracts_completed: 29, weighted_contract_difficulty: 7.1,
    clean_success_ratio: 0.897, streak_score: 8, high_value_target_count: 10,
    low_trace_rate_score: 0.93,
    hitman_score: 7620,
    blacksite_state: null, safehouse_level: 4, informant_level: 4, avg_payout: 195000,
  },
  {
    player_id: 'p-hitman-4', alias: 'Rue',
    archetype: 'HITMAN',
    reputation_tier: 'PROFESSIONAL',
    success_count: 19, failure_count: 3, success_rate: 0.864,
    recent_form: ['SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','FAILED_UNTRACED','SUCCESS_MESSY','SUCCESS_CLEAN','SUCCESS_CLEAN','FAILED_TRACED','SUCCESS_CLEAN','SUCCESS_CLEAN'],
    price_range: { min: 60000, max: 150000 },
    availability_status: 'ON_CONTRACT',
    heat_status: 45,
    contracts_completed: 19, weighted_contract_difficulty: 5.8,
    clean_success_ratio: 0.842, streak_score: 4, high_value_target_count: 5,
    low_trace_rate_score: 0.86,
    hitman_score: 4850,
    blacksite_state: null, safehouse_level: 3, informant_level: 3, avg_payout: 105000,
  },
  {
    player_id: 'p-hitman-2', alias: 'Pale Ghost',
    archetype: 'HITMAN',
    reputation_tier: 'PROFESSIONAL',
    success_count: 14, failure_count: 4, success_rate: 0.778,
    recent_form: ['FAILED_TRACED','FAILED_UNTRACED','SUCCESS_CLEAN','SUCCESS_MESSY','FAILED_UNTRACED','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','SUCCESS_CLEAN','FAILED_TRACED'],
    price_range: { min: 30000, max: 80000 },
    availability_status: 'IN_PRISON',
    heat_status: 72,
    contracts_completed: 14, weighted_contract_difficulty: 4.2,
    clean_success_ratio: 0.786, streak_score: 0, high_value_target_count: 3,
    low_trace_rate_score: 0.71,
    hitman_score: 3210,
    blacksite_state: 'BLACKSITE_CONFINED', safehouse_level: 2, informant_level: 2, avg_payout: 72000,
  },
  {
    player_id: 'p-hitman-5', alias: 'Mr. Clean',
    archetype: 'HITMAN',
    reputation_tier: 'ROOKIE',
    success_count: 5, failure_count: 3, success_rate: 0.625,
    recent_form: ['FAILED_TRACED','FAILED_UNTRACED','SUCCESS_CLEAN','SUCCESS_CLEAN','FAILED_UNTRACED','SUCCESS_MESSY','SUCCESS_CLEAN','FAILED_TRACED','SUCCESS_CLEAN','FAILED_UNTRACED'],
    price_range: { min: 15000, max: 40000 },
    availability_status: 'IN_PRISON',
    heat_status: 95,
    contracts_completed: 5, weighted_contract_difficulty: 2.1,
    clean_success_ratio: 0.600, streak_score: 0, high_value_target_count: 0,
    low_trace_rate_score: 0.50,
    hitman_score: 820,
    blacksite_state: 'BLACKSITE_MAX_SECURITY', safehouse_level: 1, informant_level: 1, avg_payout: 28000,
  },
];

// ── Downtime Jobs — spec-aligned activity IDs ─

export const MOCK_DOWNTIME_JOBS: DowntimeJob[] = [
  {
    id: 'dt-1', activity: 'SURVEILLANCE',  // spec: surveillance
    title: 'Tail the Courier',
    description: 'Track a courier moving product across the financial district. Document routes, contacts, schedules.',
    duration_hours: 6, reward_cash: 18000, reward_rep: 10, reward_readiness: 5,
    reward_intel: 25, reward_heat_reduction: 0,
    next_contract_bonus: '+15% scouting speed on next contract', risk_level: 'LOW',
    stat_req: { intelligence: 30 },
    reward_types: ['cash', 'intel_tokens', 'future_contract_bonus', 'lower_trace_chance'],
  },
  {
    id: 'dt-2', activity: 'CLEANUP',        // spec: cleanup
    title: 'Scene Cleanup — Pier 14',
    description: 'Someone made a mess at Pier 14 and needs it gone. Bring the usual.',
    duration_hours: 3, reward_cash: 22000, reward_rep: 15, reward_readiness: 0,
    reward_intel: 0, reward_heat_reduction: 20,
    next_contract_bonus: null, risk_level: 'MEDIUM',
    stat_req: {},
    reward_types: ['cash', 'heat_reduction', 'reputation_recovery'],
  },
  {
    id: 'dt-3', activity: 'SIDE_MERCENARY', // spec: side_mercenary
    title: 'Protection Detail',
    description: 'A nervous accountant needs cover for a meeting. Two nights, no questions.',
    duration_hours: 48, reward_cash: 55000, reward_rep: 20, reward_readiness: 10,
    reward_intel: 0, reward_heat_reduction: 0,
    next_contract_bonus: null, risk_level: 'MEDIUM',
    stat_req: { strength: 30, intimidation: 30 },
    reward_types: ['cash', 'xp'],
  },
  {
    id: 'dt-4', activity: 'TRAINING',       // spec: training
    title: 'Live-Fire Conditioning',
    description: 'Remote range, full protocol. Sharpen instincts, improve readiness.',
    duration_hours: 12, reward_cash: 0, reward_rep: 5, reward_readiness: 30,
    reward_intel: 0, reward_heat_reduction: 0,
    next_contract_bonus: '+10% accuracy on next execution phase', risk_level: 'LOW',
    stat_req: {},
    reward_types: ['small_stat_gains', 'temporary_next_contract_bonuses'],
  },
  {
    id: 'dt-5', activity: 'INFORMANT_NETWORK', // spec: informant_network
    title: 'Cultivate a Source',
    description: 'There is a city inspector who has seen too much. Turn him. Slow and careful.',
    duration_hours: 24, reward_cash: 8000, reward_rep: 8, reward_readiness: 0,
    reward_intel: 40, reward_heat_reduction: 0,
    next_contract_bonus: '+20% intel on next scouting phase', risk_level: 'HIGH',
    stat_req: { charisma: 25, intelligence: 40 },
    reward_types: ['intel', 'access_to_better_contracts', 'shorter_prep_times'],
  },
  {
    id: 'dt-6', activity: 'SAFEHOUSE',       // spec: safehouse
    title: 'Harden the Bolt-Hole',
    description: 'Reinforce the safe house. New locks, scanner blockers, emergency egress.',
    duration_hours: 18, reward_cash: -30000, reward_rep: 0, reward_readiness: 40,
    reward_intel: 10, reward_heat_reduction: 15,
    next_contract_bonus: '-25% prison time if caught on next contract', risk_level: 'LOW',
    stat_req: {},
    reward_types: ['lower_prison_time', 'lower_trace_chance', 'better_recovery'],
  },
];

// ── Leaderboard entries — spec-aligned ────────

function buildLeaderboardEntry(profile: HitmanProfile): HitmanLeaderboardEntry {
  return {
    player_id: profile.player_id,
    alias: profile.alias,
    rep_tier: profile.reputation_tier,
    availability: profile.availability_status,
    contracts_completed: profile.contracts_completed,
    weighted_contract_difficulty: profile.weighted_contract_difficulty,
    success_rate: profile.success_rate,
    clean_success_ratio: profile.clean_success_ratio,
    streak_score: profile.streak_score,
    high_value_target_count: profile.high_value_target_count,
    low_trace_rate_score: profile.low_trace_rate_score,
    hitman_score: profile.hitman_score,
    recent_form: profile.recent_form,
    price_min: profile.price_range.min,
    price_max: profile.price_range.max,
    avg_payout: profile.avg_payout,
    blacksite_state: profile.blacksite_state,
  };
}

const ALL_ENTRIES = MOCK_HITMAN_PROFILES.map(buildLeaderboardEntry);

export const MOCK_LEADERBOARDS: Record<LeaderboardId, HitmanLeaderboardEntry[]> = {
  // spec: round_top_hitmen — ranked by composite hitman_score
  ROUND_TOP_HITMEN: [...ALL_ENTRIES].sort((a, b) => b.hitman_score - a.hitman_score),

  // spec: all_time_legends — ranked by weighted_contract_difficulty × contracts_completed
  ALL_TIME_LEGENDS: [...ALL_ENTRIES].sort((a, b) =>
    (b.weighted_contract_difficulty * b.contracts_completed) -
    (a.weighted_contract_difficulty * a.contracts_completed)
  ),

  // spec: clean_operators — ranked by clean_success_ratio, then low_trace_rate_score
  CLEAN_OPERATORS: [...ALL_ENTRIES].sort((a, b) =>
    b.clean_success_ratio !== a.clean_success_ratio
      ? b.clean_success_ratio - a.clean_success_ratio
      : b.low_trace_rate_score - a.low_trace_rate_score
  ),

  // spec: highest_paid — ranked by avg_payout
  HIGHEST_PAID: [...ALL_ENTRIES].sort((a, b) => b.avg_payout - a.avg_payout),
};

// ── View presets ──────────────────────────────

export const VIEW_PRESETS = [
  { label: 'Boss — Don Corrado',       playerId: 'p-boss' },
  { label: 'Underboss — Sal',          playerId: 'p-underboss' },
  { label: 'Consigliere — The Counselor', playerId: 'p-consigliere' },
  { label: 'Capo — Tommy',             playerId: 'p-capo' },
  { label: 'Soldier — Vinnie D',       playerId: 'p-soldier' },
  { label: 'Associate — Luca B',       playerId: 'p-associate' },
  { label: 'Recruit — Joey Socks',     playerId: 'p-recruit' },
  { label: 'Unaffiliated',             playerId: 'p-unaffiliated' },
  { label: 'Hitman — The Iceman',      playerId: 'p-hitman-1' },
];
