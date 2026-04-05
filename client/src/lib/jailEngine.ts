/**
 * jailEngine.ts — Pure functions for the prison system.
 *
 * All functions are side-effect free.
 * In production these run server-side; here they run on mock data.
 *
 * Key exports:
 *   computeArrestChance()   — probability roll after mission failure
 *   computeSentenceHours()  — wall-clock sentence based on tier + heat
 *   resolveJailAction()     — apply a player's prison action
 *   formatSentenceRemaining() — countdown display string
 *   isActionAvailable()     — check if player can use an action
 */

import type { JailRecord, JailActionType, JailActionResult, JailActionDef, JailTier } from '../../../shared/jail';
import { JAIL_ACTIONS, computeArrestChance, computeSentenceHours, jailTierFromMissionTier } from '../../../shared/jail';
import type { MissionTier, FamilyRole } from '../../../shared/schema';

// ─────────────────────────────────────────────
// Re-export shared formula for UI use
// ─────────────────────────────────────────────

export { computeArrestChance, computeSentenceHours, jailTierFromMissionTier };

// ─────────────────────────────────────────────
// Arrest chance breakdown (for "why did I get arrested" display)
// ─────────────────────────────────────────────

export interface ArrestBreakdown {
  base: number;
  rankReduction: number;
  heatBonus: number;
  final: number;
  label: string;      // e.g. "38% arrest risk"
}

export function getArrestBreakdown(params: {
  tier: MissionTier;
  role: FamilyRole | 'UNAFFILIATED';
  familyHeat: number;
}): ArrestBreakdown {
  const { BASE_ARREST_CHANCE, RANK_ARREST_REDUCTION, heatArrестBonus } = require('../../../shared/jail');
  const base         = BASE_ARREST_CHANCE[params.tier] as number;
  const rankReduction = RANK_ARREST_REDUCTION[params.role] as number ?? 0;
  const heatBonus    = heatArrестBonus(params.familyHeat) as number;
  const final        = Math.max(0.02, Math.min(0.95, base - rankReduction + heatBonus));
  return {
    base, rankReduction, heatBonus, final,
    label: `${Math.round(final * 100)}% arrest risk`,
  };
}

// ─────────────────────────────────────────────
// Sentence display helpers
// ─────────────────────────────────────────────

export function sentenceEndsAt(record: JailRecord): Date {
  const base = new Date(record.sentence_ends_at).getTime();
  return new Date(base + record.sentence_delta_hours * 3_600_000);
}

export function formatSentenceRemaining(record: JailRecord): string {
  const ends = sentenceEndsAt(record).getTime();
  const diff = ends - Date.now();
  if (diff <= 0) return 'Sentence served';
  const hours = Math.floor(diff / 3_600_000);
  const mins  = Math.floor((diff % 3_600_000) / 60_000);
  if (hours === 0) return `${mins}m remaining`;
  return `${hours}h ${mins}m remaining`;
}

