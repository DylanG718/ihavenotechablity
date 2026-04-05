// ═══════════════════════════════════════════════════════════════════
// MAFIALIFE — World Config: Districts, Turfs, Business Definitions
//             + BusinessSlotDefinitions + BusinessExclusiveJobs
//             + BusinessAssignment dev seeds
//
// This is the single source of truth for the world seed/config layer.
//
// ── DATA MODEL NOTES ─────────────────────────────────────────────
//
//  City
//   └── District (6 districts, world layer)
//        └── Turf (world parcel, 4/6/8 slots, purchasable by families)
//             └── FrontInstance (a specific front placed on a turf slot)
//                  └── BusinessAssignment (players assigned to role slots)
//
//  Separate static catalogs:
//   - BusinessDefinition:    what a front type IS (scale, cost, income, risk)
//   - BusinessSlotDefinition: what roles exist inside a front type
//   - BusinessExclusiveJob:  jobs unlocked by holding a slot in that front
//
// ── REWARD / SCALING NOTES ───────────────────────────────────────
//
//  LARGE fronts (Casino, Construction, Nightclub):
//    rewardCashMin: 8,000 – 20,000
//    rewardCashMax: 25,000 – 90,000
//
//  SMALL fronts (Car Repair, Pizzeria, Small Bar):
//    rewardCashMin: 2,000 – 6,000
//    rewardCashMax: 6,000 – 14,000
//
//  Shares: familyShare typically 50–70%, manager 25–35%, staff 0–15%
//
// ── JAIL RISK BANDS ──────────────────────────────────────────────
//
//  Very Low  ≤ 0.05
//  Low       0.06 – 0.12
//  Medium    0.13 – 0.22
//  High      0.23 – 0.35
//  Extreme   > 0.35
//
// ── HOW TO ADD A DISTRICT ────────────────────────────────────────
//  1. Add DistrictSlug variant to shared/world.ts
//  2. Add entry to DISTRICTS below
//  3. Add Turf records referencing its id
//
// ── HOW TO ADD A TURF ────────────────────────────────────────────
//  1. Add entry to TURFS below with correct districtId
//  2. slotCount: 4 (small), 6 (mid), 8 (large prime)
//
// ── HOW TO ADD A FRONT TYPE ──────────────────────────────────────
//  1. Add FrontType variant to shared/world.ts
//  2. Add BusinessDefinition entry to BUSINESS_DEFINITIONS
//  3. Add BusinessSlotDefinition entries to BUSINESS_SLOT_DEFINITIONS
//  4. Add BusinessExclusiveJob entries to BUSINESS_EXCLUSIVE_JOBS
//
// ═══════════════════════════════════════════════════════════════════

import type {
  District,
  Turf,
  BusinessDefinition,
  BusinessSlotDefinition,
  BusinessExclusiveJob,
  BusinessAssignment,
} from '../../../shared/world';

// ═══════════════════════════════════════════════════════════════════
// 1. DISTRICTS
// ═══════════════════════════════════════════════════════════════════

export const DISTRICTS: District[] = [
  {
    id: 'district-downtown',
    slug: 'DOWNTOWN',
    name: 'Downtown',
    tagline: 'Suits, city hall, and the corruption behind the curtain.',
    description:
      'The financial and political core of the city. Downtown is home to city hall, law firms, banks, and the private clubs where real decisions are made. The heat is high and the law is close — but the contracts are worth millions. Families who control Downtown control the city\'s paperwork.',
    theme: 'POLITICAL',
    turfCountTarget: 6,
    allowedFrontTypes: ['CONSTRUCTION', 'REAL_ESTATE', 'HQ_CLUB'],
    influenceBonusType: 'CORRUPTION',
    displayOrder: 1,
  },
  {
    id: 'district-waterfront',
    slug: 'WATERFRONT',
    name: 'The Waterfront',
    tagline: 'Everything that moves through this city crosses the docks first.',
    description:
      'A working port district of warehouses, shipping terminals, and the union halls that control them. Contraband flows in and out around the clock. Waterfront turf is contested, always. The family that controls the docks controls the city\'s supply chain — legal and otherwise.',
    theme: 'MARITIME',
    turfCountTarget: 7,
    allowedFrontTypes: ['CONSTRUCTION', 'PORT_LOGISTICS', 'WASTE_MANAGEMENT', 'NIGHTCLUB'],
    influenceBonusType: 'SMUGGLING',
    displayOrder: 2,
  },
  {
    id: 'district-north-end',
    slug: 'NORTH_END',
    name: 'North End',
    tagline: 'Old money. Old neighborhood. Old rules.',
    description:
      'A dense residential and commercial neighborhood with deep family roots. Numbers spots and loan offices have operated here for three generations. The community accepts the arrangement — as long as the family takes care of its own. Protection income is stable, heat is managed, and loyalty runs deep.',
    theme: 'RESIDENTIAL',
    turfCountTarget: 8,
    allowedFrontTypes: ['PIZZERIA', 'SMALL_BAR', 'CAR_REPAIR', 'NIGHTCLUB'],
    influenceBonusType: 'PROTECTION',
    displayOrder: 3,
  },
  {
    id: 'district-industrial-belt',
    slug: 'INDUSTRIAL_BELT',
    name: 'Industrial Belt',
    tagline: 'Concrete, gravel, and things that go missing.',
    description:
      'The city\'s industrial spine — construction yards, salvage operations, waste facilities, and chop shops hidden behind legitimate business fronts. Underboss-level muscle is needed to hold territory here. The contracts are ugly and the work is physical, but the take is substantial and the witnesses are few.',
    theme: 'INDUSTRIAL',
    turfCountTarget: 6,
    allowedFrontTypes: ['CONSTRUCTION', 'CAR_REPAIR', 'WASTE_MANAGEMENT', 'PORT_LOGISTICS'],
    influenceBonusType: 'CONSTRUCTION',
    displayOrder: 4,
  },
  {
    id: 'district-casino-strip',
    slug: 'CASINO_STRIP',
    name: 'Casino Strip',
    tagline: 'The lights are bright. The money is dirty.',
    description:
      'A concentrated entertainment corridor of casinos, nightclubs, and high-end restaurants. The money moves fast and in enormous volume — ideal for laundering and skim operations. This district demands showmanship and a different kind of management. Every front here has a legitimate license and an illegitimate purpose.',
    theme: 'GAMBLING',
    turfCountTarget: 5,
    allowedFrontTypes: ['CASINO', 'NIGHTCLUB', 'HQ_CLUB', 'REAL_ESTATE'],
    influenceBonusType: 'GAMBLING',
    displayOrder: 5,
  },
  {
    id: 'district-outer-boroughs',
    slug: 'OUTER_BOROUGHS',
    name: 'Outer Boroughs',
    tagline: 'Quiet streets, steady money, no questions.',
    description:
      'Suburban neighborhoods at the edge of the city\'s reach. Low heat, low competition, and lower margins — but reliable. Small bars, pizza joints, and repair shops generate consistent income without drawing attention. A smart family uses the Outer Boroughs as a quiet base of operations while the action heats up downtown.',
    theme: 'SUBURBAN',
    turfCountTarget: 8,
    allowedFrontTypes: ['PIZZERIA', 'SMALL_BAR', 'CAR_REPAIR'],
    influenceBonusType: 'NONE',
    displayOrder: 6,
  },
];

export const DISTRICTS_BY_ID: Record<string, District> = Object.fromEntries(
  DISTRICTS.map(d => [d.id, d])
);
export const DISTRICTS_BY_SLUG = Object.fromEntries(
  DISTRICTS.map(d => [d.slug, d])
);

// ═══════════════════════════════════════════════════════════════════
// 2. TURFS
// ═══════════════════════════════════════════════════════════════════
// Slot counts:  4 = small parcel, 6 = mid, 8 = prime
// Quality tier: PRIME > SOLID > ROUGH > CONTESTED
// familyId null = unowned / available
// Corrado Family (fam-1) owns a selection for dev testing

