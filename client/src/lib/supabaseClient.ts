/**
 * supabaseClient.ts — Single source of truth for the Supabase JS client.
 *
 * ARCHITECTURE:
 *   • One client instance, created once, exported as a singleton.
 *   • In MOCK MODE (no env vars), all methods are no-ops returning safe defaults.
 *   • In REAL MODE (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY set), the real
 *     Supabase client is used for auth, RPCs, and data queries.
 *
 * BUNDLE NOTE:
 *   @supabase/supabase-js uses localStorage internally. To keep it out of the
 *   preview build (which runs in a sandboxed iframe), we use a dynamic import
 *   and a synchronous stub as the default export. The real client is loaded
 *   lazily on first use when credentials are present.
 *
 * MOCK MODE:
 *   When isSupabaseConfigured = false, all functions return safe empty values.
 *   The app runs entirely on mock/in-memory data. This is the correct state
 *   for local development without a Supabase project.
 */

// ─────────────────────────────────────────────
// Environment detection
// ─────────────────────────────────────────────

const _url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const _key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/**
 * True when real Supabase credentials are configured.
 * Controls whether auth/RPC calls go to Supabase or return mock responses.
 */
export const isSupabaseConfigured: boolean = !!(
  _url &&
  _key &&
  _url.startsWith('https://') &&
  !_url.includes('your-project-ref') &&
  !_url.includes('placeholder') &&
  _key.length > 20
);

// ─────────────────────────────────────────────
// Stub (used when not configured)
// ─────────────────────────────────────────────

type AnyFn = (...args: unknown[]) => unknown;

function makeQueryChain(): Record<string, AnyFn> {
  // Returns a proxy that chains any method call, ending in a thenable
  // that resolves to { data: null, error: null }
  const resolved = Promise.resolve({ data: null, error: null });
  const chain: Record<string, AnyFn> = new Proxy({} as Record<string, AnyFn>, {
    get(_target, prop: string) {
      // Make it thenable so await works
      if (prop === 'then')     return (r: AnyFn) => resolved.then(r);
      if (prop === 'catch')    return (r: AnyFn) => resolved.catch(r);
      if (prop === 'finally')  return (r: AnyFn) => resolved.finally(r as () => void);
      return (..._args: unknown[]) => chain;
    },
  });
  return chain;
}

const _stubAuth = {
  getSession:             async () => ({ data: { session: null }, error: null }),
  signInWithPassword:     async () => ({ data: { user: null, session: null }, error: null }),
  signUp:                 async () => ({ data: { user: null, session: null }, error: null }),
  signOut:                async () => ({ error: null }),
  resetPasswordForEmail:  async () => ({ data: {}, error: null }),
  onAuthStateChange:      (_evt: string, _cb: AnyFn) => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
  getUser:                async () => ({ data: { user: null }, error: null }),
};

export const _stub = {
  auth: _stubAuth,
  from:    (_table: string) => makeQueryChain(),
  rpc:     async (_fn: string, _args?: unknown) => ({ data: null, error: null }),
  storage: { from: (_bucket: string) => makeQueryChain() },
};

// ─────────────────────────────────────────────
// Real client (lazy, only loaded when configured)
// ─────────────────────────────────────────────

// The real Supabase client instance — populated on first getRealClient() call
let _client: typeof _stub | null = null;
let _initPromise: Promise<typeof _stub> | null = null;

async function getRealClient(): Promise<typeof _stub> {
  if (!isSupabaseConfigured) return _stub;
  if (_client) return _client;
  if (_initPromise) return _initPromise;

  _initPromise = import('@supabase/supabase-js').then(({ createClient }) => {
    _client = createClient(_url!, _key!, {
      auth: {
        persistSession:    true,
        autoRefreshToken:  true,
        detectSessionInUrl: true,
        storageKey:        'thelastfirm-auth',
      },
    }) as unknown as typeof _stub;
    return _client;
  });

  return _initPromise;
}

/**
 * Synchronous reference to the active client.
 * Returns real client if already loaded, stub otherwise.
 * For auth operations (which need the real client immediately),
 * use getRealClient() via the exported helpers below.
 */
export function getClient(): typeof _stub {
  return _client ?? _stub;
}

// Eagerly start loading the real client if configured
// so auth.onAuthStateChange is ready as soon as possible.
if (isSupabaseConfigured) {
  getRealClient().catch(console.error);
}

// ─────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────

export interface SignUpResult {
  userId: string | null;
  playerId: string | null;
  username: string;
  alias: string;
  requiresEmailConfirmation: boolean;
  error: string | null;
}

/**
 * Full signup flow:
 *   1. Create Supabase auth user
 *   2. Call create_player_profile RPC to create the player row
 *
 * Returns a structured result — never throws.
 */
