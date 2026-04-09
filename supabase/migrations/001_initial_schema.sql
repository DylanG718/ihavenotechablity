-- ═══════════════════════════════════════════════════════════════════════
-- THE LAST FIRM — Initial Database Schema
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
