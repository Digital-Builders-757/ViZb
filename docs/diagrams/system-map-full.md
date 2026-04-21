# System map (full) — ViBE

**Last updated:** April 20, 2026

**ARCHIVE / DEEP DEBUG.** Broad inventory to answer “where does X live?” **This file drifts easily.** Prefer **`docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`** for ownership; use this when you need a **single scrollable map** and will verify paths in-repo.

Do **not** default to this in `/plan` — use **`airport-model.md`** + focused diagrams.

---

## App routes (representative)

| Area | Paths |
|------|--------|
| Marketing | `/` |
| Manifest | `/events`, `/events/[slug]` |
| Auth | `/login`, `/signup`, `/auth/callback`, `/auth/error`, `/auth/sign-up-success` |
| Dashboard shell | `app/(dashboard)/layout.tsx` |
| Attendee | `/dashboard`, **`/tickets`** ( `/dashboard/tickets` alias ), `/profile` |
| Organizer | `/organizer/new`, `/organizer/[slug]`, `/organizer/[slug]/events/new`, `/organizer/[slug]/events/[eventSlug]` |
| Host | `/host/apply` |
| Admin | `/admin` |
| Invites | `/invite/claim` |

---

## Server actions (current tree)

Canonical ownership by domain lives in **`docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`** (Rule 2 — **`app/actions/*.ts`**). Do not duplicate the full inventory here; when debugging, list the directory and match files to domains (events, registrations, tickets, organizer, admin, posts, lineup, …).

---

## Supabase / data

- **Clients:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
- **SQL ledger:** `scripts/*.sql` (numbered); audit: **`database_schema_audit.md`**
- **Auth helper patterns:** `lib/auth-helpers.ts` *(if present)*

---

## Session refresh (request proxy)

- Root **`proxy.ts`** invokes **`updateSession`** from **`lib/supabase/middleware.ts`** (Next.js 16 pattern; there is no root **`middleware.ts`** file in this repo).

---

## Maintenance

When you add a **major** route group or action file, update this doc **in the same PR** or mark sections **UNVERIFIED** until refreshed.
