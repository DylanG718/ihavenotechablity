/**
 * jailMockData.ts — Mock data for the prison system.
 *
 * Covers all jail states for testing:
 *   - One player in PROCESSING (recently arrested)
 *   - One player SERVING sentence in State Pen
 *   - One player RELEASE_ELIGIBLE (sentence done, hasn't walked yet)
 *   - One player in Federal (elite job bust)
 *   - Kites in both directions (jailed → leadership, leadership → jailed)
 *   - Global jail chat + family block chat
 */

import type { JailRecord, Kite, JailChatMessage, BailMission } from '../../../shared/jail';

const now = () => new Date().toISOString();
const hoursAgo  = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
const hoursFromNow = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
const minsAgo   = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
const minsFromNow = (m: number) => new Date(Date.now() + m * 60_000).toISOString();

// ─────────────────────────────────────────────
// JAIL RECORDS
// ─────────────────────────────────────────────

export const MOCK_JAIL_RECORDS: JailRecord[] = [
  // Vinnie D (SOLDIER) — just got pinched, still processing
  {
    id: 'jail-1',
    player_id: 'p-soldier',
    family_id: 'fam-1',
    tier: 'STATE',
    status: 'PROCESSING',
    arrested_for: 'Failed ADVANCED Heist: Pier 7 Warehouse',
    mission_tier: 'ADVANCED',
    arrested_at: minsAgo(20),
    sentence_ends_at: hoursFromNow(11),   // ~12h sentence
    actual_released_at: null,
    heat_at_arrest: 55,
    sentence_delta_hours: 0,
    bribe_attempts: 0,
    lawyer_attempts: 0,
    bail_mission_active: false,
    bail_mission_progress: 0,
  },
  // Luca B (ASSOCIATE) — mid-sentence, County lockup
  {
    id: 'jail-2',
    player_id: 'p-associate',
    family_id: 'fam-1',
    tier: 'COUNTY',
    status: 'SERVING',
    arrested_for: 'Failed STANDARD Extortion: The Riverside Bar',
    mission_tier: 'STANDARD',
    arrested_at: hoursAgo(4),
    sentence_ends_at: hoursFromNow(2),   // 6h total, 4h served
    actual_released_at: null,
    heat_at_arrest: 31,
    sentence_delta_hours: -1,           // lawyer already knocked 1h off
    bribe_attempts: 0,
    lawyer_attempts: 1,
    bail_mission_active: true,
    bail_mission_progress: 55,
  },
  // Joey Socks (RECRUIT) — sentence done, eligible for release
  {
    id: 'jail-3',
    player_id: 'p-recruit',
    family_id: 'fam-1',
    tier: 'COUNTY',
    status: 'RELEASE_ELIGIBLE',
    arrested_for: 'Failed STARTER Numbers Run',
    mission_tier: 'STARTER',
    arrested_at: hoursAgo(4),
    sentence_ends_at: hoursAgo(1),      // sentence expired 1h ago
    actual_released_at: null,
    heat_at_arrest: 18,
    sentence_delta_hours: 0,
    bribe_attempts: 0,
    lawyer_attempts: 0,
    bail_mission_active: false,
    bail_mission_progress: 0,
  },
  // Rival — Federal bust (for spectator view)
  {
    id: 'jail-4',
    player_id: 'p-rival-capo',
    family_id: 'fam-2',
    tier: 'FEDERAL',
    status: 'SERVING',
    arrested_for: 'Failed ELITE Bank Job: First National Heist',
    mission_tier: 'ELITE',
    arrested_at: hoursAgo(8),
    sentence_ends_at: hoursFromNow(34),  // ~42h total sentence
    actual_released_at: null,
    heat_at_arrest: 88,
    sentence_delta_hours: -3,
    bribe_attempts: 1,
    lawyer_attempts: 1,
    bail_mission_active: false,
    bail_mission_progress: 0,
  },
];

// ─────────────────────────────────────────────
// KITES
// ─────────────────────────────────────────────

