# The Last Firm — Mobile-First UX Pass — Design Notes

**Date:** April 2026  
**Scope:** Layout, hierarchy, spacing, and interaction pass on 5 core pages.  
**Preserved:** Color palette, typography, theme, game logic, all data.  

---

## What Changed

### New File: `client/src/styles/pages.css`

A shared CSS component library for page-level layout. Key patterns:

- **`.page-stack`** — centered single-column container (max 640px mobile, 900px desktop)
- **`.hero-card`** — top-of-page identity card with stats strip
- **`.next-action-card`** — prominent gold-bordered "what to do next" CTA
- **`.summary-bar`** — responsive grid of stat cells (auto-fit 80px min, truncate on overflow)
- **`.chip-bar`** — horizontally scrollable filter bar (no wrapping)
- **`.chip` / `.chip.active`** — filter pill with active state
- **`.job-card`** — full-width job item with reward right-aligned, full-width CTA
- **`.role-slot`** — business role assignment row (vacant/filled states)
- **`.member-row`** — compact family member row
- **`.desktop-two-col`** — 2-column layout above 768px

---

### Page 1 — Dashboard (`Dashboard.tsx`)

**Changes:**
- Added `page-stack` wrapper for consistent mobile padding
- `hero-card` now shows family name, motto, role badge, status badge, and 4-stat strip (Treasury / Power / Members / Recruits) at top — eliminates the need to scroll to understand family state
- `next-action-card` surfaces the single highest-priority suggested action with a bold gold left-border and large CTA button
- Live Events Banner sits below next-action (collapsible, unchanged)
- Player stats section clearly labeled with player name
- `Unaffiliated`, `Recruit`, `Hitman` dashboards wrapped in `page-stack` for consistent padding

