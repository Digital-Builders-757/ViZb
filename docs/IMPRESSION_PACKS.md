# Impression Packs — Luxury Underwater Club

Purpose: reduce re-prompting. This file contains **pre-scoped work orders** that can be executed by Cursor one-by-one, each as its own PR into `develop`.

Operating rules
- One work order per PR.
- Branch naming: `polish/ocean-pack-XX-<short-name>`.
- Always run: `npm run ci`.
- PR title: `polish(ocean): pack XX - <name>`.
- PR body must include:
  - what changed
  - how to QA
  - commands run
- Respect reduced motion: `@media (prefers-reduced-motion: reduce)` must disable non-essential animation.
- No new UI libraries.

North Star aesthetic
- **Luxury underwater club**: smooth, glossy, premium, editorial.
- Motion is restrained. Light is intentional. No carnival glow.

---

## Ocean Impressiveness Pack (01 → 10)

### Pack 01 — Ocean Divider System (Section Transitions)
**Goal:** Make the page feel like one premium continuous environment with elegant transitions.

**Definition of Done**
- Add `components/ui/ocean-divider.tsx` (props: `variant`, `density`, `withLine`).
- Add CSS tokens in `app/globals.css` for a subtle “caustic band” + “horizon line”.
- Apply dividers between landing sections:
  - Hero → Events
  - Events → Editorial
  - Editorial → Waitlist
- Reduced motion: static divider (no drift animation).

**Files**
- `components/ui/ocean-divider.tsx`
- `app/globals.css`
- `components/hero-section.tsx`
- `components/events-section.tsx`
- `components/editorial-grid.tsx`
- `components/waitlist-section.tsx`

**QA**
- No horizontal overflow on mobile.
- Divider does not change section spacing unexpectedly.
- `npm run ci` passes.

---

### Pack 02 — Interactive Glass Cards (Tilt + Specular)
**Goal:** Make cards feel expensive on hover, like glass under club lighting.

**Definition of Done**
- Add `interactive?: boolean` to `GlassCard`.
- On hover/focus: subtle tilt (max 2–3deg), specular sweep highlight, stronger hairline glow.
- No layout shift; keep borders constant.
- Reduced motion: disable transforms/sweep.

**Files**
- `components/ui/glass-card.tsx`
- Apply `interactive` to:
  - event cards (timeline)
  - post cards (latest posts)

**QA**
- Works with keyboard focus.
- Doesn’t tank scroll performance.
- `npm run ci` passes.

---

### Pack 03 — Branded Focus System (Accessibility + Premium)
**Goal:** Focus states look intentional, not default browser rings.

**Definition of Done**
- Add `.vibe-focus-ring` utility in `app/globals.css`.
- Apply across:
  - `NeonButton`
  - `NeonLink`
  - high-traffic inputs (login/signup/waitlist)
  - filter chips (events)
- Must remain accessible (contrast + focus-visible only).

**Files**
- `app/globals.css`
- `components/ui/neon-button.tsx`
- `components/ui/neon-link.tsx`
- input + filters surfaces

**QA**
- Tab navigation shows a consistent ring.
- `npm run ci` passes.

**Shipped (Apr 2026):** `.vibe-focus-ring` + `--vibe-focus-*` in `app/globals.css`; `NeonButton`, `NeonLink`, login/signup, waitlist, `/events` filters, **`/advertise`** inquiry controls; `.vibe-input-glass` uses `--vibe-focus-glow`.

---

### Pack 04 — Liquid Border v2 (WaterFrame upgrades)
**Goal:** Extend the border effect system-wide but controlled.

**Definition of Done**
- Upgrade `WaterFrame` to support variants:
  - `subtle` (default)
  - `hero` (stronger)
  - `card` (thin)
- Apply only to:
  - hero imagery
  - editorial images
  - event flyers in timeline cards
- Ensure glow is contained (`overflow-hidden`) and doesn’t introduce horizontal scroll.

**Files**
- `components/ui/water-frame.tsx`
- `components/hero-section.tsx`
- `components/editorial-grid.tsx`
- `components/events/event-timeline-card.tsx`

