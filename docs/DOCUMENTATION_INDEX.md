# ViBE Events Platform -- Documentation Spine (3-Layer Source of Truth)

**Last Updated:** February 5, 2026

This document defines the **single, strict documentation spine** for the ViBE events platform. Everything else is **reference** or **archive**.

---

## Project Organization

### Root Directory (Critical Files Only)

These files remain in the project root for quick access:

| File | Purpose |
|------|---------|
| `README.md` | Project overview and setup instructions |
| `PERFORMANCE_REPORT.md` | Performance audit, bottlenecks, and optimization results |
| `REFACTOR_PLAN.md` | Prioritized refactor tasks with risk/impact analysis |

### docs/ Directory (All Documentation)

All project documentation lives in `docs/` with the following structure:

| Directory / File | Purpose |
|------------------|---------|
| `docs/DOCUMENTATION_INDEX.md` | **This file** -- the documentation spine |
| `docs/VIBE_APP_SPECIFICATION.md` | Complete MVP technical specification (schema, auth, payments, routes) |
| `docs/BRAND_SYSTEM.md` | Canonical visual identity -- colors, type, patterns, dashboard rules |
| `docs/CODING_STANDARDS.md` | Coding standards, style guide, and conventions |
| `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` | Canonical module ownership, wiring laws, non-negotiables |
| `docs/DEVELOPER_ONBOARDING.md` | New developer / AI agent quick-start guide |
| `docs/PROJECT_PLAN_PHASE1.md` | Phase 1 implementation plan: Auth + Dashboard (file-by-file) |
| `docs/MVP_STATUS_ROADMAP.md` | Full MVP status assessment, feature matrix, and Phases 2-6 roadmap |
| `docs/contracts/` | Domain contracts (Layer 2 source of truth) |
| `docs/journeys/` | User journeys and acceptance tests (Layer 3 source of truth) |
| `docs/guides/` | Setup instructions, environment guides, integration howtos |
| `docs/troubleshooting/` | Error fixes, debugging guides, common issues |
| `docs/archive/` | Historical / superseded documentation |

---

## Source of Truth Spine (3 Layers)

### Layer 1 -- Global Laws + Wiring + Security (Canonical)

These are **non-negotiable**. If code disagrees with Layer 1, the code is wrong.

| Document | Governs |
|----------|---------|
| `ARCHITECTURE_SOURCE_OF_TRUTH.md` | Canonical modules, file ownership, "no duplicate brains" laws |
| `BRAND_SYSTEM.md` | Visual identity, color system, typography, component patterns, brand anti-patterns |
| `VIBE_APP_SPECIFICATION.md` (Sections 5-6) | Database schema, enums, RLS policies |
| `CODING_STANDARDS.md` | Code style, naming, patterns, and anti-patterns |

**Key laws:**

1. **Schema is truth.** If docs disagree with `scripts/*.sql` migration files, the migrations win. Update docs immediately.
2. **Brand is truth.** If a dashboard screen could belong to any generic SaaS product, it fails. Every screen must follow `BRAND_SYSTEM.md`.
3. **One brain per domain.** Every server action, helper, and RLS policy has exactly one canonical location. No duplicates.
4. **RLS before shipping.** Every new table must have RLS enabled and policies defined in the spec before migration runs.
5. **Types from schema.** TypeScript types are derived from the database schema. Never hand-write types that duplicate schema columns.

### Layer 2 -- Domain Contracts (Canonical)

Domain contracts define **what each system does**, **which files own it**, and **what the failure modes are**.

| Contract | Domain |
|----------|--------|
| `contracts/AUTH_CONTRACT.md` | Authentication, session management, profile creation trigger |
| `contracts/EVENTS_CONTRACT.md` | Event CRUD, status lifecycle, media management |
| `contracts/TICKETS_CONTRACT.md` | Ticket types, orders, RSVP, purchase flow, check-in |
| `contracts/ORGANIZATIONS_CONTRACT.md` | Org creation, membership, approval queue |
| `contracts/PAYMENTS_CONTRACT.md` | Stripe Checkout, webhooks, order fulfillment |
| `contracts/ADMIN_CONTRACT.md` | Admin routes, approval queues, user moderation, metrics |

