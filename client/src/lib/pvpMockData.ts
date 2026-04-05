/**
 * pvpMockData.ts — Mock loadouts, defenses, and attack history.
 *
 * Each player has weapons + bodyguards + home defenses matching their rank:
 *   Boss:       3 guards (Elite×2, Pro×1) + full home fortress
 *   Underboss:  2 guards (Elite×1, Pro×1) + armed perimeter + alarm
 *   Capo:       2 guards (Pro×1, Street×1) + alarm + door
 *   Soldier:    1 guard (Street) + door only
 *   Associate:  no guards + door
 *   Recruit:    nothing
 */

import type {
  PlayerWeapon, PlayerBodyguard, PlayerHomeDefense,
  AttackRecord, CoordinatedAssault,
} from '../../../shared/pvp';
import { computeDefenseProfile } from './pvpEngine';

const now    = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

// ─────────────────────────────────────────────
// WEAPON LOADOUTS
// ─────────────────────────────────────────────

export const MOCK_WEAPON_LOADOUTS: Record<string, PlayerWeapon[]> = {
  'p-boss': [
    { weapon_id: 'RIFLE',     quantity: 1, ammo_remaining: 4, is_equipped_primary: true,  is_equipped_secondary: false, purchased_at: hoursAgo(72) },
    { weapon_id: 'REVOLVER',  quantity: 2, ammo_remaining: 6, is_equipped_primary: false, is_equipped_secondary: true,  purchased_at: hoursAgo(48) },
    { weapon_id: 'KNIFE',     quantity: 1, ammo_remaining: null, is_equipped_primary: false, is_equipped_secondary: false, purchased_at: hoursAgo(48) },
  ],
  'p-underboss': [
    { weapon_id: 'TOMMY_GUN', quantity: 1, ammo_remaining: 38, is_equipped_primary: true,  is_equipped_secondary: false, purchased_at: hoursAgo(24) },
    { weapon_id: 'PISTOL_45', quantity: 1, ammo_remaining: 7,  is_equipped_primary: false, is_equipped_secondary: true,  purchased_at: hoursAgo(48) },
    { weapon_id: 'BAT',       quantity: 1, ammo_remaining: null, is_equipped_primary: false, is_equipped_secondary: false, purchased_at: hoursAgo(72) },
  ],
  'p-capo': [
    { weapon_id: 'SHOTGUN',   quantity: 1, ammo_remaining: 5, is_equipped_primary: true,  is_equipped_secondary: false, purchased_at: hoursAgo(36) },
    { weapon_id: 'PISTOL_9MM',quantity: 1, ammo_remaining: 12, is_equipped_primary: false, is_equipped_secondary: true,  purchased_at: hoursAgo(60) },
  ],
  'p-soldier': [
    { weapon_id: 'PISTOL_9MM',quantity: 1, ammo_remaining: 15, is_equipped_primary: true,  is_equipped_secondary: false, purchased_at: hoursAgo(12) },
    { weapon_id: 'KNIFE',     quantity: 1, ammo_remaining: null, is_equipped_primary: false, is_equipped_secondary: true,  purchased_at: hoursAgo(24) },
  ],
  'p-associate': [
    { weapon_id: 'BRASS_KNUCKLES', quantity: 1, ammo_remaining: null, is_equipped_primary: true, is_equipped_secondary: false, purchased_at: hoursAgo(48) },
    { weapon_id: 'FISTS',     quantity: 1, ammo_remaining: null, is_equipped_primary: false, is_equipped_secondary: false, purchased_at: hoursAgo(0) },
  ],
  'p-recruit': [
    { weapon_id: 'FISTS', quantity: 1, ammo_remaining: null, is_equipped_primary: true, is_equipped_secondary: false, purchased_at: hoursAgo(0) },
  ],
  'p-hitman-1': [
    { weapon_id: 'RIFLE',     quantity: 1, ammo_remaining: 5, is_equipped_primary: true,  is_equipped_secondary: false, purchased_at: hoursAgo(48) },
    { weapon_id: 'REVOLVER',  quantity: 1, ammo_remaining: 6, is_equipped_primary: false, is_equipped_secondary: true,  purchased_at: hoursAgo(24) },
    { weapon_id: 'KNIFE',     quantity: 2, ammo_remaining: null, is_equipped_primary: false, is_equipped_secondary: false, purchased_at: hoursAgo(72) },
  ],
};

