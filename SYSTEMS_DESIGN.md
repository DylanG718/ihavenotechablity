# The Last Firm — Systems Design Reference

**Version:** 2.0  
**Date:** April 2026  
**Scope:** Archetype redesign, onboarding branching, family lifecycle, treasury ledger, inventory & issuance, permissions

---

## 1. Core Design Principle: Archetype ≠ Family Rank

**This is the single most important conceptual distinction in the system.**

| Concept | What it is | Examples |
|---|---|---|
| **Archetype** | Personal playstyle / specialization | Runner, Earner, Muscle, Shooter, Schemer, Racketeer, Hitman |
| **Family Rank** | Organizational role / authority level | Don, Underboss, Consigliere, Capo, Soldier, Associate, Recruit |

A Runner can become a Don. A Muscle can become a Consigliere. An Earner can be a Recruit. These are completely orthogonal dimensions. The only exception is Hitman — the solo path archetype cannot hold any family rank because they cannot join families.

**Enforced in:**
- `shared/schema.ts` — `Archetype` and `FamilyRole` are separate types
- `client/src/lib/archetypes.ts` — archetype definitions
- `client/src/lib/permissions.ts` — `GameRole` is derived from `FamilyRole`, not `Archetype`
- Onboarding UI — explicit clarification on the archetype choice step

---

## 2. Archetype System

### 2.1 Archetype Definitions

Defined in: `client/src/lib/archetypes.ts`  
Types defined in: `shared/schema.ts`

| Archetype | Playstyle | Solo Only | Notes |
|---|---|---|---|
| **RUNNER** | Flexible / All-rounder | No | Beginner-friendly. Balanced stats. No specialization bonus. |
| **EARNER** | Economic | No | +15% business income, financial crimes |
| **MUSCLE** | Combat / Enforcement | No | +20% damage, HP bonus |
| **SHOOTER** | Precision Combat | No | +25% accuracy, assassination missions |
| **SCHEMER** | Intel / Strategy | No | +20% complex crime success, suspicion reduction |
| **RACKETEER** | Territory / Street | No | +20% turf income, stash operations |
| **HITMAN** | Solo Assassination | **Yes** | Cannot join families. Contract board only. |

### 2.2 BOSS Archetype Removal

**Rationale:** "Boss" is a family rank (Don), not a playstyle. Having a "Boss" archetype conflated the two systems and created conceptual debt.

**Migration path:**
- All existing `BOSS` archetype players → `RUNNER`
- SQL: `UPDATE players SET archetype = 'RUNNER' WHERE archetype = 'BOSS'`
- Migration: `supabase/migrations/004_family_systems.sql` (Part 1)

**Application layer:** `BOSS` archetype value is no longer selectable. The DB enum still contains the value for backward compatibility; the application never presents it.

### 2.3 RUNNER Archetype Design Constraints

Runner must NOT become a best archetype through overbalancing. Constraints enforced in design and code:

- All stats weighted `MEDIUM` — no high or low
- `starting_bonuses`: access and flexibility only, no numeric advantages
- `soft_penalties`: no specialization bonus anywhere (explicit)
- In job engine: Runner does not receive any multiplier bonuses that specialists receive
- If future balancing accidentally buffs Runner, the `recommended_for` framing draws beginners; specialists still outperform in their lanes

---

## 3. Onboarding Branching Architecture

### 3.1 Two Paths

After archetype selection (`ARCHETYPE_CHOICE`), `FAMILY_PATH_CHOICE` branches:

