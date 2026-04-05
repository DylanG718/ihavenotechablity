// ═══════════════════════════════════════════════════════════════════
// MAFIALIFE — World Seed Data
// Covers: Crews, FrontInstances, DistrictInfluence, Seasons,
//         LeaderboardSnapshots, and helper functions
// ═══════════════════════════════════════════════════════════════════

import type {
  Crew,
  FrontInstance,
  DistrictInfluence,
  Season,
  LeaderboardSnapshot,
} from '../../../shared/world';
import { BUSINESS_DEFINITIONS } from './worldConfig';

// ═══════════════════════════════════════════════════════════════════
// UPGRADE INCOME MULTIPLIERS
// ═══════════════════════════════════════════════════════════════════

export const UPGRADE_INCOME_MULTIPLIER: [number, number, number, number] = [0, 1.0, 1.6, 2.5];
// Index 0 is unused (levels are 1, 2, 3)

// ═══════════════════════════════════════════════════════════════════
// HELPER: calc front daily income
// ═══════════════════════════════════════════════════════════════════

export function calcFrontDailyIncome(frontType: string, upgradeLevel: 1 | 2 | 3): number {
  const def = BUSINESS_DEFINITIONS.find(b => b.id === frontType);
  if (!def) return 0;
  return Math.round(def.baseProfitPerTick * UPGRADE_INCOME_MULTIPLIER[upgradeLevel]);
}

// ═══════════════════════════════════════════════════════════════════
// 1. CREWS
// ═══════════════════════════════════════════════════════════════════

export const MOCK_CREWS: Crew[] = [
  // ── Corrado Family (fam-1) ─────────────────────
  {
    id: 'crew-south-port',
    name: 'South Port Crew',
    familyId: 'fam-1',
    leaderId: 'p-underboss',           // Sal the Fist (Underboss)
    memberIds: ['p-capo', 'p-soldier', 'p-associate'],  // Tommy Two-Times, Vinnie D, Luca B
    description: 'The original earners. Controls the downtown and waterfront turf for the Corrado Family. Sal runs a tight operation — no freelancing, no shortcuts.',
    territory: ['DOWNTOWN', 'WATERFRONT'],
    createdAt: '2026-01-05T00:00:00Z',
    status: 'ACTIVE',
  },
  {
    id: 'crew-dockside',
    name: 'Dockside Crew',
    familyId: 'fam-1',
    leaderId: 'p-underboss',           // Also under Sal for now (second crew)
    memberIds: ['p-consigliere'],      // The Counselor — keeps tabs on dock operations
    description: 'Handles the industrial belt and north end territory. Quieter than South Port but equally profitable. The Counselor makes sure the numbers come out clean.',
    territory: ['INDUSTRIAL_BELT', 'NORTH_END'],
    createdAt: '2026-01-10T00:00:00Z',
    status: 'ACTIVE',
  },

  // ── Rizzo Outfit (fam-2) ──────────────────────
  {
    id: 'crew-rizzo-casino',
    name: 'Strip Crew',
    familyId: 'fam-2',
    leaderId: 'p-rival-boss',
    memberIds: ['p-rival-underboss', 'p-rival-capo'],
    description: 'The Rizzo Outfit\'s crown jewel. They own the Casino Strip and they know it.',
    territory: ['CASINO_STRIP'],
    createdAt: '2026-01-08T00:00:00Z',
    status: 'ACTIVE',
  },

  // ── Ferrante Crew (fam-3) ─────────────────────
  {
    id: 'crew-ferrante-waterfront',
    name: 'Ferrante Waterfront Crew',
    familyId: 'fam-3',
    leaderId: 'p-rival-boss-2',
    memberIds: ['p-street-1', 'p-street-2'],
    description: 'The Ferrante crew scraps for every inch of the waterfront. Contested territory, contested loyalty.',
    territory: ['WATERFRONT', 'OUTER_BOROUGHS'],
    createdAt: '2026-01-12T00:00:00Z',
    status: 'ACTIVE',
  },
];

export const MOCK_CREWS_BY_ID: Record<string, Crew> = Object.fromEntries(
  MOCK_CREWS.map(c => [c.id, c])
);

export function getCrewsByFamily(familyId: string): Crew[] {
  return MOCK_CREWS.filter(c => c.familyId === familyId);
}

// ═══════════════════════════════════════════════════════════════════
// 2. FRONT INSTANCES
// ═══════════════════════════════════════════════════════════════════