**Hierarchy (top → bottom):**
1. Family identity (who you're with, your role)
2. Next action (what to do right now)
3. Live world events (what's affecting your ops)
4. Your personal stats
5. Family details + pending items

**What's still the same:** All role-aware routing, game logic, WhatToDoNext data, LiveEventsBanner content.

---

### Page 2 — Jobs (`Jobs.tsx`)

**Changes:**
- Filter bar converted to `.chip-bar` — horizontally scrollable, no wrapping on small screens
- Each `JobCard` redesigned with `.job-card` class:
  - Job name + reward range on same top row (reward right-aligned in gold, always visible)
  - Lore tagline on line 2 (italic, muted)
  - Chip row: category + mode + ready/cooldown state (compact badges)
  - Risk level + cooldown time on meta line
  - **Full-width CTA button** (48px tall) — always at bottom, easy to tap
  - Lock state shown as inline badge + disabled button (not an overlay ribbon)
- SOLO_OR_CREW mode: two equal-width buttons (Start Solo | Invite →) stacked on narrow screens
- Outcome modal wraps in `.bottom-sheet` for mobile

**Why:** Previous cards had overlapping info density. Reward and risk are the two highest-value signals — they now lead. CTAs are now never crowded by neighboring buttons.

---

### Page 3 — Family (`Family.tsx`)

**Changes:**
- **New "Overview" tab** replaces "Family Tree" as default on mobile (Family Tree still accessible via tab)
- Overview tab shows:
  - Your role card with permission summary ("You can: promote, kick members...")
  - Leadership block (Boss/UB/Consigliere/Capo as compact rows)
  - 2×2 stat grid (Territory, Members, Active Fronts, Power Score)
  - Recent activity feed (last 3 events + "View full feed →")
- Family hero card at top: name, motto, role badge, status badge, stat strip
- Boss controls: horizontally scrollable strip of action buttons (not a wrapping grid)
- Tab bar: `.chip-bar` style, horizontally scrollable, underline active state
- Member rows use `.member-row` — compact, rank badge left, archetype right

**Why:** Family Tree requires SVG layout that's hard to use on mobile. Overview gives the same hierarchy context in a touch-friendly format. Tree is one tap away via its own tab.

---

### Page 4 — World / Districts (`DistrictMap.tsx`)

**Changes:**
- Summary strip at top: 3 stats (Districts / Owned Turfs / Active Fronts) in 3-col grid
- Your influence strip uses `.chip-bar` — horizontal scroll, no wrapping
- Each district card is a full-width panel with:
  - Name + theme badge + controller on same row
  - Influence bars (top 3 families, color-coded) immediately visible
  - Turf/front/income stat row inline
  - "View Turfs (N)" chevron expander
- When expanded: turf rows show name + owner + income + "Manage →" or "Purchase ($X)"
- Removed: complex side-by-side map panel (too small to interact with on 375px)

**Why:** The map panel doesn't work on mobile — tap targets are too small and pinch-zoom is needed. The district card list is a better mental model for the same information.

---

### Page 5a — Business / Turf (`Turf.tsx`)

**Changes:**
- Turf block header: name + location on 2 lines (prevents text wrapping across full row), income + slot count on right
- Summary bar at top: 4 stats in responsive grid
- Business legend: `flex-wrap` instead of single line
- All existing modal logic preserved (BusinessBuilderModal, BuyTurfModal)

---

### Page 5b — Front Detail (`FrontDetail.tsx`)

**Changes:**
- Identity card at top: front name + type badge, district/turf location, 5-stat summary bar
- Summary bar items: label-caps + truncated stat-val (prevents wrapping in tight cells)
- Tab bar: `.chip-bar--tabs` with underline active state
- All 4 tabs unchanged internally (Overview income breakdown, Staffing role slots, Exclusive Jobs cards, P&L table)

---

### Global Navigation (`AppShell.tsx`)

**Changes:**
- Bottom nav icons updated to lucide-react: `Home`, `Briefcase`, `Users`, `Globe`, `Building2`
- Destinations updated to 5 core areas:
  - Home → `/`
  - Jobs → `/jobs`
  - Family → `/family`
  - World → `/districts`
  - Assets → `/family/turf`
- Active state: red tint on icon + label

---

## TODOs / Recommended Future Improvements

### High Priority

1. **Dashboard — Unaffiliated state** should have a cleaner CTA to browse families or start solo jobs. Currently just an alert banner + stat grid — add a prominent "Find a Family" card.

2. **Jobs — Outcome feedback** could be an inline slide-down within the card rather than a full modal overlay. Would feel faster and less disruptive on mobile.

3. **Family — Family Tree** should be rebuilt as a vertical hierarchy list on mobile instead of an SVG tree. SVG trees are nearly unusable at 375px.

4. **World — Purchase flow** for unowned turfs needs a better mobile confirmation modal (currently relies on window.confirm or basic inline button).

5. **FrontDetail — Staffing tab** assign/remove buttons need better visual treatment — currently text-only links on very small cells.

### Medium Priority

6. **Bottom nav badge** — Notifications count badge should appear on Home icon when there are unread notifications. The count is available via `getUnreadNotifications(playerId)`.

7. **Jobs — Business Jobs section** could be a bottom-sheet triggered from the Front Detail page ("Run a job at this front") rather than a separate section at the bottom of a long list.

8. **Dashboard — Desktop 2-column** layout is specified but the current responsive grid collapses rather than truly splitting to left/right columns. A proper CSS Grid layout would improve desktop UX.

9. **Chip bar active state persistence** — filter chip state resets on page navigation. Should be stored in URL params for shareable filter states.

### Low Priority

10. **Typography** — Body text on mobile could benefit from slightly more line-height (1.6) on long descriptions. Currently mixed.

11. **Family Board** — Posts could use a floating compose button (FAB) at bottom-right rather than a header button that scrolls out of view.

12. **Loading states** — No skeleton screens exist. When real Supabase data is connected, add shimmer skeletons to all card sections.

---

## Testing Checklist

- [x] Dashboard readable at 375px, primary action visible immediately
- [x] Jobs filter bar scrolls horizontally without wrapping
- [x] Job CTAs are full-width and easily tappable
- [x] Family Overview tab visible on mobile without scrolling
- [x] World district cards show influence without horizontal scroll
- [x] Turf block header doesn't wrap on small screens
- [x] FrontDetail stat bar truncates gracefully
- [x] Bottom nav shows correct icons and active states
- [x] No horizontal overflow on any page at 375px
- [x] Desktop layout (1280px) looks clean with no broken grids
- [x] Build passes with 0 TypeScript errors
