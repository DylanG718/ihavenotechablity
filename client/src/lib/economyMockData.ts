/**
 * ECONOMY MOCK DATA
 * All mocked data for the economy subsystems.
 * Replace with API calls when backend is ready.
 */

import type {
  ItemDefinition, InventoryItem, BankAccount, Stash,
  Transaction, BlackMarketListing, TaxRule, FamilyCutRule,
  FamilyTreasury, FamilyDirectoryEntry, Business,
} from '../../../shared/economy';
import { fmt } from './mockData';

export { fmt };

// ─────────────────────────────────────────────
// ITEM DEFINITIONS — data-driven catalogue
// ─────────────────────────────────────────────

export const ITEM_DEFINITIONS: Record<string, ItemDefinition> = {
  'pistol-9mm': {
    id: 'pistol-9mm', name: '9mm Pistol', category: 'WEAPON', rarity: 'COMMON',
    description: 'Standard sidearm. Reliable, concealable. Low noise signature.',
    tradable: true, equippable: true, stackable: false, weight_class: 'LIGHT',
    stat_modifiers: [{ stat: 'accuracy', delta: +5 }],
    base_value: 4000,
  },
  'shotgun-pump': {
    id: 'shotgun-pump', name: 'Pump Shotgun', category: 'WEAPON', rarity: 'UNCOMMON',
    description: 'Close-range devastation. Not subtle. Not meant to be.',
    tradable: true, equippable: true, stackable: false, weight_class: 'HEAVY',
    stat_modifiers: [{ stat: 'strength', delta: +10 }, { stat: 'suspicion', delta: +8 }],
    base_value: 9000,
  },
  'sniper-rifle': {
    id: 'sniper-rifle', name: 'Sniper Rifle', category: 'WEAPON', rarity: 'RARE',
    description: 'Long-range precision. Required for high-tier assassination contracts.',
    tradable: false, equippable: true, stackable: false, weight_class: 'HEAVY',
    stat_modifiers: [{ stat: 'accuracy', delta: +22 }],
    base_value: 35000,
  },
  'knife-combat': {
    id: 'knife-combat', name: 'Combat Knife', category: 'WEAPON', rarity: 'COMMON',
    description: 'Silent, close-range. No heat on use.',
    tradable: true, equippable: true, stackable: false, weight_class: 'LIGHT',
    stat_modifiers: [{ stat: 'strength', delta: +3 }, { stat: 'accuracy', delta: +2 }],
    base_value: 800,
  },
  'lockpick-set': {
    id: 'lockpick-set', name: 'Lockpick Set', category: 'TOOL', rarity: 'COMMON',
    description: 'Essential for infiltration missions. Reduces entry detection risk.',
    tradable: true, equippable: false, stackable: true, weight_class: 'LIGHT',
    stat_modifiers: [],
    base_value: 500,
  },
  'explosives-c4': {
    id: 'explosives-c4', name: 'C4 Block', category: 'TOOL', rarity: 'RARE',
    description: 'Precision detonation. Required for vault jobs.',
    tradable: false, equippable: false, stackable: true, weight_class: 'MEDIUM',
    stat_modifiers: [],
    base_value: 18000,
  },
  'forged-docs': {
    id: 'forged-docs', name: 'Forged Documents', category: 'TOOL', rarity: 'UNCOMMON',
    description: 'Fake ID, vehicle reg, business license. Reduces suspicion by 12 on use.',
    tradable: true, equippable: false, stackable: true, weight_class: 'LIGHT',
    stat_modifiers: [],
    base_value: 3500,
  },
  'burner-phone': {
    id: 'burner-phone', name: 'Burner Phone', category: 'TOOL', rarity: 'COMMON',
    description: 'Untraceable communications. One-time use.',
    tradable: true, equippable: false, stackable: true, weight_class: 'LIGHT',
    stat_modifiers: [],
    base_value: 300,
  },
  'intel-blueprints': {
    id: 'intel-blueprints', name: 'Building Blueprints', category: 'INTEL', rarity: 'UNCOMMON',
    description: 'Detailed floor plans. Grants mission bonus on infiltration jobs.',
    tradable: true, equippable: false, stackable: false, weight_class: 'LIGHT',
    stat_modifiers: [],
    base_value: 12000,
  },
  'intel-police-schedule': {
    id: 'intel-police-schedule', name: 'Police Schedule', category: 'INTEL', rarity: 'RARE',
    description: 'Patrol timing and radio channels. Reduces heat generation by 20% on missions.',
    tradable: true, equippable: false, stackable: false, weight_class: 'LIGHT',
    stat_modifiers: [],
    base_value: 28000,
  },
  'medkit': {
    id: 'medkit', name: 'Field Medkit', category: 'CONSUMABLE', rarity: 'COMMON',
    description: 'Restores 30 HP on use.',
    tradable: true, equippable: false, stackable: true, weight_class: 'LIGHT',
    stat_modifiers: [],
    base_value: 1200,
  },
  'heat-reducer': {
    id: 'heat-reducer', name: 'Clean ID Package', category: 'CONSUMABLE', rarity: 'UNCOMMON',
    description: 'Reduces heat by 15 points. One-time use.',
    tradable: true, equippable: false, stackable: true, weight_class: 'LIGHT',
    stat_modifiers: [],
    base_value: 5000,
  },
  'vest-light': {
    id: 'vest-light', name: 'Lightweight Vest', category: 'GEAR', rarity: 'COMMON',
    description: 'Basic protection. No movement penalty.',
    tradable: true, equippable: true, stackable: false, weight_class: 'MEDIUM',
    stat_modifiers: [{ stat: 'hp', delta: +15 }],
    base_value: 3500,
  },
  'vest-heavy': {
    id: 'vest-heavy', name: 'Tactical Vest', category: 'GEAR', rarity: 'RARE',
    description: 'Heavy protection. Slight strength bonus. Increases suspicion when worn visibly.',
    tradable: false, equippable: true, stackable: false, weight_class: 'HEAVY',
    stat_modifiers: [{ stat: 'hp', delta: +35 }, { stat: 'strength', delta: +5 }, { stat: 'suspicion', delta: +5 }],
    base_value: 18000,
  },
  'contraband-drugs': {
    id: 'contraband-drugs', name: 'Contraband Package', category: 'CONTRABAND', rarity: 'UNCOMMON',
    description: 'Uncut product. High value. Extremely illegal. Black market only.',
    tradable: true, equippable: false, stackable: true, weight_class: 'MEDIUM',
    stat_modifiers: [],
    base_value: 22000,
  },
};

