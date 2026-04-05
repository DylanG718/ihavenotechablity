/**
 * ECONOMY ENGINE
 *
 * API-style functions for all economy subsystems.
 * All state is held in React context (see economyContext.tsx).
 * These functions are pure — they receive state and return new state + side effects.
 * TODO: replace with real API calls when backend is ready.
 */

import type {
  BankAccount, Stash, InventoryItem, ItemDefinition,
  BlackMarketListing, BlackMarketTransaction,
  Transaction, SplitResult, TaxRule, FamilyCutRule,
  IncomeSourceType, FamilyTreasury,
} from '../../../shared/economy';

// ─────────────────────────────────────────────
// Constants — proposed defaults, subject to change
// ─────────────────────────────────────────────

/** Proposed default: 2% listing fee on Black Market sales (money sink) */
export const BLACK_MARKET_LISTING_FEE_RATE = 0.02;

/** Proposed default: Bank withdrawal fee for large withdrawals (>50K) */
export const BANK_LARGE_WITHDRAWAL_THRESHOLD = 50_000;
export const BANK_LARGE_WITHDRAWAL_FEE_RATE  = 0.01;  // 1% on large withdrawals

/** Proposed default: Stash discovery risk base (future raid mechanic hook) */
export const STASH_BASE_DISCOVERABILITY = 10;  // out of 100

// ─────────────────────────────────────────────
// INVENTORY OPERATIONS
// ─────────────────────────────────────────────

export type InventoryOpResult =
  | { ok: true;  inventory: InventoryItem[] }
  | { ok: false; error: string };

/**
 * Add item to player's inventory.
 * TODO: enforce carry limits when weight system is implemented.
 */
export function addItemToInventory(
  inventory: InventoryItem[],
  item: InventoryItem,
): InventoryOpResult {
  const existing = inventory.find(i => i.item_definition_id === item.item_definition_id && i.equipped === false);
  if (existing && item.quantity > 0) {
    // Stack if stackable (determined by caller via ItemDefinition lookup)
    return {
      ok: true,
      inventory: inventory.map(i =>
        i.id === existing.id ? { ...i, quantity: i.quantity + item.quantity } : i
      ),
    };
  }
  return { ok: true, inventory: [...inventory, item] };
}

/**
 * Remove quantity of an item from inventory.
 * Returns error if quantity exceeds available.
 */
export function removeItemFromInventory(
  inventory: InventoryItem[],
  itemId: string,
  quantity: number,
  _reason: string,
): InventoryOpResult {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return { ok: false, error: 'Item not found in inventory.' };
  if (item.quantity < quantity) return { ok: false, error: `Only ${item.quantity} available; cannot remove ${quantity}.` };

  if (item.quantity === quantity) {
    return { ok: true, inventory: inventory.filter(i => i.id !== itemId) };
  }
  return {
    ok: true,
    inventory: inventory.map(i => i.id === itemId ? { ...i, quantity: i.quantity - quantity } : i),
  };
}

/**
 * Transfer item to Black Market (removes from inventory, creates listing).
 * Returns error if item not found, insufficient quantity, or item not tradable.
 */
export function transferItemToBlackMarket(
  inventory: InventoryItem[],
  definitions: Record<string, ItemDefinition>,
  itemId: string,
  quantity: number,
): InventoryOpResult & { listing_data?: Partial<BlackMarketListing> } {
  const item = inventory.find(i => i.id === itemId);
  if (!item) return { ok: false, error: 'Item not found.' };

  const def = definitions[item.item_definition_id];
  if (!def?.tradable) return { ok: false, error: 'This item cannot be listed on the Black Market.' };
  if (item.quantity < quantity) return { ok: false, error: 'Insufficient quantity.' };
  if (item.equipped) return { ok: false, error: 'Unequip the item before listing it.' };

  const removeResult = removeItemFromInventory(inventory, itemId, quantity, 'BLACK_MARKET_TRANSFER');
  if (!removeResult.ok) return removeResult;

  return {
    ok: true,
    inventory: removeResult.inventory,
    listing_data: {
      item_definition_id: item.item_definition_id,
      item_snapshot: { name: def.name, category: def.category, rarity: def.rarity, description: def.description },
      quantity,
    },
  };
}

