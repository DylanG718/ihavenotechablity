# The Last Firm

A persistent browser-based organized crime strategy game. Players join families, run businesses, execute jobs, and compete for territorial control.

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + TypeScript + Vite + Wouter (hash routing) |
| Styling | Tailwind CSS v3 + shadcn/ui + Apple-inspired theme |
| Backend | Supabase (Postgres + Auth + RLS + RPC functions) |
| State | React Context (mock mode) → Supabase queries (live mode) |
| Deployment | Static frontend on S3/CDN; Supabase handles all data |

---

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd thelastfirm
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local and fill in your Supabase credentials
```

Get your keys from [supabase.com](https://supabase.com) → Project Settings → API:
- `VITE_SUPABASE_URL` — Project URL
- `VITE_SUPABASE_ANON_KEY` — anon/public key (safe for browser)

### 3. Run locally (mock mode — no Supabase needed)

```bash
npm run dev
```

The app runs fully in mock mode without Supabase credentials. All data is in-memory TypeScript mocks. The game is fully playable for UI testing.

### 4. Connect to Supabase (live mode)

Once credentials are set in `.env.local`, the app switches to live Supabase queries automatically.

---

## Supabase Setup

### Option A: Local development (recommended for backend work)

**Prerequisites:** [Supabase CLI](https://supabase.com/docs/guides/cli/getting-started) installed.

```bash
# Start local Supabase stack (Postgres, Auth, etc.)
npm run supabase:start

# Apply all migrations
npm run supabase:migrate

# Seed dev data
npm run supabase:seed

# Generate TypeScript types from schema
npm run supabase:types
```

Local URLs (after `supabase start`):
- Studio: http://localhost:54323
- API: http://localhost:54321
- Anon key printed in terminal output

### Option B: Hosted Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run each migration in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_rls_policies.sql`
   - `supabase/migrations/003_rpc_functions.sql`
3. Run `supabase/seed.sql` to populate dev data
4. Copy your Project URL and anon key into `.env.local`

### Link CLI to hosted project

```bash
supabase link --project-ref your-project-ref
npm run supabase:migrate   # push local migrations to hosted
```

---

## Database Schema

### Core Tables

| Table | Purpose |
|---|---|
| `players` | All player accounts, stats, rank, family, protection state |
| `families` | Organized crime families with treasury and status |
| `crews` | Sub-family management units led by Underboss |
| `districts` | World map regions (6 total) |
| `turfs` | Purchasable territory parcels within districts |
| `district_influences` | Per-family influence scores per district (computed) |
| `business_definitions` | Catalog of front types (Casino, Pizzeria, etc.) |
| `business_slot_definitions` | Role slots per front type |
| `front_instances` | Placed fronts on turf slots |
| `business_assignments` | Players assigned to front roles |
| `business_exclusive_jobs` | Jobs unlocked by having a front assignment |
| `jobs` | Universal and ranked job catalog |
| `player_job_states` | Per-player cooldowns and job history |
| `family_relationships` | Diplomatic status between families |
| `family_board_posts` | Family-only message board |
| `chain_messages` | Chain-of-command internal messaging |
| `jail_records` | Arrest history and sentence tracking |
| `obituary_entries` | Public record of deaths, WP, retirements |
| `notifications` | Personal player notifications |
| `rank_history` | Promotion and demotion log |
| `contribution_scores` | Aggregated contribution metrics per player |
| `seasons` | Season records with reset configuration |
| `leaderboard_snapshots` | End-of-season family rankings |
| `liveops_events` | Scheduled world events with modifiers |
| `analytics_events` | Game telemetry |
| `family_activity_feed` | Family-scoped event timeline |
| `world_activity_feed` | Public world event timeline |

### RLS Summary

Row Level Security is enabled on all sensitive tables. Key rules:

- **players**: Public read (profiles); self-write only
- **families**: Authenticated read; Boss-write only
- **crews**: Family members read; Leadership writes
- **front_instances**: Semi-public read; Leadership writes
- **business_assignments**: Self + Leadership read; Underboss+ writes
- **notifications**: Self only
- **chain_messages**: Sender + recipient + family leadership
- **family_board_posts**: Family members only
- **Catalog tables** (districts, jobs, etc.): Public read

Helper functions:
- `current_player_id()` — resolves `auth.uid()` → player.id
- `is_admin()` — checks `players.is_admin`
- `current_family_id()` — current player's family
- `is_family_leadership()` — CAPO+

---

## RPC Functions

Called from the client via `supabase.rpc('function_name', params)`:

| Function | Description | Min Role |
|---|---|---|
| `get_my_profile()` | Full player profile with family, assignments, unread count | Any |
| `get_jobs_for_player()` | Jobs list with cooldown state | Any |
| `run_job(job_id, mode)` | Execute a job, apply rewards/penalties | Rank-gated |
| `purchase_turf(turf_slug)` | Buy turf for family treasury | BOSS |
| `build_front(turf_slug, slot, type)` | Place a front on turf | BOSS |
| `assign_business_role(front_id, player_id, slot_id)` | Staff assignment | UNDERBOSS+ |
| `claim_passive_income()` | Distribute daily front income | Any assigned |
| `mark_notification_read(notif_id)` | Mark one read | Self |
| `mark_all_notifications_read()` | Mark all read | Self |
| `send_chain_message(subject, body)` | Message to immediate superior | Any member |
| `apply_to_family(family_id)` | Request family membership | Unaffiliated |
| `promote_member(player_id, rank, note)` | Promote a family member | Leadership |
| `update_district_influence()` | Recalculate all influence scores | Admin |
| `create_season_snapshot(season_id)` | Capture standings | Admin |

