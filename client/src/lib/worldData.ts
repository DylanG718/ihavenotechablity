/**
 * worldData.ts — Mock data for new world systems
 * Turf blocks, family businesses, board posts, chain messages,
 * player protection, obituaries, other family leaderboard data.
 */

import type {
  TurfBlock,
  FamilyBusiness,
  FamilyBoardPost,
  ChainMessage,
  PlayerProtection,
  ObituaryEntry,
  Family,
} from '../../../shared/schema';

// ── Helper to build a 16-slot array ─────────────

function makeSlots(businesses: FamilyBusiness[]): TurfBlock['slots'] {
  const slots: TurfBlock['slots'] = [];
  for (let i = 1; i <= 16; i++) {
    const biz = businesses.find(b => b.slot_number === i) ?? null;
    slots.push({ slot_number: i, business: biz });
  }
  return slots;
}

// ── Business income base rates by type ───────────
export const BUSINESS_BASE_INCOME: Record<string, number> = {
  NUMBERS_SPOT:    500,
  LOAN_OFFICE:     1200,
  CHOP_SHOP:       1800,
  PAWN_SHOP:       900,
  RESTAURANT_FRONT:1500,
  LAUNDROMAT:      750,
  NIGHTCLUB:       3500,
  WAREHOUSE:       2500,
};

export const BUSINESS_BUILD_COST: Record<string, number> = {
  NUMBERS_SPOT:    10000,
  LOAN_OFFICE:     25000,
  CHOP_SHOP:       35000,
  PAWN_SHOP:       18000,
  RESTAURANT_FRONT:30000,
  LAUNDROMAT:      15000,
  NIGHTCLUB:       50000,
  WAREHOUSE:       40000,
};

export const BUSINESS_LABELS: Record<string, string> = {
  NUMBERS_SPOT:    'Numbers Spot',
  LOAN_OFFICE:     'Loan Office',
  CHOP_SHOP:       'Chop Shop',
  PAWN_SHOP:       'Pawn Shop',
  RESTAURANT_FRONT:'Restaurant Front',
  LAUNDROMAT:      'Laundromat',
  NIGHTCLUB:       'Nightclub',
  WAREHOUSE:       'Warehouse',
};

// Income with upgrade: level 1 = base, level 2 = 1.6×, level 3 = 2.5×
export function calcDailyIncome(base: number, level: number): number {
  const mult = [1, 1.6, 2.5];
  return Math.floor(base * (mult[level - 1] ?? 1));
}

// ── South Port Block A businesses ────────────────

const SP_A_BUSINESSES: FamilyBusiness[] = [
  {
    id: 'biz-1', type: 'NUMBERS_SPOT', owner_player_id: 'p-capo',
    turf_block_id: 'turf-1', slot_number: 1, upgrade_level: 2,
    daily_income_base: BUSINESS_BASE_INCOME.NUMBERS_SPOT,
    family_cut_pct: 0.3, heat_per_day: 2,
    built_at: '2026-02-10T00:00:00Z',
  },
  {
    id: 'biz-2', type: 'LOAN_OFFICE', owner_player_id: 'p-capo',
    turf_block_id: 'turf-1', slot_number: 2, upgrade_level: 3,
    daily_income_base: BUSINESS_BASE_INCOME.LOAN_OFFICE,
    family_cut_pct: 0.3, heat_per_day: 4,
    built_at: '2026-02-12T00:00:00Z',
  },
  {
    id: 'biz-3', type: 'LAUNDROMAT', owner_player_id: 'p-soldier',
    turf_block_id: 'turf-1', slot_number: 3, upgrade_level: 1,
    daily_income_base: BUSINESS_BASE_INCOME.LAUNDROMAT,
    family_cut_pct: 0.3, heat_per_day: 1,
    built_at: '2026-02-15T00:00:00Z',
  },
  {
    id: 'biz-4', type: 'PAWN_SHOP', owner_player_id: 'p-soldier',
    turf_block_id: 'turf-1', slot_number: 5, upgrade_level: 2,
    daily_income_base: BUSINESS_BASE_INCOME.PAWN_SHOP,
    family_cut_pct: 0.3, heat_per_day: 2,
    built_at: '2026-02-18T00:00:00Z',
  },
  {
    id: 'biz-5', type: 'NUMBERS_SPOT', owner_player_id: 'p-associate',
    turf_block_id: 'turf-1', slot_number: 7, upgrade_level: 1,
    daily_income_base: BUSINESS_BASE_INCOME.NUMBERS_SPOT,
    family_cut_pct: 0.3, heat_per_day: 2,
    built_at: '2026-03-01T00:00:00Z',
  },
  {
    id: 'biz-6', type: 'RESTAURANT_FRONT', owner_player_id: 'p-boss',
    turf_block_id: 'turf-1', slot_number: 9, upgrade_level: 3,
    daily_income_base: BUSINESS_BASE_INCOME.RESTAURANT_FRONT,
    family_cut_pct: 0.3, heat_per_day: 3,
    built_at: '2026-02-05T00:00:00Z',
  },
];

