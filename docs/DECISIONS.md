# Architectural decisions

**Last updated:** June 8, 2026  
**Format:** Lightweight ADR log. Status: **Accepted** unless noted.

For system context, see [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md).

---

## ADR-001: Next.js monolith (no separate API service)

**Status:** Accepted  
**Date:** Project inception

**Decision:** Single Next.js App Router application on Vercel. Server Components, Server Actions, and a small set of Route Handlers form the entire server boundary.

**Why:** Small team, flyer-first marketing + dashboard in one deploy unit, RSC performance, simpler auth cookie model.

**Consequences:** No independent API versioning; webhooks and actions share the same deploy lifecycle.

---

## ADR-002: Supabase as system of record

**Status:** Accepted

**Decision:** Postgres (Supabase) holds all durable state. Auth, Storage, and RLS are Supabase-native.

**Why:** Fast MVP, built-in auth, row-level security, storage for flyers/posts.

**Consequences:** Schema migrations are release-critical; app code assumes Supabase client patterns.

---

## ADR-003: RLS as ultimate authorization

**Status:** Accepted

**Decision:** Every table exposed to the app has RLS enabled before any application code uses it. App-level gates (`requireAdmin`, `requireOrgMember`) mirror RLS intent but do not replace it.

**Why:** Defense in depth; anon key is public; prevents data leaks if a gate is missed.

**Consequences:** New tables require policies in the same PR. Complex policies use `SECURITY DEFINER` helpers (`is_staff_admin`, `is_org_member`).

---

## ADR-004: Server Actions for mutations

**Status:** Accepted

**Decision:** All database writes go through `app/actions/*.ts`. Client Components do not write to the database.

**Why:** Clear mutation boundary, server-side validation, aligns with Next.js 16 patterns.

**Exceptions:** Trusted Route Handlers (Stripe webhook, check-in scan) when HTTP ingress is required.

---

## ADR-005: Two Supabase clients + service role enclave

**Status:** Accepted

**Decision:**

- Browser: `lib/supabase/client.ts`
- Server: `lib/supabase/server.ts`
- Service role: `lib/supabase/service-role.ts` — Stripe webhook, checkout pending orders, admin auth delete only

**Why:** Prevent accidental service role exposure; single import path per context.

---

## ADR-006: `proxy.ts` for session refresh (not `middleware.ts`)

**Status:** Accepted (Next.js 16)

**Decision:** Session refresh and coarse route protection live in `proxy.ts` → `lib/supabase/middleware.ts`. No business logic in the proxy layer.

**Why:** Next.js 16 request proxy convention; keeps auth boundary thin.

**Consequences:** Docs referencing root `middleware.ts` are wrong for this repo.

---

## ADR-007: Unified ticket model (free RSVP = $0 ticket)

**Status:** Accepted

**Decision:** Free RSVPs mint a `tickets` row and a completed `$0` `orders` record via RPC `mint_free_rsvp_ticket_for_registration`.

**Why:** One door-check flow, one wallet UI, consistent capacity accounting.

**Consequences:** RSVP is not a separate "non-ticket" path; registration + ticket are linked.

---

## ADR-008: Stripe webhook-driven fulfillment

**Status:** Accepted

**Decision:** Paid ticket mint happens in `POST /api/stripe/webhook` via RPC `fulfill_stripe_ticket_order`, not on client redirect.

**Why:** Redirect is unreliable; webhook is Stripe's source of truth.

**Consequences:** Requires `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_WEBHOOK_SECRET`, and idempotency (`webhook_logs`).

**Note:** Older RPC `fulfill_stripe_checkout_for_ticket` exists in earlier migrations; app uses `fulfill_stripe_ticket_order` (migration `20260606000500`).

---

## ADR-009: `platform_role` for staff admin gates

**Status:** Accepted (supersedes `role_admin` as primary)

**Decision:** Application admin gates use `profiles.platform_role = 'staff_admin'`. Values: `user`, `staff_admin`, `staff_support`.

**Why:** Enum is clearer than boolean; supports support tier; hardened against client self-promotion.

**Legacy:** `role_admin` boolean remains on `profiles` with column privileges; some RLS (e.g. `subscribers`) may still reference it — **known inconsistency**.

---

## ADR-010: Profile creation via database trigger

**Status:** Accepted

**Decision:** `handle_new_user()` trigger inserts `profiles` on signup. Application code must not INSERT into `profiles`.

**Why:** Eliminates race conditions and duplicate profile bugs.

**If profile missing:** Debug trigger, not app workaround.

---

## ADR-011: Dual SQL migration tracks

**Status:** Accepted (technical debt documented)

**Decision:**

- `scripts/*.sql` — numbered bootstrap mirror (historical, SQL Editor)
- `supabase/migrations/*.sql` — CLI-applied incremental deltas

**Why:** Repo linked to Supabase after prod already had schema; placeholders preserve version alignment.

**Consequences:** Greenfield setup is non-trivial; docs must state bootstrap order. **CLI-first** for new deltas.

---

## ADR-012: Server Components by default

**Status:** Accepted

**Decision:** Default to RSC; extract Client Components only for interactivity (forms, scanner, Three.js hero).

**Why:** Performance, smaller client bundles, SEO for public pages.

---

## ADR-013: Platform org for staff-created events

**Status:** Accepted

**Decision:** Staff-created official and community events use org identified by `PLATFORM_ORG_SLUG` (default `vizb`). Community events use `event_kind = community` + optional `external_rsvp_url`.

**Why:** Separates ViZb-curated listings from organizer-owned events without a separate product surface.

---

## ADR-014: 5% platform fee on paid tickets

**Status:** Accepted

**Decision:** `lib/payments/ticket-fees.ts` adds 5% platform fee to paid checkout totals; stored as `platform_fee_cents` on `orders`.

**Why:** Marketplace revenue model; transparent fee separation in schema.

---

## ADR-015: QR check-in via signed token API

**Status:** Accepted (partial MVP)

**Decision:** Door scanner uses `POST /api/checkin/scan` with HMAC-signed QR payload (`TICKET_QR_SECRET`), not client-side registration ID entry alone.

**Why:** Prevents trivial forgery; scanner works offline from ticket display.

**Also shipped:** Manual check-in via organizer/admin actions.

---

## ADR-016: Three-layer documentation model

**Status:** Accepted

**Decision:** Layer 1 laws → Layer 2 contracts → Layer 3 journeys, plus June 2026 core docs (`SYSTEM_DESIGN`, `DEVELOPER_GUIDE`, etc.).

**Why:** Scales across humans and AI agents; separates invariant from acceptance behavior.

---

## ADR-017: npm-only, develop-first branching

**Status:** Accepted

**Decision:** `npm` lockfile only; feature PRs → `develop`; release `develop` → `main` merge commit.

**Why:** Avoid mixed lockfile tooling confusion; integration branch reduces main breakage.

---

## ADR-018: No active Sentry SDK yet

**Status:** Accepted as current state

**Decision:** Sentry environment variables may exist in `.env.example`, but no Sentry SDK is wired into the app code. Treat Sentry as planned/optional, not active monitoring.

**Why:** Prevent false operational confidence. Current server-side observability is host stdout via `lib/log.ts` and surfaced admin banners.

**Consequences:** Production incident review starts in Vercel logs, Supabase/Stripe dashboards, and app runbooks until Sentry is intentionally integrated.

---

## ADR-019: Release PRs are guarded to `develop` → `main`

**Status:** Accepted with known process gap

**Decision:** `.github/workflows/release-guard.yml` currently enforces that PRs into `main` come from `develop`.

**Why:** Keeps production releases as deliberate integration promotions.

**Consequences:** Docs that describe `fix/*` hotfix PRs directly into `main` are process aspirations unless the guard is changed. Operators should route hotfixes through `develop` or explicitly coordinate a workflow exception/change.

---

## Open / deferred decisions

| Topic | State | Notes |
|-------|-------|-------|
| Sentry SDK integration | **Deferred** | Env vars exist; no code |
| Supabase type codegen | **Deferred** | Types hand-maintained |
| `subscribers` RLS → `platform_role` | **Open** | Still uses `role_admin` |
| Local Supabase as official path | **Open** | `config.toml` exists; guide says hosted-first |
| Stripe Connect / organizer payouts | **Roadmap** | Not in current schema |
| Consolidate SQL to single track | **Open** | Long-term hygiene |
| `admin_list_users` RPC versioning | **Open** | App references RPC; no repo SQL definition found |
| `supabase/seed.sql` | **Open** | Referenced by config; missing seed can break local reset |

---

## How to add a decision

1. Add a new ADR section with status, date, decision, why, consequences.
2. Link from [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) if it affects boundaries.
3. Update affected Layer 1 law or Layer 2 contract if it changes invariants.
