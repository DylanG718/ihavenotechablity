/**
 * analyticsEngine.ts — Lightweight analytics client.
 *
 * In-memory session store + DEV console logging.
 * When Supabase is configured, events are also written to
 * the `analytics_events` table (fire-and-forget, never throws).
 *
 * Usage:
 *   import { Analytics } from './analyticsEngine';
 *   Analytics.onboardingStarted('p-boss');
 *   Analytics.promotionGranted('p-boss', 'CAPO', 'UNDERBOSS');
 */

import type { AnalyticsEvent, AnalyticsEventName } from '../../../shared/ops';
import { trackEvent } from './supabaseClient';

// ─────────────────────────────────────────────
// Session store
// ─────────────────────────────────────────────

const sessionEvents: AnalyticsEvent[] = [];

// ─────────────────────────────────────────────
// Core track function
// ─────────────────────────────────────────────

function track(
  event: AnalyticsEventName,
  playerId: string,
  properties: Record<string, string | number | boolean | null> = {},
  context: {
    familyId?: string | null;
    familyRole?: string | null;
    districtId?: string | null;
    entityId?: string | null;
    entityType?: string | null;
  } = {}
): void {
  const entry: AnalyticsEvent = {
    event,
    playerId,
    familyId: context.familyId ?? null,
    familyRole: context.familyRole ?? null,
    districtId: context.districtId ?? null,
    entityId: context.entityId ?? null,
    entityType: context.entityType ?? null,
    properties,
    timestamp: new Date().toISOString(),
  };

  sessionEvents.push(entry);

  // DEV console log
  if (import.meta.env.DEV) {
    console.log(`[analytics] ${event}`, {
      playerId,
      ...properties,
      ...(context.familyId ? { familyId: context.familyId } : {}),
      ts: entry.timestamp,
    });
  }

  // Persist to Supabase (fire-and-forget, never throws)
  trackEvent(event, { ...properties, playerId }, {
    familyId:   context.familyId   ?? undefined,
    districtId: context.districtId ?? undefined,
    entityId:   context.entityId   ?? undefined,
    entityType: context.entityType ?? undefined,
  }).catch(() => { /* intentionally silent */ });
}

// ─────────────────────────────────────────────
// Session accessors
// ─────────────────────────────────────────────

/** Returns all events tracked in the current session */
export function getSessionEvents(): AnalyticsEvent[] {
  return [...sessionEvents];
}

/** Outputs a summary of session events to the console */
export function flushToLog(): void {
  const counts = sessionEvents.reduce<Record<string, number>>((acc, e) => {
    acc[e.event] = (acc[e.event] ?? 0) + 1;
    return acc;
  }, {});

  console.group('[analytics] Session Flush');
  console.log('Total events:', sessionEvents.length);
  console.table(counts);
  console.log('Raw events:', sessionEvents);
  console.groupEnd();
}

// ─────────────────────────────────────────────
// Typed event wrappers
// ─────────────────────────────────────────────