export async function signUp(
  email: string,
  password: string,
  username: string,
  alias: string,
): Promise<SignUpResult> {
  if (!isSupabaseConfigured) {
    // Mock mode: simulate success immediately
    return { userId: 'mock-user-id', playerId: 'new-player', username, alias, requiresEmailConfirmation: false, error: null };
  }

  const sb = await getRealClient();

  // Step 1: Create Supabase auth user
  const { data: authData, error: authError } = await (sb.auth as typeof _stubAuth).signUp({
    email: email.trim(),
    password,
    options: {
      data: { username, alias },
      emailRedirectTo: `${window.location.origin}/#/`,
    },
  } as never);

  if (authError) {
    return { userId: null, playerId: null, username, alias, requiresEmailConfirmation: false, error: (authError as { message: string }).message };
  }

  const authUser = (authData as { user?: { id: string } }).user;
  if (!authUser) {
    return { userId: null, playerId: null, username, alias, requiresEmailConfirmation: false, error: 'Signup succeeded but no user returned.' };
  }

  // Check if email confirmation is required (user has no session yet)
  const requiresEmailConfirmation = !(authData as { session?: unknown }).session;

  if (requiresEmailConfirmation) {
    // Email confirmation required — player row will be created when they confirm
    // and sign in for the first time. The create_player_profile call is deferred.
    return {
      userId: authUser.id,
      playerId: null,
      username,
      alias,
      requiresEmailConfirmation: true,
      error: null,
    };
  }

  // Step 2: Create player row (only if session exists — i.e. email confirmation disabled)
  const { data: profileData, error: profileError } = await sb.rpc('create_player_profile', {
    p_username: username.trim(),
    p_alias:    alias.trim() || username.trim(),
  });

  if (profileError) {
    const errMsg = (profileError as { message: string }).message;
    // username_taken is a user-facing error, surface it
    if (errMsg.includes('username_taken')) {
      return { userId: authUser.id, playerId: null, username, alias, requiresEmailConfirmation: false, error: 'That username is already taken.' };
    }
    return { userId: authUser.id, playerId: null, username, alias, requiresEmailConfirmation: false, error: errMsg };
  }

  const playerId = (profileData as { player_id?: string } | null)?.player_id ?? null;
  return { userId: authUser.id, playerId, username, alias, requiresEmailConfirmation: false, error: null };
}

/**
 * Sign in with email + password.
 * Returns the session data or throws on error.
 */
export async function signIn(email: string, password: string) {
  if (!isSupabaseConfigured) {
    // Mock mode: simulate immediate success
    return { session: { user: { id: 'mock-user-id', email } } };
  }
  const sb = await getRealClient();
  const { data, error } = await (sb.auth as typeof _stubAuth).signInWithPassword({ email, password } as never);
  if (error) throw error;
  return data;
}

/**
 * Sign out the current session.
 */
export async function signOut() {
  if (!isSupabaseConfigured) return;
  const sb = await getRealClient();
  const { error } = await sb.auth.signOut();
  if (error) throw error;
}

// ─────────────────────────────────────────────
// Bootstrap RPCs
// ─────────────────────────────────────────────

export interface PlayerBootstrapData {
  player_id:            string;
  username:             string;
  alias:                string;
  archetype:            string;
  affiliation:          string;
  family_id:            string | null;
  family_role:          string | null;
  onboarding_completed: boolean;
  onboarding_step:      string;
  is_admin:             boolean;
  player_status:        string;
  stat_cash:            number;
  stat_heat:            number;
  stat_respect:         number;
}

/**
 * Lightweight bootstrap check — called on every app load.
 * Returns the minimal player state needed for routing decisions.
 * Returns null if no player row exists yet (new user, hasn't created profile).
 */
export async function fetchBootstrapPlayer(): Promise<PlayerBootstrapData | null> {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('get_my_player');
  if (error) {
    console.error('[supabase] get_my_player error:', error);
    return null;
  }
  return data as PlayerBootstrapData | null;
}

/**
 * Ensure the player profile row exists after auth.
 * Called on first sign-in if create_player_profile wasn't called during signup
 * (e.g. when email confirmation is required and the user confirmed their email
 * and signed in — at that point we create the row).
 */
export async function ensurePlayerProfile(username: string, alias: string): Promise<PlayerBootstrapData | null> {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();

  // First check if player already exists
  const { data: existing } = await sb.rpc('get_my_player');
  if (existing) return existing as PlayerBootstrapData;

  // Create profile
  const { data, error } = await sb.rpc('create_player_profile', {
    p_username: username,
    p_alias:    alias,
  });
  if (error) {
    console.error('[supabase] create_player_profile error:', error);
    return null;
  }

  // Fetch the full player row after creation
  const { data: fresh } = await sb.rpc('get_my_player');
  return fresh as PlayerBootstrapData | null;
}

/**
 * Persist onboarding completion to Supabase.
 * Called when the player finishes or skips onboarding.
 */