// ─────────────────────────────────────────────
// PLAYER INVENTORY (for p-boss demo player)
// ─────────────────────────────────────────────

export const MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv-1', player_id: 'p-boss', item_definition_id: 'pistol-9mm', quantity: 1, equipped: true, source: 'STARTING_GEAR', acquired_at: '2026-01-01T00:00:00Z', notes: null },
  { id: 'inv-2', player_id: 'p-boss', item_definition_id: 'lockpick-set', quantity: 3, equipped: false, source: 'BLACK_MARKET_PURCHASE', acquired_at: '2026-02-10T00:00:00Z', notes: null },
  { id: 'inv-3', player_id: 'p-boss', item_definition_id: 'forged-docs', quantity: 2, equipped: false, source: 'MISSION_LOOT', acquired_at: '2026-02-14T00:00:00Z', notes: null },
  { id: 'inv-4', player_id: 'p-boss', item_definition_id: 'medkit', quantity: 4, equipped: false, source: 'FAMILY_ISSUED', acquired_at: '2026-03-01T00:00:00Z', notes: null },
  { id: 'inv-5', player_id: 'p-boss', item_definition_id: 'vest-light', quantity: 1, equipped: true, source: 'BLACK_MARKET_PURCHASE', acquired_at: '2026-01-20T00:00:00Z', notes: null },
  { id: 'inv-6', player_id: 'p-boss', item_definition_id: 'intel-blueprints', quantity: 1, equipped: false, source: 'MISSION_LOOT', acquired_at: '2026-03-15T00:00:00Z', notes: 'Ferrante warehouse floor plan' },
  { id: 'inv-7', player_id: 'p-boss', item_definition_id: 'burner-phone', quantity: 5, equipped: false, source: 'BLACK_MARKET_PURCHASE', acquired_at: '2026-03-20T00:00:00Z', notes: null },
  { id: 'inv-8', player_id: 'p-boss', item_definition_id: 'heat-reducer', quantity: 2, equipped: false, source: 'BLACK_MARKET_PURCHASE', acquired_at: '2026-03-25T00:00:00Z', notes: null },
];