---

## Economy Model

### Income sources
- Job rewards (universal + ranked): $300–$900K per job depending on rank
- Passive front income: $2.5K–$55K/day per front (Lv1 = base, Lv2 = 1.6×, Lv3 = 2.5×)
- Income splits: 30% family treasury, 15% manager, 5% staff per assigned slot

### Sinks (money leaves the system via)
- Turf purchase: $38K–$250K (one-time)
- Front build: $28K–$250K (one-time)
- Front upgrade: build_cost × 0.6 per level
- Front maintenance: $500–$2K/day (recurring)
- Jail bribe: 10% of player cash
- Witness Protection: 30% cash penalty
- Diplomacy proposals: $5K
- Crew creation: $15K
- Hitman contracts: $10K–$100K

---

## Permissions Matrix

Rank thresholds for world actions (see `shared/ops.ts` for full list):

| Action | Min Rank |
|---|---|
| Invite player, approve applicant | CAPO |
| Assign to business slot | UNDERBOSS |
| Purchase turf | BOSS |
| Build/place front | BOSS |
| Upgrade front | UNDERBOSS |
| Withdraw treasury | UNDERBOSS |
| Propose diplomacy | CONSIGLIERE |
| Declare war | BOSS |
| Appoint Underboss/Consigliere | BOSS |
| Promote to Capo | UNDERBOSS |

---

## Rank Progression

| Rank | Auto-eligible when | Requires leadership? |
|---|---|---|
| ASSOCIATE | 3 jobs, $5K earned, 2 missions, 1 day | No |
| SOLDIER | 15 jobs, $25K, 5 missions, 7 days | No |
| CAPO | 30 jobs, $75K, 10 missions, 14 days | Yes (UNDERBOSS+ appoints) |
| UNDERBOSS | 60 jobs, $200K, 20 missions, 30 days | Yes (BOSS appoints) |
| CONSIGLIERE | 20 jobs, $50K, 8 missions, 14 days | Yes (BOSS appoints) |

---

## Season Rollover

Season soft-resets at end:
- **Cleared**: treasury, prestige, turf ownership
- **Preserved**: rank, archetype, family membership, rep history

To trigger a season snapshot (admin):
```sql
SELECT create_season_snapshot('season-uuid-here');
```

---

## Mobile Support

The app is designed phone-first at 375px+.

Key mobile behaviors:
- Sidebar becomes a slide-in drawer (hamburger in topbar)
- Bottom nav for primary sections
- All tap targets are ≥ 44px
- Font size enforced to 16px+ on inputs (prevents iOS zoom)
- Tables scroll horizontally
- Modals become bottom sheets on small phones
- No horizontal overflow on main pages

Test breakpoints: 375px, 480px, 768px, 1280px

---

## Project Structure

```
thelastfirm/
├── client/src/
│   ├── lib/
│   │   ├── supabaseClient.ts   ← Supabase client + all query functions
│   │   ├── gameContext.tsx     ← Global player state (mock mode)
│   │   ├── mockData.ts         ← In-memory dev data
│   │   ├── worldConfig.ts      ← World seed config (districts, turfs, jobs)
│   │   └── opsData.ts          ← Notifications, feeds, analytics seed
│   ├── pages/                  ← All game pages
│   └── components/             ← Shared UI components
├── shared/
│   ├── schema.ts               ← Core TypeScript types
│   ├── world.ts                ← World layer types (District, Turf, Front, etc.)
│   └── ops.ts                  ← Permissions, progression, notifications
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_rls_policies.sql
│   │   └── 003_rpc_functions.sql
│   └── seed.sql                ← Dev data seed
├── .env.example                ← Copy to .env.local
└── README.md
```

---

## Dev Accounts (after seed)

| Player | Role | Family |
|---|---|---|
| don_corrado | BOSS | Corrado Family |
| sal_the_fist | UNDERBOSS | Corrado Family |
| the_counselor | CONSIGLIERE | Corrado Family |
| tommy_two_times | CAPO | Corrado Family |
| vinnie_d | SOLDIER | Corrado Family |
| luca_b | ASSOCIATE | Corrado Family |
| joey_socks | RECRUIT | Corrado Family |

Dev players have no `auth_user_id`. To test with real auth, sign up via the app and the player row will be auto-linked.

---

## Smoke Tests

After setup, verify:

- [ ] User can sign up → player row created in `players` table
- [ ] User can sign in → session returned, `get_my_profile()` works
- [ ] Dashboard loads with player data
- [ ] Jobs list loads via `get_jobs_for_player()`
- [ ] `run_job(job_id)` succeeds and updates `stat_cash` + `player_job_states`
- [ ] Cooldown prevents immediate re-run
- [ ] Family overview loads (families + members)
- [ ] Turf/front overview loads for player's family
- [ ] Business assignments display correctly
- [ ] Notification appears, can be marked read
- [ ] Mobile dashboard at 375px: no horizontal overflow, tap targets accessible
- [ ] Mobile jobs page: filter bar scrolls, job CTAs full-width

---

## Contributing

1. All schema changes go in a new numbered migration file
2. Never edit existing migrations (they may already be applied)
3. Keep RPC functions in `003_rpc_functions.sql` or add `004_` for new ones
4. Update `seed.sql` for any new catalog data
5. Run `npm run supabase:types` after schema changes to regenerate TypeScript types