```
INTRO → ARCHETYPE_CHOICE → FAMILY_PATH_CHOICE
                                    │
             ┌──────────────────────┤─────────────────────┐
             │                                             │
          Standard Path                            Founder / Don Path
        (join/unaffiliated)                     (create your own family)
             │                                             │
    FIRST_JOB → FAMILY_INTRO →            FOUNDER_FAMILY_NAME →
    APPLY_OR_INVITED → STASH_INTRO →      FOUNDER_RESPONSIBILITY_WARN →
    DASHBOARD_TOUR                         FOUNDER_TREASURY_INTRO →
                                          FOUNDER_KICKUPS_TAXES →
                                          FOUNDER_RANKS_OVERVIEW →
                                          FOUNDER_PROTECTION_INTRO →
                                          FOUNDER_STABILIZE_INTRO →
                                          FOUNDER_INVENTORY_INTRO →
                                          FOUNDER_DASHBOARD
```

**Hitman special case:** `FAMILY_PATH_CHOICE` step skips the branch decision and shows "You Work Alone" — proceeds to standard path sans family content.

### 3.2 Step Arrays

Defined in: `shared/ops.ts`

- `STANDARD_ONBOARDING_STEPS` — 8 steps
- `FOUNDER_ONBOARDING_STEPS` — 12 steps
- `ONBOARDING_STEP_ORDER` — alias of STANDARD_ONBOARDING_STEPS (legacy compat)

### 3.3 State Management

`Onboarding.tsx` holds `OnboardingState`:
```typescript
interface OnboardingState {
  path: 'standard' | 'founder';
  steps: OnboardingStep[];
  currentIdx: number;
  archetypeChosen: string | null;
  founderFamilyName: string;
}
```

When user selects founder path, `steps` is replaced with `FOUNDER_ONBOARDING_STEPS` and `currentIdx` jumps to `FOUNDER_FAMILY_NAME`.

### 3.4 Analytics Instrumentation

| Event | Trigger |
|---|---|
| `archetype_previewed` | User taps archetype card (opens panel) |
| `archetype_selected` | User confirms archetype |
| `runner_selected` | Specifically tracks Runner selection |
| `family_path_selected` | Standard path chosen |
| `family_creation_path_chosen` | Founder path chosen |
| `family_creation_started` | Beginning founder flow |
| `family_creation_completed` | Family successfully created |
| `founder_onboarding_step_completed` | Each founder step advanced |
| `founder_onboarding_completed` | Full founder onboarding done |
| `onboarding_completed` | Any path completed |
| `onboarding_abandoned_at_step` | Skip All pressed |

---

## 4. Family Rank Model

### 4.1 Rank Hierarchy

Defined in: `shared/familyConfig.ts` → `FAMILY_RANKS`  
DB enum: `family_role_type` in `shared/schema.ts`

| Rank | Order | Key Responsibilities |
|---|---|---|
| **Don (BOSS)** | 5 | Strategic control, treasury authority, war declarations, tax/kickup settings, appoint Underboss/Consigliere |
| **Underboss** | 4 | Second-in-command, operations oversight, treasury withdrawals, item issuance |
| **Consigliere** | 3 | Diplomatic negotiations, advisory, intelligence |
| **Capo** | 3 | Crew management, invite recruits, crew-level promotions |
| **Soldier** | 2 | Core operator, PvP eligible, missions |
| **Associate** | 1 | Normal missions, deposits, basic family access |
| **Recruit** | 0 | Probationary, starter missions only |

Note: Consigliere and Capo have the same order value (3) — they are peer-level roles with different lanes, not a linear chain.

### 4.2 Permission Matrix

Defined in two places:
1. `shared/ops.ts` → `WORLD_ACTION_PERMISSIONS` (action → minimum rank)
2. `client/src/lib/permissions.ts` → `ROLE_PERMISSIONS` (role → permission array)

The `ops.ts` permissions matrix is the **server-authoritative** source. The `permissions.ts` file is used for **client-side UI gating** (show/hide features) and must not be trusted as the security boundary.

**Critical server-side enforcement:**
- `create_family()` — only unaffiliated players
- `issue_family_item()` — UNDERBOSS+ only, with row-level lock
- `update_family_tax_rates()` — DON only
- `check_attack_eligibility()` — protection check before any attack