// ── The Docks Block B businesses ─────────────────

const DOCKS_B_BUSINESSES: FamilyBusiness[] = [
  {
    id: 'biz-7', type: 'CHOP_SHOP', owner_player_id: 'p-underboss',
    turf_block_id: 'turf-2', slot_number: 1, upgrade_level: 3,
    daily_income_base: BUSINESS_BASE_INCOME.CHOP_SHOP,
    family_cut_pct: 0.3, heat_per_day: 8,
    built_at: '2026-01-28T00:00:00Z',
  },
  {
    id: 'biz-8', type: 'WAREHOUSE', owner_player_id: 'p-underboss',
    turf_block_id: 'turf-2', slot_number: 2, upgrade_level: 2,
    daily_income_base: BUSINESS_BASE_INCOME.WAREHOUSE,
    family_cut_pct: 0.3, heat_per_day: 5,
    built_at: '2026-01-30T00:00:00Z',
  },
  {
    id: 'biz-9', type: 'WAREHOUSE', owner_player_id: 'p-capo',
    turf_block_id: 'turf-2', slot_number: 4, upgrade_level: 1,
    daily_income_base: BUSINESS_BASE_INCOME.WAREHOUSE,
    family_cut_pct: 0.3, heat_per_day: 5,
    built_at: '2026-02-20T00:00:00Z',
  },
  {
    id: 'biz-10', type: 'NIGHTCLUB', owner_player_id: 'p-boss',
    turf_block_id: 'turf-2', slot_number: 6, upgrade_level: 3,
    daily_income_base: BUSINESS_BASE_INCOME.NIGHTCLUB,
    family_cut_pct: 0.3, heat_per_day: 6,
    built_at: '2026-01-20T00:00:00Z',
  },
  {
    id: 'biz-11', type: 'CHOP_SHOP', owner_player_id: 'p-soldier',
    turf_block_id: 'turf-2', slot_number: 8, upgrade_level: 2,
    daily_income_base: BUSINESS_BASE_INCOME.CHOP_SHOP,
    family_cut_pct: 0.3, heat_per_day: 8,
    built_at: '2026-02-25T00:00:00Z',
  },
];

// ── Midtown Block C businesses ────────────────────

const MIDTOWN_C_BUSINESSES: FamilyBusiness[] = [
  {
    id: 'biz-12', type: 'LOAN_OFFICE', owner_player_id: 'p-consigliere',
    turf_block_id: 'turf-3', slot_number: 2, upgrade_level: 2,
    daily_income_base: BUSINESS_BASE_INCOME.LOAN_OFFICE,
    family_cut_pct: 0.3, heat_per_day: 4,
    built_at: '2026-02-08T00:00:00Z',
  },
  {
    id: 'biz-13', type: 'NUMBERS_SPOT', owner_player_id: 'p-capo',
    turf_block_id: 'turf-3', slot_number: 3, upgrade_level: 1,
    daily_income_base: BUSINESS_BASE_INCOME.NUMBERS_SPOT,
    family_cut_pct: 0.3, heat_per_day: 2,
    built_at: '2026-02-22T00:00:00Z',
  },
  {
    id: 'biz-14', type: 'LAUNDROMAT', owner_player_id: 'p-consigliere',
    turf_block_id: 'turf-3', slot_number: 5, upgrade_level: 3,
    daily_income_base: BUSINESS_BASE_INCOME.LAUNDROMAT,
    family_cut_pct: 0.3, heat_per_day: 1,
    built_at: '2026-02-10T00:00:00Z',
  },
];

