# Documentation migration map

**Last updated:** June 8, 2026

For each major existing doc: **keep**, **merge**, **rewrite**, **archive**, or **delete**. Do not delete without a pointer from [README.md](./README.md) or [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md).

**Legend:** New core docs from June 2026 rewrite are marked **NEW**.

---

## New core docs (June 2026)

| Path | Action | Replaces / complements |
|------|--------|------------------------|
| `docs/README.md` | **NEW** | Primary navigation; complements `DOCUMENTATION_INDEX.md` |
| `docs/SYSTEM_DESIGN.md` | **NEW** | Depth that was missing; complements `VIBE_APP_SPECIFICATION.md` |
| `docs/ARCHITECTURE_OVERVIEW.md` | **NEW** | Short path for agents; complements `AGENT_ONBOARDING.md` |
| `docs/DEVELOPER_GUIDE.md` | **NEW** | Supersedes stale sections of `DEVELOPER_ONBOARDING.md` |
| `docs/REPO_MAP.md` | **NEW** | Practical map; complements `ARCHITECTURE_SOURCE_OF_TRUTH.md` |
| `docs/OPERATIONS.md` | **NEW** | Consolidates ops fragments |
| `docs/DECISIONS.md` | **NEW** | Captures implicit ADRs |
| `docs/DOCS_AUDIT_2026.md` | **NEW** | Audit record |
| `docs/MIGRATION_MAP.md` | **NEW** | This file |

**June 8 status:** Core docs, entry points, Layer 2 contract statuses, and Layer 3 journey statuses were refreshed against code. Archive moves and destructive cleanup remain recommendations, not executed changes.

---

## Root always-on

| Path | Action | Notes |
|------|--------|-------|
| `README.md` | **KEEP** | Add pointer to `docs/README.md` |
| `AGENT_ONBOARDING.md` | **KEEP** | Link to `ARCHITECTURE_OVERVIEW.md` |
| `VIBE_PROJECT_CONTEXT_PROMPT.md` | **REWRITE** | Unify schema truth wording; refresh status file list |
| `database_schema_audit.md` | **REWRITE** | Add May–Jun migrations; CLI-first apply |
| `MVP_STATUS.md` | **KEEP** | Thin pointer pattern is correct |
| `PRODUCT_STATUS_REPORT.md` | **REWRITE** | Bring to Jun 2026 product reality |
| `PAST_PROGRESS_HISTORY.md` | **REWRITE** | Absorb milestone bullets from roadmap |
| `BRAND_STATUS.md` | **REWRITE** | Fix typography (Poppins not Space Grotesk) |
| `PERFORMANCE_REPORT.md` | **MERGE** | Into `docs/performance/` when populated |
| `REFACTOR_PLAN.md` | **KEEP** | Engineering backlog |

---

## Layer 1 laws

| Path | Action | Notes |
|------|--------|-------|
| `ARCHITECTURE_CONSTITUTION.md` | **KEEP** | Short laws; still accurate |
| `ARCHITECTURE_SOURCE_OF_TRUTH.md` | **KEEP** | Extend with May routes when touched |
| `BRAND_CONSTITUTION.md` | **KEEP** | Align typography line |
| `BRAND_SYSTEM.md` | **REWRITE** | Reconcile radius: glass vs zero-radius |
| `EVENTS_SOURCE_OF_TRUTH.md` | **REWRITE** | Add `event_kind`, staff pick, listing reports |
| `COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md` | **REWRITE** | Posts MVP shipped |
| `VIBE_APP_SPECIFICATION.md` | **REWRITE** or **SPLIT** | Largest staleness risk; keep path, refresh or index |
| `CODING_STANDARDS.md` | **REWRITE** | Remove contradicted UI rules |
| `DOCUMENTATION_INDEX.md` | **KEEP** | Now points to `docs/README.md` first; keep as full catalog |

---

## Layer 2 contracts

| Path | Action | Notes |
|------|--------|-------|
| `contracts/INDEX.md` | **KEEP** | Fixed Jun 8 |
| `contracts/events.md` | **KEEP** | MVP not STUB; local rail removal documented |
| `contracts/rsvps.md` | **KEEP** | RPC name updated to `fulfill_stripe_ticket_order` |
| `contracts/checkins.md` | **KEEP** | MVP scanner/manual flow documented |
| `contracts/community_posts.md` | **KEEP** | MVP |
| `contracts/auth.md` | **KEEP** | Rewritten Jun 8 from `proxy.ts` + helpers |
| `contracts/auth_errors.md` | **KEEP** | |
| `contracts/member_profiles.md` | **KEEP** | Rewritten Jun 8 with `platform_role` + trigger |
| `contracts/media_assets.md` | **KEEP** | Rewritten Jun 8 with storage buckets |
| `contracts/notifications.md` | **KEEP** | Rewritten Jun 8 with in-app MVP |
| `contracts/sponsors.md` | **KEEP** | |
| `contracts/venues.md` | **KEEP** | ROADMAP |

---

## Layer 3 journeys