export const MOCK_FRONT_INSTANCES: FrontInstance[] = [
  // ── fam-1: turf-dt-01 (City Hall Block, Downtown, 8 slots) ──
  {
    id: 'front-dt-01-construction',
    turfId: 'turf-dt-01',
    slotIndex: 0,
    frontType: 'CONSTRUCTION',
    familyId: 'fam-1',
    upgradeLevel: 2,
    builtAt: '2026-01-20T00:00:00Z',
    managerPlayerId: 'p-underboss',
  },
  {
    id: 'front-dt-01-nightclub',
    turfId: 'turf-dt-01',
    slotIndex: 1,
    frontType: 'NIGHTCLUB',
    familyId: 'fam-1',
    upgradeLevel: 1,
    builtAt: '2026-01-25T00:00:00Z',
    managerPlayerId: 'p-capo',
  },

  // ── fam-1: turf-wf-01 (Pier 7 Terminal, Waterfront, 8 slots) ──
  {
    id: 'front-wf-01-construction',
    turfId: 'turf-wf-01',
    slotIndex: 0,
    frontType: 'CONSTRUCTION',
    familyId: 'fam-1',
    upgradeLevel: 3,
    builtAt: '2026-01-18T00:00:00Z',
    managerPlayerId: 'p-underboss',
  },
  {
    id: 'front-wf-01-casino',
    turfId: 'turf-wf-01',
    slotIndex: 1,
    frontType: 'CASINO',
    familyId: 'fam-1',
    upgradeLevel: 1,
    builtAt: '2026-02-01T00:00:00Z',
    managerPlayerId: null,
  },

  // ── fam-1: turf-ne-01 (Mulberry Street, North End, 6 slots) ──
  {
    id: 'front-ne-01-pizzeria',
    turfId: 'turf-ne-01',
    slotIndex: 0,
    frontType: 'PIZZERIA',
    familyId: 'fam-1',
    upgradeLevel: 2,
    builtAt: '2026-01-22T00:00:00Z',
    managerPlayerId: 'p-capo',
  },
  {
    id: 'front-ne-01-small-bar',
    turfId: 'turf-ne-01',
    slotIndex: 1,
    frontType: 'SMALL_BAR',
    familyId: 'fam-1',
    upgradeLevel: 1,
    builtAt: '2026-01-28T00:00:00Z',
    managerPlayerId: 'p-soldier',
  },

  // ── fam-1: turf-ib-01 (Riverside Yards, Industrial Belt, 8 slots) ──
  {
    id: 'front-ib-01-construction',
    turfId: 'turf-ib-01',
    slotIndex: 0,
    frontType: 'CONSTRUCTION',
    familyId: 'fam-1',
    upgradeLevel: 2,
    builtAt: '2026-01-30T00:00:00Z',
    managerPlayerId: 'p-capo',
  },

  // ── fam-1: turf-cs-01 (Grand Boulevard Casino Row, Casino Strip, 8 slots) ──
  {
    id: 'front-cs-01-casino',
    turfId: 'turf-cs-01',
    slotIndex: 0,
    frontType: 'CASINO',
    familyId: 'fam-1',
    upgradeLevel: 3,
    builtAt: '2026-01-16T00:00:00Z',
    managerPlayerId: 'p-underboss',
  },

  // ── fam-2 (Rizzo Outfit) ───────────────────────
  {
    id: 'front-rizzo-casino-1',
    turfId: 'turf-cs-02',
    slotIndex: 0,
    frontType: 'CASINO',
    familyId: 'fam-2',
    upgradeLevel: 3,
    builtAt: '2026-01-10T00:00:00Z',
    managerPlayerId: 'p-rival-boss',
  },
  {
    id: 'front-rizzo-nightclub-1',
    turfId: 'turf-cs-02',
    slotIndex: 1,
    frontType: 'NIGHTCLUB',
    familyId: 'fam-2',
    upgradeLevel: 2,
    builtAt: '2026-01-12T00:00:00Z',
    managerPlayerId: 'p-rival-underboss',
  },

  // ── fam-3 (Ferrante Crew) ─────────────────────
  {
    id: 'front-ferrante-construction-1',
    turfId: 'turf-wf-03',
    slotIndex: 0,
    frontType: 'CONSTRUCTION',
    familyId: 'fam-3',
    upgradeLevel: 1,
    builtAt: '2026-02-05T00:00:00Z',
    managerPlayerId: 'p-rival-boss-2',
  },
  {
    id: 'front-ferrante-pizzeria-1',
    turfId: 'turf-ne-03',
    slotIndex: 0,
    frontType: 'PIZZERIA',
    familyId: 'fam-3',
    upgradeLevel: 1,
    builtAt: '2026-02-10T00:00:00Z',
    managerPlayerId: null,
  },
];