// ── TurfBlocks ────────────────────────────────────

export const MOCK_TURF_BLOCKS: TurfBlock[] = [
  {
    id: 'turf-1',
    family_id: 'fam-1',
    name: 'South Port Block A',
    location: 'South Port',
    purchase_cost: 85000,
    purchased_at: '2026-02-01T00:00:00Z',
    slots: makeSlots(SP_A_BUSINESSES),
  },
  {
    id: 'turf-2',
    family_id: 'fam-1',
    name: 'The Docks Block B',
    location: 'The Docks',
    purchase_cost: 120000,
    purchased_at: '2026-01-15T00:00:00Z',
    slots: makeSlots(DOCKS_B_BUSINESSES),
  },
  {
    id: 'turf-3',
    family_id: 'fam-1',
    name: 'Midtown Rackets Block C',
    location: 'Midtown Rackets',
    purchase_cost: 95000,
    purchased_at: '2026-02-05T00:00:00Z',
    slots: makeSlots(MIDTOWN_C_BUSINESSES),
  },
];

// Available turf blocks to purchase
export const AVAILABLE_TURF_BLOCKS = [
  { id: 'turf-avail-1', name: 'Airport Row Block A', location: 'Airport Row', cost: 150000 },
  { id: 'turf-avail-2', name: 'Financial District Block A', location: 'Financial District', cost: 130000 },
  { id: 'turf-avail-3', name: 'Eastside Block D', location: 'Eastside', cost: 75000 },
];

// ── Calculate total daily income for a family ────

export function calcTurfTotalIncome(blocks: TurfBlock[]): number {
  let total = 0;
  for (const block of blocks) {
    for (const slot of block.slots) {
      if (slot.business) {
        total += calcDailyIncome(slot.business.daily_income_base, slot.business.upgrade_level);
      }
    }
  }
  return total;
}

export function calcTurfTreasuryIncome(blocks: TurfBlock[]): number {
  let total = 0;
  for (const block of blocks) {
    for (const slot of block.slots) {
      if (slot.business) {
        const income = calcDailyIncome(slot.business.daily_income_base, slot.business.upgrade_level);
        total += Math.floor(income * slot.business.family_cut_pct);
      }
    }
  }
  return total;
}

// ── Family Board Posts ────────────────────────────

