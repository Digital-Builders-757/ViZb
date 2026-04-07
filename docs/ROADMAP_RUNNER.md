# ROADMAP_RUNNER — ViZb (ship order)

Purpose: stop re-prompting. This is the canonical backlog + Definitions of Done.

Rules
- Work on feature branches → PR into `develop` → release PR `develop` → `main`.
- Prefer minimal diffs and existing primitives.
- No production DB changes unless explicitly approved (running `supabase db push` is a separate, intentional step).

---

## Item 1 — Marketing first impression (Electric Neon)
**Status:** SHIPPED (landing + events cohesion, waitlist pending PR)

Done means
- Landing hero + trending rail + premium events cards
- /events filter pills + trending strip
- Consistent neon/glass language across marketing sections

---

## Item 2 — My Vibes (Saved events) v1
**Status:** READY

Goal
- Private, per-user saved events that power a dashboard planner module.

Definition of Done (v1)
A) Persistence (Supabase + RLS)
- New table: `event_saves`
  - columns: `id uuid primary key default gen_random_uuid()`, `user_id uuid not null`, `event_id uuid not null`, `created_at timestamptz not null default now()`
  - unique: `(user_id, event_id)`
  - indexes on `(user_id, created_at)` and `(event_id)`
- RLS enabled:
  - user can `select/insert/delete` their own rows
  - no updates required (delete+insert)

B) Actions + UI
- Save/Unsave button (label: **My Vibes**) on:
  - `/events` cards (timeline)
  - `/events/[slug]` event detail
  - dashboard calendar event detail panel
- Signed out:
  - show "Sign in to save" (link to `/login`)

C) Dashboard module
- Add module above calendar: **My Vibes — This Week**
- Shows saved upcoming events grouped by day (next 7–14 days)
- Empty state CTA: Explore events

D) Events filter
- `/events` page: toggle chip **My Vibes**
- When enabled, timeline shows only saved events (signed-in only)

E) Export
- "Add My Vibes to Calendar" downloads one ICS containing upcoming saved events (next 30 days)

Verification checklist
- `npm run ci` passes
- RLS works: user cannot read/write other users' saves
- Save persists across refresh
- Mobile: no overflow; buttons reachable; drawer/panel actions work

Files (suggested)
- Migration: `supabase/migrations/<ts>_event_saves.sql` (+ optional `scripts/0xx_event_saves.sql` mirror)
- Server actions: `app/actions/vibes.ts`
- Queries: `lib/events/my-vibes-queries.ts` (or extend dashboard queries)
- UI: `components/events/my-vibes-toggle.tsx`, `components/events/my-vibes-button.tsx`
- Dashboard module: `components/dashboard/my-vibes-week.tsx`

---

## Item 3 — Calendar v2 polish follow-ups
**Status:** AFTER Item 2

Ideas
- Add "My Vibes" filter inside calendar shell
- Add tiny hero "This week" strip on dashboard
- Better empty states + onboarding copy
