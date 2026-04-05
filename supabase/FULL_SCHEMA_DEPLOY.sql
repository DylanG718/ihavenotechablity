-- ================================================================
-- MAFIALIFE — FULL DATABASE SCHEMA
-- Run this ONCE in Supabase SQL Editor to set up all tables,
-- RLS policies, RPC functions, and seed data.
--
-- Project: nmuuxsvpydxyefomabzl.supabase.co
-- Generated: April 2026
-- ================================================================

-- Safety check: wrap everything in a transaction
BEGIN;

-- ----------------------------------------------------------------
-- MIGRATION: 001_initial_schema.sql
-- Initial Schema — enums, tables, indexes
-- ----------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════════════════
-- MAFIALIFE — Initial Database Schema
-- Migration: 001_initial_schema.sql
--
-- Conventions:
--   • All PKs are uuid DEFAULT gen_random_uuid()
--   • All tables have created_at TIMESTAMPTZ DEFAULT now()
--   • Foreign keys use ON DELETE RESTRICT unless explicitly set
--   • Enum types declared once at the top
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- ENUM TYPES
-- ─────────────────────────────────────────────

-- NOTE: BOSS archetype removed (2026-04), replaced by RUNNER.
-- Migration for existing BOSS players: see 004_runner_migration.sql
CREATE TYPE archetype_type AS ENUM (
  'RUNNER','EARNER','MUSCLE','SHOOTER','SCHEMER','RACKETEER','HITMAN'
);

CREATE TYPE family_role_type AS ENUM (
  'BOSS','UNDERBOSS','CONSIGLIERE','CAPO','SOLDIER','ASSOCIATE','RECRUIT'
);

CREATE TYPE affiliation_type AS ENUM (
  'UNAFFILIATED','RECRUIT','ASSOCIATE','MEMBER','LEADERSHIP','SOLO_HITMAN'
);

CREATE TYPE player_status_type AS ENUM (
  'ACTIVE','INACTIVE','JAILED','INCAPACITATED','DEAD','BLACKSITE'
);

CREATE TYPE death_state_type AS ENUM (
  'ALIVE','DEAD_ONCE','PERMANENTLY_DEAD'
);

CREATE TYPE family_status_type AS ENUM (
  'ACTIVE','AT_WAR','WEAKENED','DISSOLVED'
);

CREATE TYPE protection_mode_type AS ENUM (
  'NONE','SLEEP','VACATION'
);

CREATE TYPE turf_quality_type AS ENUM (
  'PRIME','SOLID','ROUGH','CONTESTED'
);

CREATE TYPE business_scale_type AS ENUM (
  'SMALL','LARGE','HQ'
);

CREATE TYPE front_type AS ENUM (
  'CASINO','CONSTRUCTION','NIGHTCLUB','CAR_REPAIR','PIZZERIA','SMALL_BAR',
  'PORT_LOGISTICS','WASTE_MANAGEMENT','REAL_ESTATE','HQ_CLUB'
);

CREATE TYPE business_role_type AS ENUM (
  'MANAGER','OPERATIONS_STAFF','SECURITY_STAFF','FINANCE_STAFF','VIP_HOST'
);

CREATE TYPE skill_tag_type AS ENUM (
  'OPERATIONS','SECURITY','FINANCE','CHARM'
);

CREATE TYPE min_rank_type AS ENUM (
  'ASSOCIATE','SOLDIER','CAPO','CONSIGLIERE','UNDERBOSS','DON'
);

CREATE TYPE job_mode_type AS ENUM (
  'SOLO','CREW','SOLO_OR_CREW'
);

CREATE TYPE diplomatic_status_type AS ENUM (
  'NEUTRAL','NON_AGGRESSION_PACT','ALLIED','AT_WAR'
);

CREATE TYPE message_status_type AS ENUM (
  'OPEN','ESCALATED','RESOLVED'
);

CREATE TYPE obituary_event_type AS ENUM (
  'DEATH','WITNESS_PROTECTION','RETIREMENT','FAMILY_DISSOLVED','LEADERSHIP_CHANGE'
);

CREATE TYPE season_status_type AS ENUM (
  'UPCOMING','ACTIVE','ENDED'
);

CREATE TYPE notification_type AS ENUM (
  'BUSINESS_ASSIGNMENT_ADDED','BUSINESS_ASSIGNMENT_REMOVED',
  'PROMOTED','DEMOTED','NEW_CHAIN_MESSAGE','JOB_INVITE_RECEIVED',
  'PASSIVE_INCOME_PAYOUT','JAIL_ENTERED','JAIL_RELEASED',
  'STASH_ROBBERY_ATTEMPTED','SLEEP_MODE_EXPIRING','VACATION_EXPIRING',
  'FAMILY_APPLICATION_ACCEPTED','FAMILY_APPLICATION_REJECTED',
  'NEW_FAMILY_BOARD_POST','DIPLOMACY_STATE_CHANGED',
  'WAR_DECLARED','TURF_ATTACK_INCOMING','SEASON_ENDING_SOON','RANK_ELIGIBLE'
);

CREATE TYPE jail_tier_type AS ENUM (
  'COUNTY_LOCKUP','STATE_PENITENTIARY','FEDERAL_DETENTION'
);

-- ─────────────────────────────────────────────
-- SEASONS
-- (created before families so families can reference current_season_id)
-- ─────────────────────────────────────────────

