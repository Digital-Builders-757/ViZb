# Production walkthrough punchlist — P0 / P1

**Branch:** `docs/prod-walkthrough-p0p1`  
**Last updated:** 2026-04-05  
**Scope:** Public, auth, member, organizer, and admin surfaces listed below.

---

## Methodology

This pass combined **static review of the current `main` implementation** (routes, middleware, dashboard, RSVP flows) with **architecture cross-checks** against `docs/ARCHITECTURE_CONSTITUTION.md`, `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`, and `docs/diagrams/airport-model.md`.

**Live production URL and credentials were not available in-repo** at authoring time. Treat each finding as a **pre-launch verification item**: confirm on your deployed host (staging first), attach screenshots to the PR or internal QA folder, and downgrade/close items that do not reproduce.

### Routes exercised (checklist)

| Zone | Route | Verified in code | Screenshot captured (Y/N) |
|------|--------|------------------|----------------------------|
| Public | `/` | Y | _Pending prod/staging_ |
| Public | `/events` | Y | _Pending_ |
| Public | `/events/[slug]` | Y | _Pending_ |
| Auth | `/login` | Y | _Pending_ |
| Member | `/dashboard` | Y | _Pending_ |
| Member | `/dashboard/tickets` | Y | _Pending_ |
| Organizer | `/organizer/[slug]` | Y | _Pending_ |
| Organizer | `/organizer/[slug]/events/[eventSlug]` | Y | _Pending_ |
| Admin | `/admin` | Y | _Pending_ |
| Admin | `/admin/posts` | Y | _Pending_ |
| Admin | `/admin/events/[id]` | Y | _Pending_ |

**Minimum evidence:** For each **P0** item, capture one full-viewport screenshot (mobile width ~390px and desktop) showing the wrong state plus the URL bar or route label in notes.

---

## Findings

### 1. Member home shows a permanent “empty” tickets strip even when the member has RSVPs

| Field | Detail |
|--------|--------|
| **Severity** | **P0** |
| **Route** | `/dashboard` |
| **Repro steps** | 1) Sign in as a user who has at least one non-cancelled `event_registrations` row. 2) Open `/dashboard`. 3) Scroll to **Your Tickets**. |
| **Expected** | A preview of upcoming RSVPs (or a deep link to `/dashboard/tickets` with accurate copy) consistent with `/dashboard/tickets`. |
| **Actual (code)** | The page always renders the “No tickets yet” `EmptyStateCard` and never loads `event_registrations` (`app/(dashboard)/dashboard/page.tsx`). |
| **Notes** | Fix tracked under member dashboard polish (connect home to the same RSVP source as `/dashboard/tickets`). |

---

### 2. Member home stat cards report `0` for tickets and “events attended” regardless of real data

| Field | Detail |
|--------|--------|
| **Severity** | **P1** |
| **Route** | `/dashboard` |
| **Repro steps** | 1) Sign in with active RSVPs and/or past check-ins. 2) Observe the three stat tiles under **Overview**. |
| **Expected** | Ticket count reflects active RSVPs; “Events attended” reflects completed/checked-in history (or copy is changed to “Coming soon” if not implemented). |
| **Actual (code)** | `StatCard` values for Tickets and Events are literals `0` (`app/(dashboard)/dashboard/page.tsx`). |
| **Notes** | Misleading trust signal before launch; align numbers with queries or soften labels. |

---

### 3. Architecture doc drift: “Manifest” vs middleware behavior for `/events`

| Field | Detail |
|--------|--------|
| **Severity** | **P1** (documentation / onboarding) |
| **Route** | `/events`, `/events/[slug]` |
| **Repro steps** | 1) Read `docs/diagrams/airport-model.md` (Manifest row). 2) Read `lib/supabase/middleware.ts` protected route list. |
| **Expected** | A single agreed rule: either the timeline is public marketing, or discovery requires a session — docs and middleware should match. |
| **Actual** | Airport model states the full catalog + detail “require a session”; middleware explicitly treats `/events` as public and gates `/dashboard`, `/organizer`, `/admin`, `/profile`, `/tickets`. |
| **Notes** | Not necessarily a product bug if public discovery is intentional — **update the airport model** (and any security runbooks) so new engineers do not gate the wrong routes. |

---

### 4. RSVP / ticketing operational docs reference `scripts/` only

| Field | Detail |
|--------|--------|
| **Severity** | **P1** (ops) |
| **Route** | `/dashboard/tickets` (error path), `/admin/events/[id]` (error path) |
| **Repro steps** | 1) Point a preview environment at a project **without** `event_registrations`. 2) Open tickets or admin event detail. |
| **Expected** | Error copy points operators to the **canonical migration path** (`supabase/migrations/*` and `supabase db push`), with `scripts/` as an optional mirror if your runbook still uses it. |
| **Actual** | User-facing / inline copy cites `scripts/025_create_event_registrations.sql` only. |
| **Notes** | Reduces time-to-fix when staging diverges from local SQL files. |

---

### 5. No durable in-app notification inbox (only ephemeral toasts / copy)