// Hitman inventory
export const MOCK_HITMAN_INVENTORY: InventoryItem[] = [
  { id: 'hinv-1', player_id: 'p-hitman-1', item_definition_id: 'sniper-rifle', quantity: 1, equipped: true, source: 'STARTING_GEAR', acquired_at: '2025-12-01T00:00:00Z', notes: 'Custom build' },
  { id: 'hinv-2', player_id: 'p-hitman-1', item_definition_id: 'pistol-9mm', quantity: 1, equipped: false, source: 'BLACK_MARKET_PURCHASE', acquired_at: '2025-12-05T00:00:00Z', notes: 'Backup sidearm' },
  { id: 'hinv-3', player_id: 'p-hitman-1', item_definition_id: 'forged-docs', quantity: 3, equipped: false, source: 'MISSION_LOOT', acquired_at: '2026-01-10T00:00:00Z', notes: null },
  { id: 'hinv-4', player_id: 'p-hitman-1', item_definition_id: 'medkit', quantity: 2, equipped: false, source: 'BLACK_MARKET_PURCHASE', acquired_at: '2026-02-01T00:00:00Z', notes: null },
  { id: 'hinv-5', player_id: 'p-hitman-1', item_definition_id: 'burner-phone', quantity: 8, equipped: false, source: 'BLACK_MARKET_PURCHASE', acquired_at: '2026-03-10T00:00:00Z', notes: null },
  { id: 'hinv-6', player_id: 'p-hitman-1', item_definition_id: 'intel-police-schedule', quantity: 1, equipped: false, source: 'REWARD', acquired_at: '2026-03-22T00:00:00Z', notes: 'Lower Manhattan precinct 7' },
];

// ─────────────────────────────────────────────
// BANK & STASH
// ─────────────────────────────────────────────

export const MOCK_BANK: BankAccount = {
  id: 'bank-boss', player_id: 'p-boss',
  balance: 820000, last_updated: '2026-03-28T10:00:00Z',
  total_deposited: 2400000, total_withdrawn: 1580000,
};

export const MOCK_STASH: Stash = {
  id: 'stash-boss', player_id: 'p-boss',
  hidden_balance: 250000, discoverability_level: 22,
  last_updated: '2026-03-26T18:00:00Z',
};

export const MOCK_HITMAN_BANK: BankAccount = {
  id: 'bank-hitman-1', player_id: 'p-hitman-1',
  balance: 180000, last_updated: '2026-03-28T08:00:00Z',
  total_deposited: 620000, total_withdrawn: 440000,
};

export const MOCK_HITMAN_STASH: Stash = {
  id: 'stash-hitman-1', player_id: 'p-hitman-1',
  hidden_balance: 320000, discoverability_level: 15,
  last_updated: '2026-03-27T22:00:00Z',
};

// ─────────────────────────────────────────────
// TRANSACTIONS
// ─────────────────────────────────────────────