export const MOCK_FRONT_INSTANCES_BY_ID: Record<string, FrontInstance> = Object.fromEntries(
  MOCK_FRONT_INSTANCES.map(f => [f.id, f])
);

export function getFamilyFronts(familyId: string): FrontInstance[] {
  return MOCK_FRONT_INSTANCES.filter(f => f.familyId === familyId);
}

export function getTurfFronts(turfId: string): FrontInstance[] {
  return MOCK_FRONT_INSTANCES.filter(f => f.turfId === turfId);
}

// ═══════════════════════════════════════════════════════════════════
// 3. DISTRICT INFLUENCE
// ═══════════════════════════════════════════════════════════════════
// Formula: turfs_owned * 100 + front_instances * 50 * upgrade_level + staffed_slots * 10
//
// Corrado (fam-1) owns:
//   turf-dt-01 (downtown), turf-wf-01 (waterfront), turf-ne-01 (north end),
//   turf-ib-01 (industrial belt), turf-cs-01 (casino strip)
// Rizzo (fam-2) owns: turf-cs-02
// Ferrante (fam-3) owns: turf-wf-03, turf-ne-03

const CALC_TS = '2026-04-04T18:00:00Z';

export const MOCK_DISTRICT_INFLUENCE: DistrictInfluence[] = [
  // ── DOWNTOWN (district-downtown) ──
  // fam-1: 1 turf * 100 + (CONSTRUCTION lv2 * 50 * 2 + NIGHTCLUB lv1 * 50 * 1) + staffed * 10
  //        = 100 + (200 + 50) + (4 staffed * 10) = 100 + 250 + 40 = 390
  {
    districtId: 'district-downtown',
    familyId: 'fam-1',
    score: 390,
    turfCount: 1,
    frontCount: 2,
    staffedSlots: 4,
    lastCalculatedAt: CALC_TS,
  },
  // fam-2: no turf in downtown
  {
    districtId: 'district-downtown',
    familyId: 'fam-2',
    score: 20,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 2,
    lastCalculatedAt: CALC_TS,
  },
  {
    districtId: 'district-downtown',
    familyId: 'fam-3',
    score: 10,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 1,
    lastCalculatedAt: CALC_TS,
  },

  // ── WATERFRONT (district-waterfront) ──
  // fam-1: 1 turf * 100 + (CONSTRUCTION lv3 * 50 * 3 + CASINO lv1 * 50 * 1) + staffed * 10
  //        = 100 + (450 + 50) + (3 * 10) = 100 + 500 + 30 = 630
  {
    districtId: 'district-waterfront',
    familyId: 'fam-1',
    score: 630,
    turfCount: 1,
    frontCount: 2,
    staffedSlots: 3,
    lastCalculatedAt: CALC_TS,
  },
  // fam-3: 1 turf * 100 + CONSTRUCTION lv1 * 50 * 1 + 0 staffed = 100 + 50 = 150
  {
    districtId: 'district-waterfront',
    familyId: 'fam-3',
    score: 150,
    turfCount: 1,
    frontCount: 1,
    staffedSlots: 0,
    lastCalculatedAt: CALC_TS,
  },
  {
    districtId: 'district-waterfront',
    familyId: 'fam-2',
    score: 80,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 8,
    lastCalculatedAt: CALC_TS,
  },

  // ── NORTH END (district-north-end) ──
  // fam-1: 1 turf * 100 + (PIZZERIA lv2 * 50 * 2 + SMALL_BAR lv1 * 50 * 1) + staffed * 10
  //        = 100 + (200 + 50) + (4 * 10) = 390
  {
    districtId: 'district-north-end',
    familyId: 'fam-1',
    score: 390,
    turfCount: 1,
    frontCount: 2,
    staffedSlots: 4,
    lastCalculatedAt: CALC_TS,
  },
  // fam-3: 1 turf * 100 + PIZZERIA lv1 * 50 * 1 + 0 staffed = 150
  {
    districtId: 'district-north-end',
    familyId: 'fam-3',
    score: 150,
    turfCount: 1,
    frontCount: 1,
    staffedSlots: 0,
    lastCalculatedAt: CALC_TS,
  },
  {
    districtId: 'district-north-end',
    familyId: 'fam-2',
    score: 45,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 4,
    lastCalculatedAt: CALC_TS,
  },

  // ── INDUSTRIAL BELT (district-industrial-belt) ──
  // fam-1: 1 turf * 100 + CONSTRUCTION lv2 * 50 * 2 + 3 staffed * 10 = 100 + 200 + 30 = 330
  {
    districtId: 'district-industrial-belt',
    familyId: 'fam-1',
    score: 330,
    turfCount: 1,
    frontCount: 1,
    staffedSlots: 3,
    lastCalculatedAt: CALC_TS,
  },
  {
    districtId: 'district-industrial-belt',
    familyId: 'fam-2',
    score: 60,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 6,
    lastCalculatedAt: CALC_TS,
  },
  {
    districtId: 'district-industrial-belt',
    familyId: 'fam-3',
    score: 45,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 4,
    lastCalculatedAt: CALC_TS,
  },

  // ── CASINO STRIP (district-casino-strip) ──
  // fam-1: 1 turf * 100 + CASINO lv3 * 50 * 3 + 3 staffed * 10 = 100 + 450 + 30 = 580
  {
    districtId: 'district-casino-strip',
    familyId: 'fam-1',
    score: 580,
    turfCount: 1,
    frontCount: 1,
    staffedSlots: 3,
    lastCalculatedAt: CALC_TS,
  },
  // fam-2: 1 turf * 100 + (CASINO lv3 * 50 * 3 + NIGHTCLUB lv2 * 50 * 2) + 6 staffed * 10
  //        = 100 + (450 + 200) + 60 = 810
  {
    districtId: 'district-casino-strip',
    familyId: 'fam-2',
    score: 810,
    turfCount: 1,
    frontCount: 2,
    staffedSlots: 6,
    lastCalculatedAt: CALC_TS,
  },
  {
    districtId: 'district-casino-strip',
    familyId: 'fam-3',
    score: 40,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 4,
    lastCalculatedAt: CALC_TS,
  },

  // ── OUTER BOROUGHS (district-outer-boroughs) ──
  {
    districtId: 'district-outer-boroughs',
    familyId: 'fam-1',
    score: 80,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 8,
    lastCalculatedAt: CALC_TS,
  },
  {
    districtId: 'district-outer-boroughs',
    familyId: 'fam-2',
    score: 60,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 6,
    lastCalculatedAt: CALC_TS,
  },
  {
    districtId: 'district-outer-boroughs',
    familyId: 'fam-3',
    score: 110,
    turfCount: 0,
    frontCount: 0,
    staffedSlots: 11,
    lastCalculatedAt: CALC_TS,
  },
];