const SEED_TS = '2026-01-01T00:00:00Z';

export const TURFS: Turf[] = [

  // ── DOWNTOWN (6 parcels) ──────────────────────────────────────
  {
    id: 'turf-dt-01', districtId: 'district-downtown', familyId: 'fam-1',
    name: 'City Hall Block', slotCount: 8, purchaseCost: 180000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: '2026-01-15T00:00:00Z', purchasedByPlayerId: 'p-boss',
    locationNote: 'Prime real estate adjacent to city hall. Permits flow from here.',
  },
  {
    id: 'turf-dt-02', districtId: 'district-downtown', familyId: null,
    name: 'Financial Row', slotCount: 8, purchaseCost: 200000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Investment banks and law firms. Ideal for real estate and construction fronts.',
  },
  {
    id: 'turf-dt-03', districtId: 'district-downtown', familyId: null,
    name: 'Courthouse Square', slotCount: 6, purchaseCost: 140000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Heavy foot traffic from legal professionals. Good for white-collar fronts.',
  },
  {
    id: 'turf-dt-04', districtId: 'district-downtown', familyId: null,
    name: 'Midtown Office Strip', slotCount: 6, purchaseCost: 120000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Mid-block commercial row. Moderate visibility and consistent revenue.',
  },
  {
    id: 'turf-dt-05', districtId: 'district-downtown', familyId: null,
    name: 'Transit Hub Block', slotCount: 4, purchaseCost: 80000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'High foot traffic, low prestige. Numbers and small bars do well here.',
  },
  {
    id: 'turf-dt-06', districtId: 'district-downtown', familyId: null,
    name: 'Hotel Row', slotCount: 4, purchaseCost: 90000,
    qualityTier: 'CONTESTED', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Three families have fought over this strip. Currently unclaimed.',
  },

  // ── WATERFRONT (7 parcels) ────────────────────────────────────
  {
    id: 'turf-wf-01', districtId: 'district-waterfront', familyId: 'fam-1',
    name: 'Pier 7 Terminal', slotCount: 8, purchaseCost: 160000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: '2026-01-20T00:00:00Z', purchasedByPlayerId: 'p-boss',
    locationNote: 'The main cargo pier. Half the city\'s contraband clears here.',
  },
  {
    id: 'turf-wf-02', districtId: 'district-waterfront', familyId: null,
    name: 'Dockside Warehouse Row', slotCount: 8, purchaseCost: 150000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Industrial warehouse district. Construction and port logistics thrive here.',
  },
  {
    id: 'turf-wf-03', districtId: 'district-waterfront', familyId: null,
    name: 'Harbor View Strip', slotCount: 6, purchaseCost: 110000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Tourist-facing waterfront with restaurants and bars above, operations below.',
  },
  {
    id: 'turf-wf-04', districtId: 'district-waterfront', familyId: null,
    name: 'Union Hall Block', slotCount: 6, purchaseCost: 130000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Longshore union territory. Control this and you control labor.',
  },
  {
    id: 'turf-wf-05', districtId: 'district-waterfront', familyId: null,
    name: 'Fish Market Corner', slotCount: 4, purchaseCost: 65000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Low-end commercial. Good for moving product without attention.',
  },
  {
    id: 'turf-wf-06', districtId: 'district-waterfront', familyId: null,
    name: 'Old Ferry Terminal', slotCount: 4, purchaseCost: 70000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Underused terminal with good access and poor surveillance.',
  },
  {
    id: 'turf-wf-07', districtId: 'district-waterfront', familyId: null,
    name: 'contested Pier 12', slotCount: 6, purchaseCost: 100000,
    qualityTier: 'CONTESTED', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Three crews have bled over this pier. Whoever takes it next earns the right.',
  },

  // ── NORTH END (8 parcels) ─────────────────────────────────────
  {
    id: 'turf-ne-01', districtId: 'district-north-end', familyId: 'fam-1',
    name: 'Mulberry Street', slotCount: 6, purchaseCost: 90000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: '2026-01-10T00:00:00Z', purchasedByPlayerId: 'p-boss',
    locationNote: 'The family\'s original neighborhood. Three generations of loyalty.',
  },
  {
    id: 'turf-ne-02', districtId: 'district-north-end', familyId: null,
    name: 'Saint Anthony\'s Block', slotCount: 6, purchaseCost: 85000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Church, social clubs, and the kind of businesses that have been there since the fifties.',
  },
  {
    id: 'turf-ne-03', districtId: 'district-north-end', familyId: null,
    name: 'North End Market', slotCount: 6, purchaseCost: 80000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Grocery stores, delis, and the back rooms that service them.',
  },
  {
    id: 'turf-ne-04', districtId: 'district-north-end', familyId: null,
    name: 'Hanover Court', slotCount: 4, purchaseCost: 55000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Quiet residential block. Low heat, consistent protection income.',
  },
  {
    id: 'turf-ne-05', districtId: 'district-north-end', familyId: null,
    name: 'Ferrante Alley', slotCount: 4, purchaseCost: 60000,
    qualityTier: 'CONTESTED', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Named for what happened to the last crew who tried to hold it.',
  },
  {
    id: 'turf-ne-06', districtId: 'district-north-end', familyId: null,
    name: 'Little Italy South', slotCount: 6, purchaseCost: 75000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Dense restaurant and bar district. Pizza joints and after-hours spots.',
  },
  {
    id: 'turf-ne-07', districtId: 'district-north-end', familyId: null,
    name: 'Cross Street Block', slotCount: 4, purchaseCost: 45000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Transitional neighborhood. Cheap to acquire, low drama.',
  },
  {
    id: 'turf-ne-08', districtId: 'district-north-end', familyId: null,
    name: 'Villa Pieri Corner', slotCount: 4, purchaseCost: 50000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Old-school numbers territory. The regulars still show up every day.',
  },

  // ── INDUSTRIAL BELT (6 parcels) ───────────────────────────────
  {
    id: 'turf-ib-01', districtId: 'district-industrial-belt', familyId: 'fam-1',
    name: 'Riverside Yards', slotCount: 8, purchaseCost: 130000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: '2026-02-01T00:00:00Z', purchasedByPlayerId: 'p-boss',
    locationNote: 'Construction staging yard with contracts worth eight figures.',
  },
  {
    id: 'turf-ib-02', districtId: 'district-industrial-belt', familyId: null,
    name: 'South Rail Depot', slotCount: 8, purchaseCost: 120000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Rail access to the entire region. Ideal for logistics and material diversion.',
  },
  {
    id: 'turf-ib-03', districtId: 'district-industrial-belt', familyId: null,
    name: 'Scrap Metal Row', slotCount: 6, purchaseCost: 85000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Salvage and metal recycling operations. Good cover for chop shops.',
  },
  {
    id: 'turf-ib-04', districtId: 'district-industrial-belt', familyId: null,
    name: 'Auto Row', slotCount: 6, purchaseCost: 90000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Mechanics and body shops. Insurance fraud runs deep on this block.',
  },
  {
    id: 'turf-ib-05', districtId: 'district-industrial-belt', familyId: null,
    name: 'Cement Plant District', slotCount: 4, purchaseCost: 65000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Heavy industry. Things have gone missing here since the sixties.',
  },
  {
    id: 'turf-ib-06', districtId: 'district-industrial-belt', familyId: null,
    name: 'Freight Corridor', slotCount: 4, purchaseCost: 70000,
    qualityTier: 'CONTESTED', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Controlled access road connecting two major distribution points.',
  },

  // ── CASINO STRIP (5 parcels) ──────────────────────────────────
  {
    id: 'turf-cs-01', districtId: 'district-casino-strip', familyId: 'fam-1',
    name: 'Grand Boulevard Casino Row', slotCount: 8, purchaseCost: 250000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: '2026-01-25T00:00:00Z', purchasedByPlayerId: 'p-boss',
    locationNote: 'The crown jewel of the strip. One casino here earns more than three elsewhere.',
  },
  {
    id: 'turf-cs-02', districtId: 'district-casino-strip', familyId: null,
    name: 'High Roller Hotel Block', slotCount: 8, purchaseCost: 240000,
    qualityTier: 'PRIME', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Five-star hotel and entertainment complex. VIP operations run around the clock.',
  },
  {
    id: 'turf-cs-03', districtId: 'district-casino-strip', familyId: null,
    name: 'Mid-Strip Entertainment', slotCount: 6, purchaseCost: 160000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Mid-tier clubs and restaurants that feed into the main casinos.',
  },
  {
    id: 'turf-cs-04', districtId: 'district-casino-strip', familyId: null,
    name: 'Back of Strip', slotCount: 6, purchaseCost: 130000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Less visible but high volume. Back-office laundering operations.',
  },
  {
    id: 'turf-cs-05', districtId: 'district-casino-strip', familyId: null,
    name: 'Strip Edge Block', slotCount: 4, purchaseCost: 90000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Pawn shops and bail bondsmen at the edge of the action.',
  },

  // ── OUTER BOROUGHS (8 parcels) ────────────────────────────────
  {
    id: 'turf-ob-01', districtId: 'district-outer-boroughs', familyId: null,
    name: 'Eastside Residential Block', slotCount: 6, purchaseCost: 60000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Quiet working-class neighborhood. Small bars and pizzerias thrive here.',
  },
  {
    id: 'turf-ob-02', districtId: 'district-outer-boroughs', familyId: null,
    name: 'Outer Park Strip', slotCount: 4, purchaseCost: 40000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Low-key suburban strip mall. Consistent but unspectacular income.',
  },
  {
    id: 'turf-ob-03', districtId: 'district-outer-boroughs', familyId: null,
    name: 'Sunset Heights', slotCount: 4, purchaseCost: 45000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Suburban neighborhood. Car repair shops and local bars.',
  },
  {
    id: 'turf-ob-04', districtId: 'district-outer-boroughs', familyId: null,
    name: 'Maple Avenue Commerce', slotCount: 6, purchaseCost: 65000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Main commercial strip of the suburbs. Good foot traffic for small fronts.',
  },
  {
    id: 'turf-ob-05', districtId: 'district-outer-boroughs', familyId: null,
    name: 'River Road', slotCount: 4, purchaseCost: 38000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Low-traffic road with a few businesses. Easy to hold.',
  },
  {
    id: 'turf-ob-06', districtId: 'district-outer-boroughs', familyId: null,
    name: 'Borough Heights', slotCount: 6, purchaseCost: 58000,
    qualityTier: 'SOLID', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Hillside neighborhood with loyal small business community.',
  },
  {
    id: 'turf-ob-07', districtId: 'district-outer-boroughs', familyId: null,
    name: 'Old Mill Road', slotCount: 4, purchaseCost: 35000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Industrial fringe. Cheap and quiet.',
  },
  {
    id: 'turf-ob-08', districtId: 'district-outer-boroughs', familyId: null,
    name: 'Clover Junction', slotCount: 4, purchaseCost: 42000,
    qualityTier: 'ROUGH', createdAt: SEED_TS,
    purchasedAt: null, purchasedByPlayerId: null,
    locationNote: 'Crossroads of two outer-borough routes. Small but steady.',
  },
];