// ─────────────────────────────────────────────
// BODYGUARDS
// ─────────────────────────────────────────────

export const MOCK_BODYGUARDS: Record<string, PlayerBodyguard[]> = {
  'p-boss': [
    { id: 'bg-boss-1', player_id: 'p-boss', tier: 'ELITE',        current_hp: 120, status: 'ACTIVE',  hired_at: hoursAgo(72) },
    { id: 'bg-boss-2', player_id: 'p-boss', tier: 'ELITE',        current_hp: 120, status: 'ACTIVE',  hired_at: hoursAgo(72) },
    { id: 'bg-boss-3', player_id: 'p-boss', tier: 'PROFESSIONAL', current_hp: 75,  status: 'ACTIVE',  hired_at: hoursAgo(48) },
  ],
  'p-underboss': [
    { id: 'bg-ub-1',   player_id: 'p-underboss', tier: 'ELITE',        current_hp: 90,  status: 'INJURED', hired_at: hoursAgo(48) },
    { id: 'bg-ub-2',   player_id: 'p-underboss', tier: 'PROFESSIONAL', current_hp: 75,  status: 'ACTIVE',  hired_at: hoursAgo(24) },
  ],
  'p-capo': [
    { id: 'bg-capo-1', player_id: 'p-capo', tier: 'PROFESSIONAL', current_hp: 60, status: 'INJURED', hired_at: hoursAgo(36) },
    { id: 'bg-capo-2', player_id: 'p-capo', tier: 'STREET',       current_hp: 40, status: 'ACTIVE',  hired_at: hoursAgo(24) },
  ],
  'p-soldier': [
    { id: 'bg-sol-1',  player_id: 'p-soldier', tier: 'STREET', current_hp: 28, status: 'INJURED', hired_at: hoursAgo(12) },
  ],
  'p-associate': [],
  'p-recruit':   [],
  'p-hitman-1':  [],
  'p-rival-boss': [
    { id: 'bg-rb-1',   player_id: 'p-rival-boss', tier: 'ELITE',        current_hp: 120, status: 'ACTIVE', hired_at: hoursAgo(96) },
    { id: 'bg-rb-2',   player_id: 'p-rival-boss', tier: 'ELITE',        current_hp: 95,  status: 'ACTIVE', hired_at: hoursAgo(96) },
    { id: 'bg-rb-3',   player_id: 'p-rival-boss', tier: 'PROFESSIONAL', current_hp: 75,  status: 'ACTIVE', hired_at: hoursAgo(72) },
  ],
};

// ─────────────────────────────────────────────
// HOME DEFENSES
// ─────────────────────────────────────────────

