# The Last Firm — Changelog

---

## [1.1.0] — 2026-04-08

### Jobs System — Cards · States · Sort / Filter / Recommendations

**Job Art (165 images across 55 jobs)**
- Wave 1 (11 jobs): Protection Rounds, Collect Debt, Numbers Spot, Loansharking, Contraband Shipment, Card Game, Hot Electronics, Boost Car, Intimidate Witness, Corrupt Official, Mid-Level Heist
- Wave 2 (15 jobs): Turn Police, Major Gambling, Commission Meeting, Laundering Front, Multi-Crew Op, Strategic Hit, Federal Contact, Tail Mark, Extort Restaurant, Sports Book, Territory Racket, Manage Loan Book, Broker Peace, Dispose Evidence, Fence Jewelry
- Wave 3 (29 jobs): All remaining ranked + universal jobs
- Art direction: painterly editorial oil-on-canvas, impressionist brushstrokes, smear-face rule (no defined facial features)

**Job Card Upgrade**
- Image banner (120px) with gradient overlay, category pill, status badge
- Summary (≤60 chars, always visible) + expandable flavor text (Brief toggle)
- Risk strip: Heat, Arrest, Mode, Profile — 2×2 grid with composite tint
- Narrative-driven outcome modal: job-specific text drawn from randomized pool of 3–4

**Card State System**
- `ready` — full image, active CTA, risk strip, optional high-risk corner warning
- `locked` — grayscale/dimmed image, lock panel explaining rank/context gate, disabled CTA
- `cooldown` — dimmed image, SVG arc progress indicator, "avail. HH:MM" timestamp
- `near-ready` (final 20%) — amber arc, "Almost Ready" label, pulsing badge
- `success` / `failure` / `busted` — full outcome modal with result image + narrative

**Sort & Filter System** (`shared/jobs.ts`)
- `sortJobs()` — 7 sort keys: Recommended (default), Ready Now, Highest Payout, Lowest Risk, Shortest Cooldown, Best Progression, Category A–Z
- `applyFilters()` — 5 axes: Availability, Risk, Category, Mode, Archetype fit
- Filter tray: bottom-sheet pattern, sticky header, chip selection, "Show Results" CTA
- Active filter chips: dismissible, "Clear all", result count when active

**Recommendation Engine** (`shared/jobs.ts`)
- `getRecommendedJobs()` — scores 0–100: readiness (+30), archetype fit (+20/+10/−15), tier (+tier×2), risk (±2–12)
- `getRecommendReasons()` — human-readable pills: "Ready now", "Good fit for Runner", "Low heat risk", "Strong payout"
- Recommended tab: default view, top 4 with gold "Best match" on #1, reason pills below each card
- Archetype + heat context label: "Personalized for Schemer · Heat 22 — low-risk jobs prioritized"

**Status Bar**
- Always-visible summary: X Ready / X Cooling / X Locked
- Tapping "Ready" instantly applies availability filter and switches to All Jobs view

**New Helpers** (`shared/jobs.ts`)
- `getLockReason()` — returns `LockReason` (code, label, explanation, temporary flag)
- `getRiskProfile()` — returns `RiskProfile` (heat, jail, solo, highProfile, composite 0–4)
- `cooldownProgress()`, `isNearReady()`, `cooldownAvailableAt()`
- `getArchetypeFit()` — STRONG/GOOD/NEUTRAL/NONE across 7 archetypes × 13 categories
- `getJobStatusCounts()` — ready/cooling/locked totals

**Empty State**
- "No jobs match" with reset button when filters return 0 results
- Recommended empty state when no accessible jobs available

**Known Issues**
- Busted image variant not yet generated (fallback to failure image active)
- Recommendation scoring uses static archetype fit table (will improve with live player stats)

---

## [1.0.0] — 2026-03 (initial)

- Full persistent world architecture
- Supabase auth + player bootstrap
- Onboarding flow (8-step)
- Family systems: treasury, inventory, protection window
- 7 archetypes: RUNNER, EARNER, MUSCLE, SHOOTER, SCHEMER, RACKETEER, HITMAN
- Hitman archetype with dedicated overview panel
- Job Board with 55 jobs (ranked + universal)
- Business front system
- Alpha deployment prep