export const TURFS_BY_ID: Record<string, Turf> = Object.fromEntries(
  TURFS.map(t => [t.id, t])
);
export const TURFS_BY_DISTRICT: Record<string, Turf[]> = TURFS.reduce(
  (acc, t) => { (acc[t.districtId] ??= []).push(t); return acc; },
  {} as Record<string, Turf[]>
);
export const FAMILY_TURFS = (familyId: string) =>
  TURFS.filter(t => t.familyId === familyId);

// ═══════════════════════════════════════════════════════════════════
// 3. BUSINESS / FRONT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export const BUSINESS_DEFINITIONS: BusinessDefinition[] = [

  // ── SMALL (Capo-scale) ────────────────────────────────────────

  {
    id: 'CAR_REPAIR',
    displayName: 'Car Repair Shop',
    scale: 'SMALL',
    baseProfitPerTick: 2800,
    baseRisk: 0.12,
    buildCost: 35000,
    recommendedManagerRank: 'CAPO',
    allowedDistricts: ['NORTH_END', 'INDUSTRIAL_BELT', 'OUTER_BOROUGHS'],
    description:
      'A legitimate auto body and repair shop that generates steady income through service, insurance fraud, and occasional chop-shop overflow. Minimal heat when managed carefully. Ideal for Capos looking for a reliable earner that doesn\'t draw attention.',
    lore: 'They\'ll fix your car. They\'ll also ask no questions about the car.',
    implemented: true,
  },
  {
    id: 'PIZZERIA',
    displayName: 'Pizzeria',
    scale: 'SMALL',
    baseProfitPerTick: 2200,
    baseRisk: 0.08,
    buildCost: 28000,
    recommendedManagerRank: 'CAPO',
    allowedDistricts: ['NORTH_END', 'OUTER_BOROUGHS', 'WATERFRONT'],
    description:
      'A neighborhood pizzeria serving the community by day and running numbers, deliveries, and back-room card games by night. Low heat, high loyalty, and a natural cover for cash flow. The best fronts in this city were built on sauce and silence.',
    lore: 'Best pizza in the city. Come for the food, stay because you have to.',
    implemented: true,
  },
  {
    id: 'SMALL_BAR',
    displayName: 'Small Bar',
    scale: 'SMALL',
    baseProfitPerTick: 2500,
    baseRisk: 0.1,
    buildCost: 30000,
    recommendedManagerRank: 'CAPO',
    allowedDistricts: ['NORTH_END', 'OUTER_BOROUGHS', 'WATERFRONT', 'CASINO_STRIP'],
    description:
      'A corner bar with a back room that does more business than the front. Card games, bookmaking, and the kind of quiet conversations that shape the neighborhood. A well-run bar is invisible to law enforcement and indispensable to the community.',
    lore: 'Drinks are cold. Questions aren\'t welcome.',
    implemented: true,
  },

  // ── LARGE (Underboss-scale) ───────────────────────────────────

  {
    id: 'CASINO',
    displayName: 'Casino',
    scale: 'LARGE',
    baseProfitPerTick: 22000,
    baseRisk: 0.28,
    buildCost: 250000,
    recommendedManagerRank: 'UNDERBOSS',
    allowedDistricts: ['CASINO_STRIP', 'DOWNTOWN', 'WATERFRONT'],
    description:
      'A licensed gaming establishment generating enormous cash flow around the clock. Casinos enable skim operations, laundering through VIP events, credit extension to high-value targets, and leverage over the politically connected. High overhead, high heat, and enormous reward. Requires top-tier management.',
    lore: 'The odds favor the house. You own the house.',
    implemented: true,
  },
  {
    id: 'CONSTRUCTION',
    displayName: 'Construction Company',
    scale: 'LARGE',
    baseProfitPerTick: 18000,
    baseRisk: 0.22,
    buildCost: 200000,
    recommendedManagerRank: 'UNDERBOSS',
    allowedDistricts: ['INDUSTRIAL_BELT', 'DOWNTOWN', 'WATERFRONT'],
    description:
      'A licensed construction and contracting business that operates in the gray zone between legitimate infrastructure and organized fraud. City contracts, no-show payrolls, material diversion, and union leverage generate substantial income while providing the family political reach. Slow to build, expensive to maintain, impossible to replace.',
    lore: 'The city gets built. You decide who builds it.',
    implemented: true,
  },
  {
    id: 'NIGHTCLUB',
    displayName: 'Nightclub',
    scale: 'LARGE',
    baseProfitPerTick: 16000,
    baseRisk: 0.24,
    buildCost: 180000,
    recommendedManagerRank: 'UNDERBOSS',
    allowedDistricts: ['CASINO_STRIP', 'DOWNTOWN', 'WATERFRONT', 'NORTH_END'],
    description:
      'A high-end entertainment venue that serves as the family\'s most public-facing operation. Cash laundering through VIP events and charity nights, blackmail material from private rooms, product distribution through bar staff, and a space for sit-downs that requires no explanation. Glamorous cover, serious business.',
    lore: 'The best clubs in the city are where business gets done.',
    implemented: true,
  },

  // ── PLACEHOLDER (not yet implemented) ────────────────────────

  {
    id: 'PORT_LOGISTICS',
    displayName: 'Port Logistics Company',
    scale: 'LARGE',
    baseProfitPerTick: 20000,
    baseRisk: 0.25,
    buildCost: 220000,
    recommendedManagerRank: 'UNDERBOSS',
    allowedDistricts: ['WATERFRONT', 'INDUSTRIAL_BELT'],
    description:
      'A freight and logistics firm operating out of the port. Ideal for importing contraband, moving stolen goods, and controlling the city\'s supply chain at scale. Placeholder — not yet implemented in UI.',
    lore: 'Everything the city needs comes through the docks. You decide what else comes through.',
    implemented: false,
  },
  {
    id: 'WASTE_MANAGEMENT',
    displayName: 'Waste Management',
    scale: 'LARGE',
    baseProfitPerTick: 15000,
    baseRisk: 0.18,
    buildCost: 170000,
    recommendedManagerRank: 'UNDERBOSS',
    allowedDistricts: ['INDUSTRIAL_BELT', 'OUTER_BOROUGHS'],
    description:
      'A sanitation and waste disposal company with city contracts. Highly profitable, politically connected, and ideal for evidence disposal. Placeholder — not yet implemented.',
    lore: 'You\'d be amazed what goes in the trucks and what comes back out.',
    implemented: false,
  },
  {
    id: 'REAL_ESTATE',
    displayName: 'Real Estate Holdings',
    scale: 'LARGE',
    baseProfitPerTick: 12000,
    baseRisk: 0.14,
    buildCost: 150000,
    recommendedManagerRank: 'UNDERBOSS',
    allowedDistricts: ['DOWNTOWN', 'CASINO_STRIP', 'NORTH_END'],
    description:
      'A real estate development and property management company used for large-scale laundering and political leverage. Placeholder — not yet implemented.',
    lore: 'The building has your name on it. The money never does.',
    implemented: false,
  },
  {
    id: 'HQ_CLUB',
    displayName: 'Headquarters Club',
    scale: 'HQ',
    baseProfitPerTick: 35000,
    baseRisk: 0.35,
    buildCost: 500000,
    recommendedManagerRank: 'DON',
    allowedDistricts: ['CASINO_STRIP', 'DOWNTOWN'],
    description:
      'The Don\'s private establishment — part social club, part command center, part symbol of power. The HQ Club generates income, hosts Commission meetings, and serves as the family\'s most protected and most valuable asset. Don-only. Placeholder — not yet implemented.',
    lore: 'You don\'t find the place. The place finds you.',
    implemented: false,
  },
];

