/**
 * ARCHETYPE DEFINITIONS — 7 canonical archetypes.
 *
 * IMPORTANT: Archetype != Family Rank.
 *   - Archetype is a personal playstyle / specialization.
 *   - Family rank (Don, Underboss, Capo, etc.) is an organizational role.
 *   - ANY archetype can hold ANY family rank.
 *   - A Runner can become a Don. A Hitman cannot (solo path).
 *
 * Archetypes: RUNNER, EARNER, MUSCLE, SHOOTER, SCHEMER, RACKETEER, HITMAN
 *
 * BOSS removed (2026-04): Boss is a family rank, not a playstyle.
 * RUNNER added (2026-04): Beginner-friendly generalist archetype.
 * Migration: existing BOSS archetype players → RUNNER.
 *
 * NOTE: CONSIGLIERE is a FamilyRole (family hierarchy position),
 *       NOT an archetype. Any archetype can hold the Consigliere role.
 */

import type { Archetype } from '../../../shared/schema';

export type { Archetype };

export type StatWeight = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ArchetypeDefinition {
  type: Archetype;
  name: string;
  tagline: string;
  description: string;
  role: string;
  playstyle: string;
  solo_only: boolean;
  routing: 'FAMILY' | 'HITMAN';
  stat_weights: Partial<Record<string, StatWeight>>;
  starting_bonuses: string[];
  soft_penalties: string[];
  best_at: string[];
  recommended_for: string;  // player-facing guidance on who should pick this
}

