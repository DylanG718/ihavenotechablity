/**
 * GAME LOGIC STUBS — spec aligned
 *
 * All outcome types now use spec-aligned names:
 *   ContractOutcome: SUCCESS_CLEAN / SUCCESS_MESSY / FAILED_UNTRACED / FAILED_TRACED / CATASTROPHIC_BLOWBACK
 *   DowntimeActivityType: SURVEILLANCE / CLEANUP / SIDE_MERCENARY / TRAINING / INFORMANT_NETWORK / SAFEHOUSE
 *
 * Constants from schema:
 *   RETALIATION_WINDOW_DAYS = 7
 *   BLOWBACK_COMPENSATION_MULTIPLE = 2.0
 */

import type { PlayerStats, DowntimeActivityType, ContractOutcome } from '../../../shared/schema';
import { RETALIATION_WINDOW_DAYS, BLOWBACK_COMPENSATION_MULTIPLE } from '../../../shared/schema';

// ─────────────────────────────────────────────
// Mission outcome types
// ─────────────────────────────────────────────

export type MissionOutcomeResult = {
  outcome: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILURE' | 'COMPROMISED';
  payoutActual: number;
  heatDelta: number;
  suspicionDelta: number;
  respectDelta: number;
  arrests: string[];
  hitmanImpact: string | null;
  notes: string;
};

// ─────────────────────────────────────────────
// Contract outcome types — spec-aligned
// ─────────────────────────────────────────────

export type ContractOutcomeResult = {
  outcome: ContractOutcome;  // spec: success_clean / success_messy / failed_untraced / failed_traced / catastrophic_blowback
  payoutActual: number;
  heatDelta: number;
  suspicionDelta: number;
  repDelta: number;
  traced: boolean;
  // Spec: economy_effect.target_family_receives_total_compensation_multiple = BLOWBACK_COMPENSATION_MULTIPLE
  blowbackCompensation: number;
  // Spec: retaliation_window_days = RETALIATION_WINDOW_DAYS
  retaliationWindowDays: number;
  notes: string;
};

export type PrisonActionResult = {
  success: boolean;
  heatDelta: number;
  repDelta: number;
  sentenceDeltaDays: number;
  notes: string;
};