export function getDistrictInfluenceSorted(districtId: string): DistrictInfluence[] {
  return MOCK_DISTRICT_INFLUENCE
    .filter(d => d.districtId === districtId)
    .sort((a, b) => b.score - a.score);
}

export function getDistrictController(districtId: string): string | null {
  const sorted = getDistrictInfluenceSorted(districtId);
  if (!sorted.length) return null;
  // Contested if top two are within 10% of each other
  if (sorted.length >= 2) {
    const gap = sorted[0].score - sorted[1].score;
    if (gap < sorted[0].score * 0.1) return null; // contested
  }
  return sorted[0].familyId;
}

// ═══════════════════════════════════════════════════════════════════
// 4. SEASONS
// ═══════════════════════════════════════════════════════════════════

export const SEASON_HISTORY: Season[] = [
  {
    id: 'season-1',
    number: 1,
    name: 'The Founding',
    status: 'ENDED',
    startedAt: '2025-10-01T00:00:00Z',
    endsAt: '2026-01-01T00:00:00Z',
    description: 'The first season established the city\'s power structure. Three months of brutal competition to claim the original territories.',
    softResetFields: ['turf', 'treasury', 'prestige'],
    preservedFields: ['rank', 'archetype', 'family_membership', 'stats'],
  },
  {
    id: 'season-2',
    number: 2,
    name: 'The Casino Wars',
    status: 'ENDED',
    startedAt: '2026-01-01T00:00:00Z',
    endsAt: '2026-03-01T00:00:00Z',
    description: 'Control of the Casino Strip was contested from day one. The Rizzo Outfit leveraged their gambling connections to seize the strip.',
    softResetFields: ['turf', 'treasury', 'prestige'],
    preservedFields: ['rank', 'archetype', 'family_membership', 'stats'],
  },
];