CREATE TABLE seasons (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number          INTEGER NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  status          season_status_type NOT NULL DEFAULT 'UPCOMING',
  started_at      TIMESTAMPTZ,
  ends_at         TIMESTAMPTZ,
  soft_reset_fields TEXT[] NOT NULL DEFAULT '{}',
  preserved_fields  TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seasons_status ON seasons (status);

-- ─────────────────────────────────────────────
-- FAMILIES
-- ─────────────────────────────────────────────

CREATE TABLE families (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  motto             TEXT,
  -- boss_id references players, but players references families — we defer the FK
  boss_player_id    UUID,
  treasury          BIGINT NOT NULL DEFAULT 0,
  prestige          INTEGER NOT NULL DEFAULT 0,
  power_score       INTEGER NOT NULL DEFAULT 0,
  status            family_status_type NOT NULL DEFAULT 'ACTIVE',
  -- territory is a list of turf ids, maintained via turf.family_id
  -- cached summary fields (updated by triggers / RPC)
  member_count      INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_families_status ON families (status);
CREATE INDEX idx_families_boss ON families (boss_player_id);

-- ─────────────────────────────────────────────
-- PLAYERS
-- ─────────────────────────────────────────────

CREATE TABLE players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Links to Supabase auth.users
  auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  username        TEXT NOT NULL UNIQUE,
  alias           TEXT NOT NULL,
  archetype       archetype_type NOT NULL DEFAULT 'EARNER',
  affiliation     affiliation_type NOT NULL DEFAULT 'UNAFFILIATED',
  family_id       UUID REFERENCES families(id) ON DELETE SET NULL,
  family_role     family_role_type,
  crew_id         UUID, -- FK added after crews table
  crew_role       TEXT CHECK (crew_role IN ('LEADER','MEMBER')),
  player_status   player_status_type NOT NULL DEFAULT 'ACTIVE',
  death_state     death_state_type NOT NULL DEFAULT 'ALIVE',

  -- Core stats (cached; updated by game functions)
  stat_cash             BIGINT NOT NULL DEFAULT 5000,
  stat_stash            BIGINT NOT NULL DEFAULT 0,
  stat_heat             INTEGER NOT NULL DEFAULT 0,
  stat_hp               INTEGER NOT NULL DEFAULT 100,
  stat_respect          INTEGER NOT NULL DEFAULT 0,
  stat_strength         INTEGER NOT NULL DEFAULT 20,
  stat_accuracy         INTEGER NOT NULL DEFAULT 20,
  stat_intelligence     INTEGER NOT NULL DEFAULT 20,
  stat_charisma         INTEGER NOT NULL DEFAULT 20,
  stat_luck             INTEGER NOT NULL DEFAULT 20,
  stat_intimidation     INTEGER NOT NULL DEFAULT 20,
  stat_clout            INTEGER NOT NULL DEFAULT 20,
  stat_leadership       INTEGER NOT NULL DEFAULT 20,
  stat_business         INTEGER NOT NULL DEFAULT 20,
  stat_suspicion        INTEGER NOT NULL DEFAULT 0,
  stat_kills            INTEGER NOT NULL DEFAULT 0,

  -- Onboarding
  onboarding_step       TEXT NOT NULL DEFAULT 'INTRO',
  onboarding_completed  BOOLEAN NOT NULL DEFAULT false,
  onboarding_skipped    BOOLEAN NOT NULL DEFAULT false,

  -- Protection state
  protection_mode       protection_mode_type NOT NULL DEFAULT 'NONE',
  protection_expires_at TIMESTAMPTZ,
  last_sleep_at         TIMESTAMPTZ,
  last_vacation_at      TIMESTAMPTZ,

  is_admin              BOOLEAN NOT NULL DEFAULT false,

  joined_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_players_auth_user  ON players (auth_user_id);
CREATE INDEX idx_players_family     ON players (family_id);
CREATE INDEX idx_players_username   ON players (username);
CREATE INDEX idx_players_status     ON players (player_status);

-- Now we can add the deferred FK on families.boss_player_id
ALTER TABLE families
  ADD CONSTRAINT fk_families_boss
  FOREIGN KEY (boss_player_id) REFERENCES players(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- CREWS
-- ─────────────────────────────────────────────

CREATE TABLE crews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  leader_id   UUID NOT NULL REFERENCES players(id) ON DELETE RESTRICT,
  description TEXT,
  territory   TEXT[] NOT NULL DEFAULT '{}', -- district slugs
  status      TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE','DISBANDED')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crews_family ON crews (family_id);
CREATE INDEX idx_crews_leader ON crews (leader_id);

-- Add deferred FK from players.crew_id
ALTER TABLE players
  ADD CONSTRAINT fk_players_crew
  FOREIGN KEY (crew_id) REFERENCES crews(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────
-- DISTRICTS
-- ─────────────────────────────────────────────

CREATE TABLE districts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug                  TEXT NOT NULL UNIQUE,
  name                  TEXT NOT NULL,
  description           TEXT,
  tagline               TEXT,
  theme                 TEXT NOT NULL, -- POLITICAL, MARITIME, etc.
  turf_count_target     INTEGER NOT NULL DEFAULT 6,
  allowed_front_types   front_type[] NOT NULL DEFAULT '{}',
  influence_bonus_type  TEXT NOT NULL DEFAULT 'NONE',
  display_order         INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_districts_slug ON districts (slug);

-- ─────────────────────────────────────────────
-- TURFS
-- ─────────────────────────────────────────────

CREATE TABLE turfs (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id           UUID NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
  family_id             UUID REFERENCES families(id) ON DELETE SET NULL,
  name                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE, -- stable short id, e.g. "turf-dt-01"
  slot_count            INTEGER NOT NULL CHECK (slot_count IN (4, 6, 8)),
  purchase_cost         BIGINT NOT NULL,
  quality_tier          turf_quality_type NOT NULL DEFAULT 'SOLID',
  location_note         TEXT,
  purchased_at          TIMESTAMPTZ,
  purchased_by_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_turfs_district ON turfs (district_id);
CREATE INDEX idx_turfs_family   ON turfs (family_id);
CREATE INDEX idx_turfs_slug     ON turfs (slug);

-- ─────────────────────────────────────────────
-- DISTRICT INFLUENCE (computed, refreshed by RPC)
-- ─────────────────────────────────────────────

CREATE TABLE district_influences (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id         UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  score               INTEGER NOT NULL DEFAULT 0,
  turf_count          INTEGER NOT NULL DEFAULT 0,
  front_count         INTEGER NOT NULL DEFAULT 0,
  staffed_slots       INTEGER NOT NULL DEFAULT 0,
  last_calculated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (district_id, family_id)
);

CREATE INDEX idx_district_inf_district ON district_influences (district_id);
CREATE INDEX idx_district_inf_family   ON district_influences (family_id);
CREATE INDEX idx_district_inf_score    ON district_influences (district_id, score DESC);

-- ─────────────────────────────────────────────
-- BUSINESS DEFINITIONS (catalog, not per-instance)
-- ─────────────────────────────────────────────

CREATE TABLE business_definitions (
  id                      front_type PRIMARY KEY,
  display_name            TEXT NOT NULL,
  scale                   business_scale_type NOT NULL,
  base_profit_per_tick    BIGINT NOT NULL DEFAULT 0,
  base_risk               NUMERIC(4,3) NOT NULL DEFAULT 0.1,
  build_cost              BIGINT NOT NULL,
  recommended_manager_rank min_rank_type NOT NULL DEFAULT 'CAPO',
  allowed_districts       TEXT[] NOT NULL DEFAULT '{}',
  description             TEXT,
  lore                    TEXT,
  implemented             BOOLEAN NOT NULL DEFAULT false,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- BUSINESS SLOT DEFINITIONS (catalog)
-- ─────────────────────────────────────────────

CREATE TABLE business_slot_definitions (
  id                    TEXT PRIMARY KEY, -- e.g. "slot-casino-manager"
  business_type         front_type NOT NULL REFERENCES business_definitions(id),
  role_type             business_role_type NOT NULL,
  display_name          TEXT NOT NULL,
  required_min_rank     min_rank_type NOT NULL,
  preferred_skill       skill_tag_type,
  max_one_per_business  BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bsd_business_type ON business_slot_definitions (business_type);

-- ─────────────────────────────────────────────
-- BUSINESS EXCLUSIVE JOBS (catalog)
-- ─────────────────────────────────────────────

CREATE TABLE business_exclusive_jobs (
  id                          TEXT PRIMARY KEY, -- e.g. "CASINO_RIG_HIGH_ROLLER"
  business_type               front_type NOT NULL REFERENCES business_definitions(id),
  name                        TEXT NOT NULL,
  description                 TEXT,
  mode                        job_mode_type NOT NULL,
  min_rank                    min_rank_type NOT NULL,
  allowed_slot_definition_ids TEXT[] NOT NULL DEFAULT '{}',
  min_crew_size               INTEGER NOT NULL DEFAULT 1,
  max_crew_size               INTEGER,
  primary_skill               skill_tag_type,
  secondary_skill             skill_tag_type,
  reward_cash_min             BIGINT NOT NULL,
  reward_cash_max             BIGINT NOT NULL,
  reward_family_share_pct     INTEGER NOT NULL DEFAULT 50,
  reward_manager_share_pct    INTEGER NOT NULL DEFAULT 30,
  reward_staff_share_pct      INTEGER NOT NULL DEFAULT 20,
  base_jail_risk              NUMERIC(4,3) NOT NULL DEFAULT 0.1,
  cooldown_seconds            INTEGER NOT NULL DEFAULT 3600,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bej_business_type ON business_exclusive_jobs (business_type);

-- ─────────────────────────────────────────────
-- FRONT INSTANCES (placed businesses on turfs)
-- ─────────────────────────────────────────────

CREATE TABLE front_instances (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turf_id           UUID NOT NULL REFERENCES turfs(id) ON DELETE CASCADE,
  slot_index        INTEGER NOT NULL, -- 0 to turf.slot_count - 1
  front_type        front_type NOT NULL REFERENCES business_definitions(id),
  family_id         UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  upgrade_level     INTEGER NOT NULL DEFAULT 1 CHECK (upgrade_level BETWEEN 1 AND 3),
  manager_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  daily_income_cache BIGINT NOT NULL DEFAULT 0, -- recalculated on upgrade
  built_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (turf_id, slot_index)
);

CREATE INDEX idx_front_turf   ON front_instances (turf_id);
CREATE INDEX idx_front_family ON front_instances (family_id);
CREATE INDEX idx_front_type   ON front_instances (front_type);

-- ─────────────────────────────────────────────
-- BUSINESS ASSIGNMENTS (who holds what slot)
-- ─────────────────────────────────────────────

CREATE TABLE business_assignments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  front_instance_id   UUID NOT NULL REFERENCES front_instances(id) ON DELETE CASCADE,
  slot_definition_id  TEXT NOT NULL REFERENCES business_slot_definitions(id),
  player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  assigned_by         UUID REFERENCES players(id) ON DELETE SET NULL,
  assigned_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (front_instance_id, slot_definition_id)
);

CREATE INDEX idx_ba_front    ON business_assignments (front_instance_id);
CREATE INDEX idx_ba_player   ON business_assignments (player_id);
CREATE INDEX idx_ba_slot_def ON business_assignments (slot_definition_id);

-- ─────────────────────────────────────────────
-- UNIVERSAL JOBS (catalog)
-- ─────────────────────────────────────────────

CREATE TABLE jobs (
  id                    TEXT PRIMARY KEY, -- e.g. "j-univ-01"
  name                  TEXT NOT NULL,
  lore_tagline          TEXT,
  description           TEXT,
  tier                  NUMERIC(3,1) NOT NULL, -- 1, 1.5, 2, 3, 3.5, 4, 5
  category              TEXT NOT NULL,
  min_rank              min_rank_type NOT NULL,
  universal             BOOLEAN NOT NULL DEFAULT false,
  mode                  job_mode_type NOT NULL,
  min_crew_size         INTEGER NOT NULL DEFAULT 0,
  cooldown_seconds      INTEGER NOT NULL DEFAULT 3600,
  reward_cash_min       BIGINT NOT NULL,
  reward_cash_max       BIGINT NOT NULL,
  reward_types          TEXT[] NOT NULL DEFAULT '{"CASH","XP"}',
  base_jail_risk        NUMERIC(4,3) NOT NULL DEFAULT 0.05,
  hitman_eligible       BOOLEAN NOT NULL DEFAULT false,
  war_context_only      BOOLEAN NOT NULL DEFAULT false,
  effect_scope          TEXT NOT NULL DEFAULT 'SELF'
    CHECK (effect_scope IN ('SELF','FAMILY_ABSTRACT')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_universal ON jobs (universal);
CREATE INDEX idx_jobs_min_rank  ON jobs (min_rank);

-- ─────────────────────────────────────────────
-- PLAYER JOB STATES (cooldowns per player per job)
-- ─────────────────────────────────────────────

CREATE TABLE player_job_states (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id           UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  job_id              TEXT NOT NULL, -- references jobs.id or business_exclusive_jobs.id
  last_completed_at   TIMESTAMPTZ,
  last_failed_at      TIMESTAMPTZ,
  total_completions   INTEGER NOT NULL DEFAULT 0,
  total_earnings      BIGINT NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (player_id, job_id)
);

CREATE INDEX idx_pjs_player ON player_job_states (player_id);
CREATE INDEX idx_pjs_job    ON player_job_states (job_id);

-- ─────────────────────────────────────────────
-- FAMILY RELATIONSHIPS (diplomacy)
-- ─────────────────────────────────────────────

CREATE TABLE family_relationships (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_a_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_b_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  status        diplomatic_status_type NOT NULL DEFAULT 'NEUTRAL',
  proposed_by   UUID REFERENCES players(id) ON DELETE SET NULL,
  cooldown_ends_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (family_a_id, family_b_id),
  CHECK (family_a_id < family_b_id) -- canonical ordering prevents duplicates
);

CREATE INDEX idx_frel_family_a ON family_relationships (family_a_id);
CREATE INDEX idx_frel_family_b ON family_relationships (family_b_id);

-- ─────────────────────────────────────────────
-- FAMILY BOARD POSTS
-- ─────────────────────────────────────────────

CREATE TABLE family_board_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id   UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  pinned      BOOLEAN NOT NULL DEFAULT false,
  pinned_by   UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_board_family ON family_board_posts (family_id, created_at DESC);

CREATE TABLE family_board_replies (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES family_board_posts(id) ON DELETE CASCADE,
  author_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reply_post ON family_board_replies (post_id);

-- ─────────────────────────────────────────────
-- CHAIN-OF-COMMAND MESSAGES
-- ─────────────────────────────────────────────

CREATE TABLE chain_messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  from_player_id  UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  to_player_id    UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  subject         TEXT NOT NULL,
  body            TEXT NOT NULL,
  status          message_status_type NOT NULL DEFAULT 'OPEN',
  escalated_to    UUID REFERENCES players(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_msg_to_player ON chain_messages (to_player_id, created_at DESC);
CREATE INDEX idx_msg_family    ON chain_messages (family_id);

-- ─────────────────────────────────────────────
-- JAIL RECORDS
-- ─────────────────────────────────────────────

CREATE TABLE jail_records (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  tier              jail_tier_type NOT NULL DEFAULT 'COUNTY_LOCKUP',
  reason            TEXT NOT NULL,
  sentence_end_at   TIMESTAMPTZ NOT NULL,
  bribe_cost        BIGINT NOT NULL DEFAULT 0,
  released_at       TIMESTAMPTZ,
  release_method    TEXT CHECK (release_method IN ('SERVED','BRIBED','LAWYER','BAIL_MISSION','ADMIN')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jail_player ON jail_records (player_id, created_at DESC);

-- ─────────────────────────────────────────────
-- OBITUARY ENTRIES
-- ─────────────────────────────────────────────

CREATE TABLE obituary_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    obituary_event_type NOT NULL,
  player_id     UUID REFERENCES players(id) ON DELETE SET NULL,
  player_alias  TEXT NOT NULL,
  family_id     UUID REFERENCES families(id) ON DELETE SET NULL,
  family_name   TEXT,
  note          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_obit_created ON obituary_entries (created_at DESC);
CREATE INDEX idx_obit_type    ON obituary_entries (event_type);

-- ─────────────────────────────────────────────
-- PLAYER NOTIFICATIONS
-- ─────────────────────────────────────────────

CREATE TABLE notifications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id             UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  type                  notification_type NOT NULL,
  title                 TEXT NOT NULL,
  body                  TEXT NOT NULL,
  read                  BOOLEAN NOT NULL DEFAULT false,
  related_entity_id     TEXT,
  related_entity_type   TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notif_player ON notifications (player_id, created_at DESC);
CREATE INDEX idx_notif_unread ON notifications (player_id, read) WHERE NOT read;

-- ─────────────────────────────────────────────
-- PROMOTION / DEMOTION HISTORY
-- ─────────────────────────────────────────────

CREATE TABLE rank_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id         UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  from_rank         TEXT NOT NULL,
  to_rank           TEXT NOT NULL,
  reason            TEXT NOT NULL,
  granted_by_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  note              TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rank_history_player ON rank_history (player_id, created_at DESC);

-- ─────────────────────────────────────────────
-- CONTRIBUTION SCORES
-- ─────────────────────────────────────────────

CREATE TABLE contribution_scores (
  player_id                 UUID PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  jobs_completed            INTEGER NOT NULL DEFAULT 0,
  missions_completed        INTEGER NOT NULL DEFAULT 0,
  money_earned              BIGINT NOT NULL DEFAULT 0,
  business_jobs_completed   INTEGER NOT NULL DEFAULT 0,
  passive_income_generated  BIGINT NOT NULL DEFAULT 0,
  loyalty_days              INTEGER NOT NULL DEFAULT 0,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────────
-- LEADERBOARD SNAPSHOTS
-- ─────────────────────────────────────────────

CREATE TABLE leaderboard_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id             UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  snapshot_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  family_id             UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_name           TEXT NOT NULL,
  don_alias             TEXT NOT NULL,
  rank                  INTEGER NOT NULL,
  composite_score       INTEGER NOT NULL DEFAULT 0,
  turf_score            INTEGER NOT NULL DEFAULT 0,
  income_score          INTEGER NOT NULL DEFAULT 0,
  treasury_score        INTEGER NOT NULL DEFAULT 0,
  prestige_score        INTEGER NOT NULL DEFAULT 0,
  member_strength_score INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_snapshot_season ON leaderboard_snapshots (season_id, rank);

-- ─────────────────────────────────────────────
-- ANALYTICS EVENTS
-- ─────────────────────────────────────────────

CREATE TABLE analytics_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name      TEXT NOT NULL,
  player_id       UUID REFERENCES players(id) ON DELETE SET NULL,
  family_id       UUID REFERENCES families(id) ON DELETE SET NULL,
  family_role     TEXT,
  district_id     UUID REFERENCES districts(id) ON DELETE SET NULL,
  entity_id       TEXT,
  entity_type     TEXT,
  properties      JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analytics_event_name ON analytics_events (event_name, created_at DESC);
CREATE INDEX idx_analytics_player     ON analytics_events (player_id, created_at DESC);

-- ─────────────────────────────────────────────
-- LIVE-OPS EVENTS
-- ─────────────────────────────────────────────

CREATE TABLE liveops_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  description       TEXT,
  flavor            TEXT,
  scope             TEXT NOT NULL CHECK (scope IN ('WORLD','DISTRICT','FRONT_TYPE','FAMILY')),
  scope_target_id   TEXT,
  modifiers         JSONB NOT NULL DEFAULT '[]',
  start_at          TIMESTAMPTZ NOT NULL,
  end_at            TIMESTAMPTZ NOT NULL,
  active            BOOLEAN NOT NULL DEFAULT false,
  admin_triggered   BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_liveops_active ON liveops_events (active, start_at, end_at);

-- ─────────────────────────────────────────────
-- FAMILY ACTIVITY FEED
-- ─────────────────────────────────────────────

CREATE TABLE family_activity_feed (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL,
  actor_alias   TEXT NOT NULL,
  actor_role    TEXT,
  description   TEXT NOT NULL,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_faf_family ON family_activity_feed (family_id, created_at DESC);

-- ─────────────────────────────────────────────
-- WORLD ACTIVITY FEED
-- ─────────────────────────────────────────────

CREATE TABLE world_activity_feed (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type    TEXT NOT NULL,
  headline      TEXT NOT NULL,
  detail        TEXT,
  family_id     UUID REFERENCES families(id) ON DELETE SET NULL,
  district_id   UUID REFERENCES districts(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_waf_created ON world_activity_feed (created_at DESC);

-- ─────────────────────────────────────────────
-- UPDATED_AT TRIGGER FUNCTION (reusable)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to mutable tables
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'players', 'families', 'crews', 'turfs',
    'front_instances', 'family_board_posts', 'chain_messages',
    'family_relationships', 'liveops_events', 'seasons'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      t, t
    );
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------
-- MIGRATION: 002_rls_policies.sql
-- Row Level Security Policies
-- ----------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════════════════
-- MAFIALIFE — Row Level Security Policies
-- Migration: 002_rls_policies.sql
--
-- RLS DESIGN PRINCIPLES:
--   • auth.uid() identifies the Supabase auth user
--   • Players are linked to auth via players.auth_user_id = auth.uid()
--   • Helper function current_player_id() resolves this join
--   • Admins (players.is_admin = true) bypass most restrictions
--   • "Family member" = player in same family as target
--   • "Leadership" = BOSS, UNDERBOSS, CONSIGLIERE, CAPO roles
--
-- TABLES WITH RLS:
--   players, families, crews, turfs, district_influences,
--   front_instances, business_assignments, player_job_states,
--   notifications, chain_messages, family_board_posts,
--   family_board_replies, jail_records, obituary_entries,
--   rank_history, contribution_scores, analytics_events
--
-- TABLES WITHOUT RLS (public/catalog reads, admin writes only):
--   districts, business_definitions, business_slot_definitions,
--   business_exclusive_jobs, jobs, seasons, leaderboard_snapshots,
--   liveops_events, family_activity_feed, world_activity_feed
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- HELPER FUNCTION: resolve auth.uid() → player id
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_player_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM players WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────
-- HELPER: check if current player is admin
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM players WHERE auth_user_id = auth.uid() LIMIT 1),
    false
  );
$$;

-- ─────────────────────────────────────────────
-- HELPER: get current player's family_id
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION current_family_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT family_id FROM players WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- ─────────────────────────────────────────────
-- HELPER: is current player a family leader?
-- (BOSS, UNDERBOSS, CONSIGLIERE, CAPO)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION is_family_leadership()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT COALESCE(
    (SELECT family_role IN ('BOSS','UNDERBOSS','CONSIGLIERE','CAPO')
     FROM players WHERE auth_user_id = auth.uid() LIMIT 1),
    false
  );
$$;

-- ─────────────────────────────────────────────
-- ENABLE RLS ON ALL SENSITIVE TABLES
-- ─────────────────────────────────────────────

ALTER TABLE players                ENABLE ROW LEVEL SECURITY;
ALTER TABLE families               ENABLE ROW LEVEL SECURITY;
ALTER TABLE crews                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE turfs                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE district_influences    ENABLE ROW LEVEL SECURITY;
ALTER TABLE front_instances        ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_assignments   ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_job_states      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE chain_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_board_posts     ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_board_replies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE jail_records           ENABLE ROW LEVEL SECURITY;
ALTER TABLE obituary_entries       ENABLE ROW LEVEL SECURITY;
ALTER TABLE rank_history           ENABLE ROW LEVEL SECURITY;
ALTER TABLE contribution_scores    ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_activity_feed   ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events       ENABLE ROW LEVEL SECURITY;

-- Catalog tables: public read, no writes from client
ALTER TABLE districts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_definitions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_slot_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_exclusive_jobs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons                ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_snapshots  ENABLE ROW LEVEL SECURITY;
ALTER TABLE liveops_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE world_activity_feed    ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────
-- CATALOG TABLES — public read, admin write
-- ─────────────────────────────────────────────

CREATE POLICY "catalog_read_all"    ON districts              FOR SELECT USING (true);
CREATE POLICY "catalog_read_all"    ON business_definitions   FOR SELECT USING (true);
CREATE POLICY "catalog_read_all"    ON business_slot_definitions FOR SELECT USING (true);
CREATE POLICY "catalog_read_all"    ON business_exclusive_jobs   FOR SELECT USING (true);
CREATE POLICY "catalog_read_all"    ON jobs                   FOR SELECT USING (true);
CREATE POLICY "catalog_read_all"    ON seasons                FOR SELECT USING (true);
CREATE POLICY "catalog_read_all"    ON leaderboard_snapshots  FOR SELECT USING (true);
CREATE POLICY "catalog_read_all"    ON liveops_events         FOR SELECT USING (active = true OR is_admin());
CREATE POLICY "catalog_read_all"    ON world_activity_feed    FOR SELECT USING (true);

-- Admin writes to catalog
CREATE POLICY "admin_write"         ON districts              FOR ALL USING (is_admin());
CREATE POLICY "admin_write"         ON business_definitions   FOR ALL USING (is_admin());
CREATE POLICY "admin_write"         ON business_slot_definitions FOR ALL USING (is_admin());
CREATE POLICY "admin_write"         ON business_exclusive_jobs   FOR ALL USING (is_admin());
CREATE POLICY "admin_write"         ON jobs                   FOR ALL USING (is_admin());
CREATE POLICY "admin_write"         ON seasons                FOR ALL USING (is_admin());
CREATE POLICY "admin_write"         ON leaderboard_snapshots  FOR ALL USING (is_admin());
CREATE POLICY "admin_write"         ON liveops_events         FOR ALL USING (is_admin());
CREATE POLICY "admin_write"         ON world_activity_feed    FOR ALL USING (is_admin());

-- ─────────────────────────────────────────────
-- PLAYERS
-- Read: everyone can see basic public profile
-- Write: own row only; admin can write all
-- ─────────────────────────────────────────────

CREATE POLICY "players_read_public"
  ON players FOR SELECT
  USING (true); -- all players visible (public profiles)

CREATE POLICY "players_write_own"
  ON players FOR UPDATE
  USING (auth_user_id = auth.uid() OR is_admin())
  WITH CHECK (auth_user_id = auth.uid() OR is_admin());

CREATE POLICY "players_insert_own"
  ON players FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- Admin can delete
CREATE POLICY "players_admin_delete"
  ON players FOR DELETE
  USING (is_admin());

-- ─────────────────────────────────────────────
-- FAMILIES
-- Read: all authenticated users
-- Write: only BOSS of that family or admin
-- ─────────────────────────────────────────────

CREATE POLICY "families_read_all"
  ON families FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "families_write_boss"
  ON families FOR UPDATE
  USING (
    boss_player_id = current_player_id()
    OR is_admin()
  );

CREATE POLICY "families_insert_authenticated"
  ON families FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────
-- CREWS
-- Read: members of same family can see all crews in their family
-- Write: UNDERBOSS+ of same family or admin
-- ─────────────────────────────────────────────

CREATE POLICY "crews_read_family_members"
  ON crews FOR SELECT
  USING (
    family_id = current_family_id()
    OR is_admin()
  );

CREATE POLICY "crews_write_leadership"
  ON crews FOR ALL
  USING (
    (family_id = current_family_id() AND is_family_leadership())
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- TURFS
-- Read: all (ownership is public knowledge)
-- Write: boss of owning family, or admin for purchase
-- ─────────────────────────────────────────────

CREATE POLICY "turfs_read_all"
  ON turfs FOR SELECT
  USING (true);

CREATE POLICY "turfs_write_boss_or_admin"
  ON turfs FOR UPDATE
  USING (
    (
      family_id = current_family_id()
      AND EXISTS (
        SELECT 1 FROM players p
        WHERE p.auth_user_id = auth.uid()
          AND p.family_role = 'BOSS'
      )
    )
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- DISTRICT INFLUENCES
-- Public read (power map), admin/server write
-- ─────────────────────────────────────────────

CREATE POLICY "dist_inf_read_all"
  ON district_influences FOR SELECT
  USING (true);

CREATE POLICY "dist_inf_write_admin"
  ON district_influences FOR ALL
  USING (is_admin());

-- ─────────────────────────────────────────────
-- FRONT INSTANCES
-- Read: family members of owning family (+ public summary)
-- Write: UNDERBOSS+ of owning family or admin
-- ─────────────────────────────────────────────

CREATE POLICY "fronts_read_family"
  ON front_instances FOR SELECT
  USING (
    family_id = current_family_id()
    OR is_admin()
    OR true -- fronts are semi-public (overview visible)
  );

CREATE POLICY "fronts_write_leadership"
  ON front_instances FOR ALL
  USING (
    (family_id = current_family_id() AND is_family_leadership())
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- BUSINESS ASSIGNMENTS
-- Read: assigned player, family leadership, admin
-- Write: UNDERBOSS+ or admin
-- ─────────────────────────────────────────────

CREATE POLICY "biz_assign_read"
  ON business_assignments FOR SELECT
  USING (
    player_id = current_player_id()
    OR (
      is_family_leadership()
      AND EXISTS (
        SELECT 1 FROM front_instances fi
        WHERE fi.id = front_instance_id
          AND fi.family_id = current_family_id()
      )
    )
    OR is_admin()
  );

CREATE POLICY "biz_assign_write_leadership"
  ON business_assignments FOR ALL
  USING (
    (
      is_family_leadership()
      AND EXISTS (
        SELECT 1 FROM front_instances fi
        WHERE fi.id = front_instance_id
          AND fi.family_id = current_family_id()
      )
    )
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- PLAYER JOB STATES
-- Only the player and admin
-- ─────────────────────────────────────────────

CREATE POLICY "pjs_own_player"
  ON player_job_states FOR ALL
  USING (
    player_id = current_player_id()
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- NOTIFICATIONS
-- Only the recipient and admin
-- ─────────────────────────────────────────────

CREATE POLICY "notif_own_player"
  ON notifications FOR SELECT
  USING (
    player_id = current_player_id()
    OR is_admin()
  );

CREATE POLICY "notif_update_own"
  ON notifications FOR UPDATE
  USING (player_id = current_player_id() OR is_admin())
  WITH CHECK (player_id = current_player_id() OR is_admin());

-- Server-side function inserts (via service role) bypass RLS — no insert policy needed for client.

-- ─────────────────────────────────────────────
-- CHAIN-OF-COMMAND MESSAGES
-- Read: sender or recipient; family leadership reads all
-- Write: sender only (via RPC)
-- ─────────────────────────────────────────────

CREATE POLICY "msg_read_parties"
  ON chain_messages FOR SELECT
  USING (
    from_player_id = current_player_id()
    OR to_player_id = current_player_id()
    OR escalated_to = current_player_id()
    OR (family_id = current_family_id() AND is_family_leadership())
    OR is_admin()
  );

CREATE POLICY "msg_write_rpc_or_admin"
  ON chain_messages FOR ALL
  USING (is_admin()); -- writes go through RPC which uses service role

-- ─────────────────────────────────────────────
-- FAMILY BOARD
-- Read: family members
-- Write: family members (post), leadership (pin)
-- ─────────────────────────────────────────────

CREATE POLICY "board_read_members"
  ON family_board_posts FOR SELECT
  USING (
    family_id = current_family_id()
    OR is_admin()
  );

CREATE POLICY "board_post_members"
  ON family_board_posts FOR INSERT
  WITH CHECK (
    family_id = current_family_id()
    AND author_id = current_player_id()
  );

CREATE POLICY "board_update_author_or_leader"
  ON family_board_posts FOR UPDATE
  USING (
    (author_id = current_player_id())
    OR (family_id = current_family_id() AND is_family_leadership())
    OR is_admin()
  );

CREATE POLICY "board_replies_read"
  ON family_board_replies FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_board_posts p
      WHERE p.id = post_id AND p.family_id = current_family_id()
    )
    OR is_admin()
  );

CREATE POLICY "board_replies_insert"
  ON family_board_replies FOR INSERT
  WITH CHECK (
    author_id = current_player_id()
    AND EXISTS (
      SELECT 1 FROM family_board_posts p
      WHERE p.id = post_id AND p.family_id = current_family_id()
    )
  );

-- ─────────────────────────────────────────────
-- JAIL RECORDS
-- Own player + family leadership + admin
-- ─────────────────────────────────────────────

CREATE POLICY "jail_read_own_or_leadership"
  ON jail_records FOR SELECT
  USING (
    player_id = current_player_id()
    OR (
      is_family_leadership()
      AND EXISTS (
        SELECT 1 FROM players p2
        WHERE p2.id = player_id
          AND p2.family_id = current_family_id()
      )
    )
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- OBITUARIES — public
-- ─────────────────────────────────────────────

CREATE POLICY "obit_read_all"
  ON obituary_entries FOR SELECT
  USING (true);

CREATE POLICY "obit_write_admin"
  ON obituary_entries FOR ALL
  USING (is_admin());

-- ─────────────────────────────────────────────
-- RANK HISTORY — own + family leadership
-- ─────────────────────────────────────────────

CREATE POLICY "rank_history_read"
  ON rank_history FOR SELECT
  USING (
    player_id = current_player_id()
    OR (
      is_family_leadership()
      AND EXISTS (
        SELECT 1 FROM players p2
        WHERE p2.id = player_id AND p2.family_id = current_family_id()
      )
    )
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- CONTRIBUTION SCORES — public (ranking visible)
-- ─────────────────────────────────────────────

CREATE POLICY "contrib_read_all"
  ON contribution_scores FOR SELECT
  USING (true);

CREATE POLICY "contrib_write_admin"
  ON contribution_scores FOR ALL
  USING (is_admin());

-- ─────────────────────────────────────────────
-- FAMILY ACTIVITY FEED — family members
-- ─────────────────────────────────────────────

CREATE POLICY "faf_read_members"
  ON family_activity_feed FOR SELECT
  USING (
    family_id = current_family_id()
    OR is_admin()
  );

-- ─────────────────────────────────────────────
-- ANALYTICS — only admin reads; server-side writes
-- ─────────────────────────────────────────────

CREATE POLICY "analytics_admin_read"
  ON analytics_events FOR SELECT
  USING (is_admin());

-- ----------------------------------------------------------------
-- MIGRATION: 003_rpc_functions.sql
-- Core RPC Functions
-- ----------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════════════════
-- MAFIALIFE — SQL RPC Functions
-- Migration: 003_rpc_functions.sql
--
-- All functions use SECURITY DEFINER so they run with elevated privileges
-- and can bypass RLS where necessary. They validate permissions internally.
-- Exposed to client via Supabase `supabase.rpc('function_name', params)`.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- HELPER: Check family role rank
-- Returns numeric rank for comparison (higher = more authority)
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION family_role_rank(role TEXT)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE role
    WHEN 'BOSS'        THEN 5
    WHEN 'UNDERBOSS'   THEN 4
    WHEN 'CONSIGLIERE' THEN 3
    WHEN 'CAPO'        THEN 3
    WHEN 'SOLDIER'     THEN 2
    WHEN 'ASSOCIATE'   THEN 1
    WHEN 'RECRUIT'     THEN 0
    ELSE -1
  END;
$$;

-- ─────────────────────────────────────────────
-- HELPER: Notify player
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION notify_player(
  p_player_id UUID,
  p_type      notification_type,
  p_title     TEXT,
  p_body      TEXT,
  p_entity_id TEXT DEFAULT NULL,
  p_entity_type TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO notifications (player_id, type, title, body, related_entity_id, related_entity_type)
  VALUES (p_player_id, p_type, p_title, p_body, p_entity_id, p_entity_type);
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: get_my_profile
-- Returns the current player's full profile
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
  v_result    JSONB;
BEGIN
  v_player_id := current_player_id();
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated' USING HINT = 'No player found for current auth user';
  END IF;

  SELECT jsonb_build_object(
    'player',       row_to_json(p),
    'family',       CASE WHEN p.family_id IS NOT NULL
                    THEN (SELECT row_to_json(f) FROM families f WHERE f.id = p.family_id)
                    ELSE NULL END,
    'contribution', (SELECT row_to_json(cs) FROM contribution_scores cs WHERE cs.player_id = v_player_id),
    'assignments',  (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', ba.id,
          'front_instance_id', ba.front_instance_id,
          'slot_definition_id', ba.slot_definition_id,
          'assigned_at', ba.assigned_at
        )
      )
      FROM business_assignments ba WHERE ba.player_id = v_player_id
    ),
    'unread_notifications', (
      SELECT COUNT(*) FROM notifications n WHERE n.player_id = v_player_id AND NOT n.read
    )
  )
  INTO v_result
  FROM players p WHERE p.id = v_player_id;

  RETURN v_result;
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: run_job
-- Executes a universal or rank-based job for the current player
-- Returns { success, cash_earned, heat_gained, xp_earned, jailed, message }
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION run_job(
  p_job_id TEXT,
  p_mode   job_mode_type DEFAULT 'SOLO'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id     UUID;
  v_player        players%ROWTYPE;
  v_job           jobs%ROWTYPE;
  v_cooldown_left INTERVAL;
  v_success       BOOLEAN;
  v_cash_earned   BIGINT;
  v_heat_gained   INTEGER;
  v_jailed        BOOLEAN := false;
  v_roll          FLOAT;
  v_min_rank_val  INTEGER;
  v_player_rank   INTEGER;
BEGIN
  v_player_id := current_player_id();
  IF v_player_id IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT * INTO v_player FROM players WHERE id = v_player_id;

  -- Check player is active
  IF v_player.player_status != 'ACTIVE' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Player is not active');
  END IF;

  -- Get job
  SELECT * INTO v_job FROM jobs WHERE id = p_job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'job_not_found' USING HINT = p_job_id;
  END IF;

  -- Check rank gate
  v_min_rank_val  := family_role_rank(v_job.min_rank::TEXT);
  v_player_rank   := family_role_rank(COALESCE(v_player.family_role::TEXT, 'RECRUIT'));
  IF v_player_rank < v_min_rank_val THEN
    RETURN jsonb_build_object('success', false, 'message', 'Rank too low for this job');
  END IF;

  -- Check war_context_only
  IF v_job.war_context_only THEN
    IF NOT EXISTS (
      SELECT 1 FROM families f WHERE f.id = v_player.family_id AND f.status = 'AT_WAR'
    ) THEN
      RETURN jsonb_build_object('success', false, 'message', 'This job is only available during war');
    END IF;
  END IF;

  -- Check cooldown
  SELECT
    CASE
      WHEN last_completed_at IS NOT NULL AND
           last_completed_at + (v_job.cooldown_seconds || ' seconds')::INTERVAL > now()
      THEN last_completed_at + (v_job.cooldown_seconds || ' seconds')::INTERVAL - now()
      ELSE NULL
    END
  INTO v_cooldown_left
  FROM player_job_states
  WHERE player_id = v_player_id AND job_id = p_job_id;

  IF v_cooldown_left IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Job is on cooldown',
      'cooldown_remaining_seconds', EXTRACT(EPOCH FROM v_cooldown_left)::INTEGER
    );
  END IF;

  -- Roll outcome (75% success base)
  v_roll    := random();
  v_success := v_roll > 0.25;

  IF v_success THEN
    v_cash_earned := v_job.reward_cash_min +
      floor(random() * (v_job.reward_cash_max - v_job.reward_cash_min + 1))::BIGINT;
    v_heat_gained := GREATEST(1, (v_job.base_jail_risk * 50)::INTEGER);
  ELSE
    v_cash_earned := 0;
    v_heat_gained := (v_job.base_jail_risk * 80)::INTEGER;

    -- Jail check on fail
    IF random() < v_job.base_jail_risk THEN
      v_jailed := true;
      -- Create jail record (basic county lockup for job failures)
      INSERT INTO jail_records (player_id, tier, reason, sentence_end_at, bribe_cost)
      VALUES (
        v_player_id,
        'COUNTY_LOCKUP',
        'Arrested during job: ' || v_job.name,
        now() + '1 hour'::INTERVAL,
        (v_player.stat_cash * 0.1)::BIGINT
      );
      -- Update player status
      UPDATE players SET player_status = 'JAILED' WHERE id = v_player_id;
      PERFORM notify_player(v_player_id, 'JAIL_ENTERED',
        'Arrested', 'You were arrested during: ' || v_job.name, p_job_id, 'job');
    END IF;
  END IF;

  -- Apply cash + heat to player
  UPDATE players SET
    stat_cash  = GREATEST(0, stat_cash + v_cash_earned),
    stat_heat  = LEAST(100, stat_heat + v_heat_gained),
    last_active_at = now()
  WHERE id = v_player_id;

  -- Upsert job state
  INSERT INTO player_job_states (player_id, job_id, last_completed_at, last_failed_at, total_completions, total_earnings)
  VALUES (
    v_player_id, p_job_id,
    CASE WHEN v_success THEN now() ELSE NULL END,
    CASE WHEN NOT v_success THEN now() ELSE NULL END,
    CASE WHEN v_success THEN 1 ELSE 0 END,
    v_cash_earned
  )
  ON CONFLICT (player_id, job_id) DO UPDATE SET
    last_completed_at = CASE WHEN v_success THEN now() ELSE player_job_states.last_completed_at END,
    last_failed_at    = CASE WHEN NOT v_success THEN now() ELSE player_job_states.last_failed_at END,
    total_completions = player_job_states.total_completions + (CASE WHEN v_success THEN 1 ELSE 0 END),
    total_earnings    = player_job_states.total_earnings + v_cash_earned,
    updated_at        = now();

  -- Update contribution score
  INSERT INTO contribution_scores (player_id, jobs_completed, money_earned)
  VALUES (v_player_id, 1, v_cash_earned)
  ON CONFLICT (player_id) DO UPDATE SET
    jobs_completed = contribution_scores.jobs_completed + 1,
    money_earned   = contribution_scores.money_earned + v_cash_earned,
    updated_at     = now();

  -- Log analytics
  INSERT INTO analytics_events (event_name, player_id, family_id, entity_id, entity_type, properties)
  VALUES (
    CASE WHEN v_success THEN 'first_job_completed' ELSE 'job_failed' END,
    v_player_id, v_player.family_id, p_job_id, 'job',
    jsonb_build_object('success', v_success, 'cash_earned', v_cash_earned)
  );

  RETURN jsonb_build_object(
    'success',      v_success,
    'cash_earned',  v_cash_earned,
    'heat_gained',  v_heat_gained,
    'jailed',       v_jailed,
    'message',      CASE WHEN v_success THEN 'Job completed.' ELSE 'Job failed.' END
  );
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: purchase_turf
-- Don purchases a turf block for the family
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION purchase_turf(p_turf_slug TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
  v_player    players%ROWTYPE;
  v_family    families%ROWTYPE;
  v_turf      turfs%ROWTYPE;
BEGIN
  v_player_id := current_player_id();
  SELECT * INTO v_player FROM players WHERE id = v_player_id;

  IF v_player.family_role != 'BOSS' THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'Only the Boss can purchase turf';
  END IF;

  SELECT * INTO v_turf FROM turfs WHERE slug = p_turf_slug;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'turf_not_found';
  END IF;

  IF v_turf.family_id IS NOT NULL THEN
    RAISE EXCEPTION 'turf_already_owned';
  END IF;

  SELECT * INTO v_family FROM families WHERE id = v_player.family_id;

  IF v_family.treasury < v_turf.purchase_cost THEN
    RAISE EXCEPTION 'insufficient_treasury'
      USING HINT = 'Need: ' || v_turf.purchase_cost || ', Have: ' || v_family.treasury;
  END IF;

  -- Deduct from treasury
  UPDATE families SET treasury = treasury - v_turf.purchase_cost
  WHERE id = v_family.id;

  -- Assign turf
  UPDATE turfs SET
    family_id = v_family.id,
    purchased_at = now(),
    purchased_by_player_id = v_player_id
  WHERE id = v_turf.id;

  -- Family activity feed
  INSERT INTO family_activity_feed (family_id, event_type, actor_alias, actor_role, description, metadata)
  VALUES (
    v_family.id, 'TURF_PURCHASED',
    v_player.alias, 'BOSS',
    v_turf.name || ' added to family holdings. Cost: $' || v_turf.purchase_cost,
    jsonb_build_object('turf_slug', p_turf_slug, 'cost', v_turf.purchase_cost)
  );

  -- Analytics
  INSERT INTO analytics_events (event_name, player_id, family_id, entity_id, entity_type, properties)
  VALUES ('turf_purchased', v_player_id, v_family.id, v_turf.id::TEXT, 'turf',
    jsonb_build_object('cost', v_turf.purchase_cost, 'slug', p_turf_slug));

  RETURN jsonb_build_object('success', true, 'turf_id', v_turf.id, 'cost', v_turf.purchase_cost);
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: build_front
-- Place a front on a turf slot. Boss required.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION build_front(
  p_turf_slug    TEXT,
  p_slot_index   INTEGER,
  p_front_type   front_type
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
  v_player    players%ROWTYPE;
  v_family    families%ROWTYPE;
  v_turf      turfs%ROWTYPE;
  v_bizdef    business_definitions%ROWTYPE;
  v_base_income BIGINT;
BEGIN
  v_player_id := current_player_id();
  SELECT * INTO v_player FROM players WHERE id = v_player_id;

  IF v_player.family_role != 'BOSS' THEN
    RAISE EXCEPTION 'permission_denied' USING HINT = 'Only the Boss can build fronts';
  END IF;

  SELECT * INTO v_turf FROM turfs WHERE slug = p_turf_slug;
  IF v_turf.family_id != v_player.family_id THEN
    RAISE EXCEPTION 'not_family_turf';
  END IF;
  IF p_slot_index < 0 OR p_slot_index >= v_turf.slot_count THEN
    RAISE EXCEPTION 'invalid_slot_index';
  END IF;
  IF EXISTS (SELECT 1 FROM front_instances WHERE turf_id = v_turf.id AND slot_index = p_slot_index) THEN
    RAISE EXCEPTION 'slot_occupied';
  END IF;

  SELECT * INTO v_bizdef FROM business_definitions WHERE id = p_front_type;
  IF NOT v_bizdef.implemented THEN
    RAISE EXCEPTION 'front_type_not_implemented';
  END IF;

  SELECT * INTO v_family FROM families WHERE id = v_player.family_id;
  IF v_family.treasury < v_bizdef.build_cost THEN
    RAISE EXCEPTION 'insufficient_treasury';
  END IF;

  -- Deduct build cost
  UPDATE families SET treasury = treasury - v_bizdef.build_cost WHERE id = v_family.id;

  -- Create front
  INSERT INTO front_instances (turf_id, slot_index, front_type, family_id, upgrade_level, daily_income_cache)
  VALUES (v_turf.id, p_slot_index, p_front_type, v_family.id, 1, v_bizdef.base_profit_per_tick);

  -- Feed event
  INSERT INTO family_activity_feed (family_id, event_type, actor_alias, actor_role, description, metadata)
  VALUES (
    v_family.id, 'FRONT_BUILT', v_player.alias, 'BOSS',
    'New ' || v_bizdef.display_name || ' established on ' || v_turf.name,
    jsonb_build_object('front_type', p_front_type, 'turf_slug', p_turf_slug)
  );

  RETURN jsonb_build_object('success', true, 'front_type', p_front_type, 'cost', v_bizdef.build_cost);
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: assign_business_role
-- Underboss+ assigns a player to a business slot
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION assign_business_role(
  p_front_instance_id UUID,
  p_player_id         UUID,
  p_slot_definition_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id  UUID;
  v_actor     players%ROWTYPE;
  v_target    players%ROWTYPE;
  v_front     front_instances%ROWTYPE;
  v_slotdef   business_slot_definitions%ROWTYPE;
BEGIN
  v_actor_id := current_player_id();
  SELECT * INTO v_actor FROM players WHERE id = v_actor_id;
  SELECT * INTO v_front FROM front_instances WHERE id = p_front_instance_id;
  SELECT * INTO v_target FROM players WHERE id = p_player_id;
  SELECT * INTO v_slotdef FROM business_slot_definitions WHERE id = p_slot_definition_id;

  -- Permission: must be UNDERBOSS+ in same family
  IF family_role_rank(v_actor.family_role::TEXT) < 4
     OR v_actor.family_id != v_front.family_id THEN
    RAISE EXCEPTION 'permission_denied';
  END IF;

  -- Slot definition must match front type
  IF v_slotdef.business_type != v_front.front_type THEN
    RAISE EXCEPTION 'slot_type_mismatch';
  END IF;

  -- Target player must be in same family
  IF v_target.family_id != v_front.family_id THEN
    RAISE EXCEPTION 'player_not_in_family';
  END IF;

  -- Upsert assignment
  INSERT INTO business_assignments (front_instance_id, slot_definition_id, player_id, assigned_by)
  VALUES (p_front_instance_id, p_slot_definition_id, p_player_id, v_actor_id)
  ON CONFLICT (front_instance_id, slot_definition_id) DO UPDATE SET
    player_id = p_player_id,
    assigned_by = v_actor_id,
    assigned_at = now();

  -- Update front's manager_player_id if this is a MANAGER slot
  IF v_slotdef.role_type = 'MANAGER' THEN
    UPDATE front_instances SET manager_player_id = p_player_id WHERE id = p_front_instance_id;
  END IF;

  -- Notify the assigned player
  PERFORM notify_player(
    p_player_id, 'BUSINESS_ASSIGNMENT_ADDED',
    'Assigned to ' || v_slotdef.display_name,
    'You have been assigned as ' || v_slotdef.display_name || ' by ' || v_actor.alias,
    p_front_instance_id::TEXT, 'front'
  );

  -- Feed event
  INSERT INTO family_activity_feed (family_id, event_type, actor_alias, actor_role, description, metadata)
  VALUES (
    v_front.family_id, 'FRONT_UPGRADED',  -- reuse event type
    v_actor.alias, v_actor.family_role::TEXT,
    v_target.alias || ' assigned as ' || v_slotdef.display_name,
    jsonb_build_object('front_id', p_front_instance_id, 'slot', p_slot_definition_id)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: claim_passive_income
-- Calculates and distributes daily front income
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION claim_passive_income()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id   UUID;
  v_player      players%ROWTYPE;
  v_total_income BIGINT := 0;
  v_front       RECORD;
  v_player_cut  BIGINT;
  v_family_cut  BIGINT;
BEGIN
  v_player_id := current_player_id();
  SELECT * INTO v_player FROM players WHERE id = v_player_id;

  IF v_player.player_status != 'ACTIVE' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Not active');
  END IF;

  -- Find all fronts where this player has an assignment
  FOR v_front IN
    SELECT fi.id, fi.daily_income_cache, fi.family_id,
           bsd.role_type
    FROM business_assignments ba
    JOIN front_instances fi ON fi.id = ba.front_instance_id
    JOIN business_slot_definitions bsd ON bsd.id = ba.slot_definition_id
    WHERE ba.player_id = v_player_id
  LOOP
    -- Manager gets 15%, staff gets share of 20%
    IF v_front.role_type = 'MANAGER' THEN
      v_player_cut := (v_front.daily_income_cache * 0.15)::BIGINT;
    ELSE
      v_player_cut := (v_front.daily_income_cache * 0.05)::BIGINT; -- staff share split
    END IF;

    v_family_cut := (v_front.daily_income_cache * 0.30)::BIGINT;

    -- Pay player
    UPDATE players SET stat_cash = stat_cash + v_player_cut WHERE id = v_player_id;

    -- Pay family treasury
    UPDATE families SET treasury = treasury + v_family_cut WHERE id = v_front.family_id;

    v_total_income := v_total_income + v_player_cut;
  END LOOP;

  IF v_total_income > 0 THEN
    -- Update contribution
    INSERT INTO contribution_scores (player_id, passive_income_generated)
    VALUES (v_player_id, v_total_income)
    ON CONFLICT (player_id) DO UPDATE SET
      passive_income_generated = contribution_scores.passive_income_generated + v_total_income,
      updated_at = now();

    -- Notify
    PERFORM notify_player(
      v_player_id, 'PASSIVE_INCOME_PAYOUT',
      'Passive Income Received',
      'You received $' || v_total_income || ' from your business assignments.',
      NULL, NULL
    );
  END IF;

  RETURN jsonb_build_object('success', true, 'income', v_total_income);
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: mark_notification_read
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE notifications
  SET read = true
  WHERE id = p_notification_id AND player_id = current_player_id();
END;
$$;

CREATE OR REPLACE FUNCTION mark_all_notifications_read()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE notifications
  SET read = true
  WHERE player_id = current_player_id() AND NOT read;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: send_chain_message
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION send_chain_message(
  p_subject TEXT,
  p_body    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
  v_player    players%ROWTYPE;
  v_superior_id UUID;
BEGIN
  v_player_id := current_player_id();
  SELECT * INTO v_player FROM players WHERE id = v_player_id;

  IF v_player.family_id IS NULL THEN
    RAISE EXCEPTION 'no_family';
  END IF;

  -- Find immediate superior based on role
  SELECT id INTO v_superior_id
  FROM players
  WHERE family_id = v_player.family_id
    AND family_role = CASE v_player.family_role::TEXT
      WHEN 'ASSOCIATE' THEN 'CAPO'
      WHEN 'RECRUIT'   THEN 'CAPO'
      WHEN 'SOLDIER'   THEN 'CAPO'
      WHEN 'CAPO'      THEN 'UNDERBOSS'
      WHEN 'UNDERBOSS' THEN 'BOSS'
      WHEN 'CONSIGLIERE' THEN 'BOSS'
      ELSE NULL
    END
  LIMIT 1;

  IF v_superior_id IS NULL THEN
    -- Fall back to BOSS
    SELECT id INTO v_superior_id FROM players
    WHERE family_id = v_player.family_id AND family_role = 'BOSS' LIMIT 1;
  END IF;

  IF v_superior_id IS NULL THEN
    RAISE EXCEPTION 'no_superior_found';
  END IF;

  INSERT INTO chain_messages (family_id, from_player_id, to_player_id, subject, body)
  VALUES (v_player.family_id, v_player_id, v_superior_id, p_subject, p_body);

  -- Notify the superior
  PERFORM notify_player(
    v_superior_id, 'NEW_CHAIN_MESSAGE',
    'New message from ' || v_player.alias,
    p_subject, NULL, 'message'
  );

  RETURN jsonb_build_object('success', true, 'to_player_id', v_superior_id);
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: update_district_influence
-- Recalculate all district influence scores
-- Called by admin or scheduled trigger
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_district_influence()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Delete and recalculate all scores
  DELETE FROM district_influences;

  INSERT INTO district_influences (district_id, family_id, score, turf_count, front_count, staffed_slots)
  SELECT
    t.district_id,
    COALESCE(fi.family_id, t.family_id) AS family_id,
    -- Formula: turfs*100 + fronts*50*upgrade_level + staffed_slots*10
    SUM(
      100 +
      COALESCE(fi.upgrade_level, 0) * 50 +
      (SELECT COUNT(*) FROM business_assignments ba WHERE ba.front_instance_id = fi.id) * 10
    ) AS score,
    COUNT(DISTINCT t.id) FILTER (WHERE t.family_id IS NOT NULL) AS turf_count,
    COUNT(fi.id) AS front_count,
    SUM((SELECT COUNT(*) FROM business_assignments ba WHERE ba.front_instance_id = fi.id)) AS staffed_slots
  FROM turfs t
  LEFT JOIN front_instances fi ON fi.turf_id = t.id
  WHERE t.family_id IS NOT NULL OR fi.family_id IS NOT NULL
  GROUP BY t.district_id, COALESCE(fi.family_id, t.family_id)
  HAVING COALESCE(fi.family_id, t.family_id) IS NOT NULL;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: get_jobs_for_player
-- Returns jobs list with cooldown state for current player
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION get_jobs_for_player()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
  v_player    players%ROWTYPE;
  v_result    JSONB;
BEGIN
  v_player_id := current_player_id();
  SELECT * INTO v_player FROM players WHERE id = v_player_id;

  SELECT jsonb_agg(
    jsonb_build_object(
      'job',            row_to_json(j),
      'on_cooldown',    CASE
                          WHEN pjs.last_completed_at IS NOT NULL AND
                               pjs.last_completed_at + (j.cooldown_seconds || ' seconds')::INTERVAL > now()
                          THEN true ELSE false
                        END,
      'cooldown_remaining',
                        CASE
                          WHEN pjs.last_completed_at IS NOT NULL AND
                               pjs.last_completed_at + (j.cooldown_seconds || ' seconds')::INTERVAL > now()
                          THEN EXTRACT(EPOCH FROM
                               pjs.last_completed_at + (j.cooldown_seconds || ' seconds')::INTERVAL - now()
                               )::INTEGER
                          ELSE 0
                        END,
      'can_start',      family_role_rank(COALESCE(v_player.family_role::TEXT, 'RECRUIT')) >=
                        family_role_rank(j.min_rank::TEXT)
    )
  )
  INTO v_result
  FROM jobs j
  LEFT JOIN player_job_states pjs
    ON pjs.player_id = v_player_id AND pjs.job_id = j.id;

  RETURN COALESCE(v_result, '[]'::JSONB);
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: apply_to_family
-- Unaffiliated player requests to join a family
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION apply_to_family(p_family_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_id UUID;
  v_player    players%ROWTYPE;
  v_family    families%ROWTYPE;
BEGIN
  v_player_id := current_player_id();
  SELECT * INTO v_player FROM players WHERE id = v_player_id;

  IF v_player.family_id IS NOT NULL THEN
    RAISE EXCEPTION 'already_in_family';
  END IF;

  SELECT * INTO v_family FROM families WHERE id = p_family_id;
  IF v_family.status = 'DISSOLVED' THEN
    RAISE EXCEPTION 'family_dissolved';
  END IF;

  -- Mark player as pending (RECRUIT with family reference)
  UPDATE players SET
    family_id   = p_family_id,
    family_role = 'RECRUIT',
    affiliation = 'RECRUIT'
  WHERE id = v_player_id;

  -- Notify family leadership
  INSERT INTO notifications (player_id, type, title, body, related_entity_id, related_entity_type)
  SELECT id, 'FAMILY_APPLICATION_ACCEPTED',
    v_player.alias || ' has applied to join',
    v_player.alias || ' (' || v_player.archetype || ') wants to join ' || v_family.name,
    v_player_id::TEXT, 'player'
  FROM players
  WHERE family_id = p_family_id AND family_role IN ('BOSS','UNDERBOSS','CAPO');

  -- Analytics
  INSERT INTO analytics_events (event_name, player_id, family_id, properties)
  VALUES ('family_applied', v_player_id, p_family_id,
    jsonb_build_object('family_name', v_family.name));

  RETURN jsonb_build_object('success', true, 'status', 'RECRUIT');
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: promote_member
-- Leadership promotes a family member
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION promote_member(
  p_target_player_id UUID,
  p_to_rank          TEXT,
  p_note             TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id  UUID;
  v_actor     players%ROWTYPE;
  v_target    players%ROWTYPE;
  v_required_actor_rank INTEGER;
BEGIN
  v_actor_id := current_player_id();
  SELECT * INTO v_actor FROM players WHERE id = v_actor_id;
  SELECT * INTO v_target FROM players WHERE id = p_target_player_id;

  IF v_actor.family_id != v_target.family_id THEN
    RAISE EXCEPTION 'different_family';
  END IF;

  -- Determine minimum actor rank needed for this promotion
  v_required_actor_rank := CASE p_to_rank
    WHEN 'ASSOCIATE' THEN 3  -- CAPO+
    WHEN 'SOLDIER'   THEN 3
    WHEN 'CAPO'      THEN 4  -- UNDERBOSS+
    WHEN 'UNDERBOSS' THEN 5  -- BOSS only
    WHEN 'CONSIGLIERE' THEN 5
    ELSE 5
  END;

  IF family_role_rank(v_actor.family_role::TEXT) < v_required_actor_rank THEN
    RAISE EXCEPTION 'permission_denied'
      USING HINT = 'Insufficient rank to perform this promotion';
  END IF;

  -- Record history
  INSERT INTO rank_history (player_id, from_rank, to_rank, reason, granted_by_player_id, note)
  VALUES (p_target_player_id, v_target.family_role::TEXT, p_to_rank,
          'LEADERSHIP_APPOINTMENT', v_actor_id, p_note);

  -- Update player
  UPDATE players SET
    family_role = p_to_rank::family_role_type,
    affiliation = CASE p_to_rank
      WHEN 'BOSS','UNDERBOSS','CONSIGLIERE','CAPO' THEN 'LEADERSHIP'
      WHEN 'SOLDIER','ASSOCIATE' THEN 'MEMBER'
      ELSE 'RECRUIT'
    END::affiliation_type
  WHERE id = p_target_player_id;

  -- Notify
  PERFORM notify_player(
    p_target_player_id, 'PROMOTED',
    'You have been promoted',
    'Promoted to ' || p_to_rank || ' by ' || v_actor.alias || '. ' || p_note,
    NULL, NULL
  );

  -- Family feed
  INSERT INTO family_activity_feed (family_id, event_type, actor_alias, actor_role, description)
  VALUES (
    v_actor.family_id, 'MEMBER_PROMOTED', v_actor.alias, v_actor.family_role::TEXT,
    v_target.alias || ' promoted from ' || v_target.family_role || ' to ' || p_to_rank
  );

  RETURN jsonb_build_object('success', true, 'new_rank', p_to_rank);
END;
$$;

-- ─────────────────────────────────────────────
-- RPC: create_season_snapshot
-- Admin-only: snapshot current leaderboard for season
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_season_snapshot(p_season_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'admin_only';
  END IF;

  INSERT INTO leaderboard_snapshots (
    season_id, family_id, family_name, don_alias, rank,
    composite_score, turf_score, income_score, treasury_score
  )
  SELECT
    p_season_id,
    f.id,
    f.name,
    COALESCE((SELECT alias FROM players WHERE id = f.boss_player_id), 'Unknown'),
    ROW_NUMBER() OVER (ORDER BY f.power_score DESC) AS rank,
    f.power_score + f.treasury / 100 AS composite_score,
    (SELECT COUNT(*) * 1000 FROM turfs WHERE family_id = f.id) AS turf_score,
    f.treasury / 100 AS income_score,
    f.treasury / 100 AS treasury_score
  FROM families f
  WHERE f.status != 'DISSOLVED';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Analytics
  INSERT INTO analytics_events (event_name, properties)
  VALUES ('season_snapshot_created', jsonb_build_object('season_id', p_season_id, 'families', v_count));

  RETURN v_count;
END;
$$;

-- ----------------------------------------------------------------
-- MIGRATION: 004_family_systems.sql
-- Family Systems — treasury, inventory, audit log
-- ----------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════════════════
-- MAFIALIFE — Migration: 004_family_systems.sql
--
-- Implements:
--   - Boss archetype → Runner archetype migration
--   - Family lifecycle fields (protection, bootstrap state)
--   - Treasury transaction ledger
--   - Family item catalog + instances
--   - Family item issuances
--   - Family audit log
--   - Extended WorldAction permissions
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- PART 1: Migrate BOSS archetype to RUNNER
-- ─────────────────────────────────────────────

-- Step 1: Add RUNNER to archetype enum (Postgres requires adding first, then removing old)
ALTER TYPE archetype_type ADD VALUE IF NOT EXISTS 'RUNNER';

-- Step 2: Migrate all existing BOSS archetype players to RUNNER
UPDATE players SET archetype = 'RUNNER' WHERE archetype = 'BOSS';

-- Step 3: After all rows migrated, BOSS can be safely removed
-- NOTE: Postgres does not support DROP VALUE from enum directly.
-- In production: create new enum, alter column, drop old enum.
-- For now, RUNNER is the canonical replacement. BOSS archetype value
-- is legacy and no new players can select it (enforced in application layer).

-- ─────────────────────────────────────────────
-- PART 2: Family lifecycle fields
-- ─────────────────────────────────────────────

-- Bootstrap state enum
CREATE TYPE family_bootstrap_state AS ENUM ('NEW', 'STABLE', 'VULNERABLE');

-- Add lifecycle fields to families table
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS bootstrap_state family_bootstrap_state NOT NULL DEFAULT 'STABLE',
  ADD COLUMN IF NOT EXISTS protection_expires_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tax_rate_pct          SMALLINT NOT NULL DEFAULT 10 CHECK (tax_rate_pct BETWEEN 0 AND 50),
  ADD COLUMN IF NOT EXISTS kickup_rate_pct        SMALLINT NOT NULL DEFAULT 5  CHECK (kickup_rate_pct BETWEEN 0 AND 30);

-- New families: set bootstrap state and protection window on INSERT (handled by application layer via RPC)
-- Existing families are already stable.

-- ─────────────────────────────────────────────
-- PART 3: Treasury transaction ledger
-- ─────────────────────────────────────────────

CREATE TYPE treasury_tx_type AS ENUM (
  'BOOTSTRAP_DEPOSIT', 'JOB_TAX', 'KICKUP',
  'MEMBER_DEPOSIT', 'DON_DEPOSIT', 'DON_WITHDRAWAL',
  'ITEM_PURCHASE', 'ITEM_ISSUED', 'ITEM_RETURNED',
  'MISSION_REWARD', 'WAR_REPARATION', 'TURF_INCOME',
  'ADMIN_ADJUSTMENT'
);

CREATE TABLE IF NOT EXISTS treasury_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  type            treasury_tx_type NOT NULL,
  amount          BIGINT NOT NULL,        -- positive = deposit, negative = withdrawal (in cents)
  balance_after   BIGINT NOT NULL,        -- snapshot of treasury after this tx
  actor_player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  note            TEXT,
  metadata        JSONB DEFAULT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_treasury_tx_family ON treasury_transactions (family_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_treasury_tx_actor  ON treasury_transactions (actor_player_id);

-- RLS: family members (CAPO+) can read; only UNDERBOSS+ can write
ALTER TABLE treasury_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY treasury_read ON treasury_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      JOIN players p ON p.id = fm.player_id
      WHERE fm.family_id = treasury_transactions.family_id
        AND p.id = auth.uid()
        AND fm.role IN ('BOSS', 'UNDERBOSS', 'CONSIGLIERE', 'CAPO')
    )
  );

CREATE POLICY treasury_insert_leadership ON treasury_transactions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = treasury_transactions.family_id
        AND fm.player_id = auth.uid()
        AND fm.role IN ('BOSS', 'UNDERBOSS')
    )
  );

-- ─────────────────────────────────────────────
-- PART 4: Item catalog (definitions)
-- ─────────────────────────────────────────────

CREATE TYPE item_category AS ENUM ('WEAPON', 'VEHICLE', 'TOOL', 'ARMOR', 'CURRENCY', 'MISC');
CREATE TYPE item_tier      AS ENUM ('STANDARD', 'ADVANCED', 'ELITE');

CREATE TABLE IF NOT EXISTS item_definitions (
  id                 TEXT PRIMARY KEY,      -- e.g. '9mm_pistol'
  name               TEXT NOT NULL,
  category           item_category NOT NULL,
  tier               item_tier NOT NULL,
  description        TEXT NOT NULL DEFAULT '',
  grants_job_tags    TEXT[] NOT NULL DEFAULT '{}',
  is_stackable       BOOLEAN NOT NULL DEFAULT FALSE,
  base_value         INTEGER NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed with canonical item definitions
INSERT INTO item_definitions (id, name, category, tier, description, grants_job_tags, is_stackable, base_value) VALUES
  ('9mm_pistol',        '9mm Pistol',         'WEAPON', 'STANDARD', 'Standard sidearm. Reliable, concealable.', '{armed_robbery,intimidation,armed_hit}', FALSE, 1500),
  ('burner_phone',      'Burner Phone',        'MISC',   'STANDARD', 'Untraceable communication device.',         '{communications,coordination}',          TRUE,  200),
  ('lockpick_kit',      'Lockpick Kit',        'TOOL',   'STANDARD', 'Opens most residential locks silently.',    '{burglary,infiltration}',                FALSE, 800),
  ('bulletproof_vest',  'Bulletproof Vest',    'ARMOR',  'STANDARD', 'Reduces combat damage.',                    '{protection}',                           FALSE, 2500),
  ('getaway_car',       'Getaway Car',         'VEHICLE','STANDARD', 'Clean plates, fast engine.',                '{heist,armed_robbery}',                  FALSE, 8000),
  ('safecracking_kit',  'Safecracking Kit',    'TOOL',   'ADVANCED', 'Professional-grade vault tool.',            '{bank_job,safe_cracking}',               FALSE, 4500)
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────────
-- PART 5: Family item instances
-- ─────────────────────────────────────────────

CREATE TYPE item_instance_state AS ENUM (
  'IN_FAMILY_VAULT', 'ISSUED', 'IN_USE',
  'CONSUMED', 'RETURNED', 'LOST', 'CONFISCATED'
);

CREATE TABLE IF NOT EXISTS family_item_instances (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  item_definition_id  TEXT NOT NULL REFERENCES item_definitions(id),
  state               item_instance_state NOT NULL DEFAULT 'IN_FAMILY_VAULT',
  acquired_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  acquired_by         UUID REFERENCES players(id) ON DELETE SET NULL,
  current_holder_id   UUID REFERENCES players(id) ON DELETE SET NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fii_family ON family_item_instances (family_id);
CREATE INDEX IF NOT EXISTS idx_fii_holder ON family_item_instances (current_holder_id) WHERE current_holder_id IS NOT NULL;

-- RLS: family members can view; only UNDERBOSS+ can modify
ALTER TABLE family_item_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY fii_read ON family_item_instances
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM family_members fm WHERE fm.family_id = family_item_instances.family_id AND fm.player_id = auth.uid())
  );

CREATE POLICY fii_write_leadership ON family_item_instances
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_item_instances.family_id
        AND fm.player_id = auth.uid()
        AND fm.role IN ('BOSS', 'UNDERBOSS')
    )
  );

-- ─────────────────────────────────────────────
-- PART 6: Family item issuances
-- ─────────────────────────────────────────────

CREATE TYPE issuance_purpose AS ENUM ('JOB', 'HIT', 'MISSION', 'PROTECTION', 'GENERAL');
CREATE TYPE issuance_status  AS ENUM ('ACTIVE', 'RETURNED', 'CONSUMED', 'LOST', 'OVERDUE');

CREATE TABLE IF NOT EXISTS family_item_issuances (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  item_instance_id      UUID NOT NULL REFERENCES family_item_instances(id) ON DELETE CASCADE,
  item_definition_id    TEXT NOT NULL,         -- denormalized for fast queries
  issued_to_player_id   UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  issued_by_player_id   UUID NOT NULL REFERENCES players(id),
  issued_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  purpose               issuance_purpose NOT NULL DEFAULT 'GENERAL',
  purpose_reference_id  UUID DEFAULT NULL,     -- job_id / mission_id / contract_id
  status                issuance_status NOT NULL DEFAULT 'ACTIVE',
  returned_at           TIMESTAMPTZ,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fis_family ON family_item_issuances (family_id);
CREATE INDEX IF NOT EXISTS idx_fis_player ON family_item_issuances (issued_to_player_id);
CREATE INDEX IF NOT EXISTS idx_fis_item   ON family_item_issuances (item_instance_id);

-- RLS
ALTER TABLE family_item_issuances ENABLE ROW LEVEL SECURITY;

CREATE POLICY fis_read ON family_item_issuances
  FOR SELECT USING (
    auth.uid() = issued_to_player_id OR
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_item_issuances.family_id
        AND fm.player_id = auth.uid()
        AND fm.role IN ('BOSS', 'UNDERBOSS', 'CONSIGLIERE', 'CAPO')
    )
  );

-- ─────────────────────────────────────────────
-- PART 7: Family audit log
-- ─────────────────────────────────────────────

CREATE TYPE family_audit_action AS ENUM (
  'RANK_ASSIGNED', 'MEMBER_KICKED', 'MEMBER_LEFT',
  'TREASURY_DEPOSITED', 'TREASURY_WITHDRAWN',
  'TAX_RATE_CHANGED',
  'ITEM_ISSUED', 'ITEM_RETURNED', 'ITEM_LOST',
  'FAMILY_CREATED', 'PROTECTION_EXPIRED',
  'FAMILY_STABILIZED', 'FAMILY_BECAME_VULNERABLE',
  'WAR_DECLARED', 'PEACE_SIGNED', 'SETTINGS_CHANGED'
);

CREATE TABLE IF NOT EXISTS family_audit_log (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  action            family_audit_action NOT NULL,
  actor_player_id   UUID REFERENCES players(id) ON DELETE SET NULL,
  target_player_id  UUID REFERENCES players(id) ON DELETE SET NULL,
  summary           TEXT NOT NULL,
  metadata          JSONB DEFAULT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fal_family ON family_audit_log (family_id, created_at DESC);

-- RLS: CAPO+ can view audit log
ALTER TABLE family_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY fal_read ON family_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = family_audit_log.family_id
        AND fm.player_id = auth.uid()
        AND fm.role IN ('BOSS', 'UNDERBOSS', 'CONSIGLIERE', 'CAPO')
    )
  );

-- System/admin can insert
CREATE POLICY fal_insert_system ON family_audit_log
  FOR INSERT WITH CHECK (TRUE); -- enforced at application layer via service role

-- ─────────────────────────────────────────────
-- PART 8: RPC — create_family
-- Creates family, seeds treasury, seeds vault items, logs audit entry
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION create_family(
  p_name       TEXT,
  p_motto      TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_player_id   UUID := auth.uid();
  v_family_id   UUID;
  v_now         TIMESTAMPTZ := now();
  v_protection_expires TIMESTAMPTZ := v_now + INTERVAL '10 days';
  v_starting_cash BIGINT := 500000;  -- $5,000 in cents
BEGIN
  -- Verify player is not already in a family
  IF EXISTS (SELECT 1 FROM players WHERE id = v_player_id AND family_id IS NOT NULL) THEN
    RAISE EXCEPTION 'Player is already in a family';
  END IF;

  -- Create the family
  INSERT INTO families (
    name, motto, boss_id, treasury, power_score, status,
    bootstrap_state, protection_expires_at,
    tax_rate_pct, kickup_rate_pct
  ) VALUES (
    p_name, p_motto, v_player_id, v_starting_cash, 0, 'ACTIVE',
    'NEW', v_protection_expires,
    10, 5
  ) RETURNING id INTO v_family_id;

  -- Add Don as first member
  INSERT INTO family_members (family_id, player_id, role, affiliation, invited_by, joined_at)
  VALUES (v_family_id, v_player_id, 'BOSS', 'LEADERSHIP', v_player_id, v_now);

  -- Update player row
  UPDATE players SET
    family_id   = v_family_id,
    family_role = 'BOSS',
    affiliation = 'LEADERSHIP'
  WHERE id = v_player_id;

  -- Bootstrap treasury deposit
  INSERT INTO treasury_transactions (family_id, type, amount, balance_after, actor_player_id, note)
  VALUES (v_family_id, 'BOOTSTRAP_DEPOSIT', v_starting_cash, v_starting_cash, v_player_id, 'Family founded — initial treasury seed');

  -- Bootstrap vault: 2× 9mm pistols
  INSERT INTO family_item_instances (family_id, item_definition_id, state, acquired_by, notes)
  VALUES
    (v_family_id, '9mm_pistol', 'IN_FAMILY_VAULT', v_player_id, 'Starting equipment'),
    (v_family_id, '9mm_pistol', 'IN_FAMILY_VAULT', v_player_id, 'Starting equipment');

  -- Audit log entry
  INSERT INTO family_audit_log (family_id, action, actor_player_id, summary, metadata)
  VALUES (
    v_family_id, 'FAMILY_CREATED', v_player_id,
    format('Family "%s" founded. Protection window: 10 days.', p_name),
    jsonb_build_object('starting_cash', v_starting_cash, 'starting_items', 2)
  );

  RETURN json_build_object(
    'family_id',            v_family_id,
    'protection_expires_at', v_protection_expires,
    'starting_cash',         v_starting_cash
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- PART 9: RPC — issue_family_item
-- Issues an item from family vault to a member.
-- Prevents double-issue. Full audit trail.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION issue_family_item(
  p_item_instance_id    UUID,
  p_issued_to_player_id UUID,
  p_purpose             issuance_purpose DEFAULT 'GENERAL',
  p_purpose_ref_id      UUID DEFAULT NULL,
  p_notes               TEXT DEFAULT NULL
) RETURNS JSON AS $$
DECLARE
  v_issuer_id UUID := auth.uid();
  v_family_id UUID;
  v_item_state item_instance_state;
  v_issuer_role TEXT;
BEGIN
  -- Get item and lock the row to prevent race conditions
  SELECT family_id, state INTO v_family_id, v_item_state
  FROM family_item_instances
  WHERE id = p_item_instance_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item instance not found';
  END IF;

  -- Verify item is in vault (not already issued)
  IF v_item_state != 'IN_FAMILY_VAULT' THEN
    RAISE EXCEPTION 'Item is not available — current state: %', v_item_state;
  END IF;

  -- Verify issuer has permission (BOSS or UNDERBOSS only)
  SELECT fm.role INTO v_issuer_role
  FROM family_members fm
  WHERE fm.family_id = v_family_id AND fm.player_id = v_issuer_id;

  IF v_issuer_role NOT IN ('BOSS', 'UNDERBOSS') THEN
    RAISE EXCEPTION 'Insufficient rank to issue items. UNDERBOSS or higher required.';
  END IF;

  -- Verify target player is in the same family
  IF NOT EXISTS (SELECT 1 FROM family_members WHERE family_id = v_family_id AND player_id = p_issued_to_player_id) THEN
    RAISE EXCEPTION 'Target player is not a member of this family';
  END IF;

  -- Update item state
  UPDATE family_item_instances
  SET state = 'ISSUED', current_holder_id = p_issued_to_player_id
  WHERE id = p_item_instance_id;

  -- Create issuance record
  INSERT INTO family_item_issuances (
    family_id, item_instance_id, item_definition_id,
    issued_to_player_id, issued_by_player_id,
    purpose, purpose_reference_id, notes
  )
  SELECT v_family_id, p_item_instance_id, item_definition_id,
         p_issued_to_player_id, v_issuer_id,
         p_purpose, p_purpose_ref_id, p_notes
  FROM family_item_instances
  WHERE id = p_item_instance_id;

  -- Audit log
  INSERT INTO family_audit_log (family_id, action, actor_player_id, target_player_id, summary)
  SELECT v_family_id, 'ITEM_ISSUED', v_issuer_id, p_issued_to_player_id,
         format('Item issued: %s → %s (purpose: %s)',
           (SELECT name FROM item_definitions WHERE id = fii.item_definition_id),
           (SELECT alias FROM players WHERE id = p_issued_to_player_id),
           p_purpose
         )
  FROM family_item_instances fii WHERE fii.id = p_item_instance_id;

  RETURN json_build_object('success', true, 'item_instance_id', p_item_instance_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- PART 10: RPC — evaluate_family_stabilization
-- Run by cron or triggered on relevant events.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION evaluate_family_stabilization(p_family_id UUID)
RETURNS JSON AS $$
DECLARE
  v_family     RECORD;
  v_has_ub     BOOLEAN;
  v_has_cg     BOOLEAN;
  v_deadline   TIMESTAMPTZ;
  v_now        TIMESTAMPTZ := now();
  v_is_stable  BOOLEAN;
BEGIN
  SELECT * INTO v_family FROM families WHERE id = p_family_id;

  IF v_family.bootstrap_state != 'NEW' THEN
    RETURN json_build_object('already_evaluated', true, 'state', v_family.bootstrap_state);
  END IF;

  v_has_ub := EXISTS (SELECT 1 FROM family_members WHERE family_id = p_family_id AND role = 'UNDERBOSS');
  v_has_cg := EXISTS (SELECT 1 FROM family_members WHERE family_id = p_family_id AND role = 'CONSIGLIERE');
  v_deadline := v_family.created_at + INTERVAL '10 days';

  -- Check if all milestones met
  v_is_stable := v_has_ub AND v_has_cg AND (v_family.treasury >= 1000000);  -- $10,000 in cents

  IF v_is_stable THEN
    UPDATE families SET bootstrap_state = 'STABLE' WHERE id = p_family_id;
    INSERT INTO family_audit_log (family_id, action, actor_player_id, summary)
    VALUES (p_family_id, 'FAMILY_STABILIZED', NULL, 'All stabilization milestones met. Family is stable.');
    RETURN json_build_object('state', 'STABLE');

  ELSIF v_now >= v_deadline THEN
    UPDATE families SET bootstrap_state = 'VULNERABLE', protection_expires_at = NULL WHERE id = p_family_id;
    INSERT INTO family_audit_log (family_id, action, actor_player_id, summary)
    VALUES (p_family_id, 'FAMILY_BECAME_VULNERABLE', NULL, 'Stabilization deadline passed without meeting milestones. Family is now vulnerable.');
    RETURN json_build_object('state', 'VULNERABLE');

  ELSE
    RETURN json_build_object('state', 'NEW', 'milestones_met', v_is_stable, 'days_remaining',
      EXTRACT(DAY FROM v_deadline - v_now));
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- PART 11: RPC — check_attack_eligibility
-- Server-side protection check before any PvP action.
-- Returns whether attacker can attack target family.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION check_attack_eligibility(
  p_attacker_family_id UUID,
  p_target_family_id   UUID
) RETURNS JSON AS $$
DECLARE
  v_target        RECORD;
  v_attacker_size INTEGER;
  v_threshold     INTEGER := 3;  -- NEW_FAMILY_CONFIG.protection_attack_threshold_members
  v_now           TIMESTAMPTZ := now();
BEGIN
  SELECT * INTO v_target FROM families WHERE id = p_target_family_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Target family not found';
  END IF;

  -- Check protection window
  IF v_target.protection_expires_at IS NOT NULL AND v_now < v_target.protection_expires_at THEN
    -- Target is protected — check attacker size
    SELECT COUNT(*) INTO v_attacker_size FROM family_members WHERE family_id = p_attacker_family_id;

    IF v_attacker_size > v_threshold THEN
      RETURN json_build_object(
        'can_attack', false,
        'reason', format('Target family is under new-family protection for %s more days. Your family is too large to attack.',
          EXTRACT(DAY FROM v_target.protection_expires_at - v_now))
      );
    END IF;
  END IF;

  RETURN json_build_object('can_attack', true, 'reason', 'Attack is permitted');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────
-- PART 12: RPC — update_family_tax_rates
-- Don-only permission to change tax/kickup rates.
-- ─────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_family_tax_rates(
  p_family_id    UUID,
  p_tax_rate     SMALLINT,
  p_kickup_rate  SMALLINT
) RETURNS JSON AS $$
DECLARE
  v_player_id UUID := auth.uid();
  v_old_tax   SMALLINT;
  v_old_kickup SMALLINT;
BEGIN
  -- Must be the Don
  IF NOT EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = p_family_id AND fm.player_id = v_player_id AND fm.role = 'BOSS'
  ) THEN
    RAISE EXCEPTION 'Only the Don can change tax rates';
  END IF;

  IF p_tax_rate    NOT BETWEEN 0 AND 50 THEN RAISE EXCEPTION 'Tax rate must be 0–50'; END IF;
  IF p_kickup_rate NOT BETWEEN 0 AND 30 THEN RAISE EXCEPTION 'Kick-up rate must be 0–30'; END IF;

  SELECT tax_rate_pct, kickup_rate_pct INTO v_old_tax, v_old_kickup FROM families WHERE id = p_family_id;

  UPDATE families SET tax_rate_pct = p_tax_rate, kickup_rate_pct = p_kickup_rate WHERE id = p_family_id;

  INSERT INTO family_audit_log (family_id, action, actor_player_id, summary, metadata)
  VALUES (
    p_family_id, 'TAX_RATE_CHANGED', v_player_id,
    format('Tax rate: %s%% → %s%%. Kick-up: %s%% → %s%%', v_old_tax, p_tax_rate, v_old_kickup, p_kickup_rate),
    jsonb_build_object('old_tax', v_old_tax, 'new_tax', p_tax_rate, 'old_kickup', v_old_kickup, 'new_kickup', p_kickup_rate)
  );

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------
-- MIGRATION: 005_auth_rpcs.sql
-- Auth RPCs — create_player_profile, complete_onboarding, get_my_player
-- ----------------------------------------------------------------

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

-- ----------------------------------------------------------------
-- SEED DATA — World config, districts, seasons
-- ----------------------------------------------------------------

-- ═══════════════════════════════════════════════════════════════════════
-- MAFIALIFE — Seed Data
-- Run after migrations to populate a fresh database.
-- NOTE: player auth_user_id fields are left NULL in seed —
--       they get linked when real Supabase auth users sign up.
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- SEASONS
-- ─────────────────────────────────────────────

INSERT INTO seasons (id, number, name, status, description, started_at, ends_at,
  soft_reset_fields, preserved_fields) VALUES
(
  'a0000000-0000-0000-0000-000000000001',
  1, 'The Beginning', 'ENDED',
  'The first season. Five families competed for control of the city.',
  '2025-10-01T00:00:00Z', '2026-01-01T00:00:00Z',
  ARRAY['treasury','prestige','turf'],
  ARRAY['rank','archetype','family_membership','rep_history']
),
(
  'a0000000-0000-0000-0000-000000000002',
  2, 'The Reckoning', 'ENDED',
  'Season 2. The Rizzo Outfit rose to dominance on the Casino Strip.',
  '2026-01-01T00:00:00Z', '2026-03-01T00:00:00Z',
  ARRAY['treasury','prestige','turf'],
  ARRAY['rank','archetype','family_membership','rep_history']
),
(
  'a0000000-0000-0000-0000-000000000003',
  3, 'The Long Game', 'ACTIVE',
  'With territories reset and fresh capital, every family is rebuilding.',
  '2026-03-01T00:00:00Z', '2026-06-01T00:00:00Z',
  ARRAY['treasury','prestige','turf'],
  ARRAY['rank','archetype','family_membership','rep_history']
);

-- ─────────────────────────────────────────────
-- DISTRICTS
-- ─────────────────────────────────────────────

INSERT INTO districts (id, slug, name, description, tagline, theme, turf_count_target,
  allowed_front_types, influence_bonus_type, display_order) VALUES
(
  'b0000000-0000-0000-0000-000000000001',
  'DOWNTOWN', 'Downtown',
  'The financial and political core of the city.',
  'Suits, city hall, and the corruption behind the curtain.',
  'POLITICAL', 6,
  ARRAY['CONSTRUCTION','REAL_ESTATE','HQ_CLUB']::front_type[],
  'CORRUPTION', 1
),
(
  'b0000000-0000-0000-0000-000000000002',
  'WATERFRONT', 'The Waterfront',
  'A working port district of warehouses and shipping terminals.',
  'Everything that moves through this city crosses the docks first.',
  'MARITIME', 7,
  ARRAY['CONSTRUCTION','PORT_LOGISTICS','NIGHTCLUB']::front_type[],
  'SMUGGLING', 2
),
(
  'b0000000-0000-0000-0000-000000000003',
  'NORTH_END', 'North End',
  'A dense residential neighborhood with deep family roots.',
  'Old money. Old neighborhood. Old rules.',
  'RESIDENTIAL', 8,
  ARRAY['PIZZERIA','SMALL_BAR','CAR_REPAIR','NIGHTCLUB']::front_type[],
  'PROTECTION', 3
),
(
  'b0000000-0000-0000-0000-000000000004',
  'INDUSTRIAL_BELT', 'Industrial Belt',
  'The city''s industrial spine — construction yards and chop shops.',
  'Concrete, gravel, and things that go missing.',
  'INDUSTRIAL', 6,
  ARRAY['CONSTRUCTION','CAR_REPAIR','WASTE_MANAGEMENT']::front_type[],
  'CONSTRUCTION', 4
),
(
  'b0000000-0000-0000-0000-000000000005',
  'CASINO_STRIP', 'Casino Strip',
  'A concentrated entertainment corridor of casinos and nightclubs.',
  'The lights are bright. The money is dirty.',
  'GAMBLING', 5,
  ARRAY['CASINO','NIGHTCLUB','HQ_CLUB','REAL_ESTATE']::front_type[],
  'GAMBLING', 5
),
(
  'b0000000-0000-0000-0000-000000000006',
  'OUTER_BOROUGHS', 'Outer Boroughs',
  'Suburban neighborhoods at the edge of the city''s reach.',
  'Quiet streets, steady money, no questions.',
  'SUBURBAN', 8,
  ARRAY['PIZZERIA','SMALL_BAR','CAR_REPAIR']::front_type[],
  'NONE', 6
);

-- ─────────────────────────────────────────────
-- BUSINESS DEFINITIONS
-- ─────────────────────────────────────────────

INSERT INTO business_definitions (id, display_name, scale, base_profit_per_tick, base_risk,
  build_cost, recommended_manager_rank, allowed_districts, description, lore, implemented) VALUES
('CAR_REPAIR', 'Car Repair Shop', 'SMALL', 2800, 0.12, 35000, 'CAPO',
  ARRAY['NORTH_END','INDUSTRIAL_BELT','OUTER_BOROUGHS'], 
  'A legitimate auto body shop with insurance fraud on the side.',
  'They''ll fix your car. They''ll also ask no questions about the car.', true),
('PIZZERIA', 'Pizzeria', 'SMALL', 2200, 0.08, 28000, 'CAPO',
  ARRAY['NORTH_END','OUTER_BOROUGHS','WATERFRONT'],
  'A neighborhood pizzeria serving the community by day, running numbers by night.',
  'Best pizza in the city. Come for the food, stay because you have to.', true),
('SMALL_BAR', 'Small Bar', 'SMALL', 2500, 0.10, 30000, 'CAPO',
  ARRAY['NORTH_END','OUTER_BOROUGHS','WATERFRONT','CASINO_STRIP'],
  'A corner bar with a back room that does more business than the front.',
  'Drinks are cold. Questions aren''t welcome.', true),
('CASINO', 'Casino', 'LARGE', 22000, 0.28, 250000, 'UNDERBOSS',
  ARRAY['CASINO_STRIP','DOWNTOWN','WATERFRONT'],
  'A licensed gaming establishment enabling skim, laundering, and credit operations.',
  'The odds favor the house. You own the house.', true),
('CONSTRUCTION', 'Construction Company', 'LARGE', 18000, 0.22, 200000, 'UNDERBOSS',
  ARRAY['INDUSTRIAL_BELT','DOWNTOWN','WATERFRONT'],
  'A contracting business operating in the gray zone between legitimate infrastructure and fraud.',
  'The city gets built. You decide who builds it.', true),
('NIGHTCLUB', 'Nightclub', 'LARGE', 16000, 0.24, 180000, 'UNDERBOSS',
  ARRAY['CASINO_STRIP','DOWNTOWN','WATERFRONT','NORTH_END'],
  'A high-end venue for laundering, blackmail, and product distribution.',
  'The best clubs in the city are where business gets done.', true),
('PORT_LOGISTICS', 'Port Logistics Company', 'LARGE', 20000, 0.25, 220000, 'UNDERBOSS',
  ARRAY['WATERFRONT','INDUSTRIAL_BELT'],
  'Freight and logistics for importing contraband at scale.', 
  'Everything the city needs comes through the docks.', false),
('WASTE_MANAGEMENT', 'Waste Management', 'LARGE', 15000, 0.18, 170000, 'UNDERBOSS',
  ARRAY['INDUSTRIAL_BELT','OUTER_BOROUGHS'],
  'Sanitation with city contracts and evidence disposal.',
  'You''d be amazed what goes in the trucks.', false),
('REAL_ESTATE', 'Real Estate Holdings', 'LARGE', 12000, 0.14, 150000, 'UNDERBOSS',
  ARRAY['DOWNTOWN','CASINO_STRIP','NORTH_END'],
  'Property development used for large-scale laundering.',
  'The building has your name on it. The money never does.', false),
('HQ_CLUB', 'Headquarters Club', 'HQ', 35000, 0.35, 500000, 'DON',
  ARRAY['CASINO_STRIP','DOWNTOWN'],
  'The Don''s private establishment — command center and symbol of power.',
  'You don''t find the place. The place finds you.', false);

-- ─────────────────────────────────────────────
-- BUSINESS SLOT DEFINITIONS
-- ─────────────────────────────────────────────

INSERT INTO business_slot_definitions (id, business_type, role_type, display_name, required_min_rank, preferred_skill, max_one_per_business) VALUES
-- Casino
('slot-casino-manager',              'CASINO', 'MANAGER',          'Casino Manager',       'UNDERBOSS',   'OPERATIONS', true),
('slot-casino-pit-boss',             'CASINO', 'OPERATIONS_STAFF', 'Pit Boss',             'SOLDIER',     'OPERATIONS', true),
('slot-casino-dealer',               'CASINO', 'OPERATIONS_STAFF', 'Dealer',               'ASSOCIATE',   'OPERATIONS', false),
('slot-casino-floor-security-chief', 'CASINO', 'SECURITY_STAFF',   'Floor Security Chief', 'SOLDIER',     'SECURITY',   true),
('slot-casino-vip-host',             'CASINO', 'VIP_HOST',         'VIP Host',             'SOLDIER',     'CHARM',      true),
('slot-casino-cage-cashier',         'CASINO', 'FINANCE_STAFF',    'Cage Cashier',         'SOLDIER',     'FINANCE',    true),
-- Construction
('slot-construction-manager',             'CONSTRUCTION', 'MANAGER',          'Construction Boss',   'UNDERBOSS',   'OPERATIONS', true),
('slot-construction-site-foreman',        'CONSTRUCTION', 'OPERATIONS_STAFF', 'Site Foreman',        'CAPO',        'OPERATIONS', true),
('slot-construction-union-liaison',       'CONSTRUCTION', 'VIP_HOST',         'Union Liaison',       'CAPO',        'CHARM',      true),
('slot-construction-procurement-officer', 'CONSTRUCTION', 'FINANCE_STAFF',    'Procurement Officer', 'SOLDIER',     'FINANCE',    true),
('slot-construction-yard-supervisor',     'CONSTRUCTION', 'SECURITY_STAFF',   'Yard Supervisor',     'SOLDIER',     'SECURITY',   true),
-- Nightclub
('slot-nightclub-manager',        'NIGHTCLUB', 'MANAGER',          'Club Manager',    'UNDERBOSS', 'OPERATIONS', true),
('slot-nightclub-vip-host',       'NIGHTCLUB', 'VIP_HOST',         'VIP Host',        'SOLDIER',   'CHARM',      true),
('slot-nightclub-floor-manager',  'NIGHTCLUB', 'OPERATIONS_STAFF', 'Floor Manager',   'SOLDIER',   'OPERATIONS', true),
('slot-nightclub-security-chief', 'NIGHTCLUB', 'SECURITY_STAFF',   'Security Chief',  'SOLDIER',   'SECURITY',   true),
('slot-nightclub-accountant',     'NIGHTCLUB', 'FINANCE_STAFF',    'Accountant',      'SOLDIER',   'FINANCE',    true),
('slot-nightclub-bartender',      'NIGHTCLUB', 'OPERATIONS_STAFF', 'Bartender',       'ASSOCIATE', 'CHARM',      false),
-- Car Repair
('slot-car-repair-manager',               'CAR_REPAIR', 'MANAGER',          'Shop Manager',          'CAPO',      'OPERATIONS', true),
('slot-car-repair-lead-mechanic',         'CAR_REPAIR', 'OPERATIONS_STAFF', 'Lead Mechanic',         'SOLDIER',   'OPERATIONS', true),
('slot-car-repair-insurance-coordinator', 'CAR_REPAIR', 'FINANCE_STAFF',    'Insurance Coordinator', 'SOLDIER',   'FINANCE',    true),
('slot-car-repair-yard-guy',              'CAR_REPAIR', 'SECURITY_STAFF',   'Yard Guy',              'ASSOCIATE', 'SECURITY',   true),
-- Pizzeria
('slot-pizzeria-manager',          'PIZZERIA', 'MANAGER',          'Restaurant Manager', 'CAPO',      'OPERATIONS', true),
('slot-pizzeria-head-waiter',      'PIZZERIA', 'OPERATIONS_STAFF', 'Head Waiter',        'SOLDIER',   'CHARM',      true),
('slot-pizzeria-delivery-driver',  'PIZZERIA', 'OPERATIONS_STAFF', 'Delivery Driver',    'ASSOCIATE', 'SECURITY',   false),
('slot-pizzeria-back-room-runner', 'PIZZERIA', 'FINANCE_STAFF',    'Back Room Runner',   'SOLDIER',   'FINANCE',    true),
-- Small Bar
('slot-small-bar-manager',          'SMALL_BAR', 'MANAGER',          'Bar Manager',       'CAPO',      'OPERATIONS', true),
('slot-small-bar-bartender',        'SMALL_BAR', 'OPERATIONS_STAFF', 'Bartender',         'SOLDIER',   'CHARM',      false),
('slot-small-bar-doorman',          'SMALL_BAR', 'SECURITY_STAFF',   'Doorman',           'ASSOCIATE', 'SECURITY',   true),
('slot-small-bar-back-room-dealer', 'SMALL_BAR', 'FINANCE_STAFF',    'Back Room Dealer',  'SOLDIER',   'FINANCE',    true);

-- ─────────────────────────────────────────────
-- TURFS (sample — Downtown + Waterfront + North End + Casino Strip)
-- ─────────────────────────────────────────────

INSERT INTO turfs (id, district_id, name, slug, slot_count, purchase_cost, quality_tier, location_note) VALUES
-- Downtown
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'City Hall Block',     'turf-dt-01', 8, 180000, 'PRIME',  'Prime real estate adjacent to city hall.'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Financial Row',       'turf-dt-02', 8, 200000, 'PRIME',  'Investment banks and law firms.'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Courthouse Square',   'turf-dt-03', 6, 140000, 'SOLID',  'Heavy foot traffic from legal professionals.'),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Transit Hub Block',   'turf-dt-05', 4, 80000,  'ROUGH',  'High foot traffic, low prestige.'),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Hotel Row',           'turf-dt-06', 4, 90000,  'CONTESTED', 'Three families have fought over this strip.'),
-- Waterfront
('c0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000002', 'Pier 7 Terminal',         'turf-wf-01', 8, 160000, 'PRIME', 'The main cargo pier.'),
('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 'Dockside Warehouse Row',  'turf-wf-02', 8, 150000, 'PRIME', 'Industrial warehouse district.'),
('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'Harbor View Strip',       'turf-wf-03', 6, 110000, 'SOLID', 'Tourist-facing waterfront.'),
('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000002', 'Union Hall Block',        'turf-wf-04', 6, 130000, 'SOLID', 'Longshore union territory.'),
-- North End
('c0000000-0000-0000-0000-000000000020', 'b0000000-0000-0000-0000-000000000003', 'Mulberry Street',        'turf-ne-01', 6, 90000, 'PRIME', 'Three generations of loyalty.'),
('c0000000-0000-0000-0000-000000000021', 'b0000000-0000-0000-0000-000000000003', 'Saint Anthony''s Block', 'turf-ne-02', 6, 85000, 'SOLID', 'Church, social clubs, and back-room arrangements.'),
('c0000000-0000-0000-0000-000000000022', 'b0000000-0000-0000-0000-000000000003', 'North End Market',       'turf-ne-03', 6, 80000, 'SOLID', 'Grocery stores and the back rooms that service them.'),
-- Industrial Belt
('c0000000-0000-0000-0000-000000000030', 'b0000000-0000-0000-0000-000000000004', 'Riverside Yards', 'turf-ib-01', 8, 130000, 'PRIME', 'Construction staging yard with major contracts.'),
('c0000000-0000-0000-0000-000000000031', 'b0000000-0000-0000-0000-000000000004', 'Scrap Metal Row',  'turf-ib-03', 6, 85000,  'SOLID', 'Salvage and metal recycling.'),
-- Casino Strip
('c0000000-0000-0000-0000-000000000040', 'b0000000-0000-0000-0000-000000000005', 'Grand Boulevard Casino Row', 'turf-cs-01', 8, 250000, 'PRIME', 'The crown jewel of the strip.'),
('c0000000-0000-0000-0000-000000000041', 'b0000000-0000-0000-0000-000000000005', 'High Roller Hotel Block',    'turf-cs-02', 8, 240000, 'PRIME', 'Five-star hotel and entertainment complex.'),
('c0000000-0000-0000-0000-000000000042', 'b0000000-0000-0000-0000-000000000005', 'Mid-Strip Entertainment',    'turf-cs-03', 6, 160000, 'SOLID', 'Mid-tier clubs feeding into the main casinos.'),
-- Outer Boroughs
('c0000000-0000-0000-0000-000000000050', 'b0000000-0000-0000-0000-000000000006', 'Eastside Residential Block', 'turf-ob-01', 6, 60000, 'SOLID', 'Quiet working-class neighborhood.'),
('c0000000-0000-0000-0000-000000000051', 'b0000000-0000-0000-0000-000000000006', 'Outer Park Strip',           'turf-ob-02', 4, 40000, 'ROUGH', 'Low-key suburban strip mall.');

-- ─────────────────────────────────────────────
-- FAMILIES (dev seed — no real auth users yet)
-- ─────────────────────────────────────────────

INSERT INTO families (id, name, motto, treasury, prestige, power_score, status, member_count) VALUES
('d0000000-0000-0000-0000-000000000001', 'The Corrado Family', 'Silenzio è oro.',  1240000, 120, 8420, 'ACTIVE', 7),
('d0000000-0000-0000-0000-000000000002', 'The Ferrante Crew',  'Blood is thicker.', 620000,  85, 7100, 'AT_WAR', 5),
('d0000000-0000-0000-0000-000000000003', 'Rizzo Outfit',       'Patience wins.',    880000, 100, 7800, 'ACTIVE', 6),
('d0000000-0000-0000-0000-000000000004', 'West Side Outfit',   'Own the night.',    210000,  40, 4200, 'ACTIVE', 3);

-- Assign some turf to Corrado Family
UPDATE turfs SET family_id = 'd0000000-0000-0000-0000-000000000001',
  purchased_at = now() - '30 days'::INTERVAL
WHERE slug IN ('turf-dt-01','turf-wf-01','turf-ne-01','turf-ib-01','turf-cs-01');

-- Assign some turf to Rizzo
UPDATE turfs SET family_id = 'd0000000-0000-0000-0000-000000000003',
  purchased_at = now() - '25 days'::INTERVAL
WHERE slug IN ('turf-cs-02','turf-dt-02');

-- ─────────────────────────────────────────────
-- DEV PLAYERS (no auth_user_id — for testing only)
-- ─────────────────────────────────────────────

INSERT INTO players (id, username, alias, archetype, affiliation, family_id, family_role,
  stat_cash, stat_stash, stat_heat, stat_respect, stat_strength, stat_accuracy,
  stat_intelligence, stat_charisma, stat_kills,
  onboarding_completed, player_status) VALUES
-- Corrado Family
('e0000000-0000-0000-0000-000000000001', 'don_corrado',    'Don Corrado',    'BOSS',      'LEADERSHIP', 'd0000000-0000-0000-0000-000000000001', 'BOSS',        480000, 250000, 22, 940, 42, 38, 76, 91, 12, true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000002', 'sal_the_fist',   'Sal the Fist',   'MUSCLE',    'LEADERSHIP', 'd0000000-0000-0000-0000-000000000001', 'UNDERBOSS',   210000, 80000,  18, 780, 70, 55, 55, 48, 8,  true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000003', 'the_counselor',  'The Counselor',  'SCHEMER',   'LEADERSHIP', 'd0000000-0000-0000-0000-000000000001', 'CONSIGLIERE', 165000, 60000,  14, 620, 28, 40, 88, 72, 2,  true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000004', 'tommy_two_times', 'Tommy Two-Times','RACKETEER', 'LEADERSHIP', 'd0000000-0000-0000-0000-000000000001', 'CAPO',        430000, 120000, 25, 590, 38, 44, 58, 65, 5,  true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000005', 'vinnie_d',       'Vinnie D',       'SHOOTER',   'MEMBER',     'd0000000-0000-0000-0000-000000000001', 'SOLDIER',     42000,  15000,  30, 340, 64, 78, 40, 26, 18, true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000006', 'luca_b',         'Luca B',         'EARNER',    'MEMBER',     'd0000000-0000-0000-0000-000000000001', 'ASSOCIATE',   19000,  5000,   12, 180, 22, 30, 44, 58, 0,  true, 'ACTIVE'),
('e0000000-0000-0000-0000-000000000007', 'joey_socks',     'Joey Socks',     'MUSCLE',    'RECRUIT',    'd0000000-0000-0000-0000-000000000001', 'RECRUIT',     8000,   0,      5,  60,  30, 22, 28, 35, 0,  false, 'ACTIVE');

-- Update boss references
UPDATE families SET boss_player_id = 'e0000000-0000-0000-0000-000000000001'
WHERE id = 'd0000000-0000-0000-0000-000000000001';

-- ─────────────────────────────────────────────
-- CONTRIBUTION SCORES (dev players)
-- ─────────────────────────────────────────────

INSERT INTO contribution_scores (player_id, jobs_completed, missions_completed, money_earned,
  business_jobs_completed, passive_income_generated, loyalty_days) VALUES
('e0000000-0000-0000-0000-000000000001', 142, 38, 1240000, 22, 480000, 180),
('e0000000-0000-0000-0000-000000000002', 98,  28, 780000,  18, 210000, 160),
('e0000000-0000-0000-0000-000000000003', 72,  20, 550000,  14, 165000, 155),
('e0000000-0000-0000-0000-000000000004', 88,  24, 650000,  16, 180000, 145),
('e0000000-0000-0000-0000-000000000005', 38,  14, 185000,  8,  42000,  84),
('e0000000-0000-0000-0000-000000000006', 15,  5,  85000,   2,  19000,  42),
('e0000000-0000-0000-0000-000000000007', 3,   2,  8000,    0,  0,      7);

-- ─────────────────────────────────────────────
-- CREWS
-- ─────────────────────────────────────────────

INSERT INTO crews (id, name, family_id, leader_id, description, territory, status) VALUES
(
  'f0000000-0000-0000-0000-000000000001',
  'South Port Crew',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'Sal''s crew covering South Port and the Waterfront.',
  ARRAY['WATERFRONT','NORTH_END'], 'ACTIVE'
),
(
  'f0000000-0000-0000-0000-000000000002',
  'Dockside Crew',
  'd0000000-0000-0000-0000-000000000001',
  'e0000000-0000-0000-0000-000000000002',
  'Industrial Belt and Riverside operations.',
  ARRAY['INDUSTRIAL_BELT','DOWNTOWN'], 'ACTIVE'
);

-- Assign players to crews
UPDATE players SET crew_id = 'f0000000-0000-0000-0000-000000000001', crew_role = 'LEADER'
WHERE id = 'e0000000-0000-0000-0000-000000000002';
UPDATE players SET crew_id = 'f0000000-0000-0000-0000-000000000001', crew_role = 'MEMBER'
WHERE id IN ('e0000000-0000-0000-0000-000000000004','e0000000-0000-0000-0000-000000000005');

-- ─────────────────────────────────────────────
-- FRONT INSTANCES (dev seed)
-- ─────────────────────────────────────────────

INSERT INTO front_instances (id, turf_id, slot_index, front_type, family_id, upgrade_level,
  manager_player_id, daily_income_cache) VALUES
-- Casino Strip - Grand Boulevard
('g0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000040', 0, 'CASINO',       'd0000000-0000-0000-0000-000000000001', 3, 'e0000000-0000-0000-0000-000000000002', 55000),
-- Waterfront - Pier 7
('g0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000010', 0, 'CONSTRUCTION', 'd0000000-0000-0000-0000-000000000001', 3, 'e0000000-0000-0000-0000-000000000002', 45000),
('g0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000010', 1, 'NIGHTCLUB',    'd0000000-0000-0000-0000-000000000001', 1, 'e0000000-0000-0000-0000-000000000002', 16000),
-- North End
('g0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000020', 0, 'PIZZERIA',  'd0000000-0000-0000-0000-000000000001', 2, 'e0000000-0000-0000-0000-000000000004', 5280),
('g0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000020', 1, 'SMALL_BAR', 'd0000000-0000-0000-0000-000000000001', 1, 'e0000000-0000-0000-0000-000000000004', 2500);

-- ─────────────────────────────────────────────
-- BUSINESS ASSIGNMENTS (dev seed)
-- ─────────────────────────────────────────────

INSERT INTO business_assignments (front_instance_id, slot_definition_id, player_id) VALUES
-- Casino: Sal as Manager, Vinnie as Pit Boss, Luca as Dealer
('g0000000-0000-0000-0000-000000000001', 'slot-casino-manager',    'e0000000-0000-0000-0000-000000000002'),
('g0000000-0000-0000-0000-000000000001', 'slot-casino-pit-boss',   'e0000000-0000-0000-0000-000000000005'),
('g0000000-0000-0000-0000-000000000001', 'slot-casino-dealer',     'e0000000-0000-0000-0000-000000000006'),
-- Construction: Sal as Manager, Tommy as Site Foreman
('g0000000-0000-0000-0000-000000000002', 'slot-construction-manager',      'e0000000-0000-0000-0000-000000000002'),
('g0000000-0000-0000-0000-000000000002', 'slot-construction-site-foreman', 'e0000000-0000-0000-0000-000000000004'),
-- Pizzeria: Tommy as Manager
('g0000000-0000-0000-0000-000000000004', 'slot-pizzeria-manager',  'e0000000-0000-0000-0000-000000000004');

-- ─────────────────────────────────────────────
-- SAMPLE NOTIFICATIONS (dev)
-- ─────────────────────────────────────────────

INSERT INTO notifications (player_id, type, title, body, read, created_at) VALUES
('e0000000-0000-0000-0000-000000000001', 'WAR_DECLARED',        'War Declared', 'The Ferrante Crew has declared war on the Corrado Family.', false, now() - '12 hours'::INTERVAL),
('e0000000-0000-0000-0000-000000000001', 'PASSIVE_INCOME_PAYOUT', 'Passive Income', 'Casino generated $12,400. Deposited to family treasury.', false, now() - '1 day'::INTERVAL),
('e0000000-0000-0000-0000-000000000001', 'RANK_ELIGIBLE',       'Promotion Eligible', 'Tommy Two-Times has met thresholds for Underboss.', false, now() - '1 day'::INTERVAL),
('e0000000-0000-0000-0000-000000000001', 'SEASON_ENDING_SOON',  'Season 3 Ending', 'Season 3 ends in 4 days. Lock in your rankings.', true, now() - '3 days'::INTERVAL);

-- ─────────────────────────────────────────────
-- OBITUARIES (dev)
-- ─────────────────────────────────────────────

INSERT INTO obituary_entries (event_type, player_alias, family_id, family_name, note, created_at) VALUES
('DEATH', 'Marco Ferrante', 'd0000000-0000-0000-0000-000000000002', 'Ferrante Crew', 'Found in his car near the waterfront. The Cardinal sends his regards.', now() - '9 days'::INTERVAL),
('WITNESS_PROTECTION', 'Danny Bricks', 'd0000000-0000-0000-0000-000000000003', 'Rizzo Outfit', 'Turned state''s evidence after the Pier 7 raid. Left with a new name and federal security.', now() - '11 days'::INTERVAL),
('LEADERSHIP_CHANGE', 'Don Corrado', 'd0000000-0000-0000-0000-000000000001', 'Corrado Family', 'Don Corrado has assumed control of the family. The transition was seamless. The throne is occupied.', now() - '30 days'::INTERVAL);

-- ─────────────────────────────────────────────
-- LIVE-OPS EVENTS (dev)
-- ─────────────────────────────────────────────

INSERT INTO liveops_events (name, description, flavor, scope, scope_target_id, modifiers, start_at, end_at, active) VALUES
(
  'Casino Weekend',
  'Increased casino activity across the city this weekend.',
  'The chips are hot. The tables are packed. Cash flows like water.',
  'FRONT_TYPE', 'CASINO',
  '[{"type": "INCOME_MULTIPLIER", "multiplier": 1.5, "targetId": "CASINO"}]'::JSONB,
  now() - '1 day'::INTERVAL, now() + '2 days'::INTERVAL, true
),
(
  'Waterfront Crackdown',
  'Federal agents are active on the docks this week.',
  'Feds are everywhere at the docks. Keep your head down.',
  'DISTRICT', 'WATERFRONT',
  '[{"type": "JAIL_RISK_MULTIPLIER", "multiplier": 1.75, "targetId": null}, {"type": "INCOME_MULTIPLIER", "multiplier": 0.7, "targetId": null}]'::JSONB,
  now() - '1 day'::INTERVAL, now() + '3 days'::INTERVAL, true
);

-- ─────────────────────────────────────────────
-- FAMILY ACTIVITY FEED (dev)
-- ─────────────────────────────────────────────

INSERT INTO family_activity_feed (family_id, event_type, actor_alias, actor_role, description, metadata, created_at) VALUES
('d0000000-0000-0000-0000-000000000001', 'WAR_STARTED',       'Don Corrado',    'BOSS',       'Don Corrado declared war on the Ferrante Crew after repeated turf incursions.', '{}'::JSONB, now() - '12 hours'::INTERVAL),
('d0000000-0000-0000-0000-000000000001', 'TURF_PURCHASED',    'Don Corrado',    'BOSS',       'South Port district added to family holdings. Cost: $85,000.', '{"cost": 85000}'::JSONB, now() - '1 day'::INTERVAL),
('d0000000-0000-0000-0000-000000000001', 'MEMBER_PROMOTED',   'Sal the Fist',   'UNDERBOSS',  'Vinnie D promoted from Associate to Soldier after consistent performance.', '{}'::JSONB, now() - '2 days'::INTERVAL),
('d0000000-0000-0000-0000-000000000001', 'FRONT_UPGRADED',    'Sal the Fist',   'UNDERBOSS',  'Waterfront Casino upgraded to Tier 3. Passive income increased by $4,200/day.', '{}'::JSONB, now() - '2 days'::INTERVAL);

-- ─────────────────────────────────────────────
-- WORLD ACTIVITY FEED (dev)
-- ─────────────────────────────────────────────

INSERT INTO world_activity_feed (event_type, headline, detail, family_id, district_id, created_at) VALUES
('OBITUARY', 'Marco Ferrante Found Dead', 'Senior Ferrante Crew member found near the waterfront. Third death this month.', 'd0000000-0000-0000-0000-000000000002', NULL, now() - '9 days'::INTERVAL),
('WITNESS_PROTECTION', 'Danny Bricks Enters Federal Protection', 'Rizzo Outfit capo turned state''s evidence. Three open investigations reopened.', 'd0000000-0000-0000-0000-000000000003', NULL, now() - '11 days'::INTERVAL),
('FAMILY_RANK_CHANGE', 'Corrado Family Claims #1 Ranking', 'The Corrado Family overtook the Rizzo Outfit for the top position in Season 3.', 'd0000000-0000-0000-0000-000000000001', NULL, now() - '5 days'::INTERVAL),
('DISTRICT_CONTROL_CHANGE', 'Corrado Family Controls Downtown', 'After sustained turf investment, the Corrado Family now controls the Downtown district.', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', now() - '3 days'::INTERVAL);

-- ─────────────────────────────────────────────
-- Calculate initial district influence
-- ─────────────────────────────────────────────

SELECT update_district_influence();

COMMIT;

-- Schema + seed deployment complete.
-- Next steps:
--   1. Set Auth > Settings > Site URL to your Vercel URL
--   2. Add redirect URLs for your domain
--   3. Optionally disable email confirmation for alpha testing