# ViBE / ViZb — Architecture Constitution (Non-Negotiables)

**Last updated:** March 23, 2026

This document is **Layer 1 law**: short, stable rules every agent and developer must follow. For module ownership maps and file-level detail, see `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`.

---

## 1. Security gate

- **`middleware.ts`** refreshes the Supabase session via `lib/supabase/middleware.ts`. It is a **security and session boundary**, not a place for business logic.
- Route protection and redirects must stay **predictable** (no redirect loops, no open redirects). Auth callback behavior is specified in `docs/VIBE_APP_SPECIFICATION.md` (auth sections) and implemented in `app/auth/callback/route.ts`.

## 2. Data access

- **Two Supabase clients only:** browser → `lib/supabase/client.ts`; server (RSC, Server Actions, route handlers) → `lib/supabase/server.ts`.
- **No database writes from Client Components.** Mutations go through **Server Actions** (or server-only route handlers when justified).
- **Explicit `select` lists** — do not use `select('*')` in application code.
- **RLS is mandatory** for every table exposed to the app. Policies live in SQL migrations and are documented in `docs/VIBE_APP_SPECIFICATION.md` (RLS sections).
- **Schema wins:** executed SQL in `scripts/*.sql` (and future `supabase/migrations/*`) overrides docs and TypeScript if they disagree. Fix docs and types, not the other way around.

## 3. Types and SQL

- Prefer generated database types when the project wires Supabase codegen; **do not hand-edit generated type files** to “fix” drift — fix schema + regenerate.
- Until codegen is standard, types must still **match** the columns and enums defined in migrations and `docs/VIBE_APP_SPECIFICATION.md`.

## 4. Auth and profiles

- **Profile creation** for new users is owned by the database trigger (`handle_new_user` — see `scripts/004_create_profiles.sql`). Application code must not insert into `profiles` as a substitute for a broken trigger.

## 5. Red zones (extra care)

Treat changes here as **high blast radius**:

- `middleware.ts`, `lib/supabase/middleware.ts`
- `app/auth/callback/route.ts` and auth-related routes
- RLS policies, triggers, enums
- Any future Stripe webhooks or payment routes

Use `/redzone` workflow for these areas.

---

## Related reading

| Document | Role |
|----------|------|
| `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` | Canonical file map and wiring |
| `docs/BRAND_CONSTITUTION.md` | Brand laws for any customer-facing surface |
| `docs/EVENTS_SOURCE_OF_TRUTH.md` | Event lifecycle and attendance truth |
| `docs/COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md` | Members, orgs, invites |
| `docs/VIBE_APP_SPECIFICATION.md` | Schema, RLS, auth, payments spec |
| `docs/CODING_STANDARDS.md` | Style and patterns |
| `docs/diagrams/airport-model.md` | Zone model for `/plan`, `/triage`, `/debug` |
| `database_schema_audit.md` | Schema inventory and audit cadence |
