/**
 * env.ts — Centralized environment and feature-flag configuration.
 *
 * All env-based feature decisions go here. Never scatter
 * `import.meta.env.DEV` or `VITE_*` checks across components.
 *
 * Production (Vercel):
 *   - VITE_ENABLE_DEV_TOOLS is unset or "false" → devTools = false
 *   - VITE_ENABLE_ADMIN_TOOLS is unset or "false" → adminTools = false
 *
 * Staging / Preview:
 *   - Set VITE_ENABLE_ADMIN_TOOLS=true in Vercel preview env to enable admin panel
 *
 * Local development:
 *   - import.meta.env.DEV = true → devTools on by default
 *   - Can be overridden with VITE_ENABLE_DEV_TOOLS=false
 */

// ─────────────────────────────────────────────
// Raw flags from Vite env
// ─────────────────────────────────────────────

const _isDev   = import.meta.env.DEV === true;
const _isProd  = import.meta.env.PROD === true;

// Explicit overrides via env vars (cast to string then compare)
const _devToolsOverride   = import.meta.env.VITE_ENABLE_DEV_TOOLS as string | undefined;
const _adminToolsOverride = import.meta.env.VITE_ENABLE_ADMIN_TOOLS as string | undefined;
const _mockDataOverride   = import.meta.env.VITE_USE_MOCK_DATA as string | undefined;

// ─────────────────────────────────────────────
// Resolved flags (use these throughout the app)
// ─────────────────────────────────────────────

/**
 * DEV TOOLS: role switcher, DEV banners, DEV nav items, skip buttons, debug selectors.
 *
 * Default: ON in local dev, OFF in production.
 * Override with VITE_ENABLE_DEV_TOOLS=true|false.
 */
export const ENABLE_DEV_TOOLS: boolean = (() => {
  if (_devToolsOverride === 'true')  return true;
  if (_devToolsOverride === 'false') return false;
  return _isDev; // default: matches Vite's dev mode
})();

/**
 * ADMIN TOOLS: Admin Panel, Progression Panel, internal routes.
 *
 * Default: ON in local dev, OFF in production.
 * Override with VITE_ENABLE_ADMIN_TOOLS=true to enable on staging/preview.
 */
export const ENABLE_ADMIN_TOOLS: boolean = (() => {
  if (_adminToolsOverride === 'true')  return true;
  if (_adminToolsOverride === 'false') return false;
  return _isDev;
})();

/**
 * MOCK DATA: whether to use in-memory seeded data instead of real Supabase.
 *
 * Default: true in dev when Supabase is not configured, false in prod.
 * The Supabase client handles this automatically via `isSupabaseConfigured`.
 * This flag allows explicit override.
 */
export const USE_MOCK_DATA: boolean = (() => {
  if (_mockDataOverride === 'true')  return true;
  if (_mockDataOverride === 'false') return false;
  return _isDev;
})();

// ─────────────────────────────────────────────
// Convenience
// ─────────────────────────────────────────────

export const IS_PRODUCTION = _isProd;
export const IS_DEVELOPMENT = _isDev;