export const MOCK_KITES: Kite[] = [
  // Vinnie D kite to Boss (leadership)
  {
    id: 'kite-1',
    from_player_id: 'p-soldier',
    from_player_alias: 'Vinnie D',
    to_player_id: 'FAMILY_LEADERSHIP',
    to_player_alias: 'Don Corrado',
    family_id: 'fam-1',
    subject: 'Pinched at Pier 7',
    body: "Don — they got me coming out of the warehouse. State penn, 12 hours. I didn't say a word. Requesting bail if you can spare someone. I'll make it up when I'm out.",
    status: 'DELIVERED',
    sent_at: minsAgo(18),
    read_at: minsAgo(5),
    reply_body: "Sit tight. We got a crew on it. Don't talk to anyone in there.",
    reply_at: minsAgo(3),
  },
  // Luca B kite to Consigliere
  {
    id: 'kite-2',
    from_player_id: 'p-associate',
    from_player_alias: 'Luca B',
    to_player_id: 'p-consigliere',
    to_player_alias: 'The Counselor',
    family_id: 'fam-1',
    subject: 'Need a lawyer contact',
    body: "Counselor — County lock up. This was a setup, the Riverside spot was blown before we got there. I hired a lawyer already (−1h) but still got 2 hours left. The bail mission is moving — 55% done. Any heat reduction from outside would help.",
    status: 'READ',
    sent_at: hoursAgo(2),
    read_at: hoursAgo(1),
    reply_body: null,
    reply_at: null,
  },
  // Joey Socks kite — release request
  {
    id: 'kite-3',
    from_player_id: 'p-recruit',
    from_player_alias: 'Joey Socks',
    to_player_id: 'FAMILY_LEADERSHIP',
    to_player_alias: 'Don Corrado',
    family_id: 'fam-1',
    subject: "I'm clear to walk",
    body: "Sentence is done. Sitting here waiting. Should I walk now or wait for a cleaner exit? Don't want extra eyes on me.",
    status: 'SENT',
    sent_at: minsAgo(45),
    read_at: null,
    reply_body: null,
    reply_at: null,
  },
  // Kite from leadership to Luca (external — they sent one back)
  {
    id: 'kite-4',
    from_player_id: 'p-boss',
    from_player_alias: 'Don Corrado',
    to_player_id: 'p-associate',
    to_player_alias: 'Luca B',
    family_id: 'fam-1',
    subject: 'Bail crew is moving',
    body: "We got Tommy and the crew working your bail. Should be done in an hour. Keep your mouth shut and don't bribe — we don't want more heat right now.",
    status: 'READ',
    sent_at: hoursAgo(1.5),
    read_at: hoursAgo(1),
    reply_body: 'Understood. Waiting it out.',
    reply_at: hoursAgo(0.8),
  },
];

// ─────────────────────────────────────────────
// JAIL CHAT
// ─────────────────────────────────────────────

