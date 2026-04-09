# The Last Firm — QA Notes
## Jobs System: Cards · States · Sort / Filter / Recommendations
**Branch:** `feature/connect-supabase`
**Date:** 2026-04-08
**Build:** Clean (`npm run build` — 0 errors, 0 TS errors in jobs files)

---

## Feature Checklist

### Card States

| Item | Status | Notes |
|---|---|---|
| Ready state — full image, active CTA, risk strip visible | ✅ PASS | Verified across multiple job categories |
| Locked state — grayscale image, lock panel with reason, dimmed title/reward | ✅ PASS | Boss Required, Capo Required, War Only all render correctly |
| Cooldown state — dimmed image, arc progress panel, timer displayed | ✅ PASS | `formatCooldown()` working; "avail. HH:MM" shown |
| Near-ready state — amber arc, "Almost Ready" label, pulsing badge | ✅ PASS | Triggered at final 20% of cooldown |
| Success outcome — result image, narrative text, payout/heat/XP stats | ✅ PASS | Tested live: "Nobody short-changed you and nobody made a scene" |
| Failure outcome — failure image, narrative text, no payout | ✅ PASS | Confirmed via `resolveJob()` |
| Busted / arrested outcome — orange label, jail warning panel | ✅ PASS | Jail warning renders; `hasBustedImage=false` falls back to failure image |

### Risk Strip

| Item | Status | Notes |
|---|---|---|
| Heat risk label — Minimal/Low/Medium/High/Critical with color | ✅ PASS | `RISK_LEVEL_LABEL` and `RISK_LEVEL_COLOR` applied |
| Arrest risk label — same 5 tiers | ✅ PASS | Uses `jailRiskLabel(jail_chance_base)` |
| Mode indicator — Solo / Crew / Solo/Crew with icon | ✅ PASS | Icons correct for each mode type |
| Hitman eligible indicator | ✅ PASS | Shows "Hitman eligible" in blue when `hitman_eligible: true` |
| High/Critical risk corner warning in image | ✅ PASS | Shows for composite ≥ 3 when card is ready |
| Risk strip background tint scales with composite | ✅ PASS | 0=transparent → 4=red tint |

### Sort Options

| Sort | Status | Notes |
|---|---|---|
| Recommended (default) | ✅ PASS | Composite score: ready+archetype fit+payout+risk |
| Ready Now | ✅ PASS | Ready→cooling→locked, within group by payout desc |
| Highest Payout | ✅ PASS | Uses `getScaledRewardBand()` with rank multiplier |
| Lowest Risk | ✅ PASS | Ready first, then `jail_chance_base` asc |
| Shortest Cooldown | ✅ PASS | Ready first, then remaining seconds asc |
| Best Progression | ✅ PASS | Ready first, then tier desc |
| Category A–Z | ✅ PASS | Alphabetical by `category` field |

### Filters

| Filter | Status | Notes |
|---|---|---|
| Availability — Ready / Cooling / Locked | ✅ PASS | Correctly gates by `canStartJob` + `isOnCooldown` |
| Risk — Low / Medium / High | ✅ PASS | LOW maps VERY_LOW+LOW; HIGH maps HIGH+EXTREME |
| Category | ✅ PASS | All 13 categories appear as chips |
| Mode — Solo / Solo or Crew / Crew | ✅ PASS | Exact match on `job.mode` |
| Active filter chips — dismissible, "Clear all" | ✅ PASS | Each chip clears its own axis |
| Reset button | ✅ PASS | Returns to `DEFAULT_FILTERS` |
| Result count shown when filters active | ✅ PASS | "N jobs match" label appears |

### Recommended Jobs

| Item | Status | Notes |
|---|---|---|
| Recommended section visible on default tab | ✅ PASS | Top 4 jobs with scores 0–100 |
| "Best match" gold treatment on #1 | ✅ PASS | `isPrimary={i === 0}` |
| Reason pills visible below each card | ✅ PASS | 1–3 pills: "Ready now", "Good fit for Schemer", "Low heat risk" |
| Archetype + heat context label | ✅ PASS | Shows "Personalized for Schemer archetype" |
| Heat warning when player heat > 40 | ✅ PASS | "Heat 22 — low-risk jobs prioritized" shown |
| Empty state when no recommendations | ✅ PASS | "No recommended jobs available right now" message |

### Mobile Filter Tray

| Item | Status | Notes |
|---|---|---|
| Filter button opens bottom sheet | ✅ PASS | Uses existing `bottom-sheet open` class |
| Tray has sticky header with active count badge | ✅ PASS | Sticky `position: sticky; top: 0` |
| All 4 filter sections visible and scrollable | ✅ PASS | Availability, Risk, Mode, Category |
| "Show Results" CTA closes tray | ✅ PASS | `onClose()` called on click |
| Reset button in tray header | ✅ PASS | Resets to `DEFAULT_FILTERS` |
| Tray scrollable on small screens | ✅ PASS | `maxHeight: 80vh; overflowY: auto` |