export const CURRENT_SEASON: Season = {
  id: 'season-3',
  number: 3,
  name: 'The Long Game',
  status: 'ACTIVE',
  startedAt: '2026-03-01T00:00:00Z',
  endsAt: '2026-06-01T00:00:00Z',
  description: 'With territories reset and fresh capital, every family is rebuilding. The Corrado Family aims to reclaim dominance. The Rizzo Outfit defends their casino empire. The Ferrante Crew plays the long game on the waterfront.',
  softResetFields: ['turf', 'treasury', 'prestige'],
  preservedFields: ['rank', 'archetype', 'family_membership', 'stats'],
};

export const ALL_SEASONS: Season[] = [...SEASON_HISTORY, CURRENT_SEASON];

// ═══════════════════════════════════════════════════════════════════
// 5. LEADERBOARD SNAPSHOTS
// ═══════════════════════════════════════════════════════════════════

export const LEADERBOARD_SNAPSHOTS: LeaderboardSnapshot[] = [
  // ── Season 1: The Founding — Corrado Family #1 ──
  {
    id: 'snap-s1-fam1',
    seasonId: 'season-1',
    snapshotAt: '2026-01-01T00:00:00Z',
    familyId: 'fam-1',
    familyName: 'The Corrado Family',
    donAlias: 'Don Corrado',
    rank: 1,
    compositeScore: 9420,
    turfScore: 3200,
    incomeScore: 2800,
    treasuryScore: 2100,
    prestigeScore: 840,
    memberStrengthScore: 480,
  },
  {
    id: 'snap-s1-fam2',
    seasonId: 'season-1',
    snapshotAt: '2026-01-01T00:00:00Z',
    familyId: 'fam-2',
    familyName: 'Rizzo Outfit',
    donAlias: 'Marco Rizzo',
    rank: 2,
    compositeScore: 7810,
    turfScore: 2600,
    incomeScore: 2200,
    treasuryScore: 1800,
    prestigeScore: 720,
    memberStrengthScore: 490,
  },
  {
    id: 'snap-s1-fam3',
    seasonId: 'season-1',
    snapshotAt: '2026-01-01T00:00:00Z',
    familyId: 'fam-3',
    familyName: 'Ferrante Crew',
    donAlias: 'Sal Ferrante',
    rank: 3,
    compositeScore: 5420,
    turfScore: 1800,
    incomeScore: 1500,
    treasuryScore: 1200,
    prestigeScore: 550,
    memberStrengthScore: 370,
  },
  {
    id: 'snap-s1-fam4',
    seasonId: 'season-1',
    snapshotAt: '2026-01-01T00:00:00Z',
    familyId: 'fam-4',
    familyName: 'West Side Outfit',
    donAlias: 'Big Sal',
    rank: 4,
    compositeScore: 4100,
    turfScore: 1400,
    incomeScore: 1100,
    treasuryScore: 900,
    prestigeScore: 420,
    memberStrengthScore: 280,
  },
  {
    id: 'snap-s1-fam5',
    seasonId: 'season-1',
    snapshotAt: '2026-01-01T00:00:00Z',
    familyId: 'fam-5',
    familyName: 'Delancey Brothers',
    donAlias: 'Johnny D',
    rank: 5,
    compositeScore: 2900,
    turfScore: 900,
    incomeScore: 800,
    treasuryScore: 700,
    prestigeScore: 300,
    memberStrengthScore: 200,
  },

  // ── Season 2: The Casino Wars — Rizzo Outfit #1 ──
  {
    id: 'snap-s2-fam1',
    seasonId: 'season-2',
    snapshotAt: '2026-03-01T00:00:00Z',
    familyId: 'fam-1',
    familyName: 'The Corrado Family',
    donAlias: 'Don Corrado',
    rank: 2,
    compositeScore: 8100,
    turfScore: 2800,
    incomeScore: 2400,
    treasuryScore: 1900,
    prestigeScore: 680,
    memberStrengthScore: 320,
  },
  {
    id: 'snap-s2-fam2',
    seasonId: 'season-2',
    snapshotAt: '2026-03-01T00:00:00Z',
    familyId: 'fam-2',
    familyName: 'Rizzo Outfit',
    donAlias: 'Marco Rizzo',
    rank: 1,
    compositeScore: 9850,
    turfScore: 3500,
    incomeScore: 3100,
    treasuryScore: 2200,
    prestigeScore: 680,
    memberStrengthScore: 370,
  },
  {
    id: 'snap-s2-fam3',
    seasonId: 'season-2',
    snapshotAt: '2026-03-01T00:00:00Z',
    familyId: 'fam-3',
    familyName: 'Ferrante Crew',
    donAlias: 'Sal Ferrante',
    rank: 3,
    compositeScore: 5100,
    turfScore: 1600,
    incomeScore: 1400,
    treasuryScore: 1100,
    prestigeScore: 580,
    memberStrengthScore: 420,
  },
  {
    id: 'snap-s2-fam4',
    seasonId: 'season-2',
    snapshotAt: '2026-03-01T00:00:00Z',
    familyId: 'fam-4',
    familyName: 'West Side Outfit',
    donAlias: 'Big Sal',
    rank: 4,
    compositeScore: 3800,
    turfScore: 1200,
    incomeScore: 1000,
    treasuryScore: 900,
    prestigeScore: 420,
    memberStrengthScore: 280,
  },
  {
    id: 'snap-s2-fam5',
    seasonId: 'season-2',
    snapshotAt: '2026-03-01T00:00:00Z',
    familyId: 'fam-5',
    familyName: 'Delancey Brothers',
    donAlias: 'Johnny D',
    rank: 5,
    compositeScore: 2700,
    turfScore: 800,
    incomeScore: 750,
    treasuryScore: 700,
    prestigeScore: 260,
    memberStrengthScore: 190,
  },
];