export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 'tx-1', player_id: 'p-boss', family_id: 'fam-1', type: 'MISSION_PAYOUT', amount: 180000, balance_after: 660000, description: 'The Warehouse Job — Boss share', related_entity_id: 'm-1', timestamp: '2026-03-25T05:00:00Z' },
  { id: 'tx-2', player_id: 'p-boss', family_id: 'fam-1', type: 'FAMILY_TAX', amount: 54000, balance_after: 606000, description: 'Family tax (30%) — Warehouse Job', related_entity_id: 'm-1', timestamp: '2026-03-25T05:00:01Z' },
  { id: 'tx-3', player_id: 'p-boss', family_id: null, type: 'BANK_DEPOSIT', amount: 200000, balance_after: 406000, description: 'Deposited to bank', related_entity_id: null, timestamp: '2026-03-25T09:00:00Z' },
  { id: 'tx-4', player_id: 'p-boss', family_id: 'fam-1', type: 'MISSION_PAYOUT', amount: 1400000, balance_after: 1806000, description: 'The Armored Car Hit — Boss share', related_entity_id: 'm-6', timestamp: '2026-03-25T04:30:00Z' },
  { id: 'tx-5', player_id: 'p-boss', family_id: 'fam-1', type: 'FAMILY_TAX', amount: 420000, balance_after: 1386000, description: 'Family tax (30%) — Armored Car Hit', related_entity_id: 'm-6', timestamp: '2026-03-25T04:30:01Z' },
  { id: 'tx-6', player_id: 'p-boss', family_id: null, type: 'BLACK_MARKET_PURCHASE', amount: 5000, balance_after: 1381000, description: 'Purchased: Heat Reducer ×2', related_entity_id: 'listing-001', timestamp: '2026-03-26T14:00:00Z' },
  { id: 'tx-7', player_id: 'p-boss', family_id: null, type: 'STASH_DEPOSIT', amount: 100000, balance_after: 1281000, description: 'Moved to stash', related_entity_id: null, timestamp: '2026-03-26T18:00:00Z' },
  { id: 'tx-8', player_id: 'p-boss', family_id: null, type: 'BANK_DEPOSIT', amount: 400000, balance_after: 881000, description: 'Deposited to bank', related_entity_id: null, timestamp: '2026-03-27T10:00:00Z' },
  { id: 'tx-9', player_id: 'p-boss', family_id: 'fam-1', type: 'FAMILY_TREASURY_OUT', amount: 180000, balance_after: 881000, description: 'Hired hitman for contract c-1', related_entity_id: 'c-1', timestamp: '2026-03-27T08:00:00Z' },
];

// ─────────────────────────────────────────────
// BLACK MARKET LISTINGS
// ─────────────────────────────────────────────

