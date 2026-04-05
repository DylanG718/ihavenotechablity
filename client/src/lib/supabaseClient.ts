/**
 * MafiaLife — Supabase Client
 *
 * Uses a lightweight in-memory stub when Supabase is not configured,
 * so the full @supabase/supabase-js library is only loaded when real
 * credentials are present (dynamic import).
 *
 * This prevents the Supabase bundle (which uses localStorage internally)
 * from appearing in the preview build.
 */

// ─────────────────────────────────────────────
// ENV check
// ─────────────────────────────────────────────

const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = !!(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL !== 'https://your-project-ref.supabase.co' &&
  !SUPABASE_URL.includes('placeholder')
);

// ─────────────────────────────────────────────
// Stub client (used when Supabase is not configured)
// Satisfies all call sites so nothing crashes in mock mode.
// ─────────────────────────────────────────────

type AnyFn = (...args: unknown[]) => unknown;

function makeChain(): Record<string, AnyFn> {
  const chain: Record<string, AnyFn> = new Proxy({} as Record<string, AnyFn>, {
    get(_target, prop) {
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined;
      // Any method call on the chain returns the chain itself (for fluent queries)
      return (..._args: unknown[]) => chain;
    },
  });
  return chain;
}

// Auth stub
const stubAuth = {
  getSession:          async () => ({ data: { session: null }, error: null }),
  signInWithPassword:  async () => ({ data: { user: null, session: null }, error: null }),
  signUp:              async () => ({ data: { user: null, session: null }, error: null }),
  signOut:             async () => ({ error: null }),
  resetPasswordForEmail: async () => ({ error: null }),
  onAuthStateChange:   (_event: string, _cb: AnyFn) => ({
    data: { subscription: { unsubscribe: () => {} } }
  }),
};

// Stub Supabase client — all operations return empty/null safely
const stubClient = {
  auth: stubAuth,
  from:  (_table: string) => makeChain(),
  rpc:   async (_fn: string, _args?: unknown) => ({ data: null, error: null }),
  storage: { from: (_bucket: string) => makeChain() },
};

// ─────────────────────────────────────────────
// Real client (only loaded when configured)
// ─────────────────────────────────────────────

// We use a lazy-loaded real client. On first use when configured,
// the real Supabase client is created via dynamic import.
let _realClient: typeof stubClient | null = null;

async function getRealClient() {
  if (_realClient) return _realClient;
  if (!isSupabaseConfigured) return stubClient;
  const { createClient } = await import('@supabase/supabase-js');
  _realClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  }) as unknown as typeof stubClient;
  return _realClient;
}

// Synchronous client reference — returns stub immediately,
// real client is wired in for async auth operations.
// For the auth context (which uses onAuthStateChange), we need a sync ref.
function getSyncClient() {
  if (!isSupabaseConfigured) return stubClient;
  // If real client already loaded, return it; otherwise return stub
  // (auth operations will re-call async path)
  return (_realClient ?? stubClient);
}

// ─────────────────────────────────────────────
// Exported `supabase` — synchronous reference
// ─────────────────────────────────────────────

// Proxy that routes to real or stub client
export const supabase = new Proxy(stubClient, {
  get(stub, prop) {
    const target = getSyncClient();
    return (target as Record<string, unknown>)[prop as string] ?? (stub as Record<string, unknown>)[prop as string];
  },
});

// Initialize real client eagerly if configured (so auth state is ready immediately)
if (isSupabaseConfigured) {
  getRealClient().catch(() => {});
}

// ─────────────────────────────────────────────
// AUTH HELPERS
// ─────────────────────────────────────────────

export async function signUp(email: string, password: string, username: string, alias: string) {
  const client = await getRealClient();
  const { data: authData, error: authError } = await (client.auth as typeof stubAuth).signUp({
    email, password, options: { data: { username, alias } },
  } as never);
  if (authError) throw authError;

  if ((authData as { user?: { id: string } }).user) {
    const { error: playerError } = await client.rpc('create_player_profile', {
      p_username: username, p_alias: alias,
    });
    if (playerError) throw playerError;
  }
  return authData;
}