export async function completeOnboarding(
  archetype: string,
  path: 'standard' | 'founder',
  skipped: boolean,
): Promise<boolean> {
  if (!isSupabaseConfigured) return true; // mock: always success
  const sb = await getRealClient();
  const { error } = await sb.rpc('complete_onboarding', {
    p_archetype:   archetype,
    p_family_path: path,
    p_skipped:     skipped,
  });
  if (error) {
    console.error('[supabase] complete_onboarding error:', error);
    return false;
  }
  return true;
}

/**
 * Full profile fetch — includes family, assignments, notification count.
 * Heavy query, only used after bootstrap confirms player exists.
 */
export async function fetchMyProfile() {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('get_my_profile');
  if (error) throw error;
  return data;
}

/**
 * Update last active timestamp — fire-and-forget.
 */
export function pingLastActive() {
  if (!isSupabaseConfigured) return;
  getRealClient().then(sb => sb.rpc('update_last_active')).catch(() => {});
}

// ─────────────────────────────────────────────
// Game action RPCs (pass-through to existing RPCs)
// ─────────────────────────────────────────────

export async function runJob(jobId: string, mode: 'SOLO' | 'CREW' | 'SOLO_OR_CREW' = 'SOLO') {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('run_job', { p_job_id: jobId, p_mode: mode } as never);
  if (error) throw error;
  return data;
}

export async function claimPassiveIncome() {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('claim_passive_income');
  if (error) throw error;
  return data;
}

export async function purchaseTurf(turfSlug: string) {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('purchase_turf', { p_turf_slug: turfSlug } as never);
  if (error) throw error;
  return data;
}

export async function buildFront(turfSlug: string, slotIndex: number, frontType: string) {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('build_front', {
    p_turf_slug: turfSlug, p_slot_index: slotIndex, p_front_type: frontType,
  } as never);
  if (error) throw error;
  return data;
}

export async function assignBusinessRole(frontInstanceId: string, playerId: string, slotDefinitionId: string) {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('assign_business_role', {
    p_front_instance_id: frontInstanceId,
    p_player_id:         playerId,
    p_slot_definition_id: slotDefinitionId,
  } as never);
  if (error) throw error;
  return data;
}

export async function applyToFamily(familyId: string) {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('apply_to_family', { p_family_id: familyId } as never);
  if (error) throw error;
  return data;
}

export async function promoteMember(targetPlayerId: string, toRank: string, note = '') {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('promote_member', {
    p_target_player_id: targetPlayerId, p_to_rank: toRank, p_note: note,
  } as never);
  if (error) throw error;
  return data;
}

export async function sendChainMessage(subject: string, body: string) {
  if (!isSupabaseConfigured) return null;
  const sb = await getRealClient();
  const { data, error } = await sb.rpc('send_chain_message', { p_subject: subject, p_body: body } as never);
  if (error) throw error;
  return data;
}

export async function fetchNotifications(limit = 50) {
  if (!isSupabaseConfigured) return [];
  return [];
}

export async function markNotificationRead(notificationId: string) {
  if (!isSupabaseConfigured) return;
  const sb = await getRealClient();
  await sb.rpc('mark_notification_read', { p_notification_id: notificationId } as never);
}

export async function markAllNotificationsRead() {
  if (!isSupabaseConfigured) return 0;
  const sb = await getRealClient();
  const { data } = await sb.rpc('mark_all_notifications_read');
  return (data as number) ?? 0;
}

export async function fetchFamilies() { return []; }
export async function fetchDistricts() { return []; }
export async function fetchTurfs(_f?: unknown) { return []; }
export async function fetchFamilyFeed(_id: string, _limit?: number) { return []; }
export async function fetchWorldFeed(_limit?: number) { return []; }
export async function fetchActiveEvents() { return []; }
export async function fetchObituaries(_limit?: number) { return []; }
export async function fetchSeasonStandings(_id: string) { return []; }

// ─────────────────────────────────────────────
// Analytics (fire-and-forget, never throws)
// ─────────────────────────────────────────────

export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  context?: { familyId?: string; districtId?: string; entityId?: string; entityType?: string },
): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const sb = await getRealClient();
    await sb.rpc('track_analytics_event', {
      p_event_name:  eventName,
      p_properties:  properties,
      p_family_id:   context?.familyId   ?? null,
      p_district_id: context?.districtId ?? null,
      p_entity_id:   context?.entityId   ?? null,
      p_entity_type: context?.entityType ?? null,
    } as never);
  } catch {
    // Analytics must never break the game
  }
}

// Re-export the singleton proxy for components that need direct client access
// (e.g. authContext which needs onAuthStateChange)
export const supabase = new Proxy(_stub, {
  get(_stub, prop: string) {
    const live = _client ?? _stub;
    return (live as Record<string, unknown>)[prop] ?? (_stub as Record<string, unknown>)[prop];
  },
});