// ─────────────────────────────────────────────
// BANK OPERATIONS
// ─────────────────────────────────────────────

export type BankOpResult =
  | { ok: true;  account: BankAccount; walletDelta: number; fee: number }
  | { ok: false; error: string };

export function depositToBank(account: BankAccount, walletCash: number, amount: number): BankOpResult {
  if (amount <= 0) return { ok: false, error: 'Deposit amount must be positive.' };
  if (walletCash < amount) return { ok: false, error: `Insufficient wallet funds. Have ${walletCash}, need ${amount}.` };
  return {
    ok: true,
    account: {
      ...account,
      balance: account.balance + amount,
      total_deposited: account.total_deposited + amount,
      last_updated: new Date().toISOString(),
    },
    walletDelta: -amount,
    fee: 0,
  };
}

export function withdrawFromBank(account: BankAccount, amount: number): BankOpResult {
  if (amount <= 0) return { ok: false, error: 'Withdrawal amount must be positive.' };
  if (account.balance < amount) return { ok: false, error: `Insufficient bank balance. Have ${account.balance}, need ${amount}.` };

  // TODO: plug real fee calculation here — currently applying fee only on large withdrawals
  const fee = amount > BANK_LARGE_WITHDRAWAL_THRESHOLD
    ? Math.floor(amount * BANK_LARGE_WITHDRAWAL_FEE_RATE)
    : 0;
  const netReceived = amount - fee;

  return {
    ok: true,
    account: {
      ...account,
      balance: account.balance - amount,
      total_withdrawn: account.total_withdrawn + amount,
      last_updated: new Date().toISOString(),
    },
    walletDelta: +netReceived,
    fee,
  };
}

// ─────────────────────────────────────────────
// STASH OPERATIONS
// ─────────────────────────────────────────────

export type StashOpResult =
  | { ok: true;  stash: Stash; walletDelta: number }
  | { ok: false; error: string };

export function moveToStash(stash: Stash, walletCash: number, amount: number): StashOpResult {
  if (amount <= 0) return { ok: false, error: 'Amount must be positive.' };
  if (walletCash < amount) return { ok: false, error: 'Insufficient wallet funds.' };
  return {
    ok: true,
    stash: {
      ...stash,
      hidden_balance: stash.hidden_balance + amount,
      // TODO: discoverability increases slightly with large stashes (future mechanic)
      discoverability_level: Math.min(100, stash.discoverability_level + Math.floor(amount / 100_000)),
      last_updated: new Date().toISOString(),
    },
    walletDelta: -amount,
  };
}

export function moveFromStash(stash: Stash, amount: number): StashOpResult {
  if (amount <= 0) return { ok: false, error: 'Amount must be positive.' };
  if (stash.hidden_balance < amount) return { ok: false, error: 'Insufficient stash funds.' };
  return {
    ok: true,
    stash: {
      ...stash,
      hidden_balance: stash.hidden_balance - amount,
      last_updated: new Date().toISOString(),
    },
    walletDelta: +amount,
  };
}

// ─────────────────────────────────────────────
// BLACK MARKET OPERATIONS
// ─────────────────────────────────────────────

export type MarketOpResult =
  | { ok: true;  listing?: BlackMarketListing; transaction?: BlackMarketTransaction; walletDelta?: number }
  | { ok: false; error: string };

export function createListing(
  listing: Omit<BlackMarketListing, 'id' | 'listing_fee_paid' | 'status' | 'created_at' | 'expires_at'>,
  walletCash: number,
): MarketOpResult & { walletDelta?: number } {
  const fee = Math.floor(listing.total_price * BLACK_MARKET_LISTING_FEE_RATE);
  if (walletCash < fee) return { ok: false, error: `Listing fee of ${fee} required. Insufficient wallet funds.` };

  const now = new Date();
  const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000 * 3); // 3 days listing

  return {
    ok: true,
    listing: {
      ...listing,
      id: `listing-${Date.now()}`,
      listing_fee_paid: fee,
      status: 'ACTIVE',
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    },
    walletDelta: -fee,
  };
}

export function cancelListing(listing: BlackMarketListing): MarketOpResult {
  if (listing.status !== 'ACTIVE') return { ok: false, error: 'Only active listings can be cancelled.' };
  return {
    ok: true,
    listing: { ...listing, status: 'CANCELLED' },
  };
}

