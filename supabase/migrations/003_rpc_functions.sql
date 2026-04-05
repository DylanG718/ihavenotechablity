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