**QA**
- No overflow on mobile.
- Hover/focus looks premium, not noisy.
- `npm run ci` passes.

---

### Pack 05 — Premium Skeleton + Loading Language (Unified)
**Goal:** Replace generic pulse blocks with underwater shimmer skeletons.

**Definition of Done**
- Create `WaterSkeleton` (shimmer + subtle caustic hint).
- Replace skeleton usage in route-level `loading.tsx` files where present:
  - `/events` loading state
  - dashboard calendar loading state (if any)
- Reduced motion: no shimmer travel.

**Files**
- `components/ui/water-skeleton.tsx` (or extend existing loader file)
- `app/**/loading.tsx`

**QA**
- Loading states feel consistent.
- `npm run ci` passes.

---

### Pack 06 — Events Timeline Cinematic Rail
**Goal:** Make `/events` timeline feel like a premium curated feed.

**Definition of Done**
- Add a subtle “timeline spine” (hairline neon with occasional glow nodes).
- Add elegant section headers (Upcoming / Past) with divider language.
- Keep layout stable and mobile-first.

**Files**
- `app/events/page.tsx`
- `components/events/event-timeline-card.tsx`
- optional new: `components/events/timeline-spine.tsx`

**QA**
- No layout shift.
- Works for long lists.
- `npm run ci` passes.

---

### Pack 07 — Modal/Sheet Underwater Glass Treatment
**Goal:** Sheets/dialogs feel like frosted underwater glass, not flat panels.

**Definition of Done**
- Upgrade sheet/drawer styling used by dashboard calendar detail:
  - backdrop blur gradient
  - top edge neon hairline
  - subtle noise/texture (CSS-only)
- Reduced motion friendly.

**Files**
- `components/dashboard/calendar/dashboard-calendar-shell.tsx`
- shared sheet/dialog wrappers (if present)
- `app/globals.css`

**QA**
- Mobile sheet feels premium.
- `npm run ci` passes.

---

### Pack 08 — Neon Microcopy + Kicker System
**Goal:** Copy layout becomes consistent: kicker → headline → body → CTA.

**Definition of Done**
- Define typography utilities (kicker/headline/body/caption) in CSS.
- Apply to:
  - landing sections
  - events empty states
  - dashboard empty states
- Remove drift/one-offs.

**Files**
- `app/globals.css`
- landing components + empty state components

**QA**
- Copy hierarchy consistent.
- `npm run ci` passes.

---

### Pack 09 — Ambient Background “Club Fog” (Subtle)
**Goal:** Add depth without distracting motion.

**Definition of Done**
- Add `components/ui/ambient-fog.tsx` background layer:
  - fog gradients + vignettes
  - optional slow drift (reduced motion disables)
- Apply to:
  - landing
  - `/events`
- Do NOT apply to admin/staff dashboards.

**Files**
- `components/ui/ambient-fog.tsx`
- `components/hero-section.tsx` or `app/page.tsx`
- `app/events/page.tsx`

**QA**
- Doesn’t hurt scroll performance.
- `npm run ci` passes.

---

### Pack 10 — Luxury Iconography Pass (Consistency)
**Goal:** Icons, button shapes, and strokes feel cohesive.

**Definition of Done**
- Standardize icon sizes (16/18/20) and stroke usage for top surfaces.
- Ensure primary CTAs use consistent rounding + shadow language.
- Audit and fix the top ~15 visible buttons/links:
  - landing
  - /events
  - /events/[slug]
  - /dashboard (member)

**Files**
- `components/ui/neon-button.tsx`
- `components/ui/neon-link.tsx`
- `components/ui/badge.tsx` (if used)
- key pages above

**QA**
- Visual consistency improved without increasing density.
- `npm run ci` passes.

---

## Cursor execution script (copy/paste)

Use this message to run the pack sequentially:

> Implement Ocean Impressiveness Pack 01→10 from `docs/IMPRESSION_PACKS.md`.
> For each pack:
> - create branch `polish/ocean-pack-XX-<short-name>`
> - implement ONLY that pack
> - run `npm run ci`
> - open PR into `develop` with title `polish(ocean): pack XX - <name>`
> - stop after opening the PR and wait for merge before starting the next.