export const MOCK_HOME_DEFENSES: Record<string, PlayerHomeDefense[]> = {
  'p-boss': [
    { id: 'hd-boss-1', player_id: 'p-boss', defense_id: 'PANIC_ROOM',       current_hp: 200, status: 'ACTIVE', installed_at: hoursAgo(96) },
    { id: 'hd-boss-2', player_id: 'p-boss', defense_id: 'ARMED_PERIMETER',  current_hp: 80,  status: 'ACTIVE', installed_at: hoursAgo(96) },
    { id: 'hd-boss-3', player_id: 'p-boss', defense_id: 'ALARM_SYSTEM',     current_hp: 40,  status: 'ACTIVE', installed_at: hoursAgo(72) },
    { id: 'hd-boss-4', player_id: 'p-boss', defense_id: 'SECURITY_CAMERAS', current_hp: 30,  status: 'ACTIVE', installed_at: hoursAgo(72) },
  ],
  'p-underboss': [
    { id: 'hd-ub-1',   player_id: 'p-underboss', defense_id: 'ARMED_PERIMETER', current_hp: 55, status: 'DAMAGED', installed_at: hoursAgo(72) },
    { id: 'hd-ub-2',   player_id: 'p-underboss', defense_id: 'ALARM_SYSTEM',    current_hp: 40, status: 'ACTIVE',  installed_at: hoursAgo(48) },
    { id: 'hd-ub-3',   player_id: 'p-underboss', defense_id: 'REINFORCED_DOOR', current_hp: 60, status: 'ACTIVE',  installed_at: hoursAgo(72) },
  ],
  'p-capo': [
    { id: 'hd-capo-1', player_id: 'p-capo', defense_id: 'ALARM_SYSTEM',     current_hp: 35, status: 'DAMAGED', installed_at: hoursAgo(48) },
    { id: 'hd-capo-2', player_id: 'p-capo', defense_id: 'REINFORCED_DOOR',  current_hp: 60, status: 'ACTIVE',  installed_at: hoursAgo(48) },
  ],
  'p-soldier': [
    { id: 'hd-sol-1',  player_id: 'p-soldier', defense_id: 'REINFORCED_DOOR', current_hp: 45, status: 'DAMAGED', installed_at: hoursAgo(24) },
  ],
  'p-associate': [],
  'p-recruit':   [],
  'p-hitman-1':  [
    { id: 'hd-hit-1',  player_id: 'p-hitman-1', defense_id: 'ALARM_SYSTEM',    current_hp: 40, status: 'ACTIVE', installed_at: hoursAgo(24) },
    { id: 'hd-hit-2',  player_id: 'p-hitman-1', defense_id: 'SECURITY_CAMERAS',current_hp: 30, status: 'ACTIVE', installed_at: hoursAgo(24) },
  ],
  'p-rival-boss': [
    { id: 'hd-rb-1',   player_id: 'p-rival-boss', defense_id: 'PANIC_ROOM',       current_hp: 200, status: 'ACTIVE', installed_at: hoursAgo(120) },
    { id: 'hd-rb-2',   player_id: 'p-rival-boss', defense_id: 'ARMED_PERIMETER',  current_hp: 80,  status: 'ACTIVE', installed_at: hoursAgo(120) },
    { id: 'hd-rb-3',   player_id: 'p-rival-boss', defense_id: 'ALARM_SYSTEM',     current_hp: 40,  status: 'ACTIVE', installed_at: hoursAgo(96) },
    { id: 'hd-rb-4',   player_id: 'p-rival-boss', defense_id: 'GUARD_DOG',        current_hp: 35,  status: 'ACTIVE', installed_at: hoursAgo(96) },
  ],
};

// ─────────────────────────────────────────────
// ATTACK HISTORY
// ─────────────────────────────────────────────