export const BUSINESS_DEFS_BY_ID: Record<string, BusinessDefinition> = Object.fromEntries(
  BUSINESS_DEFINITIONS.map(b => [b.id, b])
);

// ═══════════════════════════════════════════════════════════════════
// 4. BUSINESS SLOT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════

export const BUSINESS_SLOT_DEFINITIONS: BusinessSlotDefinition[] = [

  // ── CASINO ────────────────────────────────────────────────────
  { id: 'slot-casino-manager',              businessType: 'CASINO',        roleType: 'MANAGER',          displayName: 'Casino Manager',        requiredMinRank: 'UNDERBOSS', preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-casino-pit-boss',             businessType: 'CASINO',        roleType: 'OPERATIONS_STAFF', displayName: 'Pit Boss',              requiredMinRank: 'SOLDIER',   preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-casino-dealer',               businessType: 'CASINO',        roleType: 'OPERATIONS_STAFF', displayName: 'Dealer',                requiredMinRank: 'ASSOCIATE', preferredSkill: 'OPERATIONS', maxOnePerBusiness: false },
  { id: 'slot-casino-floor-security-chief', businessType: 'CASINO',        roleType: 'SECURITY_STAFF',   displayName: 'Floor Security Chief',  requiredMinRank: 'SOLDIER',   preferredSkill: 'SECURITY',   maxOnePerBusiness: true  },
  { id: 'slot-casino-vip-host',             businessType: 'CASINO',        roleType: 'VIP_HOST',         displayName: 'VIP Host',              requiredMinRank: 'SOLDIER',   preferredSkill: 'CHARM',      maxOnePerBusiness: true  },
  { id: 'slot-casino-cage-cashier',         businessType: 'CASINO',        roleType: 'FINANCE_STAFF',    displayName: 'Cage Cashier',          requiredMinRank: 'SOLDIER',   preferredSkill: 'FINANCE',    maxOnePerBusiness: true  },

  // ── CONSTRUCTION ──────────────────────────────────────────────
  { id: 'slot-construction-manager',             businessType: 'CONSTRUCTION', roleType: 'MANAGER',          displayName: 'Construction Boss',     requiredMinRank: 'UNDERBOSS', preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-construction-site-foreman',        businessType: 'CONSTRUCTION', roleType: 'OPERATIONS_STAFF', displayName: 'Site Foreman',          requiredMinRank: 'CAPO',      preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-construction-union-liaison',       businessType: 'CONSTRUCTION', roleType: 'VIP_HOST',         displayName: 'Union Liaison',         requiredMinRank: 'CAPO',      preferredSkill: 'CHARM',      maxOnePerBusiness: true  },
  { id: 'slot-construction-procurement-officer', businessType: 'CONSTRUCTION', roleType: 'FINANCE_STAFF',    displayName: 'Procurement Officer',   requiredMinRank: 'SOLDIER',   preferredSkill: 'FINANCE',    maxOnePerBusiness: true  },
  { id: 'slot-construction-yard-supervisor',     businessType: 'CONSTRUCTION', roleType: 'SECURITY_STAFF',   displayName: 'Yard Supervisor',       requiredMinRank: 'SOLDIER',   preferredSkill: 'SECURITY',   maxOnePerBusiness: true  },

  // ── NIGHTCLUB ─────────────────────────────────────────────────
  { id: 'slot-nightclub-manager',         businessType: 'NIGHTCLUB', roleType: 'MANAGER',          displayName: 'Club Manager',    requiredMinRank: 'UNDERBOSS', preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-nightclub-vip-host',        businessType: 'NIGHTCLUB', roleType: 'VIP_HOST',         displayName: 'VIP Host',        requiredMinRank: 'SOLDIER',   preferredSkill: 'CHARM',      maxOnePerBusiness: true  },
  { id: 'slot-nightclub-floor-manager',   businessType: 'NIGHTCLUB', roleType: 'OPERATIONS_STAFF', displayName: 'Floor Manager',   requiredMinRank: 'SOLDIER',   preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-nightclub-security-chief',  businessType: 'NIGHTCLUB', roleType: 'SECURITY_STAFF',   displayName: 'Security Chief',  requiredMinRank: 'SOLDIER',   preferredSkill: 'SECURITY',   maxOnePerBusiness: true  },
  { id: 'slot-nightclub-accountant',      businessType: 'NIGHTCLUB', roleType: 'FINANCE_STAFF',    displayName: 'Accountant',      requiredMinRank: 'SOLDIER',   preferredSkill: 'FINANCE',    maxOnePerBusiness: true  },
  { id: 'slot-nightclub-bartender',       businessType: 'NIGHTCLUB', roleType: 'OPERATIONS_STAFF', displayName: 'Bartender',       requiredMinRank: 'ASSOCIATE', preferredSkill: 'CHARM',      maxOnePerBusiness: false },

  // ── CAR_REPAIR ────────────────────────────────────────────────
  { id: 'slot-car-repair-manager',               businessType: 'CAR_REPAIR', roleType: 'MANAGER',          displayName: 'Shop Manager',           requiredMinRank: 'CAPO',      preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-car-repair-lead-mechanic',         businessType: 'CAR_REPAIR', roleType: 'OPERATIONS_STAFF', displayName: 'Lead Mechanic',          requiredMinRank: 'SOLDIER',   preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-car-repair-insurance-coordinator', businessType: 'CAR_REPAIR', roleType: 'FINANCE_STAFF',    displayName: 'Insurance Coordinator',  requiredMinRank: 'SOLDIER',   preferredSkill: 'FINANCE',    maxOnePerBusiness: true  },
  { id: 'slot-car-repair-yard-guy',              businessType: 'CAR_REPAIR', roleType: 'SECURITY_STAFF',   displayName: 'Yard Guy',               requiredMinRank: 'ASSOCIATE', preferredSkill: 'SECURITY',   maxOnePerBusiness: true  },

  // ── PIZZERIA ──────────────────────────────────────────────────
  { id: 'slot-pizzeria-manager',          businessType: 'PIZZERIA', roleType: 'MANAGER',          displayName: 'Restaurant Manager', requiredMinRank: 'CAPO',      preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-pizzeria-head-waiter',      businessType: 'PIZZERIA', roleType: 'OPERATIONS_STAFF', displayName: 'Head Waiter',        requiredMinRank: 'SOLDIER',   preferredSkill: 'CHARM',      maxOnePerBusiness: true  },
  { id: 'slot-pizzeria-delivery-driver',  businessType: 'PIZZERIA', roleType: 'OPERATIONS_STAFF', displayName: 'Delivery Driver',    requiredMinRank: 'ASSOCIATE', preferredSkill: 'SECURITY',   maxOnePerBusiness: false },
  { id: 'slot-pizzeria-back-room-runner', businessType: 'PIZZERIA', roleType: 'FINANCE_STAFF',    displayName: 'Back Room Runner',   requiredMinRank: 'SOLDIER',   preferredSkill: 'FINANCE',    maxOnePerBusiness: true  },

  // ── SMALL_BAR ─────────────────────────────────────────────────
  { id: 'slot-small-bar-manager',          businessType: 'SMALL_BAR', roleType: 'MANAGER',          displayName: 'Bar Manager',        requiredMinRank: 'CAPO',      preferredSkill: 'OPERATIONS', maxOnePerBusiness: true  },
  { id: 'slot-small-bar-bartender',        businessType: 'SMALL_BAR', roleType: 'OPERATIONS_STAFF', displayName: 'Bartender',          requiredMinRank: 'SOLDIER',   preferredSkill: 'CHARM',      maxOnePerBusiness: false },
  { id: 'slot-small-bar-doorman',          businessType: 'SMALL_BAR', roleType: 'SECURITY_STAFF',   displayName: 'Doorman',            requiredMinRank: 'ASSOCIATE', preferredSkill: 'SECURITY',   maxOnePerBusiness: true  },
  { id: 'slot-small-bar-back-room-dealer', businessType: 'SMALL_BAR', roleType: 'FINANCE_STAFF',    displayName: 'Back Room Dealer',   requiredMinRank: 'SOLDIER',   preferredSkill: 'FINANCE',    maxOnePerBusiness: true  },
];

export const SLOT_DEFS_BY_ID: Record<string, BusinessSlotDefinition> = Object.fromEntries(
  BUSINESS_SLOT_DEFINITIONS.map(s => [s.id, s])
);
export const SLOT_DEFS_BY_FRONT: Record<string, BusinessSlotDefinition[]> = BUSINESS_SLOT_DEFINITIONS.reduce(
  (acc, s) => { (acc[s.businessType] ??= []).push(s); return acc; },
  {} as Record<string, BusinessSlotDefinition[]>
);

// ═══════════════════════════════════════════════════════════════════
// 5. BUSINESS EXCLUSIVE JOBS
// ═══════════════════════════════════════════════════════════════════

export const BUSINESS_EXCLUSIVE_JOBS: BusinessExclusiveJob[] = [

  // ── CASINO (5 jobs) ───────────────────────────────────────────
  {
    id: 'CASINO_RIG_HIGH_ROLLER',
    businessType: 'CASINO',
    name: 'Rig the High-Roller Table',
    description: 'The pit has a whale coming in tonight — a real estate developer who\'s already down $200K and too proud to walk. Work with the pit boss to ensure the house takes a little more than its legal share. Card shuffles, sensor placement, a few palmed chips. Keep it invisible. One sloppy hand and the eye-in-the-sky catches everything.',
    mode: 'SOLO_OR_CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-casino-manager', 'slot-casino-pit-boss'],
    minCrewSize: 1, maxCrewSize: 2,
    primarySkill: 'OPERATIONS', secondarySkill: 'SECURITY',
    rewardCashMin: 18000, rewardCashMax: 45000,
    rewardFamilySharePercent: 55, rewardManagerSharePercent: 30, rewardStaffSharePercent: 15,
    baseJailRisk: 0.18, cooldownSeconds: 28800,
  },
  {
    id: 'CASINO_SKIM_COUNT_ROOM',
    businessType: 'CASINO',
    name: 'Skim the Count Room',
    description: 'The count room processes millions in chips every week. Before the official tally hits the books, a clean skim pulls cash off the top — never enough to trigger an audit, always enough to matter. This requires access, timing, and a cage cashier who knows when to look away. One number wrong and the Gaming Commission starts asking questions.',
    mode: 'SOLO', minRank: 'UNDERBOSS',
    allowedSlotDefinitionIds: ['slot-casino-manager'],
    minCrewSize: 1, maxCrewSize: 1,
    primarySkill: 'FINANCE', secondarySkill: 'SECURITY',
    rewardCashMin: 35000, rewardCashMax: 80000,
    rewardFamilySharePercent: 70, rewardManagerSharePercent: 25, rewardStaffSharePercent: 5,
    baseJailRisk: 0.28, cooldownSeconds: 43200,
  },
  {
    id: 'CASINO_EXTEND_CREDIT_WHALE',
    businessType: 'CASINO',
    name: 'Extend Credit to a Whale',
    description: 'A high-net-worth player is at the table and running dry. The VIP host extends an off-the-books credit line — house money at street rates. The whale keeps playing, the house keeps winning, and the debt is ours to collect at leisure. Handle it smooth. Whales have lawyers.',
    mode: 'SOLO', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-casino-manager', 'slot-casino-vip-host'],
    minCrewSize: 1, maxCrewSize: 1,
    primarySkill: 'CHARM', secondarySkill: 'FINANCE',
    rewardCashMin: 12000, rewardCashMax: 28000,
    rewardFamilySharePercent: 60, rewardManagerSharePercent: 30, rewardStaffSharePercent: 10,
    baseJailRisk: 0.12, cooldownSeconds: 21600,
  },
  {
    id: 'CASINO_REMOVE_CARD_COUNTER',
    businessType: 'CASINO',
    name: 'Quietly Remove a Card Counter',
    description: 'There\'s a man at table seven who\'s been beating the blackjack odds by a factor that doesn\'t add up. He\'s not cheating — he\'s counting. That\'s legal, which is exactly the problem. Escort him out before he damages the edge further. Friendly, professional, final. He doesn\'t come back.',
    mode: 'SOLO_OR_CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-casino-floor-security-chief', 'slot-casino-manager'],
    minCrewSize: 1, maxCrewSize: 2,
    primarySkill: 'SECURITY', secondarySkill: 'CHARM',
    rewardCashMin: 8000, rewardCashMax: 16000,
    rewardFamilySharePercent: 50, rewardManagerSharePercent: 35, rewardStaffSharePercent: 15,
    baseJailRisk: 0.1, cooldownSeconds: 14400,
  },
  {
    id: 'CASINO_LAUNDER_VIP_EVENTS',
    businessType: 'CASINO',
    name: 'Launder Through VIP Events',
    description: 'Host a private VIP gaming night — invitation only, no surveillance beyond house cameras. Dirty cash comes in as chip purchases, winnings come out clean. The cage cashier records everything as legitimate gaming revenue. Requires coordination between the host, the floor, and the cage. One loose end and three people go down.',
    mode: 'CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-casino-manager', 'slot-casino-vip-host', 'slot-casino-cage-cashier'],
    minCrewSize: 2, maxCrewSize: 3,
    primarySkill: 'FINANCE', secondarySkill: 'CHARM',
    rewardCashMin: 25000, rewardCashMax: 55000,
    rewardFamilySharePercent: 65, rewardManagerSharePercent: 25, rewardStaffSharePercent: 10,
    baseJailRisk: 0.22, cooldownSeconds: 36000,
  },

  // ── CONSTRUCTION (5 jobs) ─────────────────────────────────────
  {
    id: 'CONSTRUCTION_FIX_CITY_BID',
    businessType: 'CONSTRUCTION',
    name: 'Fix the City Contract Bid',
    description: 'A $14 million city infrastructure contract is going to competitive bid next week. The Construction Boss has a contact in the procurement office who can hand over the competing bids twenty-four hours early. Adjust the numbers accordingly, submit first, and collect the contract. A well-placed envelope makes this invisible.',
    mode: 'SOLO', minRank: 'UNDERBOSS',
    allowedSlotDefinitionIds: ['slot-construction-manager'],
    minCrewSize: 1, maxCrewSize: 1,
    primarySkill: 'FINANCE', secondarySkill: 'CHARM',
    rewardCashMin: 40000, rewardCashMax: 90000,
    rewardFamilySharePercent: 70, rewardManagerSharePercent: 25, rewardStaffSharePercent: 5,
    baseJailRisk: 0.3, cooldownSeconds: 43200,
  },
  {
    id: 'CONSTRUCTION_NO_SHOW_PAYROLL',
    businessType: 'CONSTRUCTION',
    name: 'Run the No-Show Payroll',
    description: 'Forty names are on the union payroll. Eighteen of them haven\'t set foot on a job site in six months. The foreman signs their time sheets every Friday anyway. Paychecks go out, cash gets kicked back, everyone gets their cut. The union hall looks the other way — they always have.',
    mode: 'SOLO_OR_CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-construction-manager', 'slot-construction-site-foreman'],
    minCrewSize: 1, maxCrewSize: 2,
    primarySkill: 'FINANCE', secondarySkill: 'OPERATIONS',
    rewardCashMin: 20000, rewardCashMax: 48000,
    rewardFamilySharePercent: 60, rewardManagerSharePercent: 30, rewardStaffSharePercent: 10,
    baseJailRisk: 0.2, cooldownSeconds: 28800,
  },
  {
    id: 'CONSTRUCTION_DIVERT_MATERIALS',
    businessType: 'CONSTRUCTION',
    name: 'Divert Materials Off-Site',
    description: 'Three truckloads of steel rebar and copper wiring are billed to the city project but never reach the site. The yard supervisor logs it as delivered. The material goes to a private buyer at sixty cents on the dollar. Fast, clean, untraceable — as long as the inventory audit doesn\'t come early.',
    mode: 'CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-construction-site-foreman', 'slot-construction-yard-supervisor'],
    minCrewSize: 2, maxCrewSize: 2,
    primarySkill: 'OPERATIONS', secondarySkill: 'SECURITY',
    rewardCashMin: 15000, rewardCashMax: 35000,
    rewardFamilySharePercent: 55, rewardManagerSharePercent: 30, rewardStaffSharePercent: 15,
    baseJailRisk: 0.18, cooldownSeconds: 21600,
  },
  {
    id: 'CONSTRUCTION_LEAN_SUBCONTRACTOR',
    businessType: 'CONSTRUCTION',
    name: 'Lean on a Subcontractor',
    description: 'A concrete subcontractor has been slow on tribute and even slower on kickbacks. Pay a visit. The foreman and the Construction Boss handle it personally — politely, then less politely. The subcontractor will either comply or find that city permits become difficult to obtain.',
    mode: 'SOLO_OR_CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-construction-manager', 'slot-construction-site-foreman'],
    minCrewSize: 1, maxCrewSize: 2,
    primarySkill: 'CHARM', secondarySkill: 'SECURITY',
    rewardCashMin: 10000, rewardCashMax: 22000,
    rewardFamilySharePercent: 55, rewardManagerSharePercent: 35, rewardStaffSharePercent: 10,
    baseJailRisk: 0.14, cooldownSeconds: 14400,
  },
  {
    id: 'CONSTRUCTION_STAGE_DELAY',
    businessType: 'CONSTRUCTION',
    name: "Stage an 'Accidental' Delay",
    description: "A competing developer wants his rival's project stalled before the city council vote next month. For the right price, a series of unfortunate events will set back the site by six to eight weeks — a misplaced permit, a union grievance, a small but expensive equipment failure. Nothing criminal on the surface. Everything criminal underneath.",
    mode: 'CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-construction-manager', 'slot-construction-site-foreman'],
    minCrewSize: 2, maxCrewSize: 3,
    primarySkill: 'OPERATIONS', secondarySkill: 'SECURITY',
    rewardCashMin: 18000, rewardCashMax: 40000,
    rewardFamilySharePercent: 60, rewardManagerSharePercent: 30, rewardStaffSharePercent: 10,
    baseJailRisk: 0.2, cooldownSeconds: 36000,
  },

  // ── NIGHTCLUB (5 jobs) ────────────────────────────────────────
  {
    id: 'NIGHTCLUB_VIP_POLITICIAN',
    businessType: 'NIGHTCLUB',
    name: 'Host a VIP Night for a Politician',
    description: 'A city alderman is coming in with his staff for a private event — compliments of the house. The VIP host runs the room. The club manager ensures the right bottles arrive at the right table. By the end of the night, the alderman owes a favor he may not remember agreeing to. Document everything anyway.',
    mode: 'SOLO_OR_CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-nightclub-manager', 'slot-nightclub-vip-host'],
    minCrewSize: 1, maxCrewSize: 2,
    primarySkill: 'CHARM', secondarySkill: 'OPERATIONS',
    rewardCashMin: 10000, rewardCashMax: 24000,
    rewardFamilySharePercent: 65, rewardManagerSharePercent: 25, rewardStaffSharePercent: 10,
    baseJailRisk: 0.08, cooldownSeconds: 43200,
  },
  {
    id: 'NIGHTCLUB_RECORD_COMPROMISE',
    businessType: 'NIGHTCLUB',
    name: 'Record a Compromising Encounter',
    description: 'A high-value target is at the club tonight — judge, prosecutor, department chief, pick one. The VIP host ensures a comfortable private booth. Security manages the camera placement from the security suite. What happens in that booth stays on record — leverage, not exposure. Handle the footage personally.',
    mode: 'SOLO', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-nightclub-manager', 'slot-nightclub-security-chief', 'slot-nightclub-vip-host'],
    minCrewSize: 1, maxCrewSize: 1,
    primarySkill: 'SECURITY', secondarySkill: 'OPERATIONS',
    rewardCashMin: 8000, rewardCashMax: 18000,
    rewardFamilySharePercent: 60, rewardManagerSharePercent: 35, rewardStaffSharePercent: 5,
    baseJailRisk: 0.2, cooldownSeconds: 36000,
  },
  {
    id: 'NIGHTCLUB_MOVE_PRODUCT',
    businessType: 'NIGHTCLUB',
    name: 'Move Product Through the Bar',
    description: 'The club runs product on weekend nights — pills and powder, distributed through bar staff to the floor. The security chief ensures the side entrance stays quiet and the wrong people don\'t wander in. The floor manager manages the distribution points. Move volume, keep it clean, no arrests inside the venue.',
    mode: 'CREW', minRank: 'ASSOCIATE',
    allowedSlotDefinitionIds: ['slot-nightclub-manager', 'slot-nightclub-floor-manager', 'slot-nightclub-bartender', 'slot-nightclub-security-chief'],
    minCrewSize: 2, maxCrewSize: 4,
    primarySkill: 'OPERATIONS', secondarySkill: 'SECURITY',
    rewardCashMin: 20000, rewardCashMax: 50000,
    rewardFamilySharePercent: 60, rewardManagerSharePercent: 25, rewardStaffSharePercent: 15,
    baseJailRisk: 0.25, cooldownSeconds: 21600,
  },
  {
    id: 'NIGHTCLUB_PRIVATE_SITDOWN',
    businessType: 'NIGHTCLUB',
    name: 'Close the Club for a Private Sit-Down',
    description: 'The club goes dark for the night. No public, no staff beyond essentials. Leadership from two families will meet here to resolve a territorial matter. The security chief locks the perimeter, the manager handles hospitality, and the room guarantees neutral ground. Nothing discussed here leaves this building.',
    mode: 'CREW', minRank: 'UNDERBOSS',
    allowedSlotDefinitionIds: ['slot-nightclub-manager', 'slot-nightclub-security-chief'],
    minCrewSize: 2, maxCrewSize: 2,
    primarySkill: 'SECURITY', secondarySkill: 'OPERATIONS',
    rewardCashMin: 5000, rewardCashMax: 12000,
    rewardFamilySharePercent: 70, rewardManagerSharePercent: 20, rewardStaffSharePercent: 10,
    baseJailRisk: 0.06, cooldownSeconds: 57600,
  },
  {
    id: 'NIGHTCLUB_FAKE_CHARITY',
    businessType: 'NIGHTCLUB',
    name: 'Run a Fake Charity Night',
    description: 'The club hosts a fundraising gala for a charitable foundation that exists primarily on paper. Tickets are $500 a head. Donations are tax-deductible. The foundation\'s accountant processes the proceeds through three accounts before the money surfaces clean. The VIP host works the room. Nobody asks where the money goes.',
    mode: 'CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-nightclub-manager', 'slot-nightclub-accountant', 'slot-nightclub-vip-host'],
    minCrewSize: 2, maxCrewSize: 3,
    primarySkill: 'FINANCE', secondarySkill: 'CHARM',
    rewardCashMin: 22000, rewardCashMax: 52000,
    rewardFamilySharePercent: 65, rewardManagerSharePercent: 25, rewardStaffSharePercent: 10,
    baseJailRisk: 0.22, cooldownSeconds: 43200,
  },

  // ── CAR_REPAIR (2 jobs) ───────────────────────────────────────
  {
    id: 'CAR_REPAIR_STAGE_TOTAL',
    businessType: 'CAR_REPAIR',
    name: "Stage a 'Totaled' Insurance Job",
    description: 'A vehicle worth $8,000 gets documented as a total loss worth $28,000. The lead mechanic handles the damage assessment and photographs. The insurance coordinator files the claim through the friendly adjuster. The shop collects. The car gets repaired and resold three months later under a different VIN.',
    mode: 'CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-car-repair-manager', 'slot-car-repair-lead-mechanic'],
    minCrewSize: 2, maxCrewSize: 2,
    primarySkill: 'OPERATIONS', secondarySkill: 'FINANCE',
    rewardCashMin: 6000, rewardCashMax: 14000,
    rewardFamilySharePercent: 55, rewardManagerSharePercent: 35, rewardStaffSharePercent: 10,
    baseJailRisk: 0.18, cooldownSeconds: 21600,
  },
  {
    id: 'CAR_REPAIR_VANDALIZE_REPEAT',
    businessType: 'CAR_REPAIR',
    name: 'Vandalize for Repeat Business',
    description: 'Business has been slow. The yard guy makes a few late-night trips around the neighborhood — keyed doors, sugar in tanks, slashed tires on the cars of people who happen to live three blocks from the shop. Calls come in by morning. Work ethic like that keeps the bays full.',
    mode: 'SOLO_OR_CREW', minRank: 'ASSOCIATE',
    allowedSlotDefinitionIds: ['slot-car-repair-manager', 'slot-car-repair-lead-mechanic', 'slot-car-repair-yard-guy'],
    minCrewSize: 1, maxCrewSize: 3,
    primarySkill: 'SECURITY', secondarySkill: 'OPERATIONS',
    rewardCashMin: 3000, rewardCashMax: 8000,
    rewardFamilySharePercent: 50, rewardManagerSharePercent: 40, rewardStaffSharePercent: 10,
    baseJailRisk: 0.13, cooldownSeconds: 28800,
  },

  // ── PIZZERIA (2 jobs) ─────────────────────────────────────────
  {
    id: 'PIZZERIA_DELIVER_MORE',
    businessType: 'PIZZERIA',
    name: 'Deliver More Than Pizza',
    description: 'The delivery driver runs a second route alongside the regular orders. The bags are heavier than the menu suggests and the destinations aren\'t always hungry. The restaurant manager times the runs to avoid overlapping with the beat cop\'s dinner break. Fast, repeatable, low profile.',
    mode: 'CREW', minRank: 'ASSOCIATE',
    allowedSlotDefinitionIds: ['slot-pizzeria-manager', 'slot-pizzeria-delivery-driver'],
    minCrewSize: 2, maxCrewSize: 2,
    primarySkill: 'SECURITY', secondarySkill: 'CHARM',
    rewardCashMin: 2500, rewardCashMax: 7000,
    rewardFamilySharePercent: 50, rewardManagerSharePercent: 40, rewardStaffSharePercent: 10,
    baseJailRisk: 0.1, cooldownSeconds: 10800,
  },
  {
    id: 'PIZZERIA_BACKROOM_NUMBERS',
    businessType: 'PIZZERIA',
    name: 'Run the Back-Room Numbers',
    description: 'The back dining room closes at nine. The real business starts at nine-fifteen. Regulars know the side door. The back room runner manages the slips and float. The head waiter keeps the front looking normal and watches for anyone who shouldn\'t be there. Steady, low-heat income that the neighborhood has relied on for twenty years.',
    mode: 'SOLO_OR_CREW', minRank: 'ASSOCIATE',
    allowedSlotDefinitionIds: ['slot-pizzeria-manager', 'slot-pizzeria-back-room-runner', 'slot-pizzeria-head-waiter'],
    minCrewSize: 1, maxCrewSize: 3,
    primarySkill: 'FINANCE', secondarySkill: 'CHARM',
    rewardCashMin: 3500, rewardCashMax: 9000,
    rewardFamilySharePercent: 55, rewardManagerSharePercent: 35, rewardStaffSharePercent: 10,
    baseJailRisk: 0.1, cooldownSeconds: 14400,
  },

  // ── SMALL_BAR (1 job) ─────────────────────────────────────────
  {
    id: 'BAR_FRIENDLY_CARD_GAME',
    businessType: 'SMALL_BAR',
    name: "Host a 'Friendly' Card Game",
    description: 'The bar closes at midnight. By twelve-fifteen the back room has a table, six players, and a house take of 10% per pot. The back room dealer runs the game. The bar manager watches the door and keeps the right people out. Stakes are high enough to be interesting, low enough to keep it quiet. The neighborhood loves a friendly game.',
    mode: 'CREW', minRank: 'SOLDIER',
    allowedSlotDefinitionIds: ['slot-small-bar-manager', 'slot-small-bar-back-room-dealer'],
    minCrewSize: 2, maxCrewSize: 2,
    primarySkill: 'CHARM', secondarySkill: 'SECURITY',
    rewardCashMin: 3000, rewardCashMax: 8500,
    rewardFamilySharePercent: 55, rewardManagerSharePercent: 35, rewardStaffSharePercent: 10,
    baseJailRisk: 0.12, cooldownSeconds: 18000,
  },
];

