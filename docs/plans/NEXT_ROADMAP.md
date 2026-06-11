# Next roadmap — current follow-ups

**Last updated:** June 11, 2026
**Status source:** `docs/MVP_STATUS_ROADMAP.md` (deep detail) · `MVP_STATUS.md` (at a glance)

All prior roadmaps are complete and archived (`docs/archive/`). **Retention + personalization batch (#154–#161, except #162 Sentry)** closed June 11, 2026 on `develop`. **#162 (Sentry SDK)** remains open for manual wiring.

This file is the single forward-looking list. Add new items here (or open GitHub issues and link them) instead of resurrecting archived roadmaps.

---

## Verified open follow-ups (from June 11, 2026 audit)

### Ops hardening

- [ ] **Production paid-checkout smoke test** — run a real (test-mode) checkout on production after each Stripe-touching release; watch webhook deliveries in the Stripe dashboard. Readiness check: `/admin/diagnostics/stripe`. (Carried from `MVP_STATUS_ROADMAP.md` "P0 next".)
- [ ] **Sentry SDK wiring (#162)** — `.env.example` lists `SENTRY_*` placeholders but no `@sentry` SDK is installed; logging is stdout-only via `lib/log.ts`. Wire Sentry or remove placeholders (skipped in June 11 batch — manual follow-up).
- [ ] **Re-archive pre-fix "archived" events** — events archived before migration `20260610043000` were silently blocked by RLS and may still be public. One-time data check + re-archive (see `docs/OPERATIONS.md` → Event archive ops).
- [ ] **CI coverage gaps** — CI does not verify Supabase migration parity and does not exercise Stripe webhook fulfillment end-to-end (noted in `docs/OPERATIONS.md`).

### In flight

- [ ] **PR #151** — `fix(events): remove duplicate Open My Vibes CTA on event detail` (branch `fix/events-duplicate-my-vibes-cta`, open against `develop`). Merge or close.

### Deferred product work (tracked, not scheduled)

- Stripe Tax / partial refunds automation; Stripe Connect organizer payouts (Phase 4 backlog)
- Live Realtime check-in counters; dedicated door UX polish (Phase 5 backlog)
- Mobile-responsive dashboard sidebar; loading skeletons; error boundaries (Phase 6 backlog)
- Full post-MVP backlog: see `docs/MVP_STATUS_ROADMAP.md` → "Post-MVP Features (Backlog)"

---

## Working rules

1. One issue at a time; keep changes scoped.
2. New schema changes: `supabase migration new <name>` → timestamped file in `supabase/migrations/` (never edit applied migrations).
3. Verify with `npm run ci` before shipping; feature PRs target `develop` (see `docs/development/BRANCHING.md`).
4. Update docs as behavior changes: contract → journey → troubleshooting → this file.
