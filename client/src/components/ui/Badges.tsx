/**
 * Status badges — all enum values aligned to spec schema.
 */

import type {
  PlayerStatus, MissionState, ContractState, BlacksiteState,
  FamilyRole, MissionTier, RepTier, HitmanAvailability, ContractOutcome,
} from '../../../../shared/schema';

export function StatusBadge({ status }: { status: PlayerStatus }) {
  const m: Record<PlayerStatus, [string, string]> = {
    ACTIVE:       ['Active',    'badge-green'],
    IN_JAIL:      ['In Jail',   'badge-yellow'],
    IN_BLACKSITE: ['The Box',   'badge-purple'],
    DEAD:         ['Dead',      'badge-gray'],
    RETIRED:      ['Retired',   'badge-gray'],
    SUSPENDED:    ['Suspended', 'badge-red'],
  };
  const [l, c] = m[status] ?? [status, 'badge-gray'];
  return <span className={c}>{l}</span>;
}

export function RoleBadge({ role }: { role: FamilyRole }) {
  const m: Record<FamilyRole, [string, string]> = {
    RUNNER:      ['Runner',      'badge-green'],
    UNDERBOSS:   ['Underboss',   'badge-yellow'],
    CONSIGLIERE: ['Consigliere', 'badge-gold'],
    CAPO:        ['Capo',        'badge-blue'],
    SOLDIER:     ['Soldier',     'badge-green'],
    ASSOCIATE:   ['Associate',   'badge-gray'],
    RECRUIT:     ['Recruit',     'badge-gray'],
  };
  const [l, c] = m[role] ?? [role, 'badge-gray'];
  return <span className={c}>{l}</span>;
}

export function MissionBadge({ state }: { state: MissionState }) {
  const m: Record<MissionState, [string, string]> = {
    DRAFT:           ['Draft',    'badge-gray'],
    OPEN:            ['Open',     'badge-blue'],
    ACTIVE:          ['Active',   'badge-yellow'],
    SUCCESS:         ['Success',  'badge-green'],
    PARTIAL_SUCCESS: ['Partial',  'badge-yellow'],
    FAILURE:         ['Failed',   'badge-red'],
    COMPROMISED:     ['Blown',    'badge-red'],
    ABANDONED:       ['Abandoned','badge-gray'],
  };
  const [l, c] = m[state] ?? [state, 'badge-gray'];
  return <span className={c}>{l}</span>;
}

export function TierBadge({ tier }: { tier: MissionTier }) {
  const m: Record<MissionTier, [string, string]> = {
    STARTER:  ['Starter',  'badge-gray'],
    STANDARD: ['Standard', 'badge-blue'],
    ADVANCED: ['Advanced', 'badge-yellow'],
    ELITE:    ['Elite',    'badge-red'],
  };
  const [l, c] = m[tier];
  return <span className={c}>{l}</span>;
}

/** Spec-aligned contract state names */
export function ContractBadge({ state }: { state: ContractState }) {
  const m: Record<ContractState, [string, string]> = {
    DRAFT:                 ['Draft',          'badge-gray'],
    POSTED:                ['Posted',         'badge-blue'],     // spec: posted
    ACCEPTED:              ['Accepted',       'badge-yellow'],   // spec: accepted
    IN_PROGRESS:           ['In Progress',    'badge-yellow'],   // spec: in_progress
    SUCCESS_CLEAN:         ['Clean Success',  'badge-green'],    // spec: success_clean
    SUCCESS_MESSY:         ['Messy Success',  'badge-yellow'],   // spec: success_messy
    FAILED_UNTRACED:       ['Failed',         'badge-red'],      // spec: failed_untraced
    FAILED_TRACED:         ['Traced',         'badge-red'],      // spec: failed_traced
    CATASTROPHIC_BLOWBACK: ['Catastrophic',   'badge-red'],      // spec: catastrophic_blowback
    EXPIRED:               ['Expired',        'badge-gray'],
    CANCELLED:             ['Cancelled',      'badge-gray'],
  };
  const [l, c] = m[state] ?? [state, 'badge-gray'];
  return <span className={c}>{l}</span>;
}

/** Spec-aligned contract outcome names */
export function OutcomeBadge({ outcome }: { outcome: ContractOutcome }) {
  const m: Record<ContractOutcome, [string, string]> = {
    SUCCESS_CLEAN:         ['Clean Success',  'badge-green'],
    SUCCESS_MESSY:         ['Messy Success',  'badge-yellow'],
    FAILED_UNTRACED:       ['Failed',         'badge-red'],
    FAILED_TRACED:         ['Traced Failure', 'badge-red'],
    CATASTROPHIC_BLOWBACK: ['Catastrophic',   'badge-red'],
  };
  const [l, c] = m[outcome] ?? [outcome, 'badge-gray'];
  return <span className={c}>{l}</span>;
}

export function RepBadge({ tier }: { tier: RepTier }) {
  const m: Record<RepTier, [string, string]> = {
    ROOKIE:       ['Rookie',       'badge-gray'],
    PROFESSIONAL: ['Professional', 'badge-blue'],
    ELITE:        ['Elite',        'badge-yellow'],
    LEGENDARY:    ['Legendary',    'badge-red'],
  };
  const [l, c] = m[tier];
  return <span className={c}>{l}</span>;
}

export function AvailBadge({ avail }: { avail: HitmanAvailability }) {
  const m: Record<HitmanAvailability, [string, string]> = {
    FREE:         ['Available',   'badge-green'],
    ON_CONTRACT:  ['On Contract', 'badge-yellow'],
    WATCHED:      ['Watched',     'badge-yellow'],   // spec: watched
    BURNED:       ['Burned',      'badge-red'],      // spec: burned
    IN_PRISON:    ['In The Box',  'badge-purple'],   // spec: in_prison → "The Box"
    FREE_REBUILT: ['Rebuilt',     'badge-blue'],
  };
  const [l, c] = m[avail] ?? [avail, 'badge-gray'];
  return <span className={c}>{l}</span>;
}

export function BlacksiteBadge({ state }: { state: BlacksiteState }) {
  const m: Record<BlacksiteState, string> = {
    BLACKSITE_INTAKE:           'Intake',
    BLACKSITE_CONFINED:         'Confined',
    BLACKSITE_MAX_SECURITY:     'Max Security',
    BLACKSITE_RELEASE_ELIGIBLE: 'Release Eligible',
  };
  return <span className="badge-purple">{m[state] ?? state}</span>;
}
