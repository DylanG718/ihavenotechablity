/**
 * pvpEngine.ts — Pure functions for PvP attack resolution.
 *
 * Core flow:
 *   1. computeDefenseProfile()  — build the layered defense stack for a target
 *   2. resolveAttack()          — roll dice, apply weapon vs defense, return outcome
 *   3. applyDamageToLayers()    — mutate layers, return what was hit/broken
 *
 * Layered defense order (HOME attack):
 *   [0] Home Defenses (sum HP + ratings)
 *   [1] Bodyguards    (sum HP + ratings)
 *   [2] Player HP
 *
 * Layered defense order (STREET attack):
 *   [0] Bodyguards
 *   [1] Player HP
 *
 * Family coordinated assault: multiple attackers share damage against the same
 * CoordinatedAssault record, chipping through layers over time.
 */

import type {
  WeaponId, WeaponDef, AttackContext, AttackOutcome,
  AttackRecord, PlayerDefenseProfile, DefenseLayer,
  PlayerBodyguard, PlayerHomeDefense, CoordinatedAssault,
} from '../../../shared/pvp';
import { WEAPONS, BODYGUARD_DEFS, HOME_DEFENSE_DEFS } from '../../../shared/pvp';
import type { PlayerStats, FamilyRole } from '../../../shared/schema';

// ─────────────────────────────────────────────
// Defense profile builder
// ─────────────────────────────────────────────

export function computeDefenseProfile(params: {
  player_id: string;
  player_alias: string;
  role: FamilyRole | 'UNAFFILIATED';
  player_hp: number;
  max_player_hp: number;
  is_home: boolean;
  bodyguards: PlayerBodyguard[];
  home_defenses: PlayerHomeDefense[];
}): PlayerDefenseProfile {
  const { is_home, bodyguards, home_defenses } = params;

  const layers: DefenseLayer[] = [];

  // Layer 0: Home defenses (only if at home)
  if (is_home && home_defenses.length > 0) {
    const active = home_defenses.filter(d => d.status !== 'DESTROYED');
    if (active.length > 0) {
      const totalHp  = active.reduce((s, d) => s + d.current_hp, 0);
      const maxHp    = active.reduce((s, d) => s + HOME_DEFENSE_DEFS[d.defense_id].max_hp, 0);
      const totalRating = active.reduce((s, d) => s + HOME_DEFENSE_DEFS[d.defense_id].defense_rating, 0);
      layers.push({
        label: 'Home Defenses',
        current_hp: totalHp,
        max_hp: maxHp,
        defense_rating: totalRating,
        components: active.map(d => ({
          name: HOME_DEFENSE_DEFS[d.defense_id].name,
          hp: d.current_hp,
          max_hp: HOME_DEFENSE_DEFS[d.defense_id].max_hp,
          rating: HOME_DEFENSE_DEFS[d.defense_id].defense_rating,
        })),
      });
    }
  }

  // Layer 1: Bodyguards
  const activeGuards = bodyguards.filter(g => g.status !== 'DEAD');
  if (activeGuards.length > 0) {
    const totalHp  = activeGuards.reduce((s, g) => s + g.current_hp, 0);
    const maxHp    = activeGuards.reduce((s, g) => s + BODYGUARD_DEFS[g.tier].max_hp, 0);
    const totalRating = activeGuards.reduce((s, g) => {
      const base = BODYGUARD_DEFS[g.tier].defense_rating;
      return s + (g.status === 'INJURED' ? Math.floor(base * 0.5) : base);
    }, 0);
    layers.push({
      label: 'Bodyguards',
      current_hp: totalHp,
      max_hp: maxHp,
      defense_rating: totalRating,
      components: activeGuards.map(g => ({
        name: `${BODYGUARD_DEFS[g.tier].name}${g.status === 'INJURED' ? ' (Injured)' : ''}`,
        hp: g.current_hp,
        max_hp: BODYGUARD_DEFS[g.tier].max_hp,
        rating: g.status === 'INJURED' ? Math.floor(BODYGUARD_DEFS[g.tier].defense_rating * 0.5) : BODYGUARD_DEFS[g.tier].defense_rating,
      })),
    });
  }

  return {
    player_id: params.player_id,
    player_alias: params.player_alias,
    role: params.role,
    is_home: params.is_home,
    layers,
    player_hp: params.player_hp,
    max_player_hp: params.max_player_hp,
  };
}

// ─────────────────────────────────────────────
// Total defense score (used for attack resolution)
// ─────────────────────────────────────────────

export function totalDefenseRating(profile: PlayerDefenseProfile): number {
  return profile.layers.reduce((s, l) => s + l.defense_rating, 0);
}

export function activeLayerIndex(profile: PlayerDefenseProfile): number {
  for (let i = 0; i < profile.layers.length; i++) {
    if (profile.layers[i].current_hp > 0) return i;
  }
  return -1; // All layers depleted — player HP exposed
}

// ─────────────────────────────────────────────
// Attack resolution
// ─────────────────────────────────────────────

function roll(): number { return Math.random(); }

export interface AttackResolution {
  outcome: AttackOutcome;
  weapon: WeaponDef;
  damage_dealt: number;
  layer_hit: AttackRecord['layer_hit'];
  /** Updated defense profile after damage applied */
  updated_profile: PlayerDefenseProfile;
  heat_added: number;
  suspicion_added: number;
  family_alerted: boolean;
  notes: string;
}