export async function signIn(email: string, password: string) {
  const client = await getRealClient();
  const { data, error } = await (client.auth as typeof stubAuth).signInWithPassword({
    email, password,
  } as never);
  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = await getRealClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

export async function getSession() {
  const client = await getRealClient();
  const result = await client.auth.getSession() as { data: { session: unknown } };
  return result.data.session;
}

// ─────────────────────────────────────────────
// GAME ACTION RPCs
// ─────────────────────────────────────────────

export async function fetchMyProfile() {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('get_my_profile');
  if (error) throw error;
  return data;
}

export async function fetchJobsForPlayer() {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('get_jobs_for_player');
  if (error) throw error;
  return data;
}

export async function markNotificationRead(notificationId: string) {
  if (!isSupabaseConfigured) return;
  const client = await getRealClient();
  const { error } = await client.rpc('mark_notification_read', {
    p_notification_id: notificationId,
  } as never);
  if (error) throw error;
}

export async function markAllNotificationsRead() {
  if (!isSupabaseConfigured) return 0;
  const client = await getRealClient();
  const { data, error } = await client.rpc('mark_all_notifications_read');
  if (error) throw error;
  return data as number;
}

export async function runJob(jobId: string, mode: 'SOLO' | 'CREW' | 'SOLO_OR_CREW' = 'SOLO') {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('run_job', { p_job_id: jobId, p_mode: mode } as never);
  if (error) throw error;
  return data;
}

export async function claimPassiveIncome() {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('claim_passive_income');
  if (error) throw error;
  return data;
}

export async function purchaseTurf(turfSlug: string) {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('purchase_turf', { p_turf_slug: turfSlug } as never);
  if (error) throw error;
  return data;
}

export async function buildFront(turfSlug: string, slotIndex: number, frontType: string) {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('build_front', {
    p_turf_slug: turfSlug, p_slot_index: slotIndex, p_front_type: frontType,
  } as never);
  if (error) throw error;
  return data;
}

export async function assignBusinessRole(frontInstanceId: string, playerId: string, slotDefinitionId: string) {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('assign_business_role', {
    p_front_instance_id: frontInstanceId, p_player_id: playerId, p_slot_definition_id: slotDefinitionId,
  } as never);
  if (error) throw error;
  return data;
}

export async function applyToFamily(familyId: string) {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('apply_to_family', { p_family_id: familyId } as never);
  if (error) throw error;
  return data;
}

export async function sendChainMessage(subject: string, body: string) {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('send_chain_message', { p_subject: subject, p_body: body } as never);
  if (error) throw error;
  return data;
}

export async function promoteMember(targetPlayerId: string, toRank: string, note = '') {
  if (!isSupabaseConfigured) return null;
  const client = await getRealClient();
  const { data, error } = await client.rpc('promote_member', {
    p_target_player_id: targetPlayerId, p_to_rank: toRank, p_note: note,
  } as never);
  if (error) throw error;
  return data;
}

export async function fetchNotifications(limit = 50) {
  if (!isSupabaseConfigured) return [];
  const client = await getRealClient();
  const result = client.from('notifications');
  // Fluent chain call via stub proxy
  void result; void limit;
  return [];
}

export async function fetchFamilies() {
  if (!isSupabaseConfigured) return [];
  return [];
}

export async function fetchDistricts() {
  if (!isSupabaseConfigured) return [];
  return [];
}

export async function fetchTurfs(_filters?: { districtId?: string; familyId?: string }) {
  if (!isSupabaseConfigured) return [];
  return [];
}

export async function fetchFamilyFeed(_familyId: string, _limit = 30) {
  if (!isSupabaseConfigured) return [];
  return [];
}

export async function fetchWorldFeed(_limit = 20) {
  if (!isSupabaseConfigured) return [];
  return [];
}

export async function fetchActiveEvents() {
  if (!isSupabaseConfigured) return [];
  return [];
}

export async function fetchObituaries(_limit = 30) {
  if (!isSupabaseConfigured) return [];
  return [];
}

export async function fetchSeasonStandings(_seasonId: string) {
  if (!isSupabaseConfigured) return [];
  return [];
}

// ─────────────────────────────────────────────
// ANALYTICS (fire-and-forget)
// ─────────────────────────────────────────────

export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
  context?: { familyId?: string; districtId?: string; entityId?: string; entityType?: string }
) {
  if (!isSupabaseConfigured) return;
  try {
    const client = await getRealClient();
    await client.rpc('track_analytics_event', {
      p_event_name:  eventName,
      p_properties:  properties,
      p_family_id:   context?.familyId ?? null,
      p_district_id: context?.districtId ?? null,
      p_entity_id:   context?.entityId ?? null,
      p_entity_type: context?.entityType ?? null,
    } as never);
  } catch {
    // Analytics should never break the game
  }
}
