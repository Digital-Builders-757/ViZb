# AGENT_PROGRESS.md

Living progress + audit log for autonomous shipping work.

Last updated: 2026-04-04

## Phase 1 — Truth + Stability (audit)

### Repo reality (high-level)
- Next.js App Router + Supabase + Tailwind.
- Product surfaces present: marketing landing, public events, community posts, auth, organizer event creation/editing, admin dashboard, admin posts CRUD, admin event review/management.
- SQL is migration-style scripts in `scripts/*.sql`.

### Current working branch
- `develop`

### Local repo status at start of this work session
- Pending (unshipped) ViZb fixes already present locally:
  - `scripts/024_allow_staff_update_archived.sql` (new)
  - `app/actions/event.ts` (adds `unarchiveEvent` server action)
  - `components/admin/admin-event-manager.tsx` (Restore button for archived events)
  - `docs/contracts/events.md` (documents migration 024)

### Risk/Gap scan (what matters most for launch)
1) **Schema parity / drift risk:** strong likelihood across envs unless `scripts/*` are applied in order. We need a clearer “applied migrations” checklist + verification steps.
2) **Ticketing / RSVP flow:** currently not represented as a first-class end-to-end flow (tables + CTA + wallet + organizer visibility).
3) Payments/Stripe readiness: likely absent or partial; should build clean seams even if keys aren’t available.
4) Ops/check-in: absent; can be layered after RSVP.
5) Polish: ongoing (mobile, nav, empty/loading states).

## Phase 1 — Chosen highest-impact task (start)

### Task 1: Ship archived-event unarchive support + staff RLS fix
**Why:** Fixes an admin workflow dead-end and corrects an RLS regression from migration 023 that can block staff moderation on archived rows.

**Scope:**
- Add migration `024_allow_staff_update_archived.sql` restoring staff ability to UPDATE archived events.
- Add server action `unarchiveEvent(eventId)` (staff only) to restore archived → draft and clear moderation metadata.
- Add admin UI Restore button in Archived tab.
- Update events contract docs.

**Verification plan:**
- Typecheck/build locally.
- Confirm server action is admin-gated (`requireAdmin`).
- Confirm migration policy allows `is_staff_admin()` regardless of status.

## Next highest-impact tasks (queued)

### Task 2: Add a DB drift / migration apply checklist
- Add `docs/database/MIGRATIONS.md` with:
  - required scripts in order
  - verification pointers
  - quick notes about parity/drift

### Task 3: Ticketing / RSVP V1 foundation (design + DB + minimal E2E)
- Shipped foundation pieces (in progress):
  - DB migration: `scripts/025_create_event_registrations.sql`
  - Server actions: `app/actions/registrations.ts` (RSVP + cancel)
  - Public event detail CTA wired to RSVP (tickets still “coming soon”)
  - Member wallet: `/dashboard/tickets` now lists RSVP’d events
- Next expansions:
  - Organizer/admin visibility for registrations
  - Check-in status transitions
  - Ticket types / quantities + paid orders

---

## Changelog

### 2026-04-04
- Started Phase 1 audit.
- Created `docs/AGENT_PROGRESS.md` as living progress file.
- Verified local checks before shipping unarchive work:
  - `npm run typecheck` ✅
  - `npm run test` ✅ (49 tests)
  - `npm run lint` ✅ (warning: baseline-browser-mapping data is old; non-blocking)
- Shipped Task 1 to `develop` (see commit history).
- Started Task 2 (DB migrations checklist) by adding `docs/database/MIGRATIONS.md` and updating the local-dev guide.