### 4.3 Adding New Permissions

1. Add the action to `WorldAction` type in `shared/ops.ts`
2. Add the minimum rank to `WORLD_ACTION_PERMISSIONS`
3. Add to `ROLE_PERMISSIONS` in `client/src/lib/permissions.ts` for the appropriate roles
4. Add server-side check in the relevant RPC function
5. Add to `FamilyAuditAction` if it should be auditable

---

## 5. Family Bootstrap & Lifecycle

### 5.1 Configuration

All tunable values in: `shared/familyConfig.ts` → `NEW_FAMILY_CONFIG`

```typescript
const NEW_FAMILY_CONFIG = {
  starting_cash: 5_000,           // treasury seed
  starting_items: [               // vault items
    { item_definition_id: '9mm_pistol', quantity: 2 }
  ],
  protection_window_days: 10,     // days protected from larger families
  protection_attack_threshold_members: 3,  // attacker must have > 3 members to be blocked
  default_tax_rate_pct: 10,
  default_kickup_rate_pct: 5,
  stabilization: {
    require_underboss: true,
    require_consigliere: true,
    require_minimum_treasury: 10_000,
    evaluation_deadline_days: 10,
  },
};
```

**To change any value:** edit `NEW_FAMILY_CONFIG` only. Never hardcode bootstrap values elsewhere.

### 5.2 Bootstrap States

`FamilyBootstrapState` in `shared/schema.ts`:

| State | Meaning |
|---|---|
| `NEW` | Within protection window, milestones not yet met |
| `STABLE` | All milestones met (can happen before deadline) |
| `VULNERABLE` | Deadline passed, not all milestones met |

Transitions:
- `NEW` → `STABLE`: when all milestones met (any time before deadline)
- `NEW` → `VULNERABLE`: when deadline passes without all milestones
- `STABLE` / `VULNERABLE` are terminal (no transition back)

### 5.3 Protection Logic

Defined in: `shared/familyConfig.ts` → `checkFamilyProtection()`

Protection blocks attacks when ALL of:
1. `protection_expires_at` is not null
2. Current time < `protection_expires_at`
3. Attacker has > `protection_attack_threshold_members` members

**Not blocked by:**
- Small families (≤ threshold)
- Solo players
- After protection expires

**Server enforcement:** `check_attack_eligibility()` RPC in `supabase/migrations/004_family_systems.sql` must be called before any attack action.

### 5.4 Stabilization Logic

Defined in: `shared/familyConfig.ts` → `evaluateStabilization()`

Server-side: `evaluate_family_stabilization()` RPC — run by cron or triggered on relevant events (Underboss/Consigliere recruited, treasury deposit).

Client-side: `FounderDashboard.tsx` shows real-time stabilization status using the same `evaluateStabilization()` function.

---

## 6. Treasury System

### 6.1 Data Model

```
families.treasury (number)           — current balance snapshot
treasury_transactions (table)        — full ledger
  - type: TreasuryTxType            — what kind of movement
  - amount: number                   — positive = deposit, negative = withdrawal
  - balance_after: number            — running balance at that point
  - actor_player_id                  — who triggered it
  - note                             — human-readable memo
  - metadata (JSONB)                 — structured data (job_id, mission_id, etc.)
```

### 6.2 Transaction Types

`BOOTSTRAP_DEPOSIT` | `JOB_TAX` | `KICKUP` | `MEMBER_DEPOSIT` | `DON_DEPOSIT` | `DON_WITHDRAWAL` | `ITEM_PURCHASE` | `ITEM_ISSUED` | `ITEM_RETURNED` | `MISSION_REWARD` | `WAR_REPARATION` | `TURF_INCOME` | `ADMIN_ADJUSTMENT`

### 6.3 Tax & Kick-Up