export const MOCK_BM_LISTINGS: BlackMarketListing[] = [
  {
    id: 'listing-001', seller_player_id: 'p-rival-1', seller_alias: 'ANONYMOUS',
    item_definition_id: 'heat-reducer', quantity: 3, price_per_unit: 5500, total_price: 16500,
    item_snapshot: { name: 'Clean ID Package', category: 'CONSUMABLE', rarity: 'UNCOMMON', description: 'Reduces heat by 15.' },
    status: 'ACTIVE', listing_fee_paid: 330,
    created_at: '2026-03-27T06:00:00Z', expires_at: '2026-03-30T06:00:00Z',
  },
  {
    id: 'listing-002', seller_player_id: 'p-rival-2', seller_alias: 'ShadowDeal',
    item_definition_id: 'forged-docs', quantity: 5, price_per_unit: 4000, total_price: 20000,
    item_snapshot: { name: 'Forged Documents', category: 'TOOL', rarity: 'UNCOMMON', description: 'Reduces suspicion on use.' },
    status: 'ACTIVE', listing_fee_paid: 400,
    created_at: '2026-03-27T08:00:00Z', expires_at: '2026-03-30T08:00:00Z',
  },
  {
    id: 'listing-003', seller_player_id: 'p-rival-3', seller_alias: 'ANONYMOUS',
    item_definition_id: 'pistol-9mm', quantity: 2, price_per_unit: 5500, total_price: 11000,
    item_snapshot: { name: '9mm Pistol', category: 'WEAPON', rarity: 'COMMON', description: 'Standard sidearm.' },
    status: 'ACTIVE', listing_fee_paid: 220,
    created_at: '2026-03-27T10:00:00Z', expires_at: '2026-03-30T10:00:00Z',
  },
  {
    id: 'listing-004', seller_player_id: 'p-rival-4', seller_alias: 'GhostMarket',
    item_definition_id: 'intel-blueprints', quantity: 1, price_per_unit: 15000, total_price: 15000,
    item_snapshot: { name: 'Building Blueprints', category: 'INTEL', rarity: 'UNCOMMON', description: 'Grants mission infiltration bonus.' },
    status: 'ACTIVE', listing_fee_paid: 300,
    created_at: '2026-03-28T02:00:00Z', expires_at: '2026-03-31T02:00:00Z',
  },
  {
    id: 'listing-005', seller_player_id: 'p-rival-5', seller_alias: 'ANONYMOUS',
    item_definition_id: 'lockpick-set', quantity: 10, price_per_unit: 600, total_price: 6000,
    item_snapshot: { name: 'Lockpick Set', category: 'TOOL', rarity: 'COMMON', description: 'Reduces entry detection risk.' },
    status: 'ACTIVE', listing_fee_paid: 120,
    created_at: '2026-03-28T04:00:00Z', expires_at: '2026-03-31T04:00:00Z',
  },
  {
    id: 'listing-006', seller_player_id: 'p-rival-6', seller_alias: 'NightTrade',
    item_definition_id: 'medkit', quantity: 6, price_per_unit: 1500, total_price: 9000,
    item_snapshot: { name: 'Field Medkit', category: 'CONSUMABLE', rarity: 'COMMON', description: 'Restores 30 HP.' },
    status: 'ACTIVE', listing_fee_paid: 180,
    created_at: '2026-03-28T06:00:00Z', expires_at: '2026-03-31T06:00:00Z',
  },
  {
    id: 'listing-007', seller_player_id: 'p-boss', seller_alias: 'ANONYMOUS',
    item_definition_id: 'burner-phone', quantity: 3, price_per_unit: 400, total_price: 1200,
    item_snapshot: { name: 'Burner Phone', category: 'TOOL', rarity: 'COMMON', description: 'Untraceable.' },
    status: 'ACTIVE', listing_fee_paid: 24,
    created_at: '2026-03-28T07:00:00Z', expires_at: '2026-03-31T07:00:00Z',
  },
  {
    id: 'listing-008', seller_player_id: 'p-rival-7', seller_alias: 'ANONYMOUS',
    item_definition_id: 'contraband-drugs', quantity: 2, price_per_unit: 28000, total_price: 56000,
    item_snapshot: { name: 'Contraband Package', category: 'CONTRABAND', rarity: 'UNCOMMON', description: 'High value. Extremely illegal.' },
    status: 'ACTIVE', listing_fee_paid: 1120,
    created_at: '2026-03-27T20:00:00Z', expires_at: '2026-03-30T20:00:00Z',
  },
  {
    id: 'listing-009', seller_player_id: 'p-rival-8', seller_alias: 'ANONYMOUS',
    item_definition_id: 'shotgun-pump', quantity: 1, price_per_unit: 11000, total_price: 11000,
    item_snapshot: { name: 'Pump Shotgun', category: 'WEAPON', rarity: 'UNCOMMON', description: 'Close-range devastation.' },
    status: 'SOLD', listing_fee_paid: 220,
    created_at: '2026-03-26T12:00:00Z', expires_at: '2026-03-29T12:00:00Z',
  },
];

// ─────────────────────────────────────────────
// TAX RULES — 3 family configurations
// ─────────────────────────────────────────────

export const MOCK_TAX_RULES: TaxRule[] = [
  {
    id: 'tax-low', family_id: 'fam-1',
    name: 'Low Tax — Growth Phase',
    description: 'Members keep most of their earnings. Treasury builds slowly. Encourages activity.',
    base_rate: 0.15,
    source_overrides: { HEIST: 0.20, BUSINESS_INCOME: 0.10 },
    applies_to_solo: false,
  },
  {
    id: 'tax-balanced', family_id: 'fam-balanced',
    name: 'Balanced — Standard',
    description: 'Standard family tax. Competitive share to treasury for operations and protection.',
    base_rate: 0.25,
    source_overrides: { HEIST: 0.30, STREET_JOB: 0.20 },
    applies_to_solo: false,
  },
  {
    id: 'tax-high', family_id: 'fam-war',
    name: 'High Tax — War Footing',
    description: 'Treasury priority. Family needs cash for operations. Members get protection in return.',
    base_rate: 0.40,
    source_overrides: { HEIST: 0.45, MISSION: 0.40 },
    applies_to_solo: false,
  },
];