/**
 * Purchase a listing.
 * TODO: plug in real escrow when backend is ready.
 */
export function purchaseListing(
  listing: BlackMarketListing,
  buyerWallet: number,
): MarketOpResult {
  if (listing.status !== 'ACTIVE') return { ok: false, error: 'This listing is no longer available.' };
  if (buyerWallet < listing.total_price) return { ok: false, error: `Need ${listing.total_price}, only have ${buyerWallet}.` };

  const tx: BlackMarketTransaction = {
    id: `bmt-${Date.now()}`,
    buyer_player_id: 'current-player',  // TODO: replace with real buyer ID
    seller_player_id: listing.seller_player_id,
    listing_id: listing.id,
    item_definition_id: listing.item_definition_id,
    quantity: listing.quantity,
    total_price: listing.total_price,
    listing_fee: listing.listing_fee_paid,
    timestamp: new Date().toISOString(),
  };

  return {
    ok: true,
    listing: { ...listing, status: 'SOLD' },
    transaction: tx,
    walletDelta: -listing.total_price,
  };
}

// ─────────────────────────────────────────────
// TAX & SPLITS
// ─────────────────────────────────────────────

/**
 * Apply family tax and split rules to a gross payout.
 * If no family (solo/hitman), full amount goes to player.
 * TODO: plug real cut rule resolution here.
 */
export function applyFamilyTaxAndSplits(
  grossAmount: number,
  incomeSource: IncomeSourceType,
  taxRule: TaxRule | null,
  cutRule: FamilyCutRule | null,
): SplitResult {
  if (!taxRule || !cutRule) {
    // No family — player keeps everything
    return {
      gross_amount: grossAmount,
      player_net: grossAmount,
      family_share: 0,
      system_sink: 0,
      tax_rule_applied: 'NONE',
      cut_rule_applied: 'NONE',
      income_source: incomeSource,
    };
  }

  const rate = taxRule.source_overrides[incomeSource] ?? taxRule.base_rate;
  const familyShare = Math.floor(grossAmount * rate);
  const systemSink = Math.floor(grossAmount * (cutRule.system_sink ?? 0));
  const playerNet = grossAmount - familyShare - systemSink;

  return {
    gross_amount: grossAmount,
    player_net: playerNet,
    family_share: familyShare,
    system_sink: systemSink,
    tax_rule_applied: taxRule.id,
    cut_rule_applied: cutRule.id,
    income_source: incomeSource,
  };
}

/** Credit family treasury. Returns new treasury balance. */
export function creditFamilyTreasury(treasury: FamilyTreasury, amount: number, description: string): FamilyTreasury {
  const tx: Transaction = {
    id: `tx-${Date.now()}`,
    player_id: '',
    family_id: treasury.family_id,
    type: 'FAMILY_TREASURY_IN',
    amount,
    balance_after: treasury.balance + amount,
    description,
    related_entity_id: null,
    timestamp: new Date().toISOString(),
  };
  return {
    ...treasury,
    balance: treasury.balance + amount,
    total_inflow_this_round: treasury.total_inflow_this_round + amount,
    last_updated: new Date().toISOString(),
    recent_transactions: [tx, ...treasury.recent_transactions].slice(0, 20),
  };
}

/** Debit family treasury. Returns error if insufficient. */
export function debitFamilyTreasury(
  treasury: FamilyTreasury,
  amount: number,
  reason: string,
): { ok: true; treasury: FamilyTreasury } | { ok: false; error: string } {
  if (treasury.balance < amount) return { ok: false, error: 'Insufficient treasury funds.' };
  const tx: Transaction = {
    id: `tx-${Date.now()}`,
    player_id: '',
    family_id: treasury.family_id,
    type: 'FAMILY_TREASURY_OUT',
    amount,
    balance_after: treasury.balance - amount,
    description: reason,
    related_entity_id: null,
    timestamp: new Date().toISOString(),
  };
  return {
    ok: true,
    treasury: {
      ...treasury,
      balance: treasury.balance - amount,
      total_outflow_this_round: treasury.total_outflow_this_round + amount,
      last_updated: new Date().toISOString(),
      recent_transactions: [tx, ...treasury.recent_transactions].slice(0, 20),
    },
  };
}
