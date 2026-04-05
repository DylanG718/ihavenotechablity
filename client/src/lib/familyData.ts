/**
 * familyData.ts — Mock data for family systems:
 *   - Family bootstrap state (protection, stabilization)
 *   - Treasury transaction ledger
 *   - Family inventory & item instances
 *   - Item issuances
 *   - Family audit log
 *   - Item catalog (re-exported from familyConfig)
 *
 * All IDs are deterministic strings for dev consistency.
 */

import type {
  Family,
  TreasuryTransaction,
  FamilyItemInstance,
  FamilyItemIssuance,
  FamilyAuditEntry,
} from '../../../shared/schema';
import { ITEM_CATALOG } from '../../../shared/familyConfig';

export { ITEM_CATALOG };

// ─────────────────────────────────────────────
// MOCK: Extended family data for fam-1
// ─────────────────────────────────────────────

export const MOCK_FAMILY_EXTENDED: Family = {
  id: 'fam-1',
  name: 'The Corrado Family',
  motto: 'Silenzio è oro.',
  boss_id: 'p-boss',
  treasury: 1_240_000,
  power_score: 8_420,
  territory: ['south-port-a', 'south-port-b', 'midtown-c'],
  status: 'ACTIVE',
  members: [], // populated from MOCK_PLAYERS
  underboss_ids: ['p-underboss'],
  consigliere_ids: ['p-consigliere'],
  prestige: 88,
  crew_ids: ['crew-south-port'],
  // New fields
  created_at: '2026-01-01T00:00:00Z',
  protection_expires_at: null, // established family — protection expired long ago
  bootstrap_state: 'STABLE',
  tax_rate_pct: 15,
  kickup_rate_pct: 8,
};

// Mock new family (for founder onboarding demo)
export const MOCK_NEW_FAMILY: Family = {
  id: 'fam-new',
  name: 'The New Family',
  motto: null,
  boss_id: 'p-boss',  // reusing for dev
  treasury: 5_000,    // bootstrap starting cash
  power_score: 0,
  territory: [],
  status: 'ACTIVE',
  members: [],
  underboss_ids: [],
  consigliere_ids: [],
  prestige: 0,
  crew_ids: [],
  created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
  protection_expires_at: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days remaining
  bootstrap_state: 'NEW',
  tax_rate_pct: 10,
  kickup_rate_pct: 5,
};

// ─────────────────────────────────────────────
// MOCK: Treasury transactions for fam-1
// ─────────────────────────────────────────────

export const MOCK_TREASURY_TRANSACTIONS: TreasuryTransaction[] = [
  {
    id: 'tx-001',
    family_id: 'fam-1',
    type: 'BOOTSTRAP_DEPOSIT',
    amount: 5_000,
    balance_after: 5_000,
    actor_player_id: 'p-boss',
    note: 'Family founded — initial treasury seed',
    metadata: null,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'tx-002',
    family_id: 'fam-1',
    type: 'JOB_TAX',
    amount: 18_000,
    balance_after: 23_000,
    actor_player_id: 'system',
    note: 'Automatic 15% tax from Luca B job earnings',
    metadata: { job_id: 'job-luca-001', player_id: 'p-associate' },
    created_at: '2026-01-16T14:22:00Z',
  },
  {
    id: 'tx-003',
    family_id: 'fam-1',
    type: 'MEMBER_DEPOSIT',
    amount: 50_000,
    balance_after: 73_000,
    actor_player_id: 'p-underboss',
    note: 'Sal the Fist personal deposit after waterfront job',
    metadata: null,
    created_at: '2026-01-22T09:10:00Z',
  },
  {
    id: 'tx-004',
    family_id: 'fam-1',
    type: 'TURF_INCOME',
    amount: 85_000,
    balance_after: 158_000,
    actor_player_id: 'system',
    note: 'Monthly turf income — 3 blocks',
    metadata: { blocks: ['south-port-a', 'south-port-b', 'midtown-c'] },
    created_at: '2026-02-01T00:00:00Z',
  },
  {
    id: 'tx-005',
    family_id: 'fam-1',
    type: 'DON_WITHDRAWAL',
    amount: -25_000,
    balance_after: 133_000,
    actor_player_id: 'p-boss',
    note: 'Weapons procurement for war preparation',
    metadata: null,
    created_at: '2026-02-14T16:05:00Z',
  },
  {
    id: 'tx-006',
    family_id: 'fam-1',
    type: 'KICKUP',
    amount: 32_000,
    balance_after: 165_000,
    actor_player_id: 'p-underboss',
    note: 'Weekly crew kick-up from South Port crew',
    metadata: { crew_id: 'crew-south-port' },
    created_at: '2026-02-21T10:00:00Z',
  },
  {
    id: 'tx-007',
    family_id: 'fam-1',
    type: 'MISSION_REWARD',
    amount: 180_000,
    balance_after: 345_000,
    actor_player_id: 'system',
    note: 'Family cut from Casino Heist — ELITE tier',
    metadata: { mission_id: 'mission-heist-casino' },
    created_at: '2026-03-05T22:30:00Z',
  },
  {
    id: 'tx-008',
    family_id: 'fam-1',
    type: 'ITEM_ISSUED',
    amount: -3_000,
    balance_after: 342_000,
    actor_player_id: 'p-underboss',
    note: '2× 9mm Pistols issued to Vinnie D for mission',
    metadata: { item_ids: ['item-9mm-001', 'item-9mm-002'], player_id: 'p-soldier' },
    created_at: '2026-03-10T08:00:00Z',
  },
];

