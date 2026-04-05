// ═══════════════════════════════════════════════════════════════════
// MAFIALIFE — World Config Types
// Covers: Districts, Turfs (world layer), Business Definitions,
//         BusinessSlotDefinitions, BusinessExclusiveJobs, BusinessAssignments
//
// Hierarchy:
//   City → District → Turf (world slot) → TurfBlock (family-owned) → BusinessSlot
//
// Distinction:
//   - Turf (this file): world-layer purchasable plots. Owned by a family.
//   - TurfBlock (schema.ts): a family's view of their owned turf, with 16 business slots.
//   These are intentionally separate — Turf is the acquisition layer,
//   TurfBlock is the operational layer once owned.
// ═══════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export type DistrictSlug =
  | 'DOWNTOWN'
  | 'WATERFRONT'
  | 'NORTH_END'
  | 'INDUSTRIAL_BELT'
  | 'CASINO_STRIP'
  | 'OUTER_BOROUGHS';

export type DistrictTheme =
  | 'POLITICAL'     // government, white-collar corruption
  | 'MARITIME'      // docks, smuggling, port operations
  | 'RESIDENTIAL'   // neighborhoods, protection, loan-sharking
  | 'INDUSTRIAL'    // factories, construction, waste
  | 'GAMBLING'      // casinos, bookmaking, VIP entertainment
  | 'SUBURBAN';     // outer neighborhoods, low heat, steady income

export type InfluenceBonusType =
  | 'CORRUPTION'    // better city contract outcomes
  | 'SMUGGLING'     // better contraband/fencing yields
  | 'PROTECTION'    // lower heat accumulation in territory
  | 'CONSTRUCTION'  // better construction job yields
  | 'GAMBLING'      // better casino/numbers job yields
  | 'NONE';

export type TurfQualityTier =
  | 'PRIME'      // high value, high cost, high competition
  | 'SOLID'      // mid-tier, balanced
  | 'ROUGH'      // cheap, lower income, easier to hold
  | 'CONTESTED'; // disputed, war-context bonus

export type BusinessScale = 'SMALL' | 'LARGE' | 'HQ';

export type BusinessRoleType =
  | 'MANAGER'
  | 'OPERATIONS_STAFF'
  | 'SECURITY_STAFF'
  | 'FINANCE_STAFF'
  | 'VIP_HOST';

export type SkillTag =
  | 'OPERATIONS'
  | 'SECURITY'
  | 'FINANCE'
  | 'CHARM';

// Re-export from schema context for convenience — these front types
// are the "new" fronts with role-slot mechanics. The original BusinessType
// in schema.ts covers the legacy turf-slot businesses (numbers spots, etc.)
export type FrontType =
  | 'CASINO'
  | 'CONSTRUCTION'
  | 'NIGHTCLUB'
  | 'CAR_REPAIR'
  | 'PIZZERIA'
  | 'SMALL_BAR'
  | 'PORT_LOGISTICS'    // placeholder
  | 'WASTE_MANAGEMENT'  // placeholder
  | 'REAL_ESTATE'       // placeholder
  | 'HQ_CLUB';          // placeholder (Don-level only)

export type JobMode = 'SOLO' | 'CREW' | 'SOLO_OR_CREW';

export type MinRank =
  | 'ASSOCIATE'
  | 'SOLDIER'
  | 'CAPO'
  | 'CONSIGLIERE'
  | 'UNDERBOSS'
  | 'DON';

// ─────────────────────────────────────────────
// DISTRICT
// ─────────────────────────────────────────────

export interface District {
  id: string;
  slug: DistrictSlug;
  name: string;
  description: string;
  theme: DistrictTheme;
  /** Suggested number of turf parcels in this district */
  turfCountTarget: number;
  /** Front types that gain a bonus when operated here */
  allowedFrontTypes: FrontType[];
  /** The influence bonus this district provides to its controller */
  influenceBonusType: InfluenceBonusType;
  /** For UI ordering */
  displayOrder: number;
  /** Lore tagline */
  tagline: string;
}

// ─────────────────────────────────────────────
// TURF (world-layer parcel)
// ─────────────────────────────────────────────

export interface Turf {
  id: string;
  districtId: string;
  /** null = unowned / available to purchase */
  familyId: string | null;
  name: string;
  /** How many business/front slots this parcel supports */
  slotCount: 4 | 6 | 8;
  purchaseCost: number;
  qualityTier: TurfQualityTier;
  /** ISO timestamp — seed date */
  createdAt: string;
  /** null until purchased */
  purchasedAt: string | null;
  /** null until purchased */
  purchasedByPlayerId: string | null;
  /** Short flavor description of the location */
  locationNote: string;
}

// ─────────────────────────────────────────────
// BUSINESS / FRONT DEFINITION
// ─────────────────────────────────────────────

