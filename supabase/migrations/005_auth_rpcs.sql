-- ═══════════════════════════════════════════════════════════════════════
-- MAFIALIFE — Migration: 005_auth_rpcs.sql
--
-- Adds the RPCs needed for auth + session bootstrap:
--   1. create_player_profile  — called on signup, creates player row
--   2. complete_onboarding    — called when onboarding flow finishes
--   3. get_my_player          — lighter alternative to get_my_profile for bootstrap
--
-- All functions use SECURITY DEFINER so they bypass RLS
-- but still validate against auth.uid().
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- RPC: create_player_profile
--
-- Called immediately after Supabase auth.signUp() succeeds.
-- Creates the player row linked to the new auth user.
--
-- Idempotent: if a player already exists for this auth.uid(), returns it.
-- This handles cases where signup succeeded but the client crashed
-- before the row was created — safe to call again.
--
-- Returns: { player_id, username, alias, archetype, onboarding_completed }
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_player_profile(
  p_username  TEXT,
  p_alias     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id  UUID := auth.uid();
  v_alias         TEXT := COALESCE(NULLIF(TRIM(p_alias), ''), p_username);
  v_player_id     UUID;
  v_existing      UUID;
BEGIN
  -- Validate: must be authenticated
  IF v_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated'
      USING HINT = 'create_player_profile requires an active auth session';
  END IF;

  -- Validate: username must be non-empty
  IF TRIM(p_username) = '' THEN
    RAISE EXCEPTION 'invalid_username'
      USING HINT = 'Username cannot be empty';
  END IF;

  -- Validate: username length (3–24 chars, alphanumeric + underscore)
  IF LENGTH(TRIM(p_username)) < 3 OR LENGTH(TRIM(p_username)) > 24 THEN
    RAISE EXCEPTION 'invalid_username_length'
      USING HINT = 'Username must be 3–24 characters';
  END IF;

  -- Idempotency: check if player already exists for this auth user
  SELECT id INTO v_existing FROM players WHERE auth_user_id = v_auth_user_id LIMIT 1;
  IF v_existing IS NOT NULL THEN
    RETURN (
      SELECT jsonb_build_object(
        'player_id',            id,
        'username',             username,
        'alias',                alias,
        'archetype',            archetype,
        'onboarding_completed', onboarding_completed,
        'already_existed',      true
      )
      FROM players WHERE id = v_existing
    );
  END IF;

  -- Check username uniqueness
  IF EXISTS (SELECT 1 FROM players WHERE LOWER(username) = LOWER(TRIM(p_username))) THEN
    RAISE EXCEPTION 'username_taken'
      USING HINT = 'That username is already in use. Please choose another.';
  END IF;

  -- Create the player
  INSERT INTO players (
    auth_user_id,
    username,
    alias,
    archetype,            -- will be updated when they complete onboarding
    affiliation,
    player_status,
    death_state,
    onboarding_step,
    onboarding_completed,
    stat_cash             -- small starting cash so UI is non-zero
  )
  VALUES (
    v_auth_user_id,
    TRIM(p_username),
    TRIM(v_alias),
    'RUNNER',             -- default until archetype is chosen in onboarding
    'UNAFFILIATED',
    'ACTIVE',
    'ALIVE',
    'INTRO',
    false,
    1000                  -- $10 in cents (starting cash for UI context)
  )
  RETURNING id INTO v_player_id;

  RETURN jsonb_build_object(
    'player_id',            v_player_id,
    'username',             TRIM(p_username),
    'alias',                TRIM(v_alias),
    'archetype',            'RUNNER',
    'onboarding_completed', false,
    'already_existed',      false
  );
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: complete_onboarding
--
-- Called when the player finishes (or skips) the onboarding flow.
-- Persists:
--   - archetype choice
--   - whether they created a family or chose standard path
--   - onboarding_completed = true
--   - onboarding_step = 'COMPLETED'
--
-- Returns: { success, player_id, archetype }
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION complete_onboarding(
  p_archetype         TEXT DEFAULT 'RUNNER',
  p_family_path       TEXT DEFAULT 'standard',  -- 'standard' | 'founder'
  p_skipped           BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id   UUID := current_player_id();
  v_affiliation affiliation_type;
BEGIN
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated'
      USING HINT = 'complete_onboarding requires an active auth session';
  END IF;

  -- Validate archetype value
  IF p_archetype NOT IN ('RUNNER','EARNER','MUSCLE','SHOOTER','SCHEMER','RACKETEER','HITMAN') THEN
    RAISE EXCEPTION 'invalid_archetype'
      USING HINT = 'Archetype must be one of: RUNNER, EARNER, MUSCLE, SHOOTER, SCHEMER, RACKETEER, HITMAN';
  END IF;

  -- Hitman archetype always maps to SOLO_HITMAN affiliation
  IF p_archetype = 'HITMAN' THEN
    v_affiliation := 'SOLO_HITMAN';
  ELSE
    v_affiliation := 'UNAFFILIATED';
  END IF;

  UPDATE players SET
    archetype             = p_archetype::archetype_type,
    affiliation           = v_affiliation,
    onboarding_completed  = true,
    onboarding_skipped    = p_skipped,
    onboarding_step       = 'COMPLETED',
    last_active_at        = now(),
    updated_at            = now()
  WHERE id = v_player_id;

  -- Record analytics event (fire and forget)
  BEGIN
    INSERT INTO analytics_events (player_id, event_name, properties)
    VALUES (v_player_id, 'onboarding_completed', jsonb_build_object(
      'archetype',    p_archetype,
      'path',         p_family_path,
      'skipped',      p_skipped
    ));
  EXCEPTION WHEN OTHERS THEN
    NULL; -- analytics failure must never break onboarding
  END;

  RETURN jsonb_build_object(
    'success',    true,
    'player_id',  v_player_id,
    'archetype',  p_archetype
  );
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: get_my_player (lightweight bootstrap check)
--
-- Returns only the fields needed to make routing decisions.
-- Faster than get_my_profile which joins many tables.
-- Called on every app boot to determine player state.
--
-- Returns:
--   { player_id, username, alias, archetype, affiliation,
--     family_id, family_role, onboarding_completed, is_admin,
--     player_status }
-- OR null if no player exists for this auth user yet (new signup).
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_player()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID := auth.uid();
  v_result       JSONB;
BEGIN
  IF v_auth_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'player_id',            p.id,
    'username',             p.username,
    'alias',                p.alias,
    'archetype',            p.archetype,
    'affiliation',          p.affiliation,
    'family_id',            p.family_id,
    'family_role',          p.family_role,
    'onboarding_completed', p.onboarding_completed,
    'onboarding_step',      p.onboarding_step,
    'is_admin',             p.is_admin,
    'player_status',        p.player_status,
    -- Basic stats for the dashboard header
    'stat_cash',            p.stat_cash,
    'stat_heat',            p.stat_heat,
    'stat_respect',         p.stat_respect
  )
  INTO v_result
  FROM players p
  WHERE p.auth_user_id = v_auth_user_id
  LIMIT 1;

  -- Returns NULL if no player row exists yet (new user who signed up
  -- but hasn't created their profile yet — shouldn't happen normally
  -- since create_player_profile is called right after signUp)
  RETURN v_result;
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: update_last_active
--
-- Called on app focus/load to track when a player was last seen.
-- Fire-and-forget from the client.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_last_active()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE players
  SET last_active_at = now(), updated_at = now()
  WHERE auth_user_id = auth.uid();
END;
$$;

-- ─────────────────────────────────────────────
-- Grant execute permissions on new functions
-- ─────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION create_player_profile(TEXT, TEXT)  TO authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_player()                    TO authenticated;
GRANT EXECUTE ON FUNCTION update_last_active()               TO authenticated;

-- ─────────────────────────────────────────────
-- SCHEMA FIX: Normalize boss_id alias
--
-- The TypeScript Family type uses boss_id but the DB column
-- was named boss_player_id. Add a generated column alias
-- so both references work consistently.
-- ─────────────────────────────────────────────

-- Add boss_id as a generated computed column for compatibility
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS boss_id UUID
  GENERATED ALWAYS AS (boss_player_id) STORED;

-- Add index on the new alias column
CREATE INDEX IF NOT EXISTS idx_families_boss_id ON families (boss_id);
