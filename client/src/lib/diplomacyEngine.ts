/**
 * diplomacyEngine.ts — Pure functions for all diplomacy logic.
 *
 * All functions are side-effect-free and take/return plain data.
 * In production, these run server-side; here they run in-browser on mock data.
 *
 * Systems:
 *   1. canTransitionState() — validates transitions (cooldown + influence)
 *   2. computeSnubEffects() — returns status effects to apply after a snub
 *   3. computePoliticalTags() — derives tags from active effects + history
 *   4. getRelationBetween() — looks up relation between two families
 *   5. canStartSitdown() — validates a new sitdown can be initiated
 *   6. advanceSitdown() — applies accept/decline/counter/timeout to sitdown
 *   7. computeInviteMultiplier() — already in diplomacy.ts, re-exported here
 *
 * DEV MODE:
 *   Pass devFastForward: true to skip time-based cooldowns for testing.
 */

import type {
  DiplomaticRelation, DiplomaticState, Sitdown, SitdownProposal,
  SitdownProposalType, FamilyStatusEffect, PoliticalTag, PoliticalTagId,
} from '../../../shared/diplomacy';
import {
  VALID_TRANSITIONS, MIN_STATE_HOURS, TRANSITION_INFLUENCE_COST,
  computeInviteMultiplier,
} from '../../../shared/diplomacy';
import {
  MOCK_RELATIONS, MOCK_SITDOWNS, MOCK_STATUS_EFFECTS, MOCK_POLITICAL_TAGS,
} from './diplomacyMockData';

// ─────────────────────────────────────────────
// 1. Relation lookup
// ─────────────────────────────────────────────

/** Returns the relation between two families (order-independent). */
export function getRelationBetween(
  famA: string, famB: string,
  relations: DiplomaticRelation[] = MOCK_RELATIONS,
): DiplomaticRelation | null {
  return relations.find(r =>
    (r.family_a_id === famA && r.family_b_id === famB) ||
    (r.family_a_id === famB && r.family_b_id === famA)
  ) ?? null;
}

/** Get all relations for a given family. */
export function getRelationsForFamily(
  familyId: string,
  relations: DiplomaticRelation[] = MOCK_RELATIONS,
): DiplomaticRelation[] {
  return relations.filter(r =>
    r.family_a_id === familyId || r.family_b_id === familyId
  );
}

/** Resolves the "other" family in a relation from a given perspective. */
export function otherFamily(rel: DiplomaticRelation, myFamilyId: string): string {
  return rel.family_a_id === myFamilyId ? rel.family_b_id : rel.family_a_id;
}

// ─────────────────────────────────────────────
// 2. Transition validation
// ─────────────────────────────────────────────

export interface TransitionCheck {
  allowed: boolean;
  reason?: string;
  cooldown_remaining_hours?: number;
  influence_cost: number;
}

export function canTransitionState(
  rel: DiplomaticRelation | null,
  from: DiplomaticState,
  to: DiplomaticState,
  familyInfluence: number,
  opts: { devFastForward?: boolean } = {},
): TransitionCheck {
  // Validate the transition is legal in the state machine
  if (!VALID_TRANSITIONS[from].includes(to)) {
    return { allowed: false, reason: `Cannot go directly from ${from} to ${to}.`, influence_cost: 0 };
  }

  const cost = TRANSITION_INFLUENCE_COST[`${from}→${to}`] ?? 0;

  // Check influence
  if (familyInfluence < cost) {
    return {
      allowed: false,
      reason: `Not enough Influence. Need ${cost}, have ${familyInfluence}.`,
      influence_cost: cost,
    };
  }

  // Check cooldown (skip in dev fast-forward mode)
  if (!opts.devFastForward && rel) {
    const nextAllowed = new Date(rel.next_change_allowed_at).getTime();
    const now = Date.now();
    if (now < nextAllowed) {
      const hoursLeft = Math.ceil((nextAllowed - now) / 3_600_000);
      return {
        allowed: false,
        reason: `Must remain in ${from} for ${MIN_STATE_HOURS[from]}h minimum. ${hoursLeft}h remaining.`,
        cooldown_remaining_hours: hoursLeft,
        influence_cost: cost,
      };
    }
  }

  return { allowed: true, influence_cost: cost };
}

// ─────────────────────────────────────────────
// 3. Snub effect computation
// ─────────────────────────────────────────────

