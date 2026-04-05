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
