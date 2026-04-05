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