export const Analytics = {
  // Fired when user opens the signup form
  signupStarted: (playerId: string) =>
    track('signup_started', playerId, {}),

  // Fired when account is successfully created
  accountCreated: (playerId: string, archetype: string) =>
    track('account_created', playerId, { archetype }),

  // Fired when user completes sign-in
  loginCompleted: (playerId: string) =>
    track('login_completed', playerId, {}),
  // Archetype events
  archetypeSelected: (playerId: string, archetype: string) =>
    track('archetype_selected', playerId, { archetype }),

  archetypePreviewed: (playerId: string, archetype: string) =>
    track('archetype_previewed', playerId, { archetype }),

  runnerSelected: (playerId: string) =>
    track('runner_selected', playerId, {}),

  // Onboarding branching
  familyPathSelected: (playerId: string, path: 'standard' | 'founder') =>
    track('family_path_selected', playerId, { path }),

  familyCreationPathChosen: (playerId: string) =>
    track('family_creation_path_chosen', playerId, {}),

  familyCreationStarted: (playerId: string) =>
    track('family_creation_started', playerId, {}),

  familyCreationCompleted: (playerId: string, familyName: string) =>
    track('family_creation_completed', playerId, { familyName }),

  founderOnboardingStepCompleted: (playerId: string, step: string) =>
    track('founder_onboarding_step_completed', playerId, { step }),

  founderOnboardingCompleted: (playerId: string) =>
    track('founder_onboarding_completed', playerId, {}),

  onboardingCompleted: (playerId: string, path: string) =>
    track('onboarding_completed', playerId, { path }),

  onboardingAbandoned: (playerId: string, step: string) =>
    track('onboarding_abandoned_at_step', playerId, { step }),

  // Family lifecycle
  familyCreated: (playerId: string, familyId: string, familyName: string) =>
    track('family_created', playerId, { familyId, familyName }),

  underbossRecruited: (playerId: string, familyId: string) =>
    track('underboss_recruited', playerId, { familyId }),

  consilgiereRecruited: (playerId: string, familyId: string) =>
    track('consigliere_recruited', playerId, { familyId }),

  familyProtectionStarted: (playerId: string, familyId: string, expiresAt: string) =>
    track('family_protection_started', playerId, { familyId, expiresAt }),

  familyProtectionExpired: (playerId: string, familyId: string) =>
    track('family_protection_expired', playerId, { familyId }),

  familyStabilized: (playerId: string, familyId: string) =>
    track('family_stabilized', playerId, { familyId }),

  familyBecameVulnerable: (playerId: string, familyId: string) =>
    track('family_became_vulnerable', playerId, { familyId }),

  // Inventory
  familyItemIssued: (playerId: string, familyId: string, itemId: string, toPlayerId: string) =>
    track('family_item_issued', playerId, { familyId, itemId, toPlayerId }),

  familyItemReturned: (playerId: string, familyId: string, itemId: string) =>
    track('family_item_returned', playerId, { familyId, itemId }),

  // Treasury
  treasuryDeposit: (playerId: string, familyId: string, amount: number) =>
    track('treasury_deposit', playerId, { familyId, amount }),

  treasuryWithdrawal: (playerId: string, familyId: string, amount: number) =>
    track('treasury_withdrawal', playerId, { familyId, amount }),

  taxRateChanged: (playerId: string, familyId: string, oldRate: number, newRate: number) =>
    track('treasury_tax_changed', playerId, { familyId, oldRate, newRate }),

  kickupChanged: (playerId: string, familyId: string, oldRate: number, newRate: number) =>
    track('kickup_changed', playerId, { familyId, oldRate, newRate }),

  // Fired when archetype is confirmed in onboarding
  archetypeSelected: (playerId: string, archetype: string) =>
    track('archetype_selected', playerId, { archetype }),

  // Fired when a job is run (non-onboarding)
  jobRun: (playerId: string, jobId: string, jobName: string, outcome: 'SUCCESS' | 'FAILURE', reward: number) =>
    track('job_run', playerId, { jobName, outcome, reward }, { entityId: jobId, entityType: 'job' }),

  // Fired when passive income payout is claimed
  payoutClaimed: (playerId: string, amount: number) =>
    track('payout_claimed', playerId, { amount }),

  // Fired when signup or onboarding encounters an error
  errorOccurred: (playerId: string, context: string, errorMessage: string) =>
    track('error_occurred', playerId, { context, errorMessage }),

  onboardingStarted: (playerId: string) =>
    track('onboarding_started', playerId, {}),

  onboardingStepCompleted: (playerId: string, step: string, timeSpentSeconds?: number) =>
    track('onboarding_step_completed', playerId, {
      step,
      ...(timeSpentSeconds != null ? { timeSpentSeconds } : {}),
    }),

  onboardingCompleted: (playerId: string, skipped: boolean) =>
    track('onboarding_completed', playerId, { skipped }),

  firstJobStarted: (playerId: string, jobId: string, jobName: string) =>
    track('first_job_started', playerId, { jobName }, { entityId: jobId, entityType: 'job' }),

  firstJobCompleted: (
    playerId: string,
    jobId: string,
    jobName: string,
    outcome: 'SUCCESS' | 'FAILURE',
    reward: number
  ) =>
    track('first_job_completed', playerId, { jobName, outcome, reward }, { entityId: jobId, entityType: 'job' }),

  familyApplied: (playerId: string, familyId: string, familyName: string) =>
    track('family_applied', playerId, { familyName }, { familyId, entityId: familyId, entityType: 'family' }),

  familyJoined: (playerId: string, familyId: string, familyRole: string) =>
    track('family_joined', playerId, { familyRole }, { familyId, familyRole, entityId: familyId, entityType: 'family' }),

  familyLeft: (playerId: string, familyId: string, reason: string) =>
    track('family_left', playerId, { reason }, { familyId, entityId: familyId, entityType: 'family' }),

  firstBusinessAssignment: (playerId: string, frontId: string, frontName: string, familyId: string) =>
    track('first_business_assignment', playerId, { frontName }, { familyId, entityId: frontId, entityType: 'front' }),

  firstPassiveIncomePayout: (playerId: string, amount: number, frontId: string, familyId: string) =>
    track('first_passive_income_payout', playerId, { amount }, { familyId, entityId: frontId, entityType: 'front' }),

  promotionEligible: (playerId: string, targetRank: string, familyId: string) =>
    track('promotion_eligible', playerId, { targetRank }, { familyId }),

  promotionGranted: (
    playerId: string,
    fromRank: string,
    toRank: string,
    reason: string,
    familyId: string
  ) =>
    track('promotion_granted', playerId, { fromRank, toRank, reason }, { familyId }),

  demotion: (playerId: string, fromRank: string, toRank: string, reason: string, familyId: string) =>
    track('demotion', playerId, { fromRank, toRank, reason }, { familyId }),

  jailEntered: (playerId: string, tier: string, reason: string, sentenceHours: number) =>
    track('jail_entered', playerId, { tier, reason, sentenceHours }),

  jailReleased: (playerId: string, tier: string, method: string) =>
    track('jail_released', playerId, { tier, method }),

  stashDeposit: (playerId: string, amount: number) =>
    track('stash_deposit', playerId, { amount }),

  stashWithdraw: (playerId: string, amount: number) =>
    track('stash_withdraw', playerId, { amount }),

  sleepModeEnabled: (playerId: string, durationHours: number) =>
    track('sleep_mode_enabled', playerId, { durationHours }),

  vacationModeEnabled: (playerId: string, durationHours: number) =>
    track('vacation_mode_enabled', playerId, { durationHours }),

  turfPurchased: (playerId: string, districtId: string, districtName: string, cost: number, familyId: string) =>
    track('turf_purchased', playerId, { districtName, cost }, { familyId, districtId, entityId: districtId, entityType: 'district' }),

  frontBuilt: (playerId: string, frontId: string, frontType: string, cost: number, districtId: string, familyId: string) =>
    track('front_built', playerId, { frontType, cost }, { familyId, districtId, entityId: frontId, entityType: 'front' }),

  frontUpgraded: (playerId: string, frontId: string, newTier: number, cost: number, familyId: string) =>
    track('front_upgraded', playerId, { newTier, cost }, { familyId, entityId: frontId, entityType: 'front' }),

  businessExclusiveJobCompleted: (playerId: string, jobId: string, frontId: string, earnings: number, familyId: string) =>
    track('business_exclusive_job_completed', playerId, { earnings }, { familyId, entityId: jobId, entityType: 'job' }),

  diplomaticActionProposed: (playerId: string, actionType: string, targetFamilyId: string, familyId: string) =>
    track('diplomatic_action_proposed', playerId, { actionType }, { familyId, entityId: targetFamilyId, entityType: 'family' }),

  diplomaticActionResolved: (playerId: string, actionType: string, outcome: string, targetFamilyId: string, familyId: string) =>
    track('diplomatic_action_resolved', playerId, { actionType, outcome }, { familyId, entityId: targetFamilyId, entityType: 'family' }),

  witnessProtectionStarted: (playerId: string) =>
    track('witness_protection_started', playerId, {}),

  witnessProtectionCompleted: (playerId: string) =>
    track('witness_protection_completed', playerId, {}),

  seasonSnapshotCreated: (playerId: string, seasonId: string, rank: number) =>
    track('season_snapshot_created', playerId, { seasonId, rank }, { entityId: seasonId, entityType: 'season' }),

  adminAction: (playerId: string, action: string, entityId: string | null, entityType: string | null) =>
    track('admin_action', playerId, { action }, { entityId, entityType }),
};

// Export core track for custom events
export { track };