- **Tax rate** (`tax_rate_pct`, 0–50): % of member job earnings auto-deposited to treasury
- **Kick-up rate** (`kickup_rate_pct`, 0–30): % of crew earnings paid to leadership as tribute
- Both settable by Don only via `update_family_tax_rates()` RPC
- All changes create audit log entries
- UI: `FamilyTreasury.tsx` → Settings tab

### 6.4 Permissions

| Action | Minimum Rank |
|---|---|
| View balance | CAPO |
| View transaction history | CAPO |
| Deposit | ASSOCIATE (any member) |
| Withdraw | UNDERBOSS |
| Change tax/kickup rates | DON only |

---

## 7. Family Inventory & Item Issuance

### 7.1 Architecture

```
item_definitions       — catalog of item types (seeded, not user-created)
family_item_instances  — specific instances held by a family
family_item_issuances  — records of items issued to members
```

### 7.2 Item Lifecycle

```
item_definition (catalog)
      ↓ (acquired by family)
family_item_instance [IN_FAMILY_VAULT]
      ↓ (issued to member)
family_item_instance [ISSUED]
family_item_issuance [ACTIVE]
      ↓ (outcome)
   RETURNED → IN_FAMILY_VAULT   — returned to vault
   CONSUMED → CONSUMED          — used up in operation
   LOST     → LOST              — lost in failed operation
   CONFISCATED → CONFISCATED    — seized by authorities
```

### 7.3 Issuance Permissions

Only **Don (BOSS)** or **Underboss** can issue items.

**Race condition protection:** `issue_family_item()` RPC uses `FOR UPDATE` row lock on the item instance to prevent double-issuance in concurrent requests.

**Validation:**
- Item must be `IN_FAMILY_VAULT`
- Target player must be in the same family
- Issuer must be BOSS or UNDERBOSS

### 7.4 Audit Trail

Every issuance creates:
1. An `family_item_issuances` record
2. A `family_audit_log` entry
3. An analytics event (`family_item_issued`)

### 7.5 Item Catalog

Defined in: `shared/familyConfig.ts` → `ITEM_CATALOG`  
DB: `item_definitions` table (seeded in migration 004)

| ID | Name | Category | Tier | Value |
|---|---|---|---|---|
| `9mm_pistol` | 9mm Pistol | WEAPON | STANDARD | $1,500 |
| `bulletproof_vest` | Bulletproof Vest | ARMOR | STANDARD | $2,500 |
| `lockpick_kit` | Lockpick Kit | TOOL | STANDARD | $800 |
| `burner_phone` | Burner Phone | MISC | STANDARD | $200 |
| `getaway_car` | Getaway Car | VEHICLE | STANDARD | $8,000 |
| `safecracking_kit` | Safecracking Kit | TOOL | ADVANCED | $4,500 |

---

## 8. Family Audit Log

### 8.1 Purpose

Human-readable trail of all significant family actions, visible to CAPO+ rank.

### 8.2 Auditable Actions

`RANK_ASSIGNED` | `MEMBER_KICKED` | `MEMBER_LEFT` | `TREASURY_DEPOSITED` | `TREASURY_WITHDRAWN` | `TAX_RATE_CHANGED` | `ITEM_ISSUED` | `ITEM_RETURNED` | `ITEM_LOST` | `FAMILY_CREATED` | `PROTECTION_EXPIRED` | `FAMILY_STABILIZED` | `FAMILY_BECAME_VULNERABLE` | `WAR_DECLARED` | `PEACE_SIGNED` | `SETTINGS_CHANGED`

### 8.3 Schema

```sql
family_audit_log (
  id               UUID PRIMARY KEY,
  family_id        UUID,
  action           family_audit_action,
  actor_player_id  UUID,        -- who did it
  target_player_id UUID,        -- who was affected
  summary          TEXT,        -- human-readable
  metadata         JSONB,       -- structured details
  created_at       TIMESTAMPTZ
)
```

---

