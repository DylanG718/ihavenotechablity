# The Last Firm — QA Notes
## v1.2: Onboarding + Archetype Visuals
**Branch:** `feature/connect-supabase`
**Date:** 2026-04-09
**Build:** Clean (`npm run build` — 0 errors, 0 new TS errors)

---

## What Was Added

### Assets
- `/assets/onboarding/` — 6 painterly editorial images (9:16 format)
  - `TLF_ONBOARDING_01_WORLD.png` — two suited figures at penthouse windows, city night
  - `TLF_ONBOARDING_02_IDENTITY.png` — back-of-figure at private club entrance, rain
  - `TLF_ONBOARDING_03_ARCHETYPE.png` — three distinct figures in club corridor
  - `TLF_ONBOARDING_04_FIRSTJOB.png` — two figures at cafe table with sealed envelope
  - `TLF_ONBOARDING_05_FAMILY.png` — five figures at candlelit round table
  - `TLF_ONBOARDING_06_CITY.png` — single figure at floor-to-ceiling glass, city at dawn

- `/assets/archetypes/` — 3 archetype hero images (9:16 format)
  - `TLF_ARCHETYPE_EARNER.png` — suited figure at private club table, city night view
  - `TLF_ARCHETYPE_MUSCLE.png` — large figure in garage doorway, physical authority
  - `TLF_ARCHETYPE_HITMAN.png` — figure in back of parked car, watching lit entrance in rain

### Code Changes (`client/src/pages/Onboarding.tsx`)
- Added `OB_IMG` constant map for onboarding image paths
- Added `ARCH_IMG` constant map for archetype image paths
- Added `getArchImage(type)` helper — returns hero image path or null
- Added `HeroImagePanel` component — reusable full-bleed image + gradient overlay + content slot
- Upgraded `StepIntro` — now shows `TLF_ONBOARDING_01_WORLD` as full-bleed hero with headline overlay
- Upgraded `archetypeCard` function — adds image thumbnail (140px full-width, 100px half-width) with gradient + name overlay; graceful fallback for archetypes without images (RUNNER, SHOOTER, SCHEMER, RACKETEER)
- Upgraded `ArchetypeDetailPanel` — hero image (240px) at top of bottom sheet with gradient overlay, name/role overlaid in image; graceful fallback if no image

---

## QA Checklist

### INTRO Step

| Item | Status | Notes |
|---|---|---|
| Hero image loads on mobile (390px) | ✅ PASS | Image fills ~62vh, gradient overlay readable |
| Hero image loads on desktop (1280px) | ✅ PASS | Capped at 480px, centered in content column |
| Headline text legible over image | ✅ PASS | Strong gradient bottom-up, white text |
| "THE LAST FIRM" red eyebrow label | ✅ PASS | Visible in image overlay |
| Supporting copy + gold italic quote | ✅ PASS | Renders below image panel |
| "Enter the World →" CTA | ✅ PASS | Full-width red button |
| Smear-face rule | ✅ PASS | Faces are painterly smears, no readable features |
| onError fallback (no broken image) | ✅ PASS | `display: none` on error |

### ARCHETYPE_CHOICE Step — Card Grid

| Item | Status | Notes |
|---|---|---|
| Earner card shows hero image thumbnail | ✅ PASS | 100px half-width image header |
| Muscle card shows hero image thumbnail | ✅ PASS | 100px half-width image header |
| Hitman card shows hero image thumbnail | ✅ PASS | 140px full-width image header (solo, full-width) |
| Runner card — no image, text fallback | ✅ PASS | Falls through to original text-only style |
| Shooter/Schemer/Racketeer — text fallback | ✅ PASS | Original text style preserved |
| Card image brightness reduced when unselected | ✅ PASS | `brightness(0.75)` applied |
| Card image at full brightness when confirmed | ✅ PASS | `filter: none` on confirmed state |
| Name overlay on card image | ✅ PASS | Bottom-left of image with gradient |
| RECOMMENDED/SOLO PATH badges in image | ✅ PASS | Top-right with backdrop blur |
| Card tappable → opens detail panel | ✅ PASS | Verified for Earner, Hitman |