export const MOCK_CUT_RULES: FamilyCutRule[] = [
  {
    id: 'cut-low', family_id: 'fam-1',
    name: 'Growth Cut',
    player_share: 0.85, family_share: 0.15, system_sink: 0.0,
    applies_to: ['MISSION', 'HEIST', 'STREET_JOB'],
  },
  {
    id: 'cut-balanced', family_id: 'fam-balanced',
    name: 'Standard Cut',
    player_share: 0.70, family_share: 0.28, system_sink: 0.02,
    applies_to: ['MISSION', 'HEIST', 'STREET_JOB', 'BLACK_MARKET_SALE'],
  },
  {
    id: 'cut-high', family_id: 'fam-war',
    name: 'War Cut',
    player_share: 0.58, family_share: 0.40, system_sink: 0.02,
    applies_to: ['MISSION', 'HEIST', 'STREET_JOB'],
  },
];

// ─────────────────────────────────────────────
// FAMILY TREASURY
// ─────────────────────────────────────────────

export const MOCK_FAMILY_TREASURY: FamilyTreasury = {
  family_id: 'fam-1',
  balance: 1240000,
  last_updated: '2026-03-28T10:00:00Z',
  total_inflow_this_round: 3820000,
  total_outflow_this_round: 2580000,
  recent_transactions: [
    { id: 'fam-tx-1', player_id: 'p-boss', family_id: 'fam-1', type: 'FAMILY_TREASURY_IN', amount: 420000, balance_after: 1240000, description: 'Tax share — Armored Car Hit', related_entity_id: 'm-6', timestamp: '2026-03-25T04:30:01Z' },
    { id: 'fam-tx-2', player_id: 'p-boss', family_id: 'fam-1', type: 'FAMILY_TREASURY_OUT', amount: 180000, balance_after: 820000, description: 'Hitman contract escrow — Marco Ferrante', related_entity_id: 'c-1', timestamp: '2026-03-27T08:00:00Z' },
    { id: 'fam-tx-3', player_id: 'p-capo', family_id: 'fam-1', type: 'FAMILY_TREASURY_IN', amount: 54000, balance_after: 874000, description: 'Tax share — Warehouse Job', related_entity_id: 'm-1', timestamp: '2026-03-25T05:00:01Z' },
    { id: 'fam-tx-4', player_id: 'p-underboss', family_id: 'fam-1', type: 'FAMILY_TREASURY_OUT', amount: 45000, balance_after: 829000, description: 'South Port territory defense cost', related_entity_id: null, timestamp: '2026-03-26T12:00:00Z' },
    { id: 'fam-tx-5', player_id: 'p-boss', family_id: 'fam-1', type: 'FAMILY_TREASURY_IN', amount: 320000, description: 'Tax share — City Hall Leverage', related_entity_id: 'm-3', timestamp: '2026-03-27T14:00:00Z', balance_after: 1149000 },
  ],
};

// ─────────────────────────────────────────────
// BUSINESSES
// ─────────────────────────────────────────────

export const MOCK_BUSINESSES: Business[] = [
  { id: 'biz-1', family_id: 'fam-1', name: 'South Port Numbers', type: 'NUMBERS_OPERATION', territory: 'South Port', daily_income: 12000, heat_generation_per_day: 4, level: 3, status: 'ACTIVE', managed_by: 'p-capo' },
  { id: 'biz-2', family_id: 'fam-1', name: 'Docks Protection', type: 'PROTECTION_RACKET', territory: 'The Docks', daily_income: 18000, heat_generation_per_day: 7, level: 2, status: 'ACTIVE', managed_by: 'p-associate' },
  { id: 'biz-3', family_id: 'fam-1', name: 'Corrado Imports', type: 'FRONT_BUSINESS', territory: 'Midtown', daily_income: 8500, heat_generation_per_day: 1, level: 4, status: 'ACTIVE', managed_by: null },
  { id: 'biz-4', family_id: 'fam-1', name: 'Midtown Loan Book', type: 'LOAN_SHARKING', territory: 'Midtown Rackets', daily_income: 35000, heat_generation_per_day: 14, level: 2, status: 'ACTIVE', managed_by: 'p-capo' },
  { id: 'biz-5', family_id: 'fam-1', name: 'Fifth Ave Chop Shop', type: 'CHOP_SHOP', territory: 'South Port', daily_income: 22000, heat_generation_per_day: 9, level: 1, status: 'DISRUPTED', managed_by: null },
];

