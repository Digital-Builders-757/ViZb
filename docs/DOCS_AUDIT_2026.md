# Documentation audit — June 2026

**Scope:** Full repo scan (code, config, migrations, ~167 markdown files).  
**Method:** Code-first inference; compare against existing docs.

---

## What exists now

| Category | Count / state |
|----------|---------------|
| Markdown files | ~167 across `docs/`, root, `.cursor/`, `.github/` |
| Doc spine | Three-layer model (laws → contracts → journeys) in [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) |
| Architecture laws | `ARCHITECTURE_CONSTITUTION.md`, `ARCHITECTURE_SOURCE_OF_TRUTH.md` — recently refreshed (Apr 2026) |
| Domain contracts | 12 files under `contracts/` — MVP contracts refreshed for shipped core flows |
| Journeys | 10 files under `journeys/` — MVP statuses refreshed for shipped core flows |
| Roadmaps / status | 5+ overlapping docs (`MVP_STATUS_ROADMAP`, `PRODUCT_STATUS_REPORT`, `ROADMAP_RUNNER`, etc.) |
| Diagrams | 7 conceptual maps under `diagrams/` |
| Placeholder READMEs | 12 topic folders with stub indexes only |
| Archive | `docs/archive/` exists but is **empty** |

---

## What is strong

1. **Three-layer information architecture** — laws, contracts, journeys is the right shape for humans and agents.
2. **Immutable Cursor paths** — [development/ENGINEERING_COMMANDS.md](./development/ENGINEERING_COMMANDS.md) protects command stability.
3. **Module ownership map** — [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md) names canonical files per domain.
4. **Ops fragments** — `MIGRATIONS.md`, `SUPABASE_PRODUCTION_MIGRATIONS.md`, `COMMON_ERRORS_QUICK_REFERENCE.md` are high signal.
5. **Execution chain** — product roadmap → runner → work orders (now mostly shipped).
6. **CI truth** — `.github/workflows/pr-ci.yml` runs full `npm run ci` + Playwright.

---

## What is weak

| Problem | Impact |
|---------|--------|
| Multiple docs still compete with the new **system design** spine | New contributors can still land in old specs/plans |
| Feb 2026 foundation docs stale | `VIBE_APP_SPECIFICATION.md`, `DEVELOPER_ONBOARDING.md`, `CODING_STANDARDS.md` describe pre-MVP world |
| Five roadmap-like status docs | Contradictory phase % and feature claims |
| Old status/spec docs still reference pre-MVP claims | `VIBE_APP_SPECIFICATION.md`, `PRODUCT_STATUS_REPORT.md`, brand/status docs need cleanup |
| Empty `docs/archive/` | Shipped work-orders and plans still in live tree |
| No env catalog, API surface doc, testing doc | Scattered across `.env.example` and fragments |
| Brand conflicts | Space Grotesk vs Poppins; zero-radius vs glass `rounded-xl` |

---

## What is outdated (high severity)

| Document | Last updated | Drift |
|----------|--------------|-------|
| `VIBE_APP_SPECIFICATION.md` | Feb 2026 | Routes, roles, Stripe RPC names, `event_kind`, posts, check-in |
| `DEVELOPER_ONBOARDING.md` | Feb 2026 | Says auth/events/ticketing are "planned not built" |
| `CODING_STANDARDS.md` | Feb 2026 | Zero-radius rules vs live glass UI |
| `COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md` | Mar 2026 | Posts "when implemented" — shipped |
| `contracts/INDEX.md` | Apr 2026 | **Fixed Jun 8** — statuses now match shipped MVP flows |
| `journeys/INDEX.md` | Apr 2026 | **Fixed Jun 8** — check-in/host/admin/member journeys no longer marked stub/roadmap |
| `guides/LOCAL_DEV_AND_AUTH.md` | Mar 2026 | **Fixed Jun 8** — hosted-first with optional CLI config caveat |
| `docs/tests/README.md` | — | **Fixed Jun 7** — reflects Vitest + Playwright CI |
| `diagrams/role-surfaces.md` | — | `role_admin` vs `platform_role` |

---

## What is missing

- Dedicated **environment variables** reference (partially in `.env.example`, `DEVELOPER_GUIDE`, `OPERATIONS`)
- Dedicated **API & webhook** inventory (summarized in `SYSTEM_DESIGN`, `REPO_MAP`, `OPERATIONS`)
- **RLS policy matrix** (buried in monolithic spec §6)
- **Storage buckets** reference
- Expanded **testing strategy** doc beyond the current thin tests README
- **Release runbook** consolidating RELEASING + SMOKE_TEST + migrations
- **ADR / decision log** (decisions implicit in code and old plans)
- **Schema bootstrap playbook** for dual-track SQL (`scripts/` + `supabase/migrations/`)

---

## Top documentation problems

1. **Legacy status docs contradict code** — many phase claims are now fixed in `MVP_STATUS_ROADMAP`, but root status/report docs still need cleanup.
2. **Admin role model split** — Code gates on `platform_role = 'staff_admin'`; older docs cite `role_admin`.
3. **Dual SQL history undocumented as one story** — `scripts/` bootstrap + CLI deltas confuse greenfield setup.
4. **Stripe RPC name drift** — historical docs/migrations mention `fulfill_stripe_checkout_for_ticket`; current webhook calls `fulfill_stripe_ticket_order`.
5. **Sprawl after the front door** — `docs/README.md` is now the entry point, but old work-orders/plans still need archival.

---

## Actions taken (this rewrite)

Created / hardened:

- [README.md](./README.md) — documentation front door
- [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md)
- [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md)
- [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- [REPO_MAP.md](./REPO_MAP.md)
- [OPERATIONS.md](./OPERATIONS.md)
- [DECISIONS.md](./DECISIONS.md)
- [MIGRATION_MAP.md](./MIGRATION_MAP.md)
- [contracts/INDEX.md](./contracts/INDEX.md) + shipped auth/events/RSVP/check-in/profile/media/notification contracts
- [journeys/INDEX.md](./journeys/INDEX.md) + shipped discovery/member/host/admin/check-in journeys

Deferred (next pass):

- Full rewrite of `VIBE_APP_SPECIFICATION.md` (too many inbound links — split or index-first)
- Archiving shipped work-orders (requires pointer updates across index)
- Brand doc unification (Poppins + glass system)
- Populating stub topic READMEs
- Dedicated env/API/RLS reference docs if the team wants more granularity than `SYSTEM_DESIGN` + `OPERATIONS`

---

## Uncertainties flagged (human confirmation)

| # | Question |
|---|----------|
| 1 | SQL in placeholder migrations `20260208035848` / `20260208035906` |
| 2 | Whether duplicate `posts_mvp_base` CLI migrations exist on disk (glob vs read mismatch) |
| 3 | `supabase/seed.sql` missing but referenced in `config.toml` |
| 4 | Sentry env vars — planned or remove from onboarding? |
| 5 | `subscribers` RLS still uses `role_admin` — migrate to `platform_role`? |
| 6 | Canonical production URL (`www` vs apex) for `NEXT_PUBLIC_SITE_URL` |