export const MOCK_BOARD_POSTS: FamilyBoardPost[] = [
  {
    id: 'bp-1',
    family_id: 'fam-1',
    author_id: 'p-boss',
    content: 'ATTENTION ALL MEMBERS: The Ferrante crew has been testing our south port boundary again. No one moves without authorization. If you see anything unusual on the docks, report directly to Sal. We do not respond without a plan. Silenzio è oro.',
    pinned: true,
    pinned_by: 'p-boss',
    created_at: '2026-03-28T09:00:00Z',
    replies: [
      { id: 'br-1', author_id: 'p-underboss', content: 'Understood. I have Tommy watching the south entry points.', created_at: '2026-03-28T09:15:00Z' },
      { id: 'br-2', author_id: 'p-capo', content: 'My crew is on it. Nothing moves on that block we do not know about.', created_at: '2026-03-28T09:30:00Z' },
    ],
  },
  {
    id: 'bp-2',
    family_id: 'fam-1',
    author_id: 'p-underboss',
    content: 'TREASURY REMINDER: All business owners — your 30% cut to the family chest is due by Sunday midnight. No delays. Anyone short will answer to me personally. This is how we stay strong.',
    pinned: true,
    pinned_by: 'p-boss',
    created_at: '2026-03-26T14:00:00Z',
    replies: [
      { id: 'br-3', author_id: 'p-capo', content: 'South Port numbers are running hot this week. Cut will be delivered Friday.', created_at: '2026-03-26T15:00:00Z' },
      { id: 'br-4', author_id: 'p-soldier', content: 'Laundromat take is down 12% — bad weather kept foot traffic low. Will make it up next week.', created_at: '2026-03-26T16:00:00Z' },
      { id: 'br-5', author_id: 'p-underboss', content: 'Excuses are not currency, Vinnie. Figure it out.', created_at: '2026-03-26T16:30:00Z' },
    ],
  },
  {
    id: 'bp-3',
    family_id: 'fam-1',
    author_id: 'p-consigliere',
    content: 'The Rizzo sit-down has been scheduled. I will be attending with the Don. Everyone keeps their mouths shut until I give a full debrief after. The details are above your level. Trust the process.',
    pinned: false,
    created_at: '2026-03-25T11:00:00Z',
    replies: [],
  },
  {
    id: 'bp-4',
    family_id: 'fam-1',
    author_id: 'p-capo',
    content: 'Good work on the armored car job. The Don asked me to pass along his respect to the crew. Special mention to Vinnie and Luca — they kept their heads down and did what was asked. That is how you move up.',
    pinned: false,
    created_at: '2026-03-25T18:00:00Z',
    replies: [
      { id: 'br-6', author_id: 'p-soldier', content: 'Appreciated, Tommy. Just doing what we do.', created_at: '2026-03-25T18:30:00Z' },
      { id: 'br-7', author_id: 'p-associate', content: 'Glad to be useful. Whenever the next one is ready, I am in.', created_at: '2026-03-25T19:00:00Z' },
    ],
  },
  {
    id: 'bp-5',
    family_id: 'fam-1',
    author_id: 'p-soldier',
    content: 'Heads up — there have been plainclothes outside the Pier 14 warehouse the last two evenings. Could be nothing. Could be a tail. I am routing pickups through the east side for now. Tommy knows.',
    pinned: false,
    created_at: '2026-03-24T22:00:00Z',
    replies: [
      { id: 'br-8', author_id: 'p-capo', content: 'Good call. Do not change anything without my sign-off but the reroute is smart.', created_at: '2026-03-24T22:45:00Z' },
    ],
  },
  {
    id: 'bp-6',
    family_id: 'fam-1',
    author_id: 'p-recruit',
    content: 'This is Joey. Just checking in. Ready to do whatever is needed. Is there anything for a recruit to work on right now?',
    pinned: false,
    created_at: '2026-03-24T10:00:00Z',
    replies: [
      { id: 'br-9', author_id: 'p-capo', content: 'Talk to me after the board clears. There is a corner collection coming up that needs a body.', created_at: '2026-03-24T10:30:00Z' },
    ],
  },
  {
    id: 'bp-7',
    family_id: 'fam-1',
    author_id: 'p-boss',
    content: 'To the family as a whole: we have survived another week without bloodshed. That is the goal. Wars are expensive. Stay disciplined. Stay quiet. The right opportunity will come and we will be ready. Until then — earn.',
    pinned: false,
    created_at: '2026-03-23T20:00:00Z',
    replies: [],
  },
];

// ── Chain-of-command messages ─────────────────────