/** Returns the status effects to apply when a Sitdown is snubbed. */
export function computeSnubEffects(
  sitdown: Sitdown,
): FamilyStatusEffect[] {
  const now = new Date().toISOString();
  const effects: FamilyStatusEffect[] = [];

  const snubbedFamily = sitdown.snubbed_by_family!;
  const offeringFamily = snubbedFamily === sitdown.family_a_id
    ? sitdown.family_b_id
    : sitdown.family_a_id;

  const hoursFromNow = (h: number) =>
    new Date(Date.now() + h * 3_600_000).toISOString();

  switch (sitdown.proposal_type) {
    case 'ALLIANCE': {
      // Debuff: B (snubber) gets income + influence penalty
      effects.push({
        id: `snub-${sitdown.id}-debuff`,
        family_id: snubbedFamily,
        effect_type: 'SNUBBED_ALLIANCE_DEBUFF',
        target_family_id: null,
        description: `Snubbed Alliance from ${offeringFamily}. Income −15%, Influence −20%.`,
        modifiers: {
          cash_income_pct: -0.15,
          influence_gain_pct: -0.20,
          alliance_cost_pct: +0.25,
        },
        expires_at: hoursFromNow(48),
        created_at: now,
        source_sitdown_id: sitdown.id,
      });
      // Buff: A gets contract discount vs B
      effects.push({
        id: `snub-${sitdown.id}-buff`,
        family_id: offeringFamily,
        effect_type: 'PEACE_SNUB_OFFENSIVE_BUFF',
        target_family_id: snubbedFamily,
        description: `${snubbedFamily} snubbed your Alliance. Contracts vs them cost 25% less.`,
        modifiers: {
          contract_cost_pct: -0.25,
          attack_success_pct: +0.10,
        },
        expires_at: hoursFromNow(48),
        created_at: now,
        source_sitdown_id: sitdown.id,
      });
      break;
    }

    case 'PEACE': {
      // Debuff: B gets defensive penalty vs A
      effects.push({
        id: `snub-${sitdown.id}-debuff`,
        family_id: snubbedFamily,
        effect_type: 'SNUBBED_PEACE_DEBUFF',
        target_family_id: offeringFamily,
        description: `Ignored Peace offer from ${offeringFamily}. Defense −10% vs them.`,
        modifiers: { defense_pct: -0.10 },
        expires_at: hoursFromNow(24),
        created_at: now,
        source_sitdown_id: sitdown.id,
      });
      // Buff: A gets offensive boost vs B
      effects.push({
        id: `snub-${sitdown.id}-buff`,
        family_id: offeringFamily,
        effect_type: 'PEACE_SNUB_OFFENSIVE_BUFF',
        target_family_id: snubbedFamily,
        description: `${snubbedFamily} refused your Peace offer. Attack success +20% vs them.`,
        modifiers: { attack_success_pct: +0.20 },
        expires_at: hoursFromNow(24),
        created_at: now,
        source_sitdown_id: sitdown.id,
      });
      break;
    }

    case 'NAP': {
      // Debuff: B gets influence penalty + becomes easier to war against
      effects.push({
        id: `snub-${sitdown.id}-debuff`,
        family_id: snubbedFamily,
        effect_type: 'SNUBBED_NAP_DEBUFF',
        target_family_id: null,
        description: `Ignored NAP offer. Influence −10%. Alliance formation harder.`,
        modifiers: {
          influence_gain_pct: -0.10,
          alliance_cost_pct: +0.15,
        },
        expires_at: hoursFromNow(12),
        created_at: now,
        source_sitdown_id: sitdown.id,
      });
      // Buff: A gets retaliation discount
      effects.push({
        id: `snub-${sitdown.id}-buff`,
        family_id: offeringFamily,
        effect_type: 'NAP_SNUB_RETALIATION_DISCOUNT',
        target_family_id: snubbedFamily,
        description: `${snubbedFamily} ignored your NAP. War contracts vs them cost −20%.`,
        modifiers: { contract_cost_pct: -0.20 },
        expires_at: hoursFromNow(12),
        created_at: now,
        source_sitdown_id: sitdown.id,
      });
      break;
    }
  }

  return effects;
}

// ─────────────────────────────────────────────
// 4. Political tag computation
// ─────────────────────────────────────────────

