# The Last Firm — Alpha Deployment Guide

This document covers everything needed to take the game from this repo to a live URL.

---

## Stack Overview

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Wouter (hash routing) |
| Styling | Tailwind CSS v3 + shadcn/ui + custom CSS |
| Auth + DB | Supabase (auth, Postgres, RLS, RPC functions) |
| Hosting | Vercel (static SPA, no server needed) |
| Mock mode | Full prototype works without any Supabase connection |

**Architecture:** The app is a pure frontend SPA. No Express server is needed for Vercel deployment. All game actions use Supabase RPCs directly from the browser. The Express server in `server/` is only used during local development as a dev proxy and is not deployed.

---

## Running Locally

### Prerequisites
- Node 20+
- npm 9+
- Supabase CLI (optional, for local DB): `npm install -g supabase`

### Quick start (mock mode — no Supabase needed)

```bash
git clone <your-repo-url>
cd thelastfirm
npm install
npm run dev
```

Open `http://localhost:5000`. The app runs fully in mock mode with in-memory data. Auth is bypassed and you can explore all screens.

### With real Supabase (full stack)

```bash
cp .env.example .env.local
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
npm run dev
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes (for prod) | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes (for prod) | Supabase anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | For seed scripts | Service role key (never in browser) |

**Finding these values:**
1. Go to [supabase.com](https://supabase.com) → your project
2. Settings → API
3. Copy "Project URL" → `VITE_SUPABASE_URL`
4. Copy "anon public" → `VITE_SUPABASE_ANON_KEY`
5. Copy "service_role" → `SUPABASE_SERVICE_ROLE_KEY` (scripts only)

---

## Supabase Setup

### 1. Create a project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Choose a region close to your users
3. Save the database password somewhere safe

### 2. Push migrations

The schema, RLS policies, and RPC functions are all in `supabase/migrations/`.

**Option A: Using Supabase CLI**
```bash
# Install CLI
npm install -g supabase

# Link to your project
supabase login
supabase link --project-ref <your-project-ref>

# Push all migrations
supabase db push
```

**Option B: Using Supabase Dashboard SQL editor**
Run each file in order:
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_rpc_functions.sql`

### 3. Seed alpha data

For alpha testing, seed the world config (districts, turfs, families):

```bash
# Via CLI
supabase db reset --seed
# (uses supabase/seed.sql)

# Or paste supabase/seed.sql into the Supabase SQL editor
```

### 4. Configure Auth settings

In Supabase Dashboard → Authentication → Settings:

**Site URL (required):**
```
https://your-game.vercel.app
```

**Redirect URLs (add all that apply):**
```
https://your-game.vercel.app/**
https://your-game.vercel.app/#/**
http://localhost:5000/**
http://localhost:5000/#/**
```

**Email confirmation:**
- For alpha: consider disabling "Confirm email" in Auth → Settings → Email
- This removes friction — users can log in immediately after signup

**Password settings:**
- Minimum length: 8 (already enforced in UI)

---

## Deploying to Vercel

### Option A: Deploy from GitHub (recommended)

1. Push the repo to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Vercel will auto-detect the config from `vercel.json`
5. Add environment variables:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your anon key
6. Click Deploy

Vercel settings that are auto-configured via `vercel.json`:
- Build command: `npm run build`
- Output directory: `dist/public`
- SPA rewrites: all routes → `index.html`

### Option B: Deploy via CLI

```bash
npm install -g vercel
vercel login

cd thelastfirm
vercel

# Set env vars:
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Deploy to production:
vercel --prod
```

### Preview vs Production deploys

- Every push to a branch creates a **preview deploy** automatically
- Pushes to `main` create a **production deploy**
- Both environments can use the same Supabase project for alpha, or separate projects if you want staging isolation

---

## Connecting a Custom Domain