## 9. Server-Side RPCs

Defined in: `supabase/migrations/004_family_systems.sql`

| RPC | Purpose | Auth Required |
|---|---|---|
| `create_family(name, motto)` | Create new family, seed treasury and vault | Any unaffiliated player |
| `issue_family_item(item_id, to_player_id, purpose, ...)` | Issue item from vault | BOSS or UNDERBOSS only |
| `evaluate_family_stabilization(family_id)` | Check/update bootstrap state | Service role (cron) |
| `check_attack_eligibility(attacker_family_id, target_family_id)` | Verify attack is permitted | Any |
| `update_family_tax_rates(family_id, tax_rate, kickup_rate)` | Change tax/kickup | DON only |

**Security pattern:** All RPCs use `SECURITY DEFINER` and verify `auth.uid()` against family membership before any mutation.

---

## 10. Migration Notes

### 10.1 BOSS Archetype → RUNNER

```sql
-- Migration 004, Part 1
ALTER TYPE archetype_type ADD VALUE IF NOT EXISTS 'RUNNER';
UPDATE players SET archetype = 'RUNNER' WHERE archetype = 'BOSS';
```

**No player data is lost.** Their archetype changes from BOSS to RUNNER. Their family rank (if BOSS/Don) is unaffected — that's stored in `family_role`, not `archetype`.

### 10.2 New Family Fields

```sql
-- Added to families table
bootstrap_state          family_bootstrap_state DEFAULT 'STABLE'
protection_expires_at    TIMESTAMPTZ             DEFAULT NULL
tax_rate_pct            SMALLINT                DEFAULT 10
kickup_rate_pct         SMALLINT                DEFAULT 5
```

All existing families default to `STABLE` bootstrap state and `NULL` protection — meaning they are treated as established families and no protection or stabilization logic applies to them. This is correct.

### 10.3 New Tables

`treasury_transactions`, `item_definitions`, `family_item_instances`, `family_item_issuances`, `family_audit_log`

All new tables — no existing data impact.

### 10.4 Running Migrations

```bash
# Using Supabase CLI
supabase db push

# Or manually via SQL editor in order:
# 001_initial_schema.sql
# 002_rls_policies.sql
# 003_rpc_functions.sql
# 004_family_systems.sql  ← NEW
```

---

## 11. UI Pages Reference

| Page | Route | Access | Purpose |
|---|---|---|---|
| `Onboarding.tsx` | `/onboarding` | All new users | Branching onboarding (standard + founder paths) |
| `FounderDashboard.tsx` | `/founder` | Don of NEW family | Command center for new family |
| `FamilyInventory.tsx` | `/family/inventory` | Capo+ to view, Underboss+ to issue | Family vault + issuance management |
| `FamilyTreasury.tsx` | `/family/treasury` | Capo+ to view, Don to set rates | Treasury ledger + tax settings |

---

## 12. Future Work

### Short-term (production readiness)
- [ ] Connect Supabase auth to `signIn` → `onboarding_started` event
- [ ] Wire `create_family` RPC call from founder onboarding terminal step
- [ ] Wire `issue_family_item` RPC to replace mock state in `FamilyInventory.tsx`
- [ ] Wire `update_family_tax_rates` RPC to replace mock in `FamilyTreasury.tsx`
- [ ] Cron job: daily `evaluate_family_stabilization()` for all NEW families
- [ ] Protection expiry: check-and-expire `protection_expires_at` on cron

### Medium-term
- [ ] Jobs engine: item requirement checks (does player have issued item for armed_robbery?)
- [ ] Job outcome: item consumption/return/loss state transitions
- [ ] Treasury auto-tax: calculate job_tax on job completion, insert treasury_transaction
- [ ] Kick-up calculation: weekly or per-payout kickup processing
- [ ] Family directory: show `bootstrap_state` + protection status
- [ ] Push notifications: "Your protection expires in 24h"
- [ ] Admin panel: override bootstrap_state + protection
- [ ] Wars: call `check_attack_eligibility` before processing