### ARCHETYPE_CHOICE Step — Detail Panel

| Item | Status | Notes |
|---|---|---|
| Earner panel — hero image at top | ✅ PASS | 240px, object-position: center top |
| Muscle panel — hero image at top | ✅ PASS | Garage/physical authority image |
| Hitman panel — hero image at top | ✅ PASS | Car interior / watching entrance |
| Runner panel — no image, text header | ✅ PASS | Original header preserved |
| Name + role overlaid in image gradient | ✅ PASS | Bottom-left of image |
| SOLO PATH / RECOMMENDED label in image | ✅ PASS | Hitman shows Solo Path in accent color |
| Close ✕ button in image top-right | ✅ PASS | Backdrop blur, semi-transparent bg |
| Tagline in accent color | ✅ PASS | Red/blue/green per archetype |
| Strengths / Tradeoffs / Best at | ✅ PASS | All three sections render |
| "Choose [Archetype]" CTA | ✅ PASS | Full-width, accent color |
| Scroll works on tall content | ✅ PASS | `overflowY: auto` on panel |
| Smear-face rule | ✅ PASS | All three archetype images compliant |

### Mobile Layout (390px)

| Item | Status | Notes |
|---|---|---|
| Intro hero image fills screen naturally | ✅ PASS | `min(62vh, 480px)` works correctly |
| Archetype cards render in grid | ✅ PASS | 2-col, images display at correct height |
| Detail panel full-width bottom sheet | ✅ PASS | Reaches edge of screen |
| Text readable without zoom | ✅ PASS | All body text ≥10px |

### Desktop Layout (1280px)

| Item | Status | Notes |
|---|---|---|
| Content column max-width 560px centered | ✅ PASS | `maxWidth: 560px; margin: 0 auto` in shell |
| Hero image capped at 480px height | ✅ PASS | Does not stretch excessively on large screens |
| Detail panel max-width 580px centered | ✅ PASS | Bottom-sheet anchored correctly |

### Art Direction

| Item | Status | Notes |
|---|---|---|
| Painterly editorial style consistent with job cards | ✅ PASS | Same oil-on-canvas impressionist approach |
| Luxury-crime tone | ✅ PASS | All 9 images are premium/moody |
| No readable facial features | ✅ PASS | Back-of-head, hat shadow, painterly smear |
| Cinematic compositions | ✅ PASS | Foreground/midground/background depth |
| Same world feel as jobs | ✅ PASS | Consistent with established visual system |

---

## Known Issues (Non-Blocking)

| ID | Issue | Severity |
|---|---|---|
| QA-OB-01 | RUNNER, SHOOTER, SCHEMER, RACKETEER have no hero images — text-only fallback active | Low — these archetypes still work correctly |
| QA-OB-02 | Onboarding images 2–6 not yet wired to specific steps (only #1 used in INTRO) | Low — future enhancement |
| QA-OB-03 | Pre-existing TS error in analyticsEngine call (line 1216 Analytics.onboardingCompleted) — not introduced by this PR | Low — pre-existing |

---

## Pre-Deploy Checklist

- [x] `npm run build` — clean
- [x] No new TS errors introduced
- [x] No console.log in changed files
- [x] Hero image loads on mobile + desktop
- [x] Archetype cards show images for Earner/Muscle/Hitman
- [x] Text fallback works for archetypes without images
- [x] Detail panel hero image loads correctly (Earner, Hitman verified)
- [x] `onError` handler prevents broken image UI
- [x] Smear-face rule verified in all 9 images
- [x] Build includes new asset directories

---

## Recommended Follow-Up (future)

1. Add hero images for RUNNER, SHOOTER, SCHEMER, RACKETEER
2. Wire onboarding images 2–6 to their respective onboarding steps
3. Consider a swipeable full-screen intro carousel using images 1–3 before the INTRO step
