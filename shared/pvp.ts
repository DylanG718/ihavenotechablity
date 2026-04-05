/**
 * pvp.ts — PvP weapons, bodyguards, home defenses, and attack resolution schema.
 *
 * CORE DESIGN:
 *   Every attack must be initiated WITH a weapon the attacker owns.
 *   Defense is LAYERED — must deplete outer layers before reaching player HP:
 *     Layer 1: Home Defenses (only when target is attacked at home)
 *     Layer 2: Bodyguards (street or home)
 *     Layer 3: Player HP
 *
 *   High-value targets (Capo+) have layered defenses that multiple family
 *   members must chip away at over time — mirroring classic Mafia Life behavior.
 *
 * LOCKED CANON:
 *   - Melee weapons: low heat, weak, no upkeep
 *   - Firearms: higher damage, significant heat/noise, upkeep cost
 *   - Bodyguards can be injured/killed in attacks — tracked individually
 *   - Home defenses have HP and degrade when breached
 */

import type { FamilyRole } from './schema';

// ─────────────────────────────────────────────
// WEAPONS
// ─────────────────────────────────────────────

export type WeaponCategory = 'MELEE' | 'FIREARM';

export type WeaponId =
  // Melee
  | 'FISTS'           // Free, always available. Weakest.
  | 'BRASS_KNUCKLES'
  | 'BAT'
  | 'CROWBAR'
  | 'KNIFE'
  // Firearms — pistols
  | 'PISTOL_9MM'
  | 'PISTOL_45'
  | 'REVOLVER'
  // Firearms — heavy
  | 'TOMMY_GUN'       // SMG
  | 'SHOTGUN'
  | 'RIFLE';

export interface WeaponDef {
  id: WeaponId;
  name: string;
  category: WeaponCategory;
  /** Base damage before attacker stats */
  base_damage: number;
  /** 0–100 — higher = more accurate */
  base_accuracy: number;
  /** Heat generated on ANY use (win or lose) */
  heat_on_use: number;
  /** Additional heat generated on a FAILED attack (witnesses, noise) */
  heat_on_fail: number;
  /** Purchase cost */
  cost: number;
  /** Weekly upkeep (0 for melee) */
  upkeep: number;
  /** Clip/ammo capacity before rearm needed (null = melee) */
  ammo_capacity: number | null;
  /** Whether this weapon creates "noise" (witnesses, police reports) */
  creates_noise: boolean;
  /** Flavour description */
  description: string;
}

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  FISTS: {
    id: 'FISTS', name: 'Fists', category: 'MELEE',
    base_damage: 8, base_accuracy: 90, heat_on_use: 2, heat_on_fail: 5,
    cost: 0, upkeep: 0, ammo_capacity: null, creates_noise: false,
    description: 'Always available. No cost, no heat, no real damage.',
  },
  BRASS_KNUCKLES: {
    id: 'BRASS_KNUCKLES', name: 'Brass Knuckles', category: 'MELEE',
    base_damage: 18, base_accuracy: 88, heat_on_use: 3, heat_on_fail: 6,
    cost: 500, upkeep: 0, ammo_capacity: null, creates_noise: false,
    description: 'Cheap and quiet. Good for a message, not a kill.',
  },
  BAT: {
    id: 'BAT', name: 'Baseball Bat', category: 'MELEE',
    base_damage: 28, base_accuracy: 82, heat_on_use: 4, heat_on_fail: 8,
    cost: 800, upkeep: 0, ammo_capacity: null, creates_noise: false,
    description: 'Classic enforcer tool. Loud if it connects.',
  },
  CROWBAR: {
    id: 'CROWBAR', name: 'Crowbar', category: 'MELEE',
    base_damage: 35, base_accuracy: 78, heat_on_use: 5, heat_on_fail: 10,
    cost: 1200, upkeep: 0, ammo_capacity: null, creates_noise: false,
    description: 'Heavy and brutal. Harder to conceal.',
  },
  KNIFE: {
    id: 'KNIFE', name: 'Combat Knife', category: 'MELEE',
    base_damage: 42, base_accuracy: 85, heat_on_use: 5, heat_on_fail: 12,
    cost: 3000, upkeep: 0, ammo_capacity: null, creates_noise: false,
    description: 'Silent and lethal. High damage, minimal noise.',
  },
  PISTOL_9MM: {
    id: 'PISTOL_9MM', name: '9mm Pistol', category: 'FIREARM',
    base_damage: 55, base_accuracy: 78, heat_on_use: 15, heat_on_fail: 25,
    cost: 8000, upkeep: 500, ammo_capacity: 15, creates_noise: true,
    description: 'Entry-level firearm. Easy to conceal, decent damage.',
  },
  PISTOL_45: {
    id: 'PISTOL_45', name: '.45 Pistol', category: 'FIREARM',
    base_damage: 68, base_accuracy: 72, heat_on_use: 18, heat_on_fail: 30,
    cost: 14000, upkeep: 800, ammo_capacity: 8, creates_noise: true,
    description: 'Heavier stopping power. Each shot counts more.',
  },
  REVOLVER: {
    id: 'REVOLVER', name: '.357 Revolver', category: 'FIREARM',
    base_damage: 75, base_accuracy: 82, heat_on_use: 20, heat_on_fail: 35,
    cost: 18000, upkeep: 600, ammo_capacity: 6, creates_noise: true,
    description: 'Reliable and powerful. Fewer shots, more damage per round.',
  },
  TOMMY_GUN: {
    id: 'TOMMY_GUN', name: 'Tommy Gun (SMG)', category: 'FIREARM',
    base_damage: 90, base_accuracy: 60, heat_on_use: 40, heat_on_fail: 60,
    cost: 55000, upkeep: 3000, ammo_capacity: 50, creates_noise: true,
    description: 'Classic mob weapon. Devastating output, massive heat. Not subtle.',
  },
  SHOTGUN: {
    id: 'SHOTGUN', name: 'Pump Shotgun', category: 'FIREARM',
    base_damage: 110, base_accuracy: 65, heat_on_use: 35, heat_on_fail: 55,
    cost: 45000, upkeep: 2000, ammo_capacity: 6, creates_noise: true,
    description: 'Extreme close-range damage. Hard to miss, impossible to hide.',
  },
  RIFLE: {
    id: 'RIFLE', name: 'Scoped Rifle', category: 'FIREARM',
    base_damage: 130, base_accuracy: 88, heat_on_use: 30, heat_on_fail: 50,
    cost: 80000, upkeep: 2500, ammo_capacity: 5, creates_noise: true,
    description: 'Long-range precision. High damage, needs planning. Professional weapon.',
  },
};