export const BIZ_JOBS_BY_ID: Record<string, BusinessExclusiveJob> = Object.fromEntries(
  BUSINESS_EXCLUSIVE_JOBS.map(j => [j.id, j])
);
export const BIZ_JOBS_BY_FRONT: Record<string, BusinessExclusiveJob[]> = BUSINESS_EXCLUSIVE_JOBS.reduce(
  (acc, j) => { (acc[j.businessType] ??= []).push(j); return acc; },
  {} as Record<string, BusinessExclusiveJob[]>
);

// ═══════════════════════════════════════════════════════════════════
// 6. BUSINESS ASSIGNMENT DEV SEEDS
// ═══════════════════════════════════════════════════════════════════
// businessId references a specific FRONT INSTANCE (not a definition).
// In dev/testing these are named by convention: BUSINESS_{TYPE}_{N}
// playerId references dev player stubs matching the mock player IDs.

export const BUSINESS_ASSIGNMENTS_SEED: BusinessAssignment[] = [
  // Casino assignments
  { id: 'assign-casino-001', businessId: 'BUSINESS_CASINO_1',         slotDefinitionId: 'slot-casino-manager',              playerId: 'p-underboss',    assignedAt: '2026-01-10T09:00:00Z' },
  { id: 'assign-casino-002', businessId: 'BUSINESS_CASINO_1',         slotDefinitionId: 'slot-casino-pit-boss',             playerId: 'p-soldier',      assignedAt: '2026-01-11T10:00:00Z' },
  { id: 'assign-casino-003', businessId: 'BUSINESS_CASINO_1',         slotDefinitionId: 'slot-casino-cage-cashier',         playerId: 'p-soldier-2',    assignedAt: '2026-01-12T11:00:00Z' },
  { id: 'assign-casino-004', businessId: 'BUSINESS_CASINO_1',         slotDefinitionId: 'slot-casino-vip-host',             playerId: 'p-soldier-3',    assignedAt: '2026-01-13T12:00:00Z' },
  { id: 'assign-casino-005', businessId: 'BUSINESS_CASINO_1',         slotDefinitionId: 'slot-casino-dealer',               playerId: 'p-associate',    assignedAt: '2026-01-14T13:00:00Z' },

  // Construction assignments
  { id: 'assign-construction-001', businessId: 'BUSINESS_CONSTRUCTION_1', slotDefinitionId: 'slot-construction-manager',             playerId: 'p-underboss',    assignedAt: '2026-01-15T09:00:00Z' },
  { id: 'assign-construction-002', businessId: 'BUSINESS_CONSTRUCTION_1', slotDefinitionId: 'slot-construction-site-foreman',        playerId: 'p-capo',         assignedAt: '2026-01-16T10:00:00Z' },
  { id: 'assign-construction-003', businessId: 'BUSINESS_CONSTRUCTION_1', slotDefinitionId: 'slot-construction-procurement-officer', playerId: 'p-soldier',      assignedAt: '2026-01-17T11:00:00Z' },
  { id: 'assign-construction-004', businessId: 'BUSINESS_CONSTRUCTION_1', slotDefinitionId: 'slot-construction-yard-supervisor',     playerId: 'p-soldier-2',    assignedAt: '2026-01-18T12:00:00Z' },

  // Nightclub assignments
  { id: 'assign-nightclub-001', businessId: 'BUSINESS_NIGHTCLUB_1',   slotDefinitionId: 'slot-nightclub-manager',         playerId: 'p-underboss',    assignedAt: '2026-02-01T09:00:00Z' },
  { id: 'assign-nightclub-002', businessId: 'BUSINESS_NIGHTCLUB_1',   slotDefinitionId: 'slot-nightclub-vip-host',        playerId: 'p-soldier-3',    assignedAt: '2026-02-02T10:00:00Z' },
  { id: 'assign-nightclub-003', businessId: 'BUSINESS_NIGHTCLUB_1',   slotDefinitionId: 'slot-nightclub-security-chief',  playerId: 'p-soldier-2',    assignedAt: '2026-02-03T11:00:00Z' },
  { id: 'assign-nightclub-004', businessId: 'BUSINESS_NIGHTCLUB_1',   slotDefinitionId: 'slot-nightclub-bartender',       playerId: 'p-associate',    assignedAt: '2026-02-04T12:00:00Z' },

  // Car repair assignments
  { id: 'assign-car-repair-001', businessId: 'BUSINESS_CAR_REPAIR_1', slotDefinitionId: 'slot-car-repair-manager',               playerId: 'p-capo',         assignedAt: '2026-02-10T09:00:00Z' },
  { id: 'assign-car-repair-002', businessId: 'BUSINESS_CAR_REPAIR_1', slotDefinitionId: 'slot-car-repair-lead-mechanic',         playerId: 'p-soldier',      assignedAt: '2026-02-11T10:00:00Z' },
  { id: 'assign-car-repair-003', businessId: 'BUSINESS_CAR_REPAIR_1', slotDefinitionId: 'slot-car-repair-insurance-coordinator', playerId: 'p-soldier-2',    assignedAt: '2026-02-12T11:00:00Z' },
  { id: 'assign-car-repair-004', businessId: 'BUSINESS_CAR_REPAIR_1', slotDefinitionId: 'slot-car-repair-yard-guy',              playerId: 'p-associate',    assignedAt: '2026-02-13T12:00:00Z' },

  // Pizzeria assignments
  { id: 'assign-pizzeria-001', businessId: 'BUSINESS_PIZZERIA_1',     slotDefinitionId: 'slot-pizzeria-manager',          playerId: 'p-capo-2',       assignedAt: '2026-02-15T09:00:00Z' },
  { id: 'assign-pizzeria-002', businessId: 'BUSINESS_PIZZERIA_1',     slotDefinitionId: 'slot-pizzeria-delivery-driver',  playerId: 'p-associate',    assignedAt: '2026-02-16T10:00:00Z' },
  { id: 'assign-pizzeria-003', businessId: 'BUSINESS_PIZZERIA_1',     slotDefinitionId: 'slot-pizzeria-back-room-runner', playerId: 'p-soldier',      assignedAt: '2026-02-17T11:00:00Z' },

  // Small bar assignments
  { id: 'assign-small-bar-001', businessId: 'BUSINESS_SMALL_BAR_1',  slotDefinitionId: 'slot-small-bar-manager',          playerId: 'p-capo-2',       assignedAt: '2026-03-01T09:00:00Z' },
  { id: 'assign-small-bar-002', businessId: 'BUSINESS_SMALL_BAR_1',  slotDefinitionId: 'slot-small-bar-back-room-dealer', playerId: 'p-soldier-3',    assignedAt: '2026-03-02T10:00:00Z' },
  { id: 'assign-small-bar-003', businessId: 'BUSINESS_SMALL_BAR_1',  slotDefinitionId: 'slot-small-bar-doorman',          playerId: 'p-associate',    assignedAt: '2026-03-03T11:00:00Z' },
];

// ═══════════════════════════════════════════════════════════════════
// SUMMARY STATS — useful for admin views
// ═══════════════════════════════════════════════════════════════════

export const WORLD_STATS = {
  districtCount:     DISTRICTS.length,
  turfCount:         TURFS.length,
  turfOwnedCount:    TURFS.filter(t => t.familyId !== null).length,
  turfUnownedCount:  TURFS.filter(t => t.familyId === null).length,
  bizDefCount:       BUSINESS_DEFINITIONS.length,
  bizDefImplemented: BUSINESS_DEFINITIONS.filter(b => b.implemented).length,
  slotDefCount:      BUSINESS_SLOT_DEFINITIONS.length,
  exclusiveJobCount: BUSINESS_EXCLUSIVE_JOBS.length,
  assignmentCount:   BUSINESS_ASSIGNMENTS_SEED.length,
} as const;
