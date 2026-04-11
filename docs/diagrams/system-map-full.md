# System map (full) — ViBE

**Last updated:** March 23, 2026

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

Files under **`app/actions/`** (verify exports when debugging):

- `subscribe.ts` — waitlist
- `event.ts` — events
- `organization.ts` — orgs
- `invite.ts` — invites
- `host-application.ts` — host apply

Admin mutations may live in components or future `app/actions/*`; re-scan when adding.

---

## Supabase / data

- **Clients:** `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`
- **SQL ledger:** `scripts/*.sql` (numbered); audit: **`database_schema_audit.md`**
- **Auth helper patterns:** `lib/auth-helpers.ts` *(if present)*

---

## Middleware

- **`middleware.ts`** → `updateSession` from `lib/supabase/middleware.ts`

---

## Maintenance

When you add a **major** route group or action file, update this doc **in the same PR** or mark sections **UNVERIFIED** until refreshed.