export const MOCK_CHAIN_MESSAGES: ChainMessage[] = [
  {
    id: 'msg-1',
    family_id: 'fam-1',
    from_player_id: 'p-soldier',
    to_player_id: 'p-capo',
    subject: 'Pier 14 surveillance — requesting guidance',
    body: 'Tommy — I have noticed plainclothes outside Pier 14 for the past two evenings. Both times same man, different clothes, circling the block. I have not changed my routes yet but wanted to check with you before I do anything. Do you want me to identify him or just go quiet for a few days?',
    status: 'OPEN',
    created_at: '2026-03-28T10:00:00Z',
    updated_at: '2026-03-28T10:00:00Z',
  },
  {
    id: 'msg-2',
    family_id: 'fam-1',
    from_player_id: 'p-capo',
    to_player_id: 'p-underboss',
    subject: 'Pier 14 — possible surveillance [ESCALATED from Vinnie]',
    body: 'Sal — Vinnie reports possible plainclothes outside the docks warehouse. I have told him to reroute east. But I think this needs your eye. Could be a tail on Enzo\'s contact, could be unrelated. Recommend we pull all product from Pier 14 for 48 hours.',
    status: 'ESCALATED',
    escalated_to: 'p-underboss',
    created_at: '2026-03-28T11:00:00Z',
    updated_at: '2026-03-28T11:00:00Z',
  },
  {
    id: 'msg-3',
    family_id: 'fam-1',
    from_player_id: 'p-associate',
    to_player_id: 'p-capo',
    subject: 'Midtown numbers take — short this week',
    body: 'Tommy, had a slow week on the midtown numbers. Weather kept half the regulars home. I am at about $3,200 when the normal rate is closer to $5,000. I will make it up over the next two pickups. Just wanted to flag it before it became a surprise.',
    status: 'RESOLVED',
    created_at: '2026-03-27T08:00:00Z',
    updated_at: '2026-03-27T14:00:00Z',
  },
  {
    id: 'msg-4',
    family_id: 'fam-1',
    from_player_id: 'p-underboss',
    to_player_id: 'p-boss',
    subject: 'Ferrante boundary violation — requesting authorization',
    body: 'Don Corrado — the Ferrante crew put two of their men on our south port corner last night. They left before dawn. I want to send a message — nothing permanent, just a reminder. Waiting for your authorization before I move anyone.',
    status: 'OPEN',
    created_at: '2026-03-29T07:00:00Z',
    updated_at: '2026-03-29T07:00:00Z',
  },
  {
    id: 'msg-5',
    family_id: 'fam-1',
    from_player_id: 'p-recruit',
    to_player_id: 'p-capo',
    subject: 'Requesting my first real assignment',
    body: 'Tommy — I have been with the family six weeks now and done the basic collections. I am ready for something real. I will not embarrass you or the family. Just let me prove it.',
    status: 'OPEN',
    created_at: '2026-03-29T09:00:00Z',
    updated_at: '2026-03-29T09:00:00Z',
  },
  {
    id: 'msg-6',
    family_id: 'fam-1',
    from_player_id: 'p-consigliere',
    to_player_id: 'p-boss',
    subject: 'Rizzo sit-down — my read',
    body: 'Don — after the sit-down with Rizzo, my read is that they want neutral ground on the airport corridor but are not willing to give up their north docks claim. I think there is room for a deal but only if we initiate on our timeline, not theirs. I recommend we let them wait two weeks before any counter.',
    status: 'RESOLVED',
    created_at: '2026-03-26T16:00:00Z',
    updated_at: '2026-03-26T18:00:00Z',
  },
];

// ── Player Protection states ──────────────────────

export const MOCK_PROTECTION: Record<string, PlayerProtection> = {
  'p-boss': {
    player_id: 'p-boss',
    mode: 'NONE',
    activated_at: null,
    expires_at: null,
    last_sleep_at: null,
    last_vacation_at: null,
  },
  'p-underboss': {
    player_id: 'p-underboss',
    mode: 'NONE',
    activated_at: null,
    expires_at: null,
    last_sleep_at: '2026-03-28T22:00:00Z',
    last_vacation_at: null,
  },
  'p-consigliere': {
    player_id: 'p-consigliere',
    mode: 'NONE',
    activated_at: null,
    expires_at: null,
    last_sleep_at: null,
    last_vacation_at: '2026-03-01T00:00:00Z',
  },
  'p-capo': {
    player_id: 'p-capo',
    mode: 'SLEEP',
    activated_at: '2026-03-29T01:00:00Z',
    expires_at: '2026-03-29T09:00:00Z',
    last_sleep_at: '2026-03-29T01:00:00Z',
    last_vacation_at: null,
  },
  'p-soldier': {
    player_id: 'p-soldier',
    mode: 'NONE',
    activated_at: null,
    expires_at: null,
    last_sleep_at: null,
    last_vacation_at: null,
  },
  'p-associate': {
    player_id: 'p-associate',
    mode: 'VACATION',
    activated_at: '2026-03-25T12:00:00Z',
    expires_at: '2026-04-01T12:00:00Z',
    last_sleep_at: null,
    last_vacation_at: '2026-03-25T12:00:00Z',
  },
  'p-recruit': {
    player_id: 'p-recruit',
    mode: 'NONE',
    activated_at: null,
    expires_at: null,
    last_sleep_at: null,
    last_vacation_at: null,
  },
};

// ── Obituaries ────────────────────────────────────