export function resolveAttack(params: {
  weapon_id: WeaponId;
  attacker_stats: Partial<PlayerStats>;
  target_profile: PlayerDefenseProfile;
  context: AttackContext;
  /** Accuracy bonus from planning (0-20) */
  planning_bonus?: number;
}): AttackResolution {
  const weapon = WEAPONS[params.weapon_id];

  // ── 1. Hit or miss ───────────────────────────────
  const accMod = ((params.attacker_stats.accuracy ?? 50) - 50) * 0.003;
  const planBonus = (params.planning_bonus ?? 0) / 100;
  const hitChance = Math.max(0.05, Math.min(0.98,
    weapon.base_accuracy / 100 + accMod + planBonus
  ));

  if (roll() > hitChance) {
    // Miss — some heat from noise, no damage
    return {
      outcome: 'ATTACK_MISSED', weapon,
      damage_dealt: 0, layer_hit: 'HOME_DEFENSES',
      updated_profile: params.target_profile,
      heat_added: weapon.heat_on_fail,
      suspicion_added: weapon.creates_noise ? 10 : 3,
      family_alerted: weapon.creates_noise,
      notes: `${weapon.name} missed entirely. ${weapon.creates_noise ? 'Noise reported.' : 'No witnesses.'}`,
    };
  }

  // ── 2. Calculate raw damage ──────────────────────
  const strMod = ((params.attacker_stats.strength ?? 50) - 50) * 0.004;
  const rawDamage = Math.round(weapon.base_damage * (1 + strMod) * (0.8 + roll() * 0.4));

  // ── 3. Find active layer ─────────────────────────
  const profile = JSON.parse(JSON.stringify(params.target_profile)) as PlayerDefenseProfile;
  const layerIdx = activeLayerIndex(profile);

  // ── 4a. All layers depleted → hit player HP ──────
  if (layerIdx === -1) {
    const defBonus = 0; // No active defense
    const finalDamage = Math.max(1, rawDamage - defBonus);
    const prevHp = profile.player_hp;
    profile.player_hp = Math.max(0, profile.player_hp - finalDamage);
    const killed = profile.player_hp === 0;

    return {
      outcome: killed ? 'PLAYER_KILLED' : 'PLAYER_INJURED',
      weapon, damage_dealt: finalDamage, layer_hit: 'PLAYER_HP',
      updated_profile: profile,
      heat_added: weapon.heat_on_use + (killed ? 30 : 10),
      suspicion_added: weapon.creates_noise ? 20 : 8,
      family_alerted: true,
      notes: killed
        ? `${weapon.name} — target HP reduced to 0. Player down.`
        : `${weapon.name} — ${finalDamage} damage to player HP (${profile.player_hp}/${profile.max_player_hp} remaining).`,
    };
  }

  // ── 4b. Hit the active layer ─────────────────────
  const layer = profile.layers[layerIdx];
  const defMod = layer.defense_rating / 100;
  const finalDamage = Math.max(1, Math.round(rawDamage * (1 - defMod * 0.4)));
  const prevHp = layer.current_hp;
  layer.current_hp = Math.max(0, layer.current_hp - finalDamage);
  const layerDestroyed = layer.current_hp === 0;
  const layerLabel = layerIdx === 0 && profile.is_home ? 'HOME_DEFENSES' : 'BODYGUARDS';

  // Repelled: defense was so high that attacker took damage
  const wasRepelled = defMod > 0.8 && roll() < 0.3;

  if (wasRepelled) {
    return {
      outcome: 'ATTACK_REPELLED', weapon, damage_dealt: 0, layer_hit: layerLabel,
      updated_profile: profile,
      heat_added: weapon.heat_on_use + weapon.heat_on_fail,
      suspicion_added: 15,
      family_alerted: true,
      notes: `Attack repelled by heavy defense. ${layer.label} defense rating overwhelmed the assault.`,
    };
  }

  return {
    outcome: layerDestroyed ? 'LAYER_DESTROYED' : 'LAYER_DAMAGED',
    weapon, damage_dealt: finalDamage, layer_hit: layerLabel,
    updated_profile: profile,
    heat_added: weapon.heat_on_use,
    suspicion_added: weapon.creates_noise ? 8 : 2,
    family_alerted: weapon.creates_noise || layerDestroyed,
    notes: layerDestroyed
      ? `${layer.label} fully breached. Next layer now exposed.`
      : `${weapon.name} dealt ${finalDamage} damage to ${layer.label} (${layer.current_hp}/${layer.max_hp} HP remaining).`,
  };
}

// ─────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────

export function outcomeColor(outcome: AttackOutcome): string {
  switch (outcome) {
    case 'PLAYER_KILLED':
    case 'LAYER_DESTROYED':       return '#cc3333';
    case 'PLAYER_INJURED':
    case 'LAYER_DAMAGED':         return '#cc9900';
    case 'ATTACK_REPELLED':
    case 'ATTACK_FAILED_NOTICED':
    case 'ATTACK_MISSED':         return '#4a9a4a';
  }
}

export function outcomeLabel(outcome: AttackOutcome): string {
  switch (outcome) {
    case 'PLAYER_KILLED':         return 'Target Down';
    case 'PLAYER_INJURED':        return 'Target Injured';
    case 'LAYER_DESTROYED':       return 'Layer Breached';
    case 'LAYER_DAMAGED':         return 'Layer Damaged';
    case 'ATTACK_REPELLED':       return 'Attack Repelled';
    case 'ATTACK_FAILED_NOTICED': return 'Identified';
    case 'ATTACK_MISSED':         return 'Missed';
  }
}

export function weaponCategoryColor(cat: 'MELEE' | 'FIREARM'): string {
  return cat === 'FIREARM' ? '#cc3333' : '#cc9900';
}

export function heatRating(weapon: WeaponDef): 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' {
  const total = weapon.heat_on_use + weapon.heat_on_fail;
  if (total < 10)  return 'LOW';
  if (total < 30)  return 'MEDIUM';
  if (total < 60)  return 'HIGH';
  return 'EXTREME';
}

export function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}