export const MOCK_ATTACK_HISTORY: AttackRecord[] = [
  // Coordinated assault on Rival Boss — 3 attacks stripping layers
  {
    id: 'atk-1',
    attacker_id: 'p-soldier',
    attacker_alias: 'Vinnie D',
    target_id: 'p-rival-boss',
    target_alias: 'Marco Ferrante',
    weapon_id: 'TOMMY_GUN',
    context: 'HOME',
    outcome: 'LAYER_DAMAGED',
    damage_dealt: 45,
    layer_hit: 'HOME_DEFENSES',
    heat_added: 40,
    suspicion_added: 8,
    family_alerted: true,
    notes: 'Tommy Gun — 45 damage to Home Defenses (305/350 HP remaining).',
    attacked_at: hoursAgo(6),
    coordinated_assault_id: 'assault-1',
  },
  {
    id: 'atk-2',
    attacker_id: 'p-capo',
    attacker_alias: 'Tommy Two-Times',
    target_id: 'p-rival-boss',
    target_alias: 'Marco Ferrante',
    weapon_id: 'RIFLE',
    context: 'HOME',
    outcome: 'LAYER_DAMAGED',
    damage_dealt: 85,
    layer_hit: 'HOME_DEFENSES',
    heat_added: 30,
    suspicion_added: 8,
    family_alerted: true,
    notes: 'Rifle — 85 damage to Home Defenses (220/350 HP remaining).',
    attacked_at: hoursAgo(4),
    coordinated_assault_id: 'assault-1',
  },
  {
    id: 'atk-3',
    attacker_id: 'p-underboss',
    attacker_alias: 'Sal the Fist',
    target_id: 'p-rival-boss',
    target_alias: 'Marco Ferrante',
    weapon_id: 'TOMMY_GUN',
    context: 'HOME',
    outcome: 'LAYER_DESTROYED',
    damage_dealt: 220,
    layer_hit: 'HOME_DEFENSES',
    heat_added: 40,
    suspicion_added: 8,
    family_alerted: true,
    notes: 'Home Defenses fully breached. Bodyguards now exposed.',
    attacked_at: hoursAgo(2),
    coordinated_assault_id: 'assault-1',
  },
  // Single street attack that was repelled
  {
    id: 'atk-4',
    attacker_id: 'p-rival-capo',
    attacker_alias: 'Nico Russo',
    target_id: 'p-boss',
    target_alias: 'Don Corrado',
    weapon_id: 'PISTOL_45',
    context: 'STREET',
    outcome: 'ATTACK_REPELLED',
    damage_dealt: 0,
    layer_hit: 'BODYGUARDS',
    heat_added: 48,
    suspicion_added: 15,
    family_alerted: true,
    notes: 'Attack repelled by heavy defense. Elite bodyguards overwhelmed the assault.',
    attacked_at: hoursAgo(12),
    coordinated_assault_id: null,
  },
];

// ─────────────────────────────────────────────
// COORDINATED ASSAULT
// ─────────────────────────────────────────────

export const MOCK_ASSAULTS: CoordinatedAssault[] = [
  {
    id: 'assault-1',
    attacking_family_id: 'fam-1',
    target_player_id: 'p-rival-boss',
    total_damage: 350,
    attack_ids: ['atk-1', 'atk-2', 'atk-3'],
    current_layer: 'BODYGUARDS',
    status: 'ACTIVE',
    started_at: hoursAgo(6),
    last_attack_at: hoursAgo(2),
  },
];

// ─────────────────────────────────────────────
// Pre-built defense profiles
// ─────────────────────────────────────────────

export function getDefenseProfile(playerId: string, isHome = true) {
  const PLAYER_META: Record<string, { alias: string; role: any; hp: number; maxHp: number }> = {
    'p-boss':       { alias: 'Don Corrado',   role: 'BOSS',       hp: 100, maxHp: 100 },
    'p-underboss':  { alias: 'Sal the Fist',  role: 'UNDERBOSS',  hp: 120, maxHp: 120 },
    'p-capo':       { alias: 'Tommy Two-Times',role: 'CAPO',      hp: 100, maxHp: 100 },
    'p-soldier':    { alias: 'Vinnie D',       role: 'SOLDIER',   hp: 100, maxHp: 100 },
    'p-associate':  { alias: 'Luca B',         role: 'ASSOCIATE', hp: 100, maxHp: 100 },
    'p-recruit':    { alias: 'Joey Socks',     role: 'RECRUIT',   hp: 100, maxHp: 100 },
    'p-rival-boss': { alias: 'Marco Ferrante', role: 'BOSS',      hp: 100, maxHp: 100 },
  };
  const meta = PLAYER_META[playerId] ?? { alias: playerId, role: 'UNAFFILIATED', hp: 80, maxHp: 100 };
  return computeDefenseProfile({
    player_id: playerId,
    player_alias: meta.alias,
    role: meta.role,
    player_hp: meta.hp,
    max_player_hp: meta.maxHp,
    is_home: isHome,
    bodyguards: MOCK_BODYGUARDS[playerId] ?? [],
    home_defenses: isHome ? (MOCK_HOME_DEFENSES[playerId] ?? []) : [],
  });
}
