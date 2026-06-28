# Launch Visual Polish Audit

**Branch:** `polish/launch-visual-pass` (merged PR #149 → `develop`)  
**Date:** June 10, 2026  
**Issues:** #135–#148 (closed June 10, 2026)

> **Historical audit:** File lists and component names below reflect the June 10 polish branch. For the live homepage structure, use [../ARCHITECTURE_SOURCE_OF_TRUTH.md](../ARCHITECTURE_SOURCE_OF_TRUTH.md) and [../REPO_MAP.md](../REPO_MAP.md).

## What was reviewed

- Homepage: hero, timeline, footer
- About: hero, editorial grid, waitlist, app preview
- Events: listing hero, discovery rails, timeline cards, empty/error states
- Advertise: hero copy, contact form
- Auth: login, signup, forgot-password, sign-up-success (visual only)
- Shared UI: `GlassCard`, `WaterFrame`, `NeonLink`, `NeonButton`, `EmptyStateCard`, `SectionTitle`
- Tokens: `app/globals.css` glow and card classes

## Top priority fixes

1. **Copy** — Remove AI-sounding phrases and em dashes from public marketing surfaces; keep "Virginia Isn't Boring" identity.
2. **Hero hierarchy** — Darker scrim, tighter spacing, local kicker, clearer CTA grouping.
3. **Flyers** — Branded missing-flyer fallback; lighter overlays; intentional crops on rail cards.
4. **Glass/glow** — Tune central tokens; reduce noisy resting glow on event cards.
5. **CTAs & empty states** — Unify on `NeonLink` / `EmptyStateCard` on public pages.
6. **Mobile** — 44px tap targets on nav toggle; comfortable form and card spacing.

## Files touched

- `components/hero-section.tsx`
- `components/home-timeline-section.tsx`
- `components/footer.tsx`
- `components/editorial-grid.tsx`
- `components/waitlist-section.tsx`
- `components/navbar.tsx`
- `components/events/event-timeline-card.tsx`
- `components/events/event-flyer-fallback.tsx` (new)
- `components/ui/glass-card.tsx`
- `components/ui/empty-state-card.tsx`
- `components/ui/section-title.tsx`
- `components/advertise/advertise-contact-form.tsx`
- `app/page.tsx` (via child components)
- `app/layout.tsx`
- `app/about/page.tsx`
- `app/events/page.tsx`
- `app/events/loading.tsx`
- `app/advertise/page.tsx`
- `app/signup/page.tsx`
- `app/login/page.tsx`
- `app/auth/forgot-password/page.tsx`
- `app/auth/sign-up-success/page.tsx`
- `app/loading.tsx`
- `app/p/page.tsx`
- `app/p/[slug]/page.tsx`
- `components/posts/post-card.tsx`
- `components/app-preview.tsx`
- `components/auth/auth-alert.tsx`
- `components/brand/header-brand-mark.tsx`
- `app/globals.css`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/MVP_STATUS_ROADMAP.md`

## Visual risks avoided

- No new design system or animation libraries
- No route, form field, or schema changes
- No auth logic changes
- Glow tuned down, not up
- Dashboard surfaces unchanged except shared UI primitives
- `prefers-reduced-motion` respected throughout

## Intentionally not changed

- Dashboard and admin UI
- `components/culture-section.tsx` (unused)
- Three.js shader logic
- Event browsing behavior and filters
- Unrelated `supabase/migrations/` work on disk

## Verification

```powershell
npm run typecheck
npm run test
npm run lint
npm run build
rg "—|–" app components lib -g "*.tsx" -g "*.ts"
```

**Follow-up pass (merged in #149):** login/forgot-password/signup form polish, global loading tagline, posts glass/glow, app-preview copy/motion, navbar logo sizing, auth-alert glow tuning.

**Post-merge (branch `polish/auth-reset-password`):** reset-password page aligned with other auth forms; login shows success alert after `?reset=success`.

Results:

| Command | Outcome |
|---------|---------|
| `npm run typecheck` | Pass |
| `npm run test` | Pass (181 tests) |
| `npm run lint` | Pass |
| `npm run build` | Pass |
| `rg "—|–" …` | Public marketing copy cleaned; remaining dashes are dashboard/lib/price-range strings only |