/** Derive current political tags for a family from effects + sitdown history. */
export function computePoliticalTags(
  familyId: string,
  effects: FamilyStatusEffect[] = MOCK_STATUS_EFFECTS,
  sitdowns: Sitdown[] = MOCK_SITDOWNS,
  knownFamilyName?: (id: string) => string,
): PoliticalTag[] {
  const tags: PoliticalTag[] = [];
  const now = Date.now();

  // Active effects on this family
  const myEffects = effects.filter(e =>
    e.family_id === familyId && new Date(e.expires_at).getTime() > now
  );

  // Sitdown history involving this family
  const mySitdowns = sitdowns.filter(s =>
    s.family_a_id === familyId || s.family_b_id === familyId
  );
  const snubsCommitted = mySitdowns.filter(s =>
    s.state === 'SNUBBED' && s.snubbed_by_family === familyId
  );
  const agreed = mySitdowns.filter(s => s.state === 'AGREED');
  const recent = mySitdowns.filter(s =>
    new Date(s.created_at).getTime() > now - 7 * 24 * 3_600_000
  );

  // Negative tags from active effects
  for (const eff of myEffects) {
    if (eff.effect_type === 'SNUBBED_ALLIANCE_DEBUFF') {
      tags.push({
        id: 'SNUBBED_ALLIANCE',
        label: 'Snubbed Alliance',
        description: 'Ignored an Alliance Sitdown. Income and influence penalized.',
        expires_at: eff.expires_at,
        is_negative: true,
      });
    }
    if (eff.effect_type === 'SNUBBED_PEACE_DEBUFF') {
      const targetName = knownFamilyName?.(eff.target_family_id!) ?? eff.target_family_id ?? 'Unknown';
      tags.push({
        id: 'IGNORED_PEACE_OFFER',
        label: 'Ignored Peace Offer',
        description: `Refused a Peace Sitdown. Defense penalized vs ${targetName}.`,
        expires_at: eff.expires_at,
        target_family_name: targetName,
        is_negative: true,
      });
    }
    if (eff.effect_type === 'SNUBBED_NAP_DEBUFF') {
      tags.push({
        id: 'POLITICAL_INSTABILITY',
        label: 'Political Instability',
        description: 'Recent diplomatic snubs signal unreliable leadership.',
        expires_at: eff.expires_at,
        is_negative: true,
      });
    }
  }

  // Positive tags from history
  if (agreed.length >= 2 && snubsCommitted.length === 0) {
    tags.push({
      id: 'HONORED_ALLY',
      label: 'Honored Ally',
      description: 'Has honored multiple agreements and never snubbed a Sitdown.',
      expires_at: null,
      is_negative: false,
    });
  } else if (agreed.length >= 1 && snubsCommitted.length === 0) {
    tags.push({
      id: 'RELIABLE_NEGOTIATOR',
      label: 'Reliable Negotiator',
      description: 'Responds to Sitdowns and keeps agreements.',
      expires_at: null,
      is_negative: false,
    });
  }

  // Neutral fallback
  if (tags.length === 0) {
    tags.push({
      id: 'NEUTRAL',
      label: 'Neutral',
      description: 'No active diplomatic ties or recent events.',
      expires_at: null,
      is_negative: false,
    });
  }

  return tags;
}

// ─────────────────────────────────────────────
// 5. Sitdown validation
// ─────────────────────────────────────────────

export interface SitdownCheck {
  allowed: boolean;
  reason?: string;
}

export function canStartSitdown(
  initiatorFamilyId: string,
  targetFamilyId: string,
  sitdowns: Sitdown[] = MOCK_SITDOWNS,
): SitdownCheck {
  // No active sitdowns between these families
  const active = sitdowns.find(s =>
    ((s.family_a_id === initiatorFamilyId && s.family_b_id === targetFamilyId) ||
     (s.family_a_id === targetFamilyId && s.family_b_id === initiatorFamilyId)) &&
    (s.state === 'ACTIVE' || s.state === 'PENDING')
  );
  if (active) {
    return { allowed: false, reason: 'A Sitdown between these families is already in progress.' };
  }
  // Can't sit down with yourself
  if (initiatorFamilyId === targetFamilyId) {
    return { allowed: false, reason: 'Cannot initiate a Sitdown with your own family.' };
  }
  return { allowed: true };
}

// ─────────────────────────────────────────────
// 6. Sitdown lifecycle — pure state transitions
// ─────────────────────────────────────────────

