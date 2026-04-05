/**
 * PERMISSIONS — spec aligned
 *
 * Spec: families.member_permissions
 *   Recruit:     basic_family_missions
 *   Associate:   normal_missions
 *   Soldier:     missions, basic_pvp
 *   Capo:        crew_management, member_promotion_recommend
 *   Underboss:   high_level_missions, contract_approval
 *   Consigliere: advisory, diplomacy
 *   Boss:        full_control, family_creation, hire_hitman
 */

import type { GameRole, Permission, FamilyRole, Affiliation } from '../../../shared/schema';

const MEMBER_BASE: Permission[] = [
  'LEAVE_FAMILY', 'VIEW_FAMILY_DASHBOARD', 'VIEW_FAMILY_ROSTER',
  'VIEW_FAMILY_CHAT', 'VIEW_MISSION_BOARD', 'JOIN_STARTER_MISSION',
  'JOIN_MISSION', 'DEPOSIT_TREASURY', 'VIEW_OPERATIONS',
  'VIEW_HITMAN_PROFILES', 'VIEW_ROUND_STATS', 'ACCESS_HITMAN_LEADERBOARD',
];

const LEADERSHIP_BASE: Permission[] = [
  ...MEMBER_BASE,
  'VIEW_FAMILY_TREASURY', 'VIEW_FAMILY_STRATEGY',
  'START_MISSION', 'CREATE_MISSION', 'EDIT_MISSION',
  'INVITE_RECRUIT', 'APPROVE_RECRUIT',
  'PROMOTE_TO_ASSOCIATE', 'PROMOTE_TO_SOLDIER',
  'KICK_MEMBER', 'MANAGE_OPERATIONS', 'VIEW_CONTRACT_HISTORY',
];

export const ROLE_PERMISSIONS: Record<GameRole, Permission[]> = {

  UNAFFILIATED: [
    'JOIN_FAMILY', 'VIEW_MISSION_BOARD', 'VIEW_HITMAN_PROFILES',
    'VIEW_ROUND_STATS', 'ACCESS_HITMAN_LEADERBOARD',
  ],

  RECRUIT: [
    'LEAVE_FAMILY', 'VIEW_FAMILY_DASHBOARD', 'VIEW_FAMILY_ROSTER',
    'VIEW_FAMILY_CHAT',         // read-only
    'VIEW_MISSION_BOARD', 'JOIN_STARTER_MISSION',  // spec: basic_family_missions
    'VIEW_HITMAN_PROFILES', 'VIEW_ROUND_STATS', 'ACCESS_HITMAN_LEADERBOARD',
  ],

  ASSOCIATE: [                   // spec: normal_missions
    ...MEMBER_BASE,
  ],

  SOLDIER: [                     // spec: missions, basic_pvp
    ...MEMBER_BASE,
  ],

  CAPO: [                        // spec: crew_management, member_promotion_recommend
    ...LEADERSHIP_BASE,
  ],

  CONSIGLIERE: [                 // spec: advisory, diplomacy
    ...LEADERSHIP_BASE,
    'POST_CONTRACT',             // advisory role can help coordinate contracts
    'OFFER_TRUCE',               // spec: diplomacy
    'ACCEPT_TRUCE',
    'VIEW_CONTRACT_HISTORY',
  ],

  UNDERBOSS: [                   // spec: high_level_missions, contract_approval
    ...LEADERSHIP_BASE,
    'PROMOTE_TO_CAPO',
    'KICK_MEMBER',
    'SPEND_TREASURY',
    'POST_CONTRACT',             // spec: contract_approval
    'OFFER_TRUCE',
    'VIEW_CONTRACT_HISTORY',
  ],

  BOSS: [                        // spec: full_control, family_creation, hire_hitman
    ...LEADERSHIP_BASE,
    'PROMOTE_TO_CAPO', 'PROMOTE_TO_UNDERBOSS',
    'KICK_MEMBER', 'SPEND_TREASURY',
    'POST_CONTRACT',             // spec: hire_hitman
    'OFFER_TRUCE', 'ACCEPT_TRUCE', 'DECLARE_WAR',
    'VIEW_CONTRACT_HISTORY', 'MANAGE_ROUND_REWARDS',
  ],

  SOLO_HITMAN: [                 // spec: contract_only, cannot_join_family
    'VIEW_MISSION_BOARD',        // support slot view only
    'VIEW_HITMAN_PROFILES',
    'VIEW_ROUND_STATS',
    'ACCESS_HITMAN_DASHBOARD',
    'ACCESS_HITMAN_DOWNTIME',
    'ACCESS_HITMAN_PRISON',
    'ACCESS_HITMAN_LEADERBOARD',
    'ACCEPT_CONTRACT',           // spec: contract_only
    'ACCEPT_SUPPORT_SLOT',       // spec: family_missions: support_slot_only
  ],
};

export function can(role: GameRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: GameRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function incomeMultiplier(role: GameRole | null): number {
  if (['BOSS','UNDERBOSS','CONSIGLIERE','CAPO'].includes(role ?? '')) return 1.0;
  return 0.6;
}

/** Maps DB FamilyRole + Affiliation to GameRole for permissions check */
export function toGameRole(familyRole: FamilyRole | null, affiliation: Affiliation): GameRole {
  if (affiliation === 'SOLO_HITMAN')  return 'SOLO_HITMAN';
  if (affiliation === 'UNAFFILIATED') return 'UNAFFILIATED';
  if (familyRole === 'BOSS')          return 'BOSS';
  if (familyRole === 'UNDERBOSS')     return 'UNDERBOSS';
  if (familyRole === 'CONSIGLIERE')   return 'CONSIGLIERE';
  if (familyRole === 'CAPO')          return 'CAPO';
  if (familyRole === 'SOLDIER')       return 'SOLDIER';
  if (familyRole === 'ASSOCIATE')     return 'ASSOCIATE';
  if (familyRole === 'RECRUIT')       return 'RECRUIT';
  return 'UNAFFILIATED';
}