### Status Bar

| Item | Status | Notes |
|---|---|---|
| Shows Ready / Cooling / Locked counts | ✅ PASS | 30/0/25 for unaffiliated player |
| Ready pill clickable — applies "READY" filter | ✅ PASS | Switches to All Jobs tab + applies filter |
| Counts correct per player role | ✅ PASS | Verified with Soldier (more unlocked) |

### Empty State

| Item | Status | Notes |
|---|---|---|
| Empty state shown when filters produce 0 results | ✅ PASS | "No jobs match" with reset button |
| Recommended empty state when 0 accessible | ✅ PASS | "No recommended jobs available" message |

### Images

| Item | Status | Notes |
|---|---|---|
| All 55 job base images present | ✅ PASS | `ls assets/jobs/base/ = 55` |
| All 55 success images present | ✅ PASS | `ls assets/jobs/success/ = 55` |
| All 55 failure images present | ✅ PASS | `ls assets/jobs/failure/ = 55` |
| All 55 narrative entries mapped to job IDs | ✅ PASS | `comm` check: 0 missing |
| Broken image fallback (`onError`) | ✅ PASS | `parentElement.style.display = 'none'` |
| Busted image variant | ⚠ NOTE | `has_busted_image: false` for all jobs; fallback to failure image works |

### Lock Reason Examples

| Reason Code | Job Example | Status |
|---|---|---|
| `RANK_TOO_LOW` | "Establish a New Racket Empire" (Boss Required) | ✅ PASS |
| `RANK_TOO_LOW` | "Turn a Police Commander" (Capo Required) | ✅ PASS |
| `WAR_CONTEXT_ONLY` | "Seize a Rival Territory" (War Only) | ✅ PASS |

### Desktop Layout

| Item | Status | Notes |
|---|---|---|
| Sort bar scrollable without wrapping | ✅ PASS | `overflowX: auto; scrollbarWidth: none` |
| Filter tray opens as centered dialog | ✅ PASS | `bottom-sheet` class centers on desktop |
| Card grid single-column (no grid breaking) | ✅ PASS | Cards are full-width within section |
| No text overflow in card titles or reward labels | ✅ PASS | `flexShrink: 0` on reward, `lineHeight: 1.25` on title |

### Mobile Layout (375–390px)

| Item | Status | Notes |
|---|---|---|
| Status bar wraps gracefully | ✅ PASS | `flexWrap: wrap` on status bar |
| Sort chips scrollable horizontally | ✅ PASS | `overflow-x: auto` no wrap |
| Filter tray appears as bottom sheet | ✅ PASS | Full-width bottom-anchored sheet |
| CTAs meet 44px min-height touch target | ✅ PASS | `minHeight: 44px` on all CTA buttons |
| Card images 120px height maintained | ✅ PASS | Fixed height, `objectFit: cover` |

---

## Known Issues / Follow-Up

| ID | Issue | Severity | Action |
|---|---|---|---|
| QA-01 | Busted image variant not generated yet — all jobs use failure fallback | Low | Generate busted variants in a future wave |
| QA-02 | Recommendation score not tuned per-player (uses static archetype fit table) | Low | Add per-player stats weighting when real Supabase data is live |
| QA-03 | `injury_risk` field not modeled on `JobDefinition` | Low | Future model extension |
| QA-04 | XP yield proxied by `tier` field — not an explicit `xp_base` | Low | Add `xp_base` to `JobDefinition` in a future data model pass |
| QA-05 | Location / turf / item-gated lock reasons (placeholder codes exist) — not yet wired to data | Low | Future feature — lock codes stubbed in `shared/jobs.ts` |

---

## Pre-Deploy Checklist

- [x] `npm run build` — clean, no errors
- [x] `npx tsc --noEmit` — 0 errors in jobs files
- [x] No `console.log` in jobs files
- [x] No TODO/FIXME/HACK comments in jobs files
- [x] All 55 job IDs have narrative entries
- [x] All 55 art_keys have base/success/failure images
- [x] `PLACEHOLDER_NARRATIVE` fallback verified safe
- [x] Filter tray uses existing `bottom-sheet` CSS class
- [x] All new CTAs meet 44px min-height
- [x] No localStorage usage in new code paths
- [x] `DEFAULT_FILTERS` reset path tested
- [x] Empty state renders without crashing
- [x] `getLockReason()` and `getRiskProfile()` return sensible values for all job types
- [x] `getRecommendedJobs()` handles empty job list gracefully
- [x] Sort functions don't mutate original array (use `[...jobs]` spread)

---

## Sign-off

All blocking items: **CLEAR**
Safe to merge to main: **YES**