// ─────────────────────────────────────────────
// PLAYER WEAPON LOADOUT
// ─────────────────────────────────────────────

export interface PlayerWeapon {
  weapon_id: WeaponId;
  quantity: number;       // How many owned
  ammo_remaining: number | null; // null for melee
  is_equipped_primary: boolean;
  is_equipped_secondary: boolean;
  purchased_at: string;
}

// ─────────────────────────────────────────────
// BODYGUARDS (purchasable NPC defenders)
// ─────────────────────────────────────────────

export type BodyguardTier = 'STREET' | 'PROFESSIONAL' | 'ELITE';

export interface BodyguardDef {
  tier: BodyguardTier;
  name: string;
  /** Defense points contributed per guard */
  defense_rating: number;
  /** HP of this guard (depleted when attacked) */
  max_hp: number;
  /** Cost to hire */
  cost: number;
  /** Weekly upkeep */
  weekly_upkeep: number;
  description: string;
}

export const BODYGUARD_DEFS: Record<BodyguardTier, BodyguardDef> = {
  STREET: {
    tier: 'STREET', name: 'Street Muscle',
    defense_rating: 20, max_hp: 40,
    cost: 15000, weekly_upkeep: 2000,
    description: 'Local enforcer. Provides basic deterrence. Can be bypassed with enough firepower.',
  },
  PROFESSIONAL: {
    tier: 'PROFESSIONAL', name: 'Professional Guard',
    defense_rating: 45, max_hp: 75,
    cost: 50000, weekly_upkeep: 8000,
    description: 'Trained security. Absorbs significant damage before going down.',
  },
  ELITE: {
    tier: 'ELITE', name: 'Elite Fixer',
    defense_rating: 80, max_hp: 120,
    cost: 150000, weekly_upkeep: 20000,
    description: 'Top-tier protection. Requires a coordinated assault to defeat.',
  },
};

/** One active bodyguard instance owned by a player */
export interface PlayerBodyguard {
  id: string;
  player_id: string;
  tier: BodyguardTier;
  current_hp: number;
  /** Injured guards are less effective until healed */
  status: 'ACTIVE' | 'INJURED' | 'DEAD';
  hired_at: string;
}