export const ARCHETYPES: ArchetypeDefinition[] = [
  // ── RUNNER — beginner-friendly generalist (listed first in onboarding) ────────
  {
    type: 'RUNNER',
    name: 'Runner',
    tagline: 'Every job. Every angle. No limit.',
    description: 'You adapt. No single lane owns you — you can handle street work, earn through businesses, coordinate with a crew, or go it alone when needed. The Runner has no ceiling and no floor. What you become depends entirely on your choices.',
    role: 'Adaptable operator / Generalist',
    playstyle: 'Flexible / All-rounder',
    solo_only: false,
    routing: 'FAMILY',
    stat_weights: {
      // Balanced across all stats — no extreme high or low
      charisma: 'MEDIUM', clout: 'MEDIUM', business: 'MEDIUM',
      intelligence: 'MEDIUM', leadership: 'MEDIUM', luck: 'MEDIUM',
      strength: 'MEDIUM', accuracy: 'MEDIUM', intimidation: 'MEDIUM',
    },
    starting_bonuses: [
      'Access to all job types from day one',
      'No stat penalties on any activity type',
    ],
    soft_penalties: [
      'No specialization bonus in any lane',
      'Outperformed by specialists in their strongest role',
    ],
    best_at: ['Flexibility', 'Early game optionality', 'Supporting any crew type', 'Trying everything'],
    recommended_for: 'New players or anyone who wants to explore the game before specializing.',
  },

  // ── EARNER ──────────────────────────────────────────────
  {
    type: 'EARNER',
    name: 'Earner',
    tagline: 'Money is the only language everyone understands.',
    description: 'You move money. Businesses, street operations, numbers — you turn everything into cash. The family runs on your work even when nobody says your name.',
    role: 'Financier / Treasury backbone',
    playstyle: 'Economic',
    solo_only: false,
    routing: 'FAMILY',
    stat_weights: {
      charisma: 'HIGH', clout: 'HIGH', business: 'HIGH', intelligence: 'HIGH',
      leadership: 'MEDIUM', luck: 'MEDIUM',
      strength: 'LOW', accuracy: 'LOW', intimidation: 'LOW',
    },
    starting_bonuses: [
      '+15% income from all business operations',
      'Lower suspicion on financial crimes',
    ],
    soft_penalties: [
      'Reduced damage in PvP',
      'Cannot lead frontline missions',
    ],
    best_at: ['Street jobs', 'Business scaling', 'Markets & betting', 'Stash growth'],
    recommended_for: 'Players who want to maximize income and build the family treasury.',
  },
  {
    type: 'MUSCLE',
    name: 'Muscle',
    tagline: 'The message does not need words when you show up.',
    description: "You're the reason people pay. Enforcers keep the peace, collect the debts, and make rivals understand the consequences.",
    role: 'Frontline enforcer / War asset',
    playstyle: 'Combat',
    solo_only: false,
    routing: 'FAMILY',
    stat_weights: {
      strength: 'HIGH', intimidation: 'HIGH',
      accuracy: 'MEDIUM', respect: 'MEDIUM',
      charisma: 'LOW', business: 'LOW', intelligence: 'LOW',
    },
    starting_bonuses: ['+20% damage in beatings', 'HP bonus (+20)'],
    soft_penalties: ['Higher suspicion on violent crimes', 'Lower business income'],
    best_at: ['Beatings', 'PvP combat', 'Extortion', 'Protection'],
    recommended_for: 'Players who want to dominate in combat, wars, and enforcement roles.',
  },
  {
    type: 'SHOOTER',
    name: 'Shooter',
    tagline: 'You pull the trigger so the boss does not have to.',
    description: 'When negotiations end and a message needs to be sent in gunfire — that is your work. You are family. You follow orders.',
    role: 'Precision killer inside families',
    playstyle: 'Combat / Military',
    solo_only: false,
    routing: 'FAMILY',
    stat_weights: {
      accuracy: 'HIGH', intimidation: 'HIGH', luck: 'HIGH',
      intelligence: 'MEDIUM', respect: 'MEDIUM',
      business: 'LOW', charisma: 'LOW', leadership: 'LOW',
    },
    starting_bonuses: ['+25% shooting accuracy', 'Access to assassination mission slots'],
    soft_penalties: ['Cannot run economic operations', 'Higher heat from gun crimes'],
    best_at: ['Shootings', 'War missions', 'Drive-bys', 'Armed heists'],
    recommended_for: 'Players who want to specialize in armed operations and family wars.',
  },

  {
    type: 'SCHEMER',
    name: 'Schemer',
    tagline: 'You know what is going to happen before it happens.',
    description: 'Intel, angles, and leverage. You know what is coming, who owes who, and which lever to pull. The smartest player rarely has to fight.',
    role: 'Strategist / Planner / Fixer',
    playstyle: 'Intel / Strategy',
    solo_only: false,
    routing: 'FAMILY',
    stat_weights: {
      intelligence: 'HIGH', luck: 'HIGH', suspicion: 'HIGH',
      business: 'MEDIUM', accuracy: 'MEDIUM',
      strength: 'LOW', intimidation: 'LOW',
    },
    starting_bonuses: [
      '+20% success rate on complex crimes',
      'Suspicion reduction on all actions',
    ],
    soft_penalties: ['Weaker in direct combat', 'Lower raw income'],
    best_at: ['Bank jobs', 'Big Jobs', 'Surveillance', 'Risk-managed crimes'],
    recommended_for: 'Players who want to outthink opponents and minimize risk on complex operations.',
  },
  {
    type: 'RACKETEER',
    name: 'Racketeer',
    tagline: 'Every block has a tax. You collect it.',
    description: 'Protection, numbers, loansharking — you run the operations that keep the family funded. Part earner, part enforcer.',
    role: 'Territory manager / Business enforcer',
    playstyle: 'Economic / Street',
    solo_only: false,
    routing: 'FAMILY',
    stat_weights: {
      business: 'HIGH', intimidation: 'HIGH', clout: 'HIGH',
      strength: 'MEDIUM', leadership: 'MEDIUM',
      accuracy: 'LOW', luck: 'LOW', charisma: 'LOW',
    },
    starting_bonuses: ['+20% turf income', 'Can run stash operations from day one'],
    soft_penalties: ['Lower accuracy in firefights', 'Weaker in long-range combat'],
    best_at: ['Turf control', 'Extortion', 'Stash management', 'Street operations'],
    recommended_for: 'Players who want to own territory and run the street economy.',
  },
  {
    type: 'HITMAN',
    name: 'Hitman',
    tagline: 'Solo. Anonymous. Final.',
    description: 'You do not join families. You work for whoever can afford you. Contracts, reputation, and disappearing without a trace. The moment you fail, everything changes.',
    role: 'Solo assassin / External contractor',
    playstyle: 'Solo / Assassination',
    solo_only: true,           // spec: family_affiliation: cannot_join_family
    routing: 'HITMAN',
    stat_weights: {
      accuracy: 'HIGH', intelligence: 'HIGH', luck: 'HIGH', suspicion: 'HIGH',
      intimidation: 'MEDIUM', respect: 'MEDIUM',
      leadership: 'LOW', business: 'LOW', charisma: 'LOW', strength: 'LOW',
    },
    starting_bonuses: [
      'Full contract board access from day one',
      'Suspicion control bonuses on all actions',
    ],
    soft_penalties: [
      'Cannot join families — solo path for the entire round',  // spec: cannot_join_family
      'The Box (prison) risk on traced failures',
    ],
    best_at: ['Assassination contracts', 'Support specialist slots', 'Surveillance', 'Downtime loop'],
    recommended_for: 'Players who want a solo, high-skill, high-reward path completely outside families.',
  },
];

export const ARCHETYPE_MAP = Object.fromEntries(
  ARCHETYPES.map(a => [a.type, a])
) as Record<Archetype, ArchetypeDefinition>;