1. Vercel Dashboard → Project → Domains → Add
2. Add your domain: `thelastfirm.gg` (or whatever)
3. Follow DNS instructions (CNAME or A record)
4. Update Supabase Auth settings:
   - Add the new domain to Redirect URLs
   - Update Site URL to the new domain

---

## Build Verification

Before deploying, verify the build passes locally:

```bash
cd thelastfirm
npm run build
# Output: dist/public/index.html + assets/

# Optionally serve and check:
npx serve dist/public -l 3000 --single
```

---

## Post-Deploy Smoke Test

After deploying, verify these flows work:

### 1. New user signup
- Go to `https://your-game.vercel.app`
- Should redirect to `/#/login`
- Click "Create account"
- Fill in email, username, password
- Expected: redirected to onboarding OR email confirmation message

### 2. Login
- Go to `/#/login`
- Enter credentials
- Expected: redirected to `/#/` (dashboard)

### 3. Onboarding flow
- If new user, should see `/#/onboarding`
- Navigate through 7 steps: Intro → Archetype → First Job → Family → Stash → Dashboard
- Confirm archetype → dashboard
- Expected: all steps render, archetype panel opens on tap

### 4. Dashboard loads
- Route: `/#/`
- Expected: player summary card, income section, quick-action CTAs

### 5. Jobs page
- Route: `/#/jobs`
- Expected: job cards with reward ranges, filter chips, run job action

### 6. Family view
- Route: `/#/family`
- Expected: family overview, member list, role display

### 7. World view
- Route: `/#/districts`
- Expected: district cards, influence bars, turf expanders

### 8. Business / front view
- Route: `/#/family/turf`
- Expected: turf block list, front detail accessible via `/#/front/:frontId`

---

## Monitoring Alpha Users

### Analytics events

The following events are tracked and written to `analytics_events` in Supabase when configured:

| Event | Trigger |
|---|---|
| `signup_started` | User opens signup form |
| `account_created` | Successful signup |
| `login_completed` | Successful login |
| `onboarding_started` | Onboarding flow begins |
| `onboarding_step_completed` | Each onboarding step finished |
| `onboarding_completed` | Full onboarding done |
| `archetype_selected` | Archetype confirmed in onboarding |
| `first_job_completed` | First job run in onboarding |
| `family_applied` | Player applies to a family |
| `family_joined` | Player accepted into family |
| `job_run` | Any job run in the game |
| `payout_claimed` | Passive income claimed |

Query in Supabase SQL editor:
```sql
SELECT event_name, COUNT(*) as count, MAX(created_at) as last_seen
FROM analytics_events
GROUP BY event_name
ORDER BY count DESC;
```

### Error monitoring

Check Vercel deployment logs for JS errors. The app uses graceful degradation — Supabase errors are caught and shown in the UI rather than crashing.

---

## Architecture Notes for Future Backend Work

The current alpha uses Supabase RPCs for all game actions. When you're ready for a more complex backend:

1. `server/routes.ts` is already wired up — add Express routes there
2. `server/storage.ts` has a SQLite/Drizzle layer ready to extend
3. The `shared/` directory has all TypeScript types shared between client and server

For now, all game state is in `client/src/lib/mockData.ts` — Supabase RPCs in `supabaseClient.ts` are wired and ready but the UI still reads from mock data. Phase 2 work is to gradually swap mock reads for Supabase queries.

---

## Common Issues

**"Supabase not configured" warning in console**
→ Normal in mock mode. Add your `.env.local` file and restart the dev server.

**Auth redirect loop**
→ Check that your Supabase Site URL matches your deployed URL exactly.

**Blank page after deploy**
→ Verify `dist/public/index.html` exists after build. Check Vercel Output Directory is set to `dist/public`.

**Hash routing 404s**
→ `vercel.json` already has the SPA rewrite rule. If this still happens, check the file is committed.

**Migrations fail**
→ Run them in order (001, 002, 003). If re-running, use `supabase db reset` first.

---

## Contact

For alpha issues, use the Admin Panel (`/#/admin`) to inspect player data and analytics.