// Running balance total for display (mock computed)
export const MOCK_TREASURY_BALANCE = MOCK_FAMILY_EXTENDED.treasury;

// ─────────────────────────────────────────────
// MOCK: Family item instances (vault)
// ─────────────────────────────────────────────

export const MOCK_FAMILY_ITEMS: FamilyItemInstance[] = [
  {
    id: 'item-9mm-001',
    family_id: 'fam-1',
    item_definition_id: '9mm_pistol',
    state: 'IN_FAMILY_VAULT',
    acquired_at: '2026-01-01T00:00:00Z',
    acquired_by: 'p-boss',
    current_holder_id: null,
    notes: 'Bootstrap item',
  },
  {
    id: 'item-9mm-002',
    family_id: 'fam-1',
    item_definition_id: '9mm_pistol',
    state: 'ISSUED',
    acquired_at: '2026-01-01T00:00:00Z',
    acquired_by: 'p-boss',
    current_holder_id: 'p-soldier',
    notes: 'Bootstrap item — currently with Vinnie D',
  },
  {
    id: 'item-9mm-003',
    family_id: 'fam-1',
    item_definition_id: '9mm_pistol',
    state: 'IN_FAMILY_VAULT',
    acquired_at: '2026-02-15T00:00:00Z',
    acquired_by: 'p-underboss',
    current_holder_id: null,
    notes: 'Purchased via market',
  },
  {
    id: 'item-vest-001',
    family_id: 'fam-1',
    item_definition_id: 'bulletproof_vest',
    state: 'IN_FAMILY_VAULT',
    acquired_at: '2026-02-20T00:00:00Z',
    acquired_by: 'p-underboss',
    current_holder_id: null,
    notes: 'War preparation',
  },
  {
    id: 'item-car-001',
    family_id: 'fam-1',
    item_definition_id: 'getaway_car',
    state: 'IN_FAMILY_VAULT',
    acquired_at: '2026-03-01T00:00:00Z',
    acquired_by: 'p-boss',
    current_holder_id: null,
    notes: 'For heist operations',
  },
  {
    id: 'item-lock-001',
    family_id: 'fam-1',
    item_definition_id: 'lockpick_kit',
    state: 'LOST',
    acquired_at: '2026-02-01T00:00:00Z',
    acquired_by: 'p-capo',
    current_holder_id: null,
    notes: 'Lost during failed burglary — Tommy Two-Times',
  },
];

// New family bootstrap items (for founder onboarding demo)
export const MOCK_NEW_FAMILY_ITEMS: FamilyItemInstance[] = [
  {
    id: 'nf-item-001',
    family_id: 'fam-new',
    item_definition_id: '9mm_pistol',
    state: 'IN_FAMILY_VAULT',
    acquired_at: MOCK_NEW_FAMILY.created_at,
    acquired_by: 'p-boss',
    current_holder_id: null,
    notes: 'Starting equipment',
  },
  {
    id: 'nf-item-002',
    family_id: 'fam-new',
    item_definition_id: '9mm_pistol',
    state: 'IN_FAMILY_VAULT',
    acquired_at: MOCK_NEW_FAMILY.created_at,
    acquired_by: 'p-boss',
    current_holder_id: null,
    notes: 'Starting equipment',
  },
];

// ─────────────────────────────────────────────
// MOCK: Item issuances
// ─────────────────────────────────────────────