### Long-term
- [ ] Item trading between families
- [ ] Item durability / condition
- [ ] Item upgrades
- [ ] Season-based item reset
- [ ] Elite item tier (advanced acquisition requirements)
- [ ] Hitman item access (specific contract-based items)

---

## 13. Implementation Summary

### What was changed

| Component | Change |
|---|---|
| `shared/schema.ts` | Added RUNNER archetype, removed BOSS archetype. Added `FamilyBootstrapState`, new `Family` fields (created_at, protection_expires_at, bootstrap_state, tax_rate_pct, kickup_rate_pct). Added `TreasuryTransaction`, `ItemDefinition`, `FamilyItemInstance`, `FamilyItemIssuance`, `FamilyAuditEntry` types. |
| `shared/familyConfig.ts` | **NEW FILE** — `NEW_FAMILY_CONFIG`, `ITEM_CATALOG`, `FAMILY_RANKS`, `checkFamilyProtection()`, `evaluateStabilization()` |
| `shared/ops.ts` | New `OnboardingStep` values for both paths, `STANDARD_ONBOARDING_STEPS`, `FOUNDER_ONBOARDING_STEPS`, new `WorldAction` entries for inventory/treasury/family, new analytics event names |
| `client/src/lib/archetypes.ts` | BOSS archetype removed, RUNNER archetype added with full data |
| `client/src/lib/familyData.ts` | **NEW FILE** — Mock data for treasury, inventory, issuances, audit log |
| `client/src/lib/analyticsEngine.ts` | 20+ new analytics event methods |
| `client/src/pages/Onboarding.tsx` | Full rewrite — branching architecture, founder path (12 steps), progressive disclosure |
| `client/src/pages/FamilyInventory.tsx` | **NEW** — Vault, issuances, audit log, issue modal |
| `client/src/pages/FamilyTreasury.tsx` | **NEW** — Balance, ledger, settings |
| `client/src/pages/FounderDashboard.tsx` | **NEW** — Protection timer, stabilization checklist, priority actions |
| `client/src/App.tsx` | New routes: `/family/inventory`, `/family/treasury`, `/founder` |
| `client/src/components/layout/Sidebar.tsx` | Family Vault + Treasury nav links, sign out button |
| `client/src/lib/mockData.ts` | `p-boss` archetype: BOSS → RUNNER |
| `supabase/migrations/001_initial_schema.sql` | Updated archetype enum comment |
| `supabase/migrations/004_family_systems.sql` | **NEW** — Full schema for all new tables + RPCs |

### Assumptions made

1. **Protection threshold** — "Larger family" is defined as > 3 members. This is tunable in `NEW_FAMILY_CONFIG.protection_attack_threshold_members`.
2. **Treasury in cents** — DB stores amounts in integer cents (e.g. $5,000 = 500000). Client displays in dollars.
3. **Runner balance** — Runner is balanced at all-MEDIUM stats. Future job engine must NOT give Runner any specialization bonuses. This constraint is documented in code and this file.
4. **Item catalog is seeded, not player-created** — Items are defined in `item_definitions` and seeded. Players/families cannot create new item types.
5. **Audit log is append-only** — No updates to audit log entries ever.
6. **Bootstrap state is one-way** — NEW → STABLE or NEW → VULNERABLE. No reversion. If a STABLE family wants to "restart," that's a future feature.
7. **Hitman skip** — Hitman archetype bypasses family path choice in onboarding. No special founder flow for Hitmen (they cannot create families by design).

### Remaining conceptual debt
- Job engine does not yet enforce item requirements (flagged as future work)
- Treasury auto-tax is designed but not wired to the job completion flow
- `create_family` RPC call is not yet triggered from the founder onboarding terminal step — it fires mock success (connect to Supabase to enable)