export function sentenceProgress(record: JailRecord): number {
  const start = new Date(record.arrested_at).getTime();
  const end   = sentenceEndsAt(record).getTime();
  const now   = Date.now();
  if (now >= end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

export function isReleaseEligible(record: JailRecord): boolean {
  return sentenceEndsAt(record).getTime() <= Date.now();
}

// ─────────────────────────────────────────────
// Action availability
// ─────────────────────────────────────────────

export function isActionAvailable(
  action: JailActionDef,
  record: JailRecord,
  lastUsed: Record<JailActionType, string | null>,
): { available: boolean; reason?: string } {
  // Tier check
  if (!action.available_tiers.includes(record.tier)) {
    return { available: false, reason: `Not available in ${record.tier} custody` };
  }

  // Status check
  if (record.status !== 'SERVING') {
    return { available: false, reason: record.status === 'PROCESSING'
      ? 'Still in processing — wait 1 hour'
      : 'Already released'
    };
  }

  // Rate limits
  if (action.id === 'BRIBE_GUARD' && record.bribe_attempts >= 2) {
    return { available: false, reason: 'Max bribe attempts reached (2/2)' };
  }
  if (action.id === 'HIRE_LAWYER' && record.lawyer_attempts >= 3) {
    return { available: false, reason: 'Max lawyer hires reached (3/3)' };
  }
  if (action.id === 'REQUEST_BAIL' && record.bail_mission_active) {
    return { available: false, reason: 'Bail mission already running' };
  }

  // Cooldown check
  if (action.cooldown_hours > 0 && lastUsed[action.id]) {
    const cooldownEnds = new Date(lastUsed[action.id]!).getTime() + action.cooldown_hours * 3_600_000;
    if (Date.now() < cooldownEnds) {
      const left = Math.ceil((cooldownEnds - Date.now()) / 60_000);
      return { available: false, reason: `Cooldown: ${left < 60 ? `${left}m` : `${Math.ceil(left/60)}h`} remaining` };
    }
  }

  return { available: true };
}

// ─────────────────────────────────────────────
// Action resolution
// ─────────────────────────────────────────────

function roll(): number { return Math.random(); }

export function resolveJailAction(
  action: JailActionType,
  record: JailRecord,
  playerCash: number,
): JailActionResult {
  switch (action) {
    case 'LAY_LOW':
      return {
        success: true, action,
        sentence_delta_hours: 0,
        heat_delta: -5,
        cash_gained: 0,
        rep_delta: 2,
        notes: 'Kept a low profile. Heat reduced slightly. Rep preserved.',
        released: false,
      };

    case 'PRISON_JOBS':
      const jobPay = Math.floor(2000 + roll() * 6000);
      return {
        success: true, action,
        sentence_delta_hours: -1,
        heat_delta: 0,
        cash_gained: jobPay,
        rep_delta: 1,
        notes: `Work detail complete. Earned $${jobPay.toLocaleString()}. Sentence −1 hour.`,
        released: false,
      };

    case 'BRIBE_GUARD': {
      const bribeSuccess = roll() < 0.60;
      if (bribeSuccess) {
        return {
          success: true, action,
          sentence_delta_hours: -999,   // signals full release
          heat_delta: +10,
          cash_gained: -40000,
          rep_delta: -2,
          notes: 'Guard took the money. You\'re out — but you\'re hot. Heat +10.',
          released: true,
        };
      }
      return {
        success: false, action,
        sentence_delta_hours: 0,
        heat_delta: +5,
        cash_gained: -40000,   // money lost even on failure
        rep_delta: -5,
        notes: 'Guard took the money then reported you anyway. Funds gone. Heat up. No release.',
        released: false,
      };
    }

    case 'HIRE_LAWYER': {
      const reduction = Math.floor(3 + roll() * 4); // 3–6 hours
      return {
        success: true, action,
        sentence_delta_hours: -reduction,
        heat_delta: 0,
        cash_gained: -25000,
        rep_delta: 0,
        notes: `Lawyer negotiated a deal. Sentence reduced by ${reduction} hours.`,
        released: false,
      };
    }

    case 'REQUEST_BAIL':
      return {
        success: true, action,
        sentence_delta_hours: 0,
        heat_delta: 0,
        cash_gained: 0,
        rep_delta: 0,
        notes: 'Kite sent to family leadership. Bail mission posted — watch for their progress.',
        released: false,
      };

    default:
      return {
        success: false, action,
        sentence_delta_hours: 0,
        heat_delta: 0,
        cash_gained: 0,
        rep_delta: 0,
        notes: 'Unknown action.',
        released: false,
      };
  }
}

// ─────────────────────────────────────────────
// Jail tier display
// ─────────────────────────────────────────────

export function jailTierLabel(tier: JailTier): string {
  switch (tier) {
    case 'COUNTY':  return 'County Lockup';
    case 'STATE':   return 'State Penitentiary';
    case 'FEDERAL': return 'Federal Detention';
  }
}

export function jailTierColor(tier: JailTier): string {
  switch (tier) {
    case 'COUNTY':  return '#cc9900';
    case 'STATE':   return '#cc7700';
    case 'FEDERAL': return '#cc3333';
  }
}

export function jailStatusLabel(status: JailRecord['status']): string {
  switch (status) {
    case 'PROCESSING':       return 'Processing';
    case 'SERVING':          return 'Serving Sentence';
    case 'RELEASE_ELIGIBLE': return 'Release Eligible';
    case 'RELEASED':         return 'Released';
  }
}