| Field | Detail |
|--------|--------|
| **Severity** | **P1** (product gap; may become P0 if you promise “we’ll notify you” in UX) |
| **Route** | Cross-cutting (`/dashboard`, `/host/apply`, organizer/admin actions) |
| **Repro steps** | 1) Complete flows that imply follow-up (host application submitted, RSVP, check-in). 2) Look for a persistent notification center with unread state. |
| **Expected** | Optional for MVP, but if copy promises notification, users need a surface to read and clear items. |
| **Actual** | `docs/contracts/notifications.md` is **ROADMAP**; UI uses `sonner` toasts in several actions but no shared inbox. |
| **Notes** | Align marketing/host copy with reality or ship a minimal inbox + “mark all read”. |

---

### 6. `profiles` bootstrap uses `select('*')` in the auth helper

| Field | Detail |
|--------|--------|
| **Severity** | **P2** (tech debt / constitution alignment) |
| **Route** | Any server path calling `getProfile()` |
| **Repro steps** | Inspect `lib/auth-helpers.ts` (`getProfile`). |
| **Expected** | Explicit column lists per `docs/ARCHITECTURE_CONSTITUTION.md`. |
| **Actual** | `.select("*")` on `profiles`. |
| **Notes** | Schedule a focused refactor when profile columns stabilize. |

---

### 7. Admin overview degrades heavily when server Supabase env is missing

| Field | Detail |
|--------|--------|
| **Severity** | **P1** (prod should never hit this; preview/storybook might) |
| **Route** | `/admin` |
| **Repro steps** | 1) Run the app without server Supabase URL/key. 2) Visit `/admin` as staff. |
| **Expected** | Hard fail in **production** (middleware already throws when anon env missing in prod) or a loud “misconfiguration” banner with no fake counts. |
| **Actual** | `isServerSupabaseConfigured()` gate renders a reduced shell with static links — acceptable for previews, confusing if mis-deployed. |
| **Notes** | Add deploy-time checks / health page to catch missing env before customers see hollow admin. |

---

### 8. Organizer event surface depends on optional RSVP table — verify prod migration parity

| Field | Detail |
|--------|--------|
| **Severity** | **P1** |
| **Route** | `/organizer/[slug]/events/[eventSlug]` |
| **Repro steps** | 1) Use an org with a real event. 2) Compare RSVP panel behavior when `event_registrations` exists vs missing. |
| **Expected** | Production projects always have migrations applied; panel shows counts or a single actionable error. |
| **Actual (code)** | Page defensively handles missing rollup; easy to confuse with “zero RSVPs” if errors are swallowed in UI. |
| **Notes** | Pair with monitoring on PostgREST errors for this query. |

---

### 9. Public home 3D / heavy assets — verify low-end mobile

| Field | Detail |
|--------|--------|
| **Severity** | **P2** (performance) |
| **Route** | `/` |
| **Repro steps** | 1) Throttle CPU + network on a mid-tier phone profile. 2) Load the landing page cold. |
| **Expected** | Acceptable LCP, no horizontal scroll, no main-thread lock longer than product standards. |
| **Actual** | Not measured in this doc pass; code includes client 3D wrapper — treat as perf risk. |
| **Notes** | Capture WebPageTest / Lighthouse mobile traces before marketing spend. |

---

### 10. Login redirect parameter — regression spot-check

| Field | Detail |
|--------|--------|
| **Severity** | **P2** |
| **Route** | `/login` (from deep links) |
| **Repro steps** | 1) While signed out, hit a protected URL (e.g. `/dashboard/tickets`). 2) Complete login. |
| **Expected** | User lands on the originally requested route when `redirect` (or equivalent) is valid and safe. |
| **Actual** | Middleware sets `redirect` query param; **confirm** auth pages honor it and do not strip external/open redirects. |
| **Notes** | Explicitly try organizer and admin targets. |

---

### 11. Event detail RSVP CTA — confirm behavior for non-published events

| Field | Detail |
|--------|--------|
| **Severity** | **P1** |
| **Route** | `/events/[slug]` |
| **Repro steps** | 1) As a member, open a published event and RSVP. 2) If possible, attempt RSVP paths for draft/archived slugs via old links or typos. |
| **Expected** | RLS + UI prevent silent failures; user sees a clear message if RSVP is not allowed. |
| **Actual** | RLS policy allows insert only for `events.status = 'published'`; **verify** the CTA matches server errors and does not infinite-spin. |
| **Notes** | Pair with `components/events/event-rsvp-cta.tsx` manual test matrix. |

---

### 12. Large RSVP / attendee lists — organizer + admin tables

| Field | Detail |
|--------|--------|
| **Severity** | **P1** (scalability) |
| **Route** | `/organizer/[slug]/events/[eventSlug]`, `/admin/events/[id]` |
| **Repro steps** | 1) Seed or simulate 500+ registrations. 2) Scroll, search (if any), check-in actions. |
| **Expected** | Pagination or virtualized list; server queries bounded. |
| **Actual** | Not benchmarked in this pass; treat as launch risk for viral events. |
| **Notes** | Add load test or cap + “export” for ops if tables are full-width fetch today. |

---

## Summary

| Severity | Count |
|----------|-------|
| P0 | 1 |
| P1 | 8 |
| P2 | 3 |

---

## “No issues found” clause

If, after running the same routes on **your** production or staging host, the P0/P1 items above do not reproduce (because fixes landed or environment differs), record the **deployment SHA**, **tester**, and **date** in this section and attach screenshots to close the loop.

---

## Related docs

- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/diagrams/airport-model.md`
- `docs/contracts/rsvps.md`
- `docs/contracts/notifications.md`
