# ViZb — code hygiene & documentation master plan

**Purpose:** Single source of truth for the April 2026 hygiene/documentation pass.  
**Process roadmap (ongoing):** [`DOCS_OVERHAUL_PLAN_2026.md`](DOCS_OVERHAUL_PLAN_2026.md) — this file is the **run log** for this pass only.

**Last updated:** April 18, 2026

---

## 1. Current repo audit (living)

### Stack & tooling

- **Next.js 16** App Router; session refresh via root [`proxy.ts`](../proxy.ts) delegating to [`lib/supabase/middleware.ts`](../lib/supabase/middleware.ts) (not `middleware.ts` at repo root).
- **Supabase:** `createClient()` from `lib/supabase/client.ts` (browser) or `lib/supabase/server.ts` (server) only; env helpers in [`lib/supabase/project-env.ts`](../lib/supabase/project-env.ts).
- **Validation:** `npm run typecheck`, `lint`, `test`, `build`; `npm run ci` runs all four in sequence.
- **E2E:** Playwright present (`playwright.config.ts`, `tests/e2e/`, script `npm run test:e2e`).

### Routes surveyed (representative)

- Public: `/`, `/events`, `/events/[slug]`, `/p`, `/p/[slug]`, `/lineup/[eventSlug]`, `/advertise`, `/login`, `/signup`, `/auth/*`, `/invite/claim`.
- Dashboard: `/dashboard`, `/dashboard/tickets`, `/dashboard/tickets/[ticketId]`, `/profile`, `/host/apply`, `/organizer/*`, `/admin/*`, `/tickets/*`.

### Server actions (actual filenames)

Mutations live under [`app/actions/`](../app/actions/): `event.ts`, `registrations.ts`, `ticket-types.ts`, `ticket-checkout.ts`, `checkin.ts`, `organizer-checkin.ts`, `undo-checkin.ts`, `organizer-undo-checkin.ts`, `subscribe.ts`, `organization.ts`, `invite.ts`, `profile.ts`, `lineup.ts`, `posts-admin.ts`, `admin-users.ts`, `admin-registrations.ts`, `host-application.ts`, `notifications.ts`, `advertise-contact.ts`, `vibes.ts` — plus tests under `app/actions/__tests__/`.

**Drift fixed in this pass:** [`ARCHITECTURE_SOURCE_OF_TRUTH.md`](ARCHITECTURE_SOURCE_OF_TRUTH.md) previously listed non-existent `events.ts`, `orders.ts`, `tickets.ts`, `orgs.ts`, `admin.ts` and “Phase N — Planned” for shipped surfaces.

### Documentation spine

- Entry: [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md).
- Layer 1: `ARCHITECTURE_*`, `EVENTS_SOURCE_OF_TRUTH`, `COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH`, `VIBE_APP_SPECIFICATION`, brand docs.
- Setup: [`guides/LOCAL_DEV_AND_AUTH.md`](guides/LOCAL_DEV_AND_AUTH.md), [`.env.example`](../.env.example).

---

## 2. Top hygiene issues found

1. **`docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`** — Wrong action filenames and “planned” phases for live auth, events, ticketing, organizer, admin.
2. **`docs/development/ENGINEERING_COMMANDS.md`** — Incorrect `ci` description (implied lint excluded); Playwright described as absent though repo has E2E.
3. **`docs/CODING_STANDARDS.md`** — Project tree listed `app/actions/events.ts` as future; stale vs current tree.
4. **`package.json` `name`** — `my-v0-project` (cosmetic confusion for contributors).
5. **Root `README.md`** — v0 boilerplate mixed with product setup; weak separation of “how to develop” vs “v0 sync”.

---

## 3. Top documentation gaps found

1. No explicit mention of **`proxy.ts`** as the auth cookie refresh boundary in Layer 1 module map (now added in `ARCHITECTURE_SOURCE_OF_TRUTH`).
2. **ENGINEERING_COMMANDS** verification table did not match `package.json` `ci` script.
3. **CODING_STANDARDS** structure section did not point to real `app/actions/*` layout.

---

## 4. Cleanup priorities (ordered)

1. Create this master plan + link from documentation index (+ README pointer).
2. Align `ARCHITECTURE_SOURCE_OF_TRUTH.md` with repo (actions, routes, proxy, env vars that exist in `.env.example`).
3. Fix `ENGINEERING_COMMANDS.md` and `CODING_STANDARDS.md` verification/structure snippets.
4. Tighten root `README.md`; rename `package.json` name to `vizb`.
5. Run lint; fix high-confidence issues (unused imports, etc.).
6. Run full validation; record results below.