/** Accept the current pending proposal (Don action). */
export function acceptSitdownProposal(
  sitdown: Sitdown,
  respondingFamily: string,
): Sitdown {
  const proposals = [...sitdown.proposals];
  const last = { ...proposals[proposals.length - 1] };
  last.response = 'ACCEPTED';
  last.responded_at = new Date().toISOString();
  proposals[proposals.length - 1] = last;

  return {
    ...sitdown,
    proposals,
    state: 'AGREED',
    agreed_proposal_round: last.round,
    resolved_at: new Date().toISOString(),
  };
}

/** Decline the current pending proposal (Don action). */
export function declineSitdownProposal(
  sitdown: Sitdown,
  respondingFamily: string,
): Sitdown {
  const proposals = [...sitdown.proposals];
  const last = { ...proposals[proposals.length - 1] };
  last.response = 'DECLINED';
  last.responded_at = new Date().toISOString();
  proposals[proposals.length - 1] = last;

  return {
    ...sitdown,
    proposals,
    state: 'DECLINED',
    resolved_at: new Date().toISOString(),
  };
}

/** Submit a counter-proposal (round 2 or 3). Returns null if rounds exhausted. */
export function counterSitdownProposal(
  sitdown: Sitdown,
  counteringFamily: string,
  proposal: Omit<SitdownProposal, 'round' | 'proposed_by_family' | 'proposed_at' | 'response' | 'responded_at'>,
): Sitdown | null {
  const existingRounds = sitdown.proposals.length;
  if (existingRounds >= 3) return null; // Rounds exhausted

  const proposals = [...sitdown.proposals];
  // Mark last as countered
  const last = { ...proposals[proposals.length - 1] };
  last.response = 'COUNTERED';
  last.responded_at = new Date().toISOString();
  proposals[proposals.length - 1] = last;

  // Add new proposal
  const newRound = (existingRounds + 1) as 1 | 2 | 3;
  proposals.push({
    ...proposal,
    round: newRound,
    proposed_by_family: counteringFamily,
    proposed_at: new Date().toISOString(),
    response: null,
    responded_at: null,
  });

  return { ...sitdown, proposals };
}

/** Mark sitdown as SNUBBED (called when timer expires). */
export function markSitdownSnubbed(
  sitdown: Sitdown,
): Sitdown {
  const snubbedBy = sitdown.session_started_at === null
    ? sitdown.family_b_id  // Never joined
    : (sitdown.proposals.length > 0
       ? (sitdown.proposals[sitdown.proposals.length - 1].proposed_by_family === sitdown.family_a_id
          ? sitdown.family_b_id
          : sitdown.family_a_id)
       : sitdown.family_b_id);

  return {
    ...sitdown,
    state: 'SNUBBED',
    snubbed_by_family: snubbedBy,
    resolved_at: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// 7. Reward multiplier (re-export)
// ─────────────────────────────────────────────

export { computeInviteMultiplier };

// ─────────────────────────────────────────────
// 8. Formatting helpers (for UI)
// ─────────────────────────────────────────────

export function formatTimeRemaining(isoTimestamp: string): string {
  const diff = new Date(isoTimestamp).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const totalMins = Math.ceil(diff / 60_000);
  if (totalMins < 60) return `${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  if (hours >= 24) return `${Math.ceil(hours / 24)}d`;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function diplomaticStateColor(state: DiplomaticState): string {
  switch (state) {
    case 'ALLIED':  return '#4a9a4a';
    case 'NAP':     return '#5580bb';
    case 'AT_WAR':  return '#cc3333';
    case 'NEUTRAL': return '#888';
  }
}

export function diplomaticStateLabel(state: DiplomaticState): string {
  switch (state) {
    case 'ALLIED':  return 'Allied';
    case 'NAP':     return 'Non-Aggression Pact';
    case 'AT_WAR':  return 'At War';
    case 'NEUTRAL': return 'Neutral';
  }
}

export function proposalTypeLabel(type: SitdownProposalType): string {
  switch (type) {
    case 'NAP':             return 'Non-Aggression Pact';
    case 'ALLIANCE':        return 'Alliance';
    case 'PEACE':           return 'Peace / Ceasefire';
    case 'WAR':             return 'Declaration of War';
    case 'BREAK_NAP':       return 'Break NAP';
    case 'BREAK_ALLIANCE':  return 'Dissolve Alliance';
  }
}

export { getRelationBetween as getRelation };