### Layer 3 -- Journeys (Canonical Acceptance Tests)

Journeys define **what the user experiences**. They are the acceptance tests.

| Journey | Scenario |
|---------|----------|
| `journeys/ATTENDEE_BROWSE_RSVP.md` | Browse events, view details, RSVP for free event |
| `journeys/ATTENDEE_PURCHASE_TICKET.md` | Select paid ticket, Stripe Checkout, receive ticket |
| `journeys/ATTENDEE_SHOW_TICKET.md` | Open ticket wallet, present ticket at door |
| `journeys/ORGANIZER_CREATE_EVENT.md` | Create org, create event, add ticket types, submit for review |
| `journeys/ORGANIZER_DOOR_CHECKIN.md` | Open door screen, view attendee list, check in tickets |
| `journeys/ADMIN_APPROVE_EVENT.md` | Review pending events, approve/reject, publish to feed |
| `journeys/ADMIN_APPROVE_ORG.md` | Review pending organizations, approve/reject |

---

## Reference Docs (Useful, Non-Authoritative)

### Performance & Optimization

| Document | Purpose |
|----------|---------|
| `PERFORMANCE_REPORT.md` (root) | Baseline metrics, bottleneck analysis, optimization results |
| `REFACTOR_PLAN.md` (root) | Prioritized refactor tasks with implementation status |

### Database & Backend

| Document | Purpose |
|----------|---------|
| `VIBE_APP_SPECIFICATION.md` (Section 5) | Full schema definitions with SQL |
| `VIBE_APP_SPECIFICATION.md` (Section 6) | All RLS policies |
| `VIBE_APP_SPECIFICATION.md` (Section 11) | Migration plan and script inventory |

### Payments

| Document | Purpose |
|----------|---------|
| `VIBE_APP_SPECIFICATION.md` (Section 8) | Stripe Checkout architecture, webhook flow, Connect roadmap |

### Authentication

| Document | Purpose |
|----------|---------|
| `VIBE_APP_SPECIFICATION.md` (Section 7) | Auth methods, profile trigger, middleware, role helpers |

---

## Quick Start Guides

### For New Developers / AI Agents

1. Read `docs/DEVELOPER_ONBOARDING.md` first
2. Read `docs/CODING_STANDARDS.md` to understand conventions
3. Read `docs/VIBE_APP_SPECIFICATION.md` for full technical spec
4. Check `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` before adding new modules

### For Building Features

1. Check the relevant Layer 2 contract in `docs/contracts/`
2. Verify schema in `VIBE_APP_SPECIFICATION.md` Section 5
3. Follow patterns in `CODING_STANDARDS.md`
4. Update the relevant journey in `docs/journeys/` after shipping

### When Troubleshooting

1. Check `docs/troubleshooting/` for known issues
2. Review `PERFORMANCE_REPORT.md` for performance-related concerns
3. Check RLS policies in `VIBE_APP_SPECIFICATION.md` Section 6 for permission errors

---

## How to Update Docs Without Drift (MANDATORY)

### Update Order (Never Skip)

1. **Prove schema + types first**
   - `scripts/*.sql` migration files are ground truth
   - If docs disagree with migrations, docs are wrong until updated

2. **Update the relevant Layer 2 contract** (`docs/contracts/*.md`)
   - Routes involved (exact paths)
   - Canonical server actions (file paths + function names)
   - Tables/views/functions touched (explicit columns)
   - RLS expectations
   - Failure modes + symptoms

3. **Update the relevant Layer 3 journey** (`docs/journeys/*.md`) if user-facing behavior changed

4. **Update Layer 1** only when wiring/laws change (new canonical helpers, routing changes, new "winners")

### Evidence Rule

- If you cannot prove a claim by pointing to a file, migration, or policy, mark it **UNVERIFIED**
- Never assume a table or column exists -- verify against migration scripts
- When in doubt, run a query against the live schema using Supabase tools

### Naming Conventions

- **ALL_CAPS_WITH_UNDERSCORES.md** -- Major guides and authoritative documents
- **lowercase-with-hyphens.md** -- Smaller reference documents
- Contracts: `{DOMAIN}_CONTRACT.md`
- Journeys: `{ROLE}_{ACTION}.md`