export type DowntimeOutcome = {
  cashEarned: number;
  repDelta: number;
  heatDelta: number;
  suspicionDelta: number;
  readinessDelta: number;
  intelDelta: number;
  nextContractBonus: string | null;
  notes: string;
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function roll(): number { return Math.random(); }

/** TODO: replace with real stat-weighted formula */
function calcSuccessChance(base: number, stats: Partial<PlayerStats>, keys: (keyof PlayerStats)[]): number {
  let mod = 0;
  for (const k of keys) mod += ((stats[k] as number ?? 50) - 50) * 0.003;
  return Math.max(0.05, Math.min(0.95, base + mod));
}

// ─────────────────────────────────────────────
// Mission resolution
// ─────────────────────────────────────────────

/** TODO: plug real combat/economy formulas here */
export function resolveMission(params: {
  missionTier: 'STARTER' | 'STANDARD' | 'ADVANCED' | 'ELITE';
  basePayout: number;
  leadStats: Partial<PlayerStats>;
  memberCount: number;
  hasHitmanSlot: boolean;
  hitmanAccuracy?: number;
}): MissionOutcomeResult {
  const tierBase: Record<string, number> = { STARTER: 0.82, STANDARD: 0.68, ADVANCED: 0.52, ELITE: 0.38 };
  const tierHeat: Record<string, number> = { STARTER: 5, STANDARD: 15, ADVANCED: 28, ELITE: 50 };

  let successChance = calcSuccessChance(tierBase[params.missionTier] ?? 0.60, params.leadStats, ['intelligence','leadership','strength']);
  let hitmanImpact: string | null = null;

  if (params.hasHitmanSlot && params.hitmanAccuracy !== undefined) {
    const bonus = (params.hitmanAccuracy / 100) * 0.12;
    successChance = Math.min(0.95, successChance + bonus);
    hitmanImpact = `Hitman specialist improved success chance by ${Math.round(bonus * 100)}%.`;
  }

  const r = roll();
  let outcome: MissionOutcomeResult['outcome'];
  let payoutActual = 0, heatDelta = tierHeat[params.missionTier] ?? 20;
  let suspicionDelta = 0, respectDelta = 0;
  const arrests: string[] = [];
  let notes = '';

  if (r < successChance * 0.75) {
    outcome = 'SUCCESS'; payoutActual = params.basePayout; respectDelta = 10;
    heatDelta = Math.floor(heatDelta * 0.6);
    notes = 'Clean execution. Full payout secured.';
  } else if (r < successChance) {
    outcome = 'PARTIAL_SUCCESS'; payoutActual = Math.floor(params.basePayout * 0.6);
    respectDelta = 4; suspicionDelta = 10;
    notes = 'Mission succeeded with complications. Reduced payout.';
    arrests.push('Wheelman');
  } else if (r < successChance + 0.15) {
    outcome = 'FAILURE'; heatDelta = Math.floor(heatDelta * 1.5); suspicionDelta = 15; respectDelta = -5;
    notes = 'Mission failed. No payout. Heat spike.';
  } else {
    outcome = 'COMPROMISED'; heatDelta = heatDelta * 2; suspicionDelta = 25; respectDelta = -10;
    arrests.push('Lead', 'Enforcer');
    notes = 'Mission blown. Multiple arrests. Major heat spike.';
  }

  return { outcome, payoutActual, heatDelta, suspicionDelta, respectDelta, arrests, hitmanImpact, notes };
}

// ─────────────────────────────────────────────
// Contract resolution — spec-aligned outcomes
// ─────────────────────────────────────────────

/** TODO: replace with real contract difficulty logic */
export function resolveContract(params: {
  difficulty: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  hitmanStats: Partial<PlayerStats>;
  contractPrice: number;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  secrecy: 'LOW' | 'MEDIUM' | 'HIGH';
}): ContractOutcomeResult {
  const diffBase: Record<string, number> = { LOW: 0.85, MEDIUM: 0.68, HIGH: 0.50, EXTREME: 0.30 };

  // TODO: replace with real heat/trace calculations
  const traceBase: Record<string, number> = { LOW: 0.05, MEDIUM: 0.15, HIGH: 0.28, EXTREME: 0.45 };
  const traceMod = params.secrecy === 'LOW' ? 1.5 : params.secrecy === 'HIGH' ? 0.5 : 1.0;

  const successChance = calcSuccessChance(diffBase[params.difficulty] ?? 0.60, params.hitmanStats, ['accuracy','intelligence','luck']);
  const traced = roll() < (traceBase[params.difficulty] ?? 0.15) * traceMod;
  const r = roll();

  if (r < successChance * 0.80) {
    return {
      outcome: 'SUCCESS_CLEAN',                // spec: success_clean
      payoutActual: params.contractPrice,
      heatDelta: -5, suspicionDelta: 5, repDelta: 15, traced: false,
      blowbackCompensation: 0, retaliationWindowDays: 0,
      notes: 'Clean hit. No trace. Full payment.',
    };
  } else if (r < successChance) {
    return {
      outcome: 'SUCCESS_MESSY',                // spec: success_messy
      payoutActual: Math.floor(params.contractPrice * 0.85),
      heatDelta: 15, suspicionDelta: 12, repDelta: 8, traced,
      blowbackCompensation: 0, retaliationWindowDays: 0,
      notes: 'Hit succeeded but left evidence. Reduced rep gain.',
    };
  } else if (!traced) {
    return {
      outcome: 'FAILED_UNTRACED',              // spec: failed_untraced
      payoutActual: 0,
      heatDelta: 25, suspicionDelta: 20, repDelta: -10, traced: false,
      blowbackCompensation: 0, retaliationWindowDays: 0,
      notes: 'Contract failed. Target alerted. Your alias is now known to the target.',
    };
  } else if (traced) {
    // Spec: on_failed_traced.economy_effect
    const compensation = params.contractPrice * BLOWBACK_COMPENSATION_MULTIPLE;
    const r2 = roll();
    // ~15% chance of catastrophic blowback on traced failure
    if (r2 < 0.15) {
      return {
        outcome: 'CATASTROPHIC_BLOWBACK',        // spec: catastrophic_blowback
        payoutActual: 0,
        heatDelta: 80, suspicionDelta: 60, repDelta: -50, traced: true,
        blowbackCompensation: compensation * 2,  // double on catastrophic
        retaliationWindowDays: RETALIATION_WINDOW_DAYS,
        notes: `CATASTROPHIC. Target survives, hiring family exposed, hitman sent to The Box. Double blowback: $${(compensation * 2).toLocaleString()} paid. ${RETALIATION_WINDOW_DAYS}-day retaliation window active.`,
      };
    }
    return {
      outcome: 'FAILED_TRACED',                // spec: failed_traced
      payoutActual: 0,
      heatDelta: 50, suspicionDelta: 40, repDelta: -25, traced: true,
      blowbackCompensation: compensation,      // spec: target_family_receives × 2.0
      retaliationWindowDays: RETALIATION_WINDOW_DAYS, // spec: 7 days
      notes: `Traced. Hiring family exposed. Target receives $${compensation.toLocaleString()} blowback (${BLOWBACK_COMPENSATION_MULTIPLE}× contract value). ${RETALIATION_WINDOW_DAYS}-day retaliation window activated.`,
    };
  } else {
    // failed, untraced — already handled above but adding else branch for exhaustiveness
    return {
      outcome: 'FAILED_UNTRACED',
      payoutActual: 0,
      heatDelta: 25, suspicionDelta: 20, repDelta: -10, traced: false,
      blowbackCompensation: 0, retaliationWindowDays: 0,
      notes: 'Contract failed. Target alerted. Your alias is now known to the target.',
    };
  }
}

// ─────────────────────────────────────────────
// Prison actions
// ─────────────────────────────────────────────

/** TODO: replace with real sentence/heat formulas */
export function resolvePrisonAction(
  action: 'BRIBE' | 'STAY_SILENT' | 'CLEANUP_WORK' | 'COOPERATE',
  currentHeat: number,
  currentSentenceDays: number,
): PrisonActionResult {
  switch (action) {
    case 'BRIBE':
      return { success: roll() > 0.35, heatDelta: +5, repDelta: -3, sentenceDeltaDays: -currentSentenceDays, notes: 'Guard bribed. Early release. Heat penalty applied.' };
    case 'STAY_SILENT':
      return { success: true, heatDelta: -8, repDelta: +2, sentenceDeltaDays: 0, notes: 'Stayed silent. Trace risk reduced. Reputation preserved.' };
    case 'CLEANUP_WORK':
      return { success: roll() > 0.20, heatDelta: -3, repDelta: +5, sentenceDeltaDays: -1, notes: 'Prison work complete. Sentence −1 day. Small rep gain.' };
    case 'COOPERATE':
      return { success: true, heatDelta: -15, repDelta: -20, sentenceDeltaDays: -Math.floor(currentSentenceDays * 0.5), notes: 'Cooperated. Sentence halved. Reputation takes major damage.' };
  }
}

// ─────────────────────────────────────────────
// Downtime resolution — spec-aligned activity IDs
// ─────────────────────────────────────────────

/** TODO: plug in real stat scaling and duration-based rewards */
export function resolveDowntime(
  activity: DowntimeActivityType,
  hitmanStats: Partial<PlayerStats>,
): DowntimeOutcome {
  const outcomes: Record<DowntimeActivityType, DowntimeOutcome> = {
    SURVEILLANCE: {       // spec: surveillance
      cashEarned: 18000, repDelta: 8, heatDelta: 0, suspicionDelta: 2,
      readinessDelta: 5, intelDelta: 25,
      nextContractBonus: '+15% scouting speed on next contract',
      notes: 'Target routine mapped. Intel filed. Scouting bonus unlocked.',
    },
    CLEANUP: {            // spec: cleanup
      cashEarned: 22000, repDelta: 12, heatDelta: -20, suspicionDelta: -10,
      readinessDelta: 0, intelDelta: 0,
      nextContractBonus: null,
      notes: 'Scene sanitized. Heat reduced. Trace eliminated.',
    },
    SIDE_MERCENARY: {     // spec: side_mercenary
      cashEarned: 55000, repDelta: 18, heatDelta: +8, suspicionDelta: +5,
      readinessDelta: 10, intelDelta: 0,
      nextContractBonus: null,
      notes: 'Protection detail complete. Good pay, minor heat.',
    },
    TRAINING: {           // spec: training
      cashEarned: 0, repDelta: 3, heatDelta: 0, suspicionDelta: 0,
      readinessDelta: 30, intelDelta: 0,
      nextContractBonus: '+10% accuracy on next execution phase',
      notes: 'Live-fire conditioning complete. Readiness improved.',
    },
    INFORMANT_NETWORK: {  // spec: informant_network
      cashEarned: 8000, repDelta: 6, heatDelta: +5, suspicionDelta: +3,
      readinessDelta: 0, intelDelta: 40,
      nextContractBonus: '+20% intel on next scouting phase',
      notes: 'Source cultivated. Intel network expanded.',
    },
    SAFEHOUSE: {          // spec: safehouse
      cashEarned: -30000, repDelta: 0, heatDelta: -15, suspicionDelta: -8,
      readinessDelta: 40, intelDelta: 8,
      nextContractBonus: '-25% prison time if caught on next contract',
      notes: 'Safe house hardened. Emergency egress updated. Trace risk reduced.',
    },
  };

  return outcomes[activity] ?? { cashEarned: 0, repDelta: 0, heatDelta: 0, suspicionDelta: 0, readinessDelta: 0, intelDelta: 0, nextContractBonus: null, notes: 'Activity complete.' };
}