export const MOCK_OBITUARIES: ObituaryEntry[] = [
  {
    id: 'obit-1',
    event_type: 'DEATH',
    player_id: 'p-rival-boss',
    player_alias: 'Marco Ferrante',
    family_id: 'fam-2',
    family_name: 'Ferrante Crew',
    note: 'Found in his car near the waterfront. The Cardinal sends his regards.',
    created_at: '2026-03-22T03:14:00Z',
  },
  {
    id: 'obit-2',
    event_type: 'DEATH',
    player_id: 'p-rival-underboss',
    player_alias: 'Enzo Barese',
    family_id: 'fam-2',
    family_name: 'Ferrante Crew',
    note: 'Underboss of the Ferrante Crew. Three shots, no witnesses. Contract fulfilled.',
    created_at: '2026-03-22T02:14:00Z',
  },
  {
    id: 'obit-3',
    event_type: 'WITNESS_PROTECTION',
    player_id: null,
    player_alias: 'Danny Bricks',
    family_id: 'fam-3',
    family_name: 'Rizzo Outfit',
    note: 'Turned state\'s evidence after the Pier 7 raid. Left with a new name and federal security. Left his crew with nothing.',
    created_at: '2026-03-20T15:00:00Z',
  },
  {
    id: 'obit-4',
    event_type: 'RETIREMENT',
    player_id: null,
    player_alias: 'Fat Carlo',
    family_id: 'fam-1',
    family_name: 'The Corrado Family',
    note: 'Twenty-two years in the life. Walked away clean. Don Corrado gave him his blessing. He runs a restaurant in Florida now.',
    created_at: '2026-03-18T12:00:00Z',
  },
  {
    id: 'obit-5',
    event_type: 'LEADERSHIP_CHANGE',
    player_id: null,
    player_alias: 'Bobby Rizzo',
    family_id: 'fam-3',
    family_name: 'Rizzo Outfit',
    note: 'Assumed leadership of the Rizzo Outfit after the previous boss was removed. Young, ambitious, and not yet tested.',
    created_at: '2026-03-17T10:00:00Z',
  },
  {
    id: 'obit-6',
    event_type: 'FAMILY_DISSOLVED',
    player_id: null,
    player_alias: 'Victor Greco',
    family_id: 'fam-6',
    family_name: 'Greco Associates',
    note: 'The Greco Associates are no more. Treasury seized, territory divided. Victor Greco fled the city. Nobody looked for him.',
    created_at: '2026-03-15T20:00:00Z',
  },
  {
    id: 'obit-7',
    event_type: 'DEATH',
    player_id: null,
    player_alias: 'Two-Tone Tommy',
    family_id: 'fam-4',
    family_name: 'Moretti Syndicate',
    note: 'Caught in the crossfire during the Midtown dispute. Wrong place, wrong time. The life has its costs.',
    created_at: '2026-03-14T23:00:00Z',
  },
  {
    id: 'obit-8',
    event_type: 'WITNESS_PROTECTION',
    player_id: null,
    player_alias: 'Pete the Greek',
    family_id: 'fam-4',
    family_name: 'Moretti Syndicate',
    note: 'Soldato who ran to the feds after the armory bust. His crew will not forget. Neither will the feds.',
    created_at: '2026-03-12T09:00:00Z',
  },
  {
    id: 'obit-9',
    event_type: 'RETIREMENT',
    player_id: null,
    player_alias: 'The Professor',
    family_id: null,
    family_name: null,
    note: 'Solo operator. Worked contracts for a decade without a traced failure. Retired on his own terms. Status: unknown.',
    created_at: '2026-03-10T00:00:00Z',
  },
  {
    id: 'obit-10',
    event_type: 'DEATH',
    player_id: null,
    player_alias: 'Richie Pockets',
    family_id: 'fam-5',
    family_name: 'West Side Outfit',
    note: 'Found near the airport. No family claimed the body. The West Side Outfit denies involvement, as always.',
    created_at: '2026-03-08T05:30:00Z',
  },
];

// ── Other families for leaderboard ───────────────