export function getSeasonSnapshots(seasonId: string): LeaderboardSnapshot[] {
  return LEADERBOARD_SNAPSHOTS
    .filter(s => s.seasonId === seasonId)
    .sort((a, b) => a.rank - b.rank);
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVE SEASON STANDINGS (mock — current season, rank by composite)
// ═══════════════════════════════════════════════════════════════════

export interface ActiveStanding {
  familyId: string;
  familyName: string;
  donAlias: string;
  rank: number;
  compositeScore: number;
  turfScore: number;
  incomeScore: number;
  treasuryScore: number;
  prestigeScore: number;
  memberStrengthScore: number;
}

export const CURRENT_SEASON_STANDINGS: ActiveStanding[] = [
  {
    familyId: 'fam-1',
    familyName: 'The Corrado Family',
    donAlias: 'Don Corrado',
    rank: 1,
    compositeScore: 5840,
    turfScore: 2000,
    incomeScore: 1600,
    treasuryScore: 1240,
    prestigeScore: 620,
    memberStrengthScore: 380,
  },
  {
    familyId: 'fam-2',
    familyName: 'Rizzo Outfit',
    donAlias: 'Marco Rizzo',
    rank: 2,
    compositeScore: 5420,
    turfScore: 1900,
    incomeScore: 1700,
    treasuryScore: 1100,
    prestigeScore: 520,
    memberStrengthScore: 200,
  },
  {
    familyId: 'fam-3',
    familyName: 'Ferrante Crew',
    donAlias: 'Sal Ferrante',
    rank: 3,
    compositeScore: 3100,
    turfScore: 1100,
    incomeScore: 900,
    treasuryScore: 700,
    prestigeScore: 280,
    memberStrengthScore: 120,
  },
  {
    familyId: 'fam-4',
    familyName: 'West Side Outfit',
    donAlias: 'Big Sal',
    rank: 4,
    compositeScore: 2400,
    turfScore: 800,
    incomeScore: 700,
    treasuryScore: 550,
    prestigeScore: 220,
    memberStrengthScore: 130,
  },
  {
    familyId: 'fam-5',
    familyName: 'Delancey Brothers',
    donAlias: 'Johnny D',
    rank: 5,
    compositeScore: 1700,
    turfScore: 600,
    incomeScore: 500,
    treasuryScore: 380,
    prestigeScore: 150,
    memberStrengthScore: 70,
  },
];

// ═══════════════════════════════════════════════════════════════════
// FAMILY NAME LOOKUP (for cross-referencing in UI)
// ═══════════════════════════════════════════════════════════════════

export const FAMILY_NAMES: Record<string, string> = {
  'fam-1': 'The Corrado Family',
  'fam-2': 'Rizzo Outfit',
  'fam-3': 'Ferrante Crew',
  'fam-4': 'West Side Outfit',
  'fam-5': 'Delancey Brothers',
};

export const FAMILY_DON_ALIASES: Record<string, string> = {
  'fam-1': 'Don Corrado',
  'fam-2': 'Marco Rizzo',
  'fam-3': 'Sal Ferrante',
  'fam-4': 'Big Sal',
  'fam-5': 'Johnny D',
};