export const MOCK_JAIL_CHAT: JailChatMessage[] = [
  // Global jail chat
  {
    id: 'jc-1',
    channel: 'GLOBAL_JAIL',
    player_id: 'p-rival-capo',
    player_alias: 'Nico Russo',
    family_name: 'The Ferrante Crew',
    jail_tier: 'FEDERAL',
    body: "Federal wing is no joke. Anyone else in here from that Pier 7 situation?",
    sent_at: hoursAgo(6),
    reply_to_id: null,
  },
  {
    id: 'jc-2',
    channel: 'GLOBAL_JAIL',
    player_id: 'p-soldier',
    player_alias: 'Vinnie D',
    family_name: 'The Corrado Family',
    jail_tier: 'STATE',
    body: "Nah I'm State. Pier 7 was a different crew. When you getting out Russo?",
    sent_at: minsAgo(15),
    reply_to_id: 'jc-1',
  },
  {
    id: 'jc-3',
    channel: 'GLOBAL_JAIL',
    player_id: 'p-rival-capo',
    player_alias: 'Nico Russo',
    family_name: 'The Ferrante Crew',
    jail_tier: 'FEDERAL',
    body: "34 hours. Lawyer took 3 off. At least I got the good unit.",
    sent_at: minsAgo(12),
    reply_to_id: null,
  },
  {
    id: 'jc-4',
    channel: 'GLOBAL_JAIL',
    player_id: 'p-recruit',
    player_alias: 'Joey Socks',
    family_name: 'The Corrado Family',
    jail_tier: 'COUNTY',
    body: "County lockup here. This place smells like mildew. Anyone know a good guard to bribe on the night shift?",
    sent_at: minsAgo(8),
    reply_to_id: null,
  },
  {
    id: 'jc-5',
    channel: 'GLOBAL_JAIL',
    player_id: 'p-associate',
    player_alias: 'Luca B',
    family_name: 'The Corrado Family',
    jail_tier: 'COUNTY',
    body: "Socks — night shift guard is Martinez. He takes 40 but he's skittish. Don't push it.",
    sent_at: minsAgo(5),
    reply_to_id: 'jc-4',
  },
  // Family block chat (Corrado members only)
  {
    id: 'jc-6',
    channel: 'FAMILY_BLOCK',
    player_id: 'p-soldier',
    player_alias: 'Vinnie D',
    family_name: 'The Corrado Family',
    jail_tier: 'STATE',
    body: "We need to talk about that Riverside tip. Someone outside the family knew we were coming.",
    sent_at: hoursAgo(3),
    reply_to_id: null,
  },
  {
    id: 'jc-7',
    channel: 'FAMILY_BLOCK',
    player_id: 'p-associate',
    player_alias: 'Luca B',
    family_name: 'The Corrado Family',
    jail_tier: 'COUNTY',
    body: "I said the same in my kite to the Counselor. The Riverside spot was already cold when we got there. This was a setup.",
    sent_at: hoursAgo(2),
    reply_to_id: 'jc-6',
  },
  {
    id: 'jc-8',
    channel: 'FAMILY_BLOCK',
    player_id: 'p-recruit',
    player_alias: 'Joey Socks',
    family_name: 'The Corrado Family',
    jail_tier: 'COUNTY',
    body: "My sentence is up and I haven't walked yet. Waiting for the all-clear from Don.",
    sent_at: minsAgo(40),
    reply_to_id: null,
  },
];

// ─────────────────────────────────────────────
// BAIL MISSIONS
// ─────────────────────────────────────────────

export const MOCK_BAIL_MISSIONS: BailMission[] = [
  {
    id: 'bail-1',
    jail_record_id: 'jail-2',
    jailed_player_id: 'p-associate',
    family_id: 'fam-1',
    status: 'ACTIVE',
    sentence_reduction_hours: 4,
    progress: 55,
    created_at: hoursAgo(2),
    resolved_at: null,
  },
];

// ─────────────────────────────────────────────
// Action cooldown tracking per player (simulated last-used timestamps)
// ─────────────────────────────────────────────

export const MOCK_ACTION_LAST_USED: Record<string, Record<string, string | null>> = {
  'p-soldier': {
    LAY_LOW: null,
    PRISON_JOBS: null,
    BRIBE_GUARD: null,
    HIRE_LAWYER: null,
    REQUEST_BAIL: null,
  },
  'p-associate': {
    LAY_LOW: hoursAgo(2),     // on cooldown
    PRISON_JOBS: hoursAgo(5), // cooldown cleared
    BRIBE_GUARD: null,
    HIRE_LAWYER: hoursAgo(1), // still cooling down (12h cooldown)
    REQUEST_BAIL: hoursAgo(2), // bail already active
  },
  'p-recruit': {
    LAY_LOW: null,
    PRISON_JOBS: null,
    BRIBE_GUARD: null,
    HIRE_LAWYER: null,
    REQUEST_BAIL: null,
  },
};