// ─────────────────────────────────────────────
// FAMILIES DIRECTORY
// ─────────────────────────────────────────────

export const MOCK_FAMILY_DIRECTORY: FamilyDirectoryEntry[] = [
  {
    id: 'fam-1', name: 'The Corrado Family', don_alias: 'Don Corrado',
    tagline: 'The oldest name in the city. We do not start wars. We end them.',
    playstyle_tags: ['BALANCED', 'POLITICAL'],
    size_band: 'MEDIUM', member_count: 7, strength_tier: 'DOMINANT',
    wealth_tier: 'DOMINANT', aggression_tier: 'MODERATE', reputation_tier: 'LEGENDARY',
    recruiting_open: true, territory_count: 3, business_count: 5, founded_round: 1, wins_this_round: 12,
  },
  {
    id: 'fam-2', name: 'The Ferrante Crew', don_alias: 'Marco Ferrante',
    tagline: 'Blood before business. Always.',
    playstyle_tags: ['WAR_FOCUSED'],
    size_band: 'MEDIUM', member_count: 5, strength_tier: 'ESTABLISHED',
    wealth_tier: 'ESTABLISHED', aggression_tier: 'WARMONGER', reputation_tier: 'ESTABLISHED',
    recruiting_open: false, territory_count: 2, business_count: 3, founded_round: 2, wins_this_round: 9,
  },
  {
    id: 'fam-3', name: 'West Side Outfit', don_alias: 'Big Lou Mancuso',
    tagline: 'We run the west. Everything else is negotiable.',
    playstyle_tags: ['BUSINESS_FOCUSED'],
    size_band: 'SMALL', member_count: 3, strength_tier: 'RISING',
    wealth_tier: 'ESTABLISHED', aggression_tier: 'PEACEFUL', reputation_tier: 'RISING',
    recruiting_open: true, territory_count: 1, business_count: 2, founded_round: 4, wins_this_round: 5,
  },
  {
    id: 'fam-4', name: 'The Neri Faction', don_alias: 'Carmine Neri',
    tagline: 'Quiet money. Quiet power. No noise.',
    playstyle_tags: ['STEALTH', 'BUSINESS_FOCUSED'],
    size_band: 'SMALL', member_count: 4, strength_tier: 'ESTABLISHED',
    wealth_tier: 'ESTABLISHED', aggression_tier: 'PEACEFUL', reputation_tier: 'ESTABLISHED',
    recruiting_open: false, territory_count: 1, business_count: 4, founded_round: 3, wins_this_round: 3,
  },
  {
    id: 'fam-5', name: 'The Zappala Syndicate', don_alias: 'Old Man Zappala',
    tagline: 'Forty years of patience. You cannot outlast us.',
    playstyle_tags: ['POLITICAL', 'BALANCED'],
    size_band: 'LARGE', member_count: 18, strength_tier: 'LEGENDARY',
    wealth_tier: 'LEGENDARY', aggression_tier: 'MODERATE', reputation_tier: 'LEGENDARY',
    recruiting_open: false, territory_count: 7, business_count: 12, founded_round: 1, wins_this_round: 28,
  },
  {
    id: 'fam-6', name: 'The Russo Brothers', don_alias: 'Nico Russo',
    tagline: 'New money, new rules. We are building something different.',
    playstyle_tags: ['WAR_FOCUSED', 'BUSINESS_FOCUSED'],
    size_band: 'SMALL', member_count: 6, strength_tier: 'RISING',
    wealth_tier: 'RISING', aggression_tier: 'AGGRESSIVE', reputation_tier: 'RISING',
    recruiting_open: true, territory_count: 1, business_count: 1, founded_round: 6, wins_this_round: 2,
  },
];
