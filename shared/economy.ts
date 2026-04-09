// ═══════════════════════════════════════════════
// THE LAST FIRM — Economy & Meta Systems
// Canonical data models for all economy subsystems.
// Mocked data only. Backend-ready structure.
// ═══════════════════════════════════════════════

// ─────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────

export type ItemCategory =
  | 'WEAPON'       // pistols, rifles, knives — future accuracy/strength modifiers
  | 'TOOL'         // lockpicks, explosives, forged docs, burner phones
  | 'INTEL'        // abstract information assets (scouting data, blueprints, contacts)
  | 'CONSUMABLE'   // medkits, heat reducers, disguise kits
  | 'GEAR'         // vests, comm devices, clean clothing
  | 'CONTRABAND';  // raw drugs, stolen goods — for sale only

export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'ELITE';

export interface ItemStatModifier {
  stat: string;         // e.g. 'accuracy', 'strength', 'suspicion'
  delta: number;        // positive = bonus, negative = penalty
}

/** Canonical item definition — data-driven for easy extension */
export interface ItemDefinition {
  id: string;
  name: string;
  category: ItemCategory;
  rarity: ItemRarity;
  description: string;
  tradable: boolean;           // can be listed on Black Market
  equippable: boolean;         // can be "equipped" for stat effect
  stackable: boolean;          // if false, max quantity = 1
  weight_class: 'LIGHT' | 'MEDIUM' | 'HEAVY'; // for future carry-limit mechanics
  stat_modifiers: ItemStatModifier[];           // applied when equipped
  base_value: number;          // reference price in cash
}

/** A player's instance of an item (quantity, wear state, source) */
export interface InventoryItem {
  id: string;                  // unique instance ID
  player_id: string;
  item_definition_id: string;
  quantity: number;
  equipped: boolean;
  source: InventoryItemSource;
  acquired_at: string;
  notes: string | null;
}

export type InventoryItemSource =
  | 'MISSION_LOOT'
  | 'BLACK_MARKET_PURCHASE'
  | 'STARTING_GEAR'
  | 'FAMILY_ISSUED'
  | 'CRAFTED'
  | 'REWARD'
  | 'TRANSFERRED';

// ─────────────────────────────────────────────
// BANK & STASH
// ─────────────────────────────────────────────

export interface BankAccount {
  id: string;
  player_id: string;
  balance: number;
  last_updated: string;
  total_deposited: number;    // lifetime stat
  total_withdrawn: number;    // lifetime stat
}

export interface Stash {
  id: string;
  player_id: string;
  hidden_balance: number;
  discoverability_level: number;  // 0–100; higher = easier to raid (future mechanic)
  last_updated: string;
}

// ─────────────────────────────────────────────
// TRANSACTIONS — generic money movement ledger
// ─────────────────────────────────────────────

export type TransactionType =
  | 'MISSION_PAYOUT'       // from completing a mission
  | 'CONTRACT_PAYOUT'      // hitman contract payment
  | 'FAMILY_TAX'           // portion taken by family
  | 'FAMILY_TREASURY_IN'   // deposit into family treasury
  | 'FAMILY_TREASURY_OUT'  // withdraw from family treasury
  | 'BANK_DEPOSIT'
  | 'BANK_WITHDRAWAL'
  | 'STASH_DEPOSIT'
  | 'STASH_WITHDRAWAL'
  | 'BLACK_MARKET_SALE'
  | 'BLACK_MARKET_PURCHASE'
  | 'LISTING_FEE'
  | 'SYSTEM_REWARD'
  | 'SYSTEM_PENALTY'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT';

export interface Transaction {
  id: string;
  player_id: string;           // primary actor
  family_id: string | null;    // if family-related
  type: TransactionType;
  amount: number;              // always positive; direction determined by type
  balance_after: number;       // wallet balance after this transaction
  description: string;
  related_entity_id: string | null;  // mission ID, contract ID, listing ID, etc.
  timestamp: string;
}

// ─────────────────────────────────────────────
// BLACK MARKET
// ─────────────────────────────────────────────

export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED' | 'EXPIRED';

export interface BlackMarketListing {
  id: string;
  seller_player_id: string;
  seller_alias: string | 'ANONYMOUS';  // sellers can choose anonymity
  item_definition_id: string;
  item_snapshot: Pick<ItemDefinition, 'name' | 'category' | 'rarity' | 'description'>;
  quantity: number;
  price_per_unit: number;
  total_price: number;         // price_per_unit × quantity
  status: ListingStatus;
  listing_fee_paid: number;    // proposed default: 2% of total_price (money sink)
  created_at: string;
  expires_at: string;
}