| Path | Action | Notes |
|------|--------|-------|
| `journeys/INDEX.md` | **KEEP** | Fixed Jun 8 |
| `journeys/member_rsvps_to_event.md` | **KEEP** | Paid + free paths documented |
| `journeys/member_checks_in.md` | **KEEP** | MVP scanner/manual flow documented |
| `journeys/admin_publishes_post.md` | **KEEP** | |
| `journeys/public_discovery_to_member.md` | **KEEP** | Refreshed Jun 8 |
| `journeys/guest_discovers_event.md` | **KEEP** | Current `/events` rail behavior documented |
| `journeys/host_creates_event.md` | **KEEP** | Host/apply/invite/event flow documented |
| `journeys/admin_reviews_submission.md` | **KEEP** | Admin review/trust flow documented |
| `journeys/member_joins_community.md` | **KEEP** | Signup + invite claim documented |
| `journeys/sponsor_partnership_flow.md` | **KEEP** | ROADMAP |

---

## Status & roadmaps

| Path | Action | Notes |
|------|--------|-------|
| `MVP_STATUS_ROADMAP.md` | **KEEP** | Phase/check-in contradiction fixed Jun 8; still a deep historical status doc |
| `plans/VIZB_PRODUCT_ROADMAP.md` | **KEEP** | Product intent |
| `ROADMAP_RUNNER.md` | **ARCHIVE** | All items DONE — history |
| `development/PUSH_FORWARD_ROADMAP.md` | **ARCHIVE** | Superseded |
| `AGENT_PROGRESS.md` | **ARCHIVE** | Ephemeral session log |
| `PROJECT_PLAN_PHASE1.md` | **ARCHIVE** | Historical |
| `work-orders/*.md` (8 files) | **ARCHIVE** | Shipped May/Jun 2026 → `docs/archive/work-orders-2026-05/` |
| `VIZB_CODE_HYGIENE_AND_DOCUMENTATION_MASTER_PLAN.md` | **ARCHIVE** | April pass complete |

---

## Guides, ops, development

| Path | Action | Notes |
|------|--------|-------|
| `DEVELOPER_ONBOARDING.md` | **KEEP** | Superseded banner added; keep path for immutable links |
| `guides/LOCAL_DEV_AND_AUTH.md` | **KEEP** | Hosted-first + CLI caveat fixed Jun 8 |
| `guides/SUPABASE_AUTH_EMAIL_RESEND.md` | **MERGE** | With `RESEND_SUPABASE_AUTH_VERIFICATION.md` |
| `database/MIGRATIONS.md` | **KEEP** | Primary apply doc |
| `operations/SUPABASE_PRODUCTION_MIGRATIONS.md` | **KEEP** | Linked from `OPERATIONS.md` |
| `operations/WALLET_PASSES_SETUP.md` | **KEEP** | |
| `troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` | **KEEP** | Ops gold |
| `development/ENGINEERING_COMMANDS.md` | **KEEP** | Immutable |
| `development/BRANCHING.md` | **KEEP** | |
| `development/RELEASING.md` | **KEEP** | Linked from `OPERATIONS.md` |
| `release/SMOKE_TEST.md` | **KEEP** | |
| `tests/README.md` | **KEEP** | Documents Vitest + Playwright CI |

---

## Diagrams

| Path | Action | Notes |
|------|--------|-------|
| `diagrams/airport-model.md` | **KEEP** | Immutable path |
| `diagrams/signup-bootstrap-flow.md` | **REWRITE** | `proxy.ts` not `middleware.ts` |
| `diagrams/role-surfaces.md` | **REWRITE** | `platform_role`, paid checkout |
| `diagrams/infrastructure-flow.md` | **REWRITE** | |
| `diagrams/core-transaction-sequence.md` | **REWRITE** | Stripe + check-in branches |
| `diagrams/system-map-full.md` | **REWRITE** | Verify routes |

---

## Archive candidates (batch, not executed yet)

Move to `docs/archive/` with one-line pointer in index:

- `plans/POSTS_MVP.md` (shipped)
- `plans/ADMIN_DASHBOARD_UI_POLISH.md`
- `plans/PROD_WALKTHROUGH_P0_P1.md`
- All `work-orders/*.md`
- `ROADMAP_RUNNER.md`, `PUSH_FORWARD_ROADMAP.md`, `AGENT_PROGRESS.md`, `PROJECT_PLAN_PHASE1.md`

---

## Delete only if safe

| Path | Action | Rationale |
|------|--------|-----------|
| `.cursor/commands/sumarize.md` | **DELETE** | Typo duplicate of `summarize.md` |
| `.cursor/plans/*talent_dashboard*.plan.md` | **DELETE** | Wrong project (TOTL) |

---

## Recommended final `docs/` tree

```
docs/
  README.md                    # front door
  SYSTEM_DESIGN.md
  ARCHITECTURE_OVERVIEW.md
  DEVELOPER_GUIDE.md
  REPO_MAP.md
  OPERATIONS.md
  DECISIONS.md
  DOCS_AUDIT_2026.md
  MIGRATION_MAP.md
  DOCUMENTATION_INDEX.md       # legacy full index
  ARCHITECTURE_CONSTITUTION.md
  ARCHITECTURE_SOURCE_OF_TRUTH.md
  EVENTS_SOURCE_OF_TRUTH.md
  COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md
  BRAND_CONSTITUTION.md
  BRAND_SYSTEM.md
  VIBE_APP_SPECIFICATION.md    # refresh or split later
  contracts/
  journeys/
  diagrams/
  database/
  development/
  guides/
  operations/
  troubleshooting/
  archive/                     # populated in next pass
  plans/                       # active plans only
```