export const ALL_FAMILIES: Family[] = [
  {
    id: 'fam-1',
    name: 'The Corrado Family',
    motto: 'Silenzio è oro.',
    boss_id: 'p-boss',
    treasury: 1240000,
    power_score: 8420,
    territory: ['South Port', 'The Docks', 'Midtown Rackets'],
    status: 'ACTIVE',
    underboss_ids: [], consigliere_ids: [], prestige: 8420, crew_ids: [],
    members: [], // filled from MOCK_FAMILY
  },
  {
    id: 'fam-2',
    name: 'Ferrante Crew',
    motto: 'Blood is thicker.',
    boss_id: 'fam2-boss',
    treasury: 580000,
    power_score: 5140,
    territory: ['Airport Row', 'East Harbor'],
    status: 'AT_WAR',
    underboss_ids: ['fam2-ub'], consigliere_ids: [], prestige: 5140, crew_ids: [],
    members: [
      { player_id: 'fam2-boss',    family_id: 'fam-2', role: 'BOSS',      affiliation: 'LEADERSHIP', joined_at: '2026-01-01T00:00:00Z', promoted_at: null, invited_by: 'fam2-boss', missions_completed: 14, money_earned: 620000 },
      { player_id: 'fam2-ub',      family_id: 'fam-2', role: 'UNDERBOSS', affiliation: 'LEADERSHIP', joined_at: '2026-01-05T00:00:00Z', promoted_at: null, invited_by: 'fam2-boss', missions_completed: 11, money_earned: 290000 },
      { player_id: 'fam2-s1',      family_id: 'fam-2', role: 'SOLDIER',   affiliation: 'MEMBER',     joined_at: '2026-01-10T00:00:00Z', promoted_at: null, invited_by: 'fam2-ub',   missions_completed: 6,  money_earned: 85000 },
      { player_id: 'fam2-s2',      family_id: 'fam-2', role: 'SOLDIER',   affiliation: 'MEMBER',     joined_at: '2026-01-12T00:00:00Z', promoted_at: null, invited_by: 'fam2-ub',   missions_completed: 5,  money_earned: 70000 },
    ],
  },
  {
    id: 'fam-3',
    name: 'Rizzo Outfit',
    motto: 'Patience wins.',
    boss_id: 'fam3-boss',
    treasury: 920000,
    power_score: 7200,
    territory: ['North Docks', 'Financial Row'],
    status: 'ACTIVE',
    underboss_ids: ['fam3-ub'], consigliere_ids: ['fam3-cons'], prestige: 7200, crew_ids: [],
    members: [
      { player_id: 'fam3-boss',  family_id: 'fam-3', role: 'BOSS',        affiliation: 'LEADERSHIP', joined_at: '2026-01-02T00:00:00Z', promoted_at: null, invited_by: 'fam3-boss', missions_completed: 19, money_earned: 850000 },
      { player_id: 'fam3-ub',    family_id: 'fam-3', role: 'UNDERBOSS',   affiliation: 'LEADERSHIP', joined_at: '2026-01-06T00:00:00Z', promoted_at: null, invited_by: 'fam3-boss', missions_completed: 13, money_earned: 380000 },
      { player_id: 'fam3-cons',  family_id: 'fam-3', role: 'CONSIGLIERE', affiliation: 'LEADERSHIP', joined_at: '2026-01-08T00:00:00Z', promoted_at: null, invited_by: 'fam3-boss', missions_completed: 10, money_earned: 320000 },
      { player_id: 'fam3-capo',  family_id: 'fam-3', role: 'CAPO',        affiliation: 'LEADERSHIP', joined_at: '2026-01-10T00:00:00Z', promoted_at: null, invited_by: 'fam3-ub',   missions_completed: 8,  money_earned: 210000 },
      { player_id: 'fam3-s1',    family_id: 'fam-3', role: 'SOLDIER',     affiliation: 'MEMBER',     joined_at: '2026-01-15T00:00:00Z', promoted_at: null, invited_by: 'fam3-capo', missions_completed: 5,  money_earned: 95000 },
      { player_id: 'fam3-s2',    family_id: 'fam-3', role: 'SOLDIER',     affiliation: 'MEMBER',     joined_at: '2026-01-16T00:00:00Z', promoted_at: null, invited_by: 'fam3-capo', missions_completed: 4,  money_earned: 78000 },
    ],
  },
  {
    id: 'fam-4',
    name: 'Moretti Syndicate',
    motto: 'Numbers don\'t lie.',
    boss_id: 'fam4-boss',
    treasury: 340000,
    power_score: 4100,
    territory: ['Uptown'],
    status: 'WEAKENED',
    underboss_ids: ['fam4-ub'], consigliere_ids: [], prestige: 4100, crew_ids: [],
    members: [
      { player_id: 'fam4-boss', family_id: 'fam-4', role: 'BOSS',    affiliation: 'LEADERSHIP', joined_at: '2026-01-01T00:00:00Z', promoted_at: null, invited_by: 'fam4-boss', missions_completed: 9,  money_earned: 320000 },
      { player_id: 'fam4-ub',   family_id: 'fam-4', role: 'UNDERBOSS', affiliation: 'LEADERSHIP', joined_at: '2026-01-07T00:00:00Z', promoted_at: null, invited_by: 'fam4-boss', missions_completed: 7,  money_earned: 180000 },
      { player_id: 'fam4-s1',   family_id: 'fam-4', role: 'SOLDIER',   affiliation: 'MEMBER',     joined_at: '2026-01-20T00:00:00Z', promoted_at: null, invited_by: 'fam4-ub',   missions_completed: 3,  money_earned: 45000 },
    ],
  },
  {
    id: 'fam-5',
    name: 'West Side Outfit',
    motto: 'Own the night.',
    boss_id: 'fam5-boss',
    treasury: 760000,
    power_score: 6300,
    territory: ['Westside Strip', 'Harbor View'],
    status: 'ACTIVE',
    underboss_ids: ['fam5-ub'], consigliere_ids: [], prestige: 6300, crew_ids: [],
    members: [
      { player_id: 'fam5-boss', family_id: 'fam-5', role: 'BOSS',      affiliation: 'LEADERSHIP', joined_at: '2026-01-03T00:00:00Z', promoted_at: null, invited_by: 'fam5-boss', missions_completed: 16, money_earned: 690000 },
      { player_id: 'fam5-ub',   family_id: 'fam-5', role: 'UNDERBOSS', affiliation: 'LEADERSHIP', joined_at: '2026-01-05T00:00:00Z', promoted_at: null, invited_by: 'fam5-boss', missions_completed: 12, money_earned: 330000 },
      { player_id: 'fam5-capo', family_id: 'fam-5', role: 'CAPO',      affiliation: 'LEADERSHIP', joined_at: '2026-01-12T00:00:00Z', promoted_at: null, invited_by: 'fam5-ub',   missions_completed: 9,  money_earned: 220000 },
      { player_id: 'fam5-s1',   family_id: 'fam-5', role: 'SOLDIER',   affiliation: 'MEMBER',     joined_at: '2026-01-18T00:00:00Z', promoted_at: null, invited_by: 'fam5-capo', missions_completed: 5,  money_earned: 100000 },
      { player_id: 'fam5-s2',   family_id: 'fam-5', role: 'SOLDIER',   affiliation: 'MEMBER',     joined_at: '2026-01-19T00:00:00Z', promoted_at: null, invited_by: 'fam5-capo', missions_completed: 4,  money_earned: 80000 },
    ],
  },
];