export interface BlackMarketTransaction {
  id: string;
  buyer_player_id: string;
  seller_player_id: string;
  listing_id: string;
  item_definition_id: string;
  quantity: number;
  total_price: number;
  listing_fee: number;         // seller paid this; already sunk
  timestamp: string;
}

// ─────────────────────────────────────────────
// TAX & SPLITS
// ─────────────────────────────────────────────

/** What type of income is being taxed — different sources can have different rates */
export type IncomeSourceType =
  | 'MISSION'
  | 'HEIST'
  | 'CONTRACT'         // hitman contract — solo, no family share
  | 'STREET_JOB'
  | 'BLACK_MARKET_SALE'
  | 'BUSINESS_INCOME';

export interface TaxRule {
  id: string;
  family_id: string;
  name: string;
  description: string;
  base_rate: number;                                   // 0.0 – 1.0 (e.g. 0.15 = 15%)
  source_overrides: Partial<Record<IncomeSourceType, number>>;  // per-source rate overrides
  applies_to_solo: boolean;                            // does this apply to unaffiliated members?
}

/** How a gross payout is split between player and family */
export interface FamilyCutRule {
  id: string;
  family_id: string;
  name: string;
  player_share: number;    // e.g. 0.70 = player keeps 70%
  family_share: number;    // e.g. 0.30 = family treasury gets 30%
  system_sink: number;     // e.g. 0.00 = no system drain (proposed default: 0)
  applies_to: IncomeSourceType[];
}

/** Result of applying tax/split to a gross amount */
export interface SplitResult {
  gross_amount: number;
  player_net: number;
  family_share: number;
  system_sink: number;
  tax_rule_applied: string;
  cut_rule_applied: string;
  income_source: IncomeSourceType;
}

// ─────────────────────────────────────────────
// FAMILY TREASURY
// ─────────────────────────────────────────────

export interface FamilyTreasury {
  family_id: string;
  balance: number;
  last_updated: string;
  total_inflow_this_round: number;
  total_outflow_this_round: number;
  recent_transactions: Transaction[];  // last 20
}

// ─────────────────────────────────────────────
// BUSINESSES
// ─────────────────────────────────────────────

export type BusinessType =
  | 'NUMBERS_OPERATION'   // daily income, low heat
  | 'PROTECTION_RACKET'   // moderate income, moderate heat
  | 'FRONT_BUSINESS'      // legal cover, slow but safe income
  | 'CHOP_SHOP'           // vehicle-related income, moderate risk
  | 'LOAN_SHARKING'       // high income, high heat
  | 'DRUG_DISTRIBUTION';  // highest income, highest heat

export interface Business {
  id: string;
  family_id: string;
  name: string;
  type: BusinessType;
  territory: string;
  daily_income: number;
  heat_generation_per_day: number;
  level: number;           // 1–5, upgradeable (future)
  status: 'ACTIVE' | 'DISRUPTED' | 'SEIZED';
  managed_by: string | null;  // player_id of assigned operator
}

// ─────────────────────────────────────────────
// FAMILIES DIRECTORY
// ─────────────────────────────────────────────

export type FamilySizeBand = 'SMALL' | 'MEDIUM' | 'LARGE' | 'EMPIRE';  // 1-5, 6-15, 16-30, 30+
export type FamilyTier = 'RISING' | 'ESTABLISHED' | 'DOMINANT' | 'LEGENDARY';
export type FamilyPlaystyle = 'BUSINESS_FOCUSED' | 'WAR_FOCUSED' | 'BALANCED' | 'STEALTH' | 'POLITICAL';

/** Public-facing directory entry — no sensitive internal data */
export interface FamilyDirectoryEntry {
  id: string;
  name: string;
  don_alias: string;
  tagline: string;
  playstyle_tags: FamilyPlaystyle[];
  size_band: FamilySizeBand;
  member_count: number;         // approximate — exposed to directory
  strength_tier: FamilyTier;
  wealth_tier: FamilyTier;
  aggression_tier: 'PEACEFUL' | 'MODERATE' | 'AGGRESSIVE' | 'WARMONGER';
  reputation_tier: FamilyTier;
  recruiting_open: boolean;
  territory_count: number;
  business_count: number;
  founded_round: number;
  wins_this_round: number;
}