export interface BusinessDefinition {
  /** Matches FrontType enum */
  id: FrontType;
  displayName: string;
  scale: BusinessScale;
  /** Base cash generated per income tick (daily) */
  baseProfitPerTick: number;
  /** 0–1 base risk multiplier for heat accrual */
  baseRisk: number;
  /** One-time cost to establish this front on a turf slot */
  buildCost: number;
  /** Minimum rank required to manage this business */
  recommendedManagerRank: MinRank;
  /** Districts where this front type gains a bonus */
  allowedDistricts: DistrictSlug[];
  description: string;
  /** Flavor tagline */
  lore: string;
  /** Whether the front is available in the current build */
  implemented: boolean;
}

// ─────────────────────────────────────────────
// BUSINESS SLOT DEFINITION
// ─────────────────────────────────────────────

export interface BusinessSlotDefinition {
  id: string;
  businessType: FrontType;
  roleType: BusinessRoleType;
  displayName: string;
  requiredMinRank: MinRank;
  preferredSkill: SkillTag | null;
  /** If true, only one player can hold this slot per business instance */
  maxOnePerBusiness: boolean;
}

// ─────────────────────────────────────────────
// BUSINESS EXCLUSIVE JOB
// ─────────────────────────────────────────────

export interface BusinessExclusiveJob {
  id: string;
  businessType: FrontType;
  name: string;
  description: string;
  mode: JobMode;
  minRank: MinRank;
  /** Only players holding one of these slot definition IDs can run this job */
  allowedSlotDefinitionIds: string[];
  minCrewSize: number;
  maxCrewSize: number | null;
  primarySkill: SkillTag | null;
  secondarySkill: SkillTag | null;
  rewardCashMin: number;
  rewardCashMax: number;
  /** % of reward that goes to family treasury */
  rewardFamilySharePercent: number;
  /** % that goes to the player holding the MANAGER slot */
  rewardManagerSharePercent: number;
  /** % split among participating crew (non-manager) */
  rewardStaffSharePercent: number;
  /** 0–1 probability of arrest on failure */
  baseJailRisk: number;
  /** Wall-clock cooldown in seconds */
  cooldownSeconds: number;
}

// ─────────────────────────────────────────────
// BUSINESS ASSIGNMENT
// ─────────────────────────────────────────────

export interface BusinessAssignment {
  id: string;
  /** ID of the specific business instance (not the definition) */
  businessId: string;
  /** References BusinessSlotDefinition.id */
  slotDefinitionId: string;
  /** The player assigned to this role */
  playerId: string;
  assignedAt: string;
}

// ─────────────────────────────────────────────
// RANK ORDER (for gate comparisons)
// ─────────────────────────────────────────────

export const RANK_ORDER: Record<MinRank, number> = {
  ASSOCIATE:   1,
  SOLDIER:     2,
  CAPO:        3,
  CONSIGLIERE: 3,
  UNDERBOSS:   4,
  DON:         5,
};

export function meetsRankRequirement(playerRank: MinRank, required: MinRank): boolean {
  return RANK_ORDER[playerRank] >= RANK_ORDER[required];
}

// ─────────────────────────────────────────────
// CREW
// ─────────────────────────────────────────────

export interface Crew {
  id: string;
  name: string;
  familyId: string;
  leaderId: string;        // Underboss who leads it
  memberIds: string[];     // Capos, Soldiers, Associates
  description: string;
  territory: string[];     // district slugs
  createdAt: string;
  status: 'ACTIVE' | 'DISBANDED';
}

// ─────────────────────────────────────────────
// FRONT INSTANCE
// ─────────────────────────────────────────────

export interface FrontInstance {
  id: string;
  turfId: string;
  slotIndex: number;       // which slot on the turf (0 to slotCount-1)
  frontType: FrontType;
  familyId: string;
  upgradeLevel: 1 | 2 | 3;
  builtAt: string;
  // Daily income = BusinessDefinition.baseProfitPerTick * upgradeMultiplier[upgradeLevel]
  // UpgradeMultiplier: [1, 1.6, 2.5]
  managerPlayerId: string | null;    // holds slot-*-manager assignment
  // Staffing tracked via BusinessAssignments by frontId
}

// ─────────────────────────────────────────────
// DISTRICT INFLUENCE
// ─────────────────────────────────────────────

export interface DistrictInfluence {
  districtId: string;
  familyId: string;
  // Calculated from: turfs owned * 100 + frontInstances * 50 * avgUpgradeLevel + staffed slots * 10
  score: number;
  turfCount: number;
  frontCount: number;
  staffedSlots: number;
  lastCalculatedAt: string;
}

// ─────────────────────────────────────────────
// SEASON
// ─────────────────────────────────────────────

export type SeasonStatus = 'ACTIVE' | 'ENDED' | 'UPCOMING';

export interface Season {
  id: string;
  number: number;           // Season 1, 2, 3...
  name: string;
  status: SeasonStatus;
  startedAt: string;
  endsAt: string;
  description: string;
  // What changes at season end:
  softResetFields: string[];  // e.g. ['turf', 'treasury', 'prestige']
  preservedFields: string[];  // e.g. ['rank', 'archetype', 'family_membership']
}

// ─────────────────────────────────────────────
// LEADERBOARD SNAPSHOT
// ─────────────────────────────────────────────

export interface LeaderboardSnapshot {
  id: string;
  seasonId: string;
  snapshotAt: string;
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