// Boss aliases for leaderboard display
export const FAMILY_BOSS_ALIAS: Record<string, string> = {
  'fam-1': 'Don Corrado',
  'fam-2': 'Marco Ferrante Jr.',
  'fam-3': 'Bobby Rizzo',
  'fam-4': 'Sal Moretti',
  'fam-5': 'Big Ray West',
};

// Turf blocks per family (for leaderboard)
export const FAMILY_TURF_COUNT: Record<string, number> = {
  'fam-1': 3,
  'fam-2': 2,
  'fam-3': 2,
  'fam-4': 1,
  'fam-5': 2,
};

export const FAMILY_DAILY_INCOME: Record<string, number> = {
  'fam-1': calcTurfTotalIncome(MOCK_TURF_BLOCKS),
  'fam-2': 22500,
  'fam-3': 34800,
  'fam-4': 9200,
  'fam-5': 28600,
};

// Top-5 member respect sum per family (for leaderboard)
export const FAMILY_MEMBER_RESPECT: Record<string, number> = {
  'fam-1': 940 + 780 + 810 + 620 + 410,  // top 5 from p-boss etc
  'fam-2': 420 + 310 + 180 + 150,
  'fam-3': 680 + 540 + 480 + 420 + 380,
  'fam-4': 310 + 240 + 120,
  'fam-5': 580 + 460 + 350 + 280 + 240,
};

export function calcFamilyScore(
  familyId: string,
  family: Family,
): number {
  const turfScore = (FAMILY_TURF_COUNT[familyId] ?? 0) * 1000;
  const incomeScore = (FAMILY_DAILY_INCOME[familyId] ?? 0) * 10;
  const treasuryScore = Math.floor(family.treasury / 100);
  const memberScore = FAMILY_MEMBER_RESPECT[familyId] ?? 0;
  const powerScore = family.power_score;
  return turfScore + incomeScore + treasuryScore + memberScore + powerScore;
}