export const MOCK_ISSUANCES: FamilyItemIssuance[] = [
  {
    id: 'iss-001',
    family_id: 'fam-1',
    item_instance_id: 'item-9mm-002',
    item_definition_id: '9mm_pistol',
    issued_to_player_id: 'p-soldier',
    issued_by_player_id: 'p-underboss',
    issued_at: '2026-03-10T08:00:00Z',
    purpose: 'MISSION',
    purpose_reference_id: 'mission-heist-casino',
    status: 'ACTIVE',
    returned_at: null,
    notes: 'Issued for casino heist, expected return after',
  },
  {
    id: 'iss-002',
    family_id: 'fam-1',
    item_instance_id: 'item-lock-001',
    item_definition_id: 'lockpick_kit',
    issued_to_player_id: 'p-capo',
    issued_by_player_id: 'p-underboss',
    issued_at: '2026-02-10T10:00:00Z',
    purpose: 'JOB',
    purpose_reference_id: null,
    status: 'LOST',
    returned_at: null,
    notes: 'Lost during failed job',
  },
];

// ─────────────────────────────────────────────
// MOCK: Family audit log
// ─────────────────────────────────────────────

export const MOCK_AUDIT_LOG: FamilyAuditEntry[] = [
  {
    id: 'audit-001',
    family_id: 'fam-1',
    action: 'FAMILY_CREATED',
    actor_player_id: 'p-boss',
    target_player_id: null,
    summary: 'Don Corrado founded The Corrado Family',
    metadata: { starting_cash: 5000, starting_items: 2 },
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'audit-002',
    family_id: 'fam-1',
    action: 'RANK_ASSIGNED',
    actor_player_id: 'p-boss',
    target_player_id: 'p-underboss',
    summary: 'Don Corrado appointed Sal the Fist as Underboss',
    metadata: { from_rank: 'SOLDIER', to_rank: 'UNDERBOSS' },
    created_at: '2026-01-03T12:00:00Z',
  },
  {
    id: 'audit-003',
    family_id: 'fam-1',
    action: 'RANK_ASSIGNED',
    actor_player_id: 'p-boss',
    target_player_id: 'p-consigliere',
    summary: 'Don Corrado appointed The Counselor as Consigliere',
    metadata: { from_rank: 'SOLDIER', to_rank: 'CONSIGLIERE' },
    created_at: '2026-01-04T09:00:00Z',
  },
  {
    id: 'audit-004',
    family_id: 'fam-1',
    action: 'FAMILY_STABILIZED',
    actor_player_id: 'system',
    target_player_id: null,
    summary: 'Family met all stabilization milestones. Protection window ended cleanly.',
    metadata: { day: 4 },
    created_at: '2026-01-05T00:00:00Z',
  },
  {
    id: 'audit-005',
    family_id: 'fam-1',
    action: 'ITEM_ISSUED',
    actor_player_id: 'p-underboss',
    target_player_id: 'p-soldier',
    summary: 'Underboss issued 9mm Pistol to Vinnie D for Casino Heist',
    metadata: { item_id: 'item-9mm-002', purpose: 'MISSION' },
    created_at: '2026-03-10T08:00:00Z',
  },
  {
    id: 'audit-006',
    family_id: 'fam-1',
    action: 'TAX_RATE_CHANGED',
    actor_player_id: 'p-boss',
    target_player_id: null,
    summary: 'Don Corrado changed family tax rate from 10% to 15%',
    metadata: { old_rate: 10, new_rate: 15 },
    created_at: '2026-02-01T10:00:00Z',
  },
];

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

/** Get all items currently in the vault (not issued or consumed) */
export function getVaultItems(items: FamilyItemInstance[]): FamilyItemInstance[] {
  return items.filter(i => i.state === 'IN_FAMILY_VAULT');
}

/** Get all currently active issuances */
export function getActiveIssuances(issuances: FamilyItemIssuance[]): FamilyItemIssuance[] {
  return issuances.filter(i => i.status === 'ACTIVE');
}

/** Get issuances for a specific member */
export function getMemberIssuances(issuances: FamilyItemIssuance[], playerId: string): FamilyItemIssuance[] {
  return issuances.filter(i => i.issued_to_player_id === playerId && i.status === 'ACTIVE');
}

/** Treasury balance formatted */
export function formatTxAmount(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount >= 0 ? '+' : '-';
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000)     return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toLocaleString()}`;
}

export const TX_TYPE_LABELS: Record<string, string> = {
  BOOTSTRAP_DEPOSIT: 'Founding Deposit',
  JOB_TAX:           'Job Tax',
  KICKUP:            'Kick-Up',
  MEMBER_DEPOSIT:    'Member Deposit',
  DON_DEPOSIT:       'Leadership Deposit',
  DON_WITHDRAWAL:    'Leadership Withdrawal',
  ITEM_PURCHASE:     'Item Purchased',
  ITEM_ISSUED:       'Item Issued',
  ITEM_RETURNED:     'Item Returned',
  MISSION_REWARD:    'Mission Reward',
  WAR_REPARATION:    'War Reparation',
  TURF_INCOME:       'Turf Income',
  ADMIN_ADJUSTMENT:  'Admin Adjustment',
};