---

## 5. Definition of done

- [x] Master plan exists and stays updated through the pass.
- [x] Obvious doc drift (architecture, commands, coding standards) reduced.
- [x] Cosmetic/package identity improved where safe.
- [x] Lint/typecheck/test/build green (or failures documented with cause).
- [x] Deferred work listed explicitly in §8.

---

## 6. Files / routes / systems reviewed

| Area | Notes |
|------|--------|
| `proxy.ts`, `lib/supabase/middleware.ts` | Session refresh matcher; documented |
| `app/actions/*` | Inventory aligned in architecture doc |
| `app/**/page.tsx` | Route list spot-checked vs architecture doc |
| `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` | Major refresh |
| `docs/ARCHITECTURE_CONSTITUTION.md` | Proxy entry for session boundary |
| `docs/development/ENGINEERING_COMMANDS.md` | CI + Playwright rows |
| `docs/CODING_STANDARDS.md` | Structure, auth, Supabase examples |
| `README.md`, `DOCUMENTATION_INDEX.md` | Links to this plan |
| `package.json` | `name` → `vizb` |
| Layer 1 / guides / diagrams / spec snippets | Auth + infra naming alignment |
| `.cursor/rules/no-client-db-writes.mdc` | `createClient()` wording |

---

## 7. Cleanup & documentation completed (changelog)

| Item | Detail |
|------|--------|
| **Created** | This file |
| **Updated** | `ARCHITECTURE_SOURCE_OF_TRUTH.md` — Rule 2 action map; module sections for auth, events, tickets, organizer, admin; `proxy.ts`; env table; utilities note |
| **Updated** | `ENGINEERING_COMMANDS.md` — `ci` includes lint; Playwright → `npm run test:e2e` |
| **Updated** | `CODING_STANDARDS.md` — project tree, auth/route-protection, Supabase examples use `createClient()` |
| **Updated** | `DOCUMENTATION_INDEX.md`, `README.md` — link to master plan |
| **Updated** | `package.json` — `"name": "vizb"` |
| **Updated** | `ARCHITECTURE_CONSTITUTION.md`, `contracts/auth.md`, `guides/LOCAL_DEV_AND_AUTH.md`, `troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`, `MVP_STATUS_ROADMAP.md`, `DEVELOPER_ONBOARDING.md`, `diagrams/infrastructure-flow.md`, `VIBE_APP_SPECIFICATION.md` (Realtime example), `.cursor/rules/no-client-db-writes.mdc` — `proxy.ts` + `createClient()` naming |
| **Hygiene** | `npm run lint` clean; no application-code edits required this pass (drift was mostly documentation) |

---

## 8. Follow-ups deferred intentionally

| Item | Reason |
|------|--------|
| Enabling stricter ESLint rules (e.g. unused imports plugin) | Not in `eslint-config-next` by default; would need new deps or config policy |
| Moving root markdown (`REFACTOR_PLAN.md`, etc.) into `docs/` | High link churn; `DOCUMENTATION_INDEX` already maps them |
| Full rewrite of `CODING_STANDARDS.md` §2 deep dive | Out of scope; only structure snippet refreshed |
| Renaming `my-v0-project` in lockfile contexts | N/A — package name change does not require lockfile regen for npm |
| Sweep remaining `middleware.ts` mentions in `docs/diagrams/airport-model.md`, `system-map-full.md`, `VIBE_APP_SPECIFICATION.md` (non-snippet prose), `signup-bootstrap-flow.md` | Lower risk to batch in a docs-only PR; constitution + troubleshooting + contracts already updated |

---

## 9. Validation checklist

| Check | Command | Result |
|-------|---------|--------|
| Typecheck | `npm run typecheck` | Pass (`tsc --noEmit`, exit 0) |
| Lint | `npm run lint` | Pass (`eslint .`, exit 0) |
| Test | `npm run test` | Pass (Vitest: 14 files, 98 tests, exit 0) |
| Build | `npm run build` | Pass (Next.js 16.0.10 production build, exit 0) |

---

## 10. Final completion notes

This pass focused on **documentation truth** (especially `ARCHITECTURE_SOURCE_OF_TRUTH.md`, auth/session naming, and Supabase `createClient()` consistency across spine docs), a **cleaner README** (v0 called out as optional), **`package.json` identity** (`vizb`), and a **living master plan** linked from the doc index. Application behavior was not intentionally changed. Remaining diagram references to `middleware.ts` in `airport-model.md` / `system-map-full.md` are noted under §8 for a future sweep if desired.