// ─────────────────────────────────────────────
// HOME / SAFEHOUSE DEFENSES
// ─────────────────────────────────────────────

export type HomeDefenseId =
  | 'REINFORCED_DOOR'
  | 'ALARM_SYSTEM'
  | 'SECURITY_CAMERAS'
  | 'GUARD_DOG'
  | 'PANIC_ROOM'
  | 'ARMED_PERIMETER';

export interface HomeDefenseDef {
  id: HomeDefenseId;
  name: string;
  /** Defense points added (home context only) */
  defense_rating: number;
  /** HP of this installation */
  max_hp: number;
  /** Purchase cost */
  cost: number;
  /** Repair cost when damaged */
  repair_cost: number;
  description: string;
}

export const HOME_DEFENSE_DEFS: Record<HomeDefenseId, HomeDefenseDef> = {
  REINFORCED_DOOR: {
    id: 'REINFORCED_DOOR', name: 'Reinforced Door',
    defense_rating: 15, max_hp: 60,
    cost: 5000, repair_cost: 1500,
    description: 'Slows entry. Buys time but won\'t stop a determined crew.',
  },
  ALARM_SYSTEM: {
    id: 'ALARM_SYSTEM', name: 'Alarm System',
    defense_rating: 20, max_hp: 40,
    cost: 10000, repair_cost: 3000,
    description: 'Triggers heat event on the attacker. Doesn\'t block damage but raises their risk.',
  },
  SECURITY_CAMERAS: {
    id: 'SECURITY_CAMERAS', name: 'Security Cameras',
    defense_rating: 10, max_hp: 30,
    cost: 8000, repair_cost: 2500,
    description: 'Exposes attacker identity. Adds to their heat and suspicion on a failed attack.',
  },
  GUARD_DOG: {
    id: 'GUARD_DOG', name: 'Guard Dog',
    defense_rating: 25, max_hp: 35,
    cost: 12000, repair_cost: 4000,
    description: 'Effective early alarm and deterrent. Can be neutralized with bait.',
  },
  PANIC_ROOM: {
    id: 'PANIC_ROOM', name: 'Panic Room',
    defense_rating: 50, max_hp: 200,
    cost: 80000, repair_cost: 15000,
    description: 'Near-impenetrable last resort. Protects player HP directly.',
  },
  ARMED_PERIMETER: {
    id: 'ARMED_PERIMETER', name: 'Armed Perimeter',
    defense_rating: 60, max_hp: 80,
    cost: 100000, repair_cost: 20000,
    description: 'Physical armed presence around the property. Highest home defense rating.',
  },
};

export interface PlayerHomeDefense {
  id: string;
  player_id: string;
  defense_id: HomeDefenseId;
  current_hp: number;
  status: 'ACTIVE' | 'DAMAGED' | 'DESTROYED';
  installed_at: string;
}

// ─────────────────────────────────────────────
// LAYERED DEFENSE SYSTEM
// ─────────────────────────────────────────────

/**
 * The three layers of defense, in order.
 * Each must be fully depleted before the next can be targeted.
 *
 * HOME ATTACK context:
 *   Layer 1 → Home Defenses (sum of all active installations)
 *   Layer 2 → Bodyguards
 *   Layer 3 → Player HP
 *
 * STREET ATTACK context:
 *   Layer 1 → Bodyguards only (no home defenses apply)
 *   Layer 2 → Player HP
 */

export type AttackContext = 'HOME' | 'STREET';

export interface DefenseLayer {
  label: string;
  current_hp: number;
  max_hp: number;
  defense_rating: number;
  /** Details of what makes up this layer */
  components: {
    name: string;
    hp: number;
    max_hp: number;
    rating: number;
  }[];
}

export interface PlayerDefenseProfile {
  player_id: string;
  player_alias: string;
  role: FamilyRole | 'UNAFFILIATED';
  /** True if target is at home (home defenses apply) */
  is_home: boolean;
  layers: DefenseLayer[];
  /** Remaining player HP (final layer) */
  player_hp: number;
  max_player_hp: number;
}

// ─────────────────────────────────────────────
// ATTACK RECORD
// ─────────────────────────────────────────────

export type AttackOutcome =
  | 'LAYER_DAMAGED'          // Attacker damaged a defense layer but didn't deplete it
  | 'LAYER_DESTROYED'        // A defense layer was fully depleted
  | 'PLAYER_INJURED'         // Player HP was damaged
  | 'PLAYER_KILLED'          // Player HP reached 0 (death)
  | 'ATTACK_REPELLED'        // Defense exceeded attack — attacker took damage/heat
  | 'ATTACK_FAILED_NOTICED'  // Attack failed AND attacker was identified (high heat)
  | 'ATTACK_MISSED';         // Weapon missed entirely (low accuracy roll)

export interface AttackRecord {
  id: string;
  attacker_id: string;
  attacker_alias: string;
  target_id: string;
  target_alias: string;
  weapon_id: WeaponId;
  context: AttackContext;
  outcome: AttackOutcome;
  /** Damage dealt to the top defense layer (or player HP if all layers gone) */
  damage_dealt: number;
  /** Which layer was hit */
  layer_hit: 'HOME_DEFENSES' | 'BODYGUARDS' | 'PLAYER_HP';
  /** Heat added to attacker */
  heat_added: number;
  /** Suspicion added to attacker */
  suspicion_added: number;
  /** Did the target's family get notified */
  family_alerted: boolean;
  notes: string;
  attacked_at: string;
  /** Part of a coordinated family assault */
  coordinated_assault_id: string | null;
}

// ─────────────────────────────────────────────
// COORDINATED ASSAULT (family vs family)
// ─────────────────────────────────────────────

/**
 * Multiple family members can contribute attacks to a shared assault,
 * collectively depleting the target's layers over time.
 */
export interface CoordinatedAssault {
  id: string;
  attacking_family_id: string;
  target_player_id: string;
  /** Running total of damage dealt across all participants */
  total_damage: number;
  /** Attacks contributed */
  attack_ids: string[];
  /** Layer currently being targeted */
  current_layer: 'HOME_DEFENSES' | 'BODYGUARDS' | 'PLAYER_HP';
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  started_at: string;
  last_attack_at: string;
}

// ─────────────────────────────────────────────
// RECOMMENDED DEFENSE BY RANK
// (canon: high-value players have layered defenses)
// ─────────────────────────────────────────────

export const RECOMMENDED_DEFENSE_BY_ROLE: Record<FamilyRole | 'UNAFFILIATED', {
  bodyguards: BodyguardTier[];
  home_defenses: HomeDefenseId[];
  note: string;
}> = {
  BOSS: {
    bodyguards: ['ELITE', 'ELITE', 'PROFESSIONAL'],
    home_defenses: ['PANIC_ROOM', 'ARMED_PERIMETER', 'ALARM_SYSTEM', 'SECURITY_CAMERAS'],
    note: 'Maximum layered defense. Requires coordinated family assault to break.',
  },
  UNDERBOSS: {
    bodyguards: ['ELITE', 'PROFESSIONAL'],
    home_defenses: ['ARMED_PERIMETER', 'ALARM_SYSTEM', 'REINFORCED_DOOR'],
    note: 'Heavy defense. Multiple attackers needed.',
  },
  CONSIGLIERE: {
    bodyguards: ['PROFESSIONAL', 'PROFESSIONAL'],
    home_defenses: ['ALARM_SYSTEM', 'SECURITY_CAMERAS', 'REINFORCED_DOOR'],
    note: 'Moderate defense. Can be stripped by 2–3 coordinated attackers.',
  },
  CAPO: {
    bodyguards: ['PROFESSIONAL', 'STREET'],
    home_defenses: ['ALARM_SYSTEM', 'REINFORCED_DOOR'],
    note: 'Mid-tier defense. Vulnerable to a 2-person assault.',
  },
  SOLDIER: {
    bodyguards: ['STREET'],
    home_defenses: ['REINFORCED_DOOR'],
    note: 'Basic protection. One skilled attacker can get through.',
  },
  ASSOCIATE: {
    bodyguards: [],
    home_defenses: ['REINFORCED_DOOR'],
    note: 'Minimal defense. Vulnerable.',
  },
  RECRUIT: {
    bodyguards: [],
    home_defenses: [],
    note: 'No defense. Cannot be targeted for death attacks (protected status).',
  },
  UNAFFILIATED: {
    bodyguards: [],
    home_defenses: [],
    note: 'No defense. Solo and exposed.',
  },
};
