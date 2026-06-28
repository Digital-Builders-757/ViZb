# ViZb documentation

**Last updated:** June 28, 2026

Start here. This repo documents **ViZb** (VIZB in the UI), an events discovery and ticketing platform for the Virginia/DMV creative community built as a **Next.js 16 + Supabase** monolith on Vercel.

**Current status:** MVP+ shipped. Paid Stripe ticketing, organizer payouts, wallet-pass scaffolding, door QR check-in, admin posts, local event imports, My Vibes reminders, and dashboard planner polish are live in code. Deep status lives in [MVP_STATUS_ROADMAP.md](./MVP_STATUS_ROADMAP.md), current follow-ups live in [plans/NEXT_ROADMAP.md](./plans/NEXT_ROADMAP.md), and the June 28 drift cleanup is recorded in [DOCUMENTATION_CONSOLIDATION_2026_06_28.md](./DOCUMENTATION_CONSOLIDATION_2026_06_28.md).

---

## Who Should Read What

| Reader | Start with | Then |
| --- | --- | --- |
| New engineer | [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) |
| AI agent | [../AGENT_ONBOARDING.md](../AGENT_ONBOARDING.md) | [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) |
| Architect / lead | [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | [DECISIONS.md](./DECISIONS.md) |
| Operator / release | [OPERATIONS.md](./OPERATIONS.md) | [troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md](./troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md) |
| Feature work | Domain contract in [contracts/](./contracts/) | Layer 1 law for that domain |

---

## Core Docs

| Doc | Purpose |
| --- | --- |
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Full system design: domains, data flows, auth, integrations, risks |
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | Short orientation for developers and agents |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Local setup, commands, env, testing, safe contribution |
| [REPO_MAP.md](./REPO_MAP.md) | Where logic lives in the repository |
| [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md) | Module ownership and no-drift boundaries |
| [OPERATIONS.md](./OPERATIONS.md) | Deploy, migrations, integrations, failure points |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions (ADR-style) |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | What to keep, merge, rewrite, or archive from old docs |
| [DOCUMENTATION_CONSOLIDATION_2026_06_28.md](./DOCUMENTATION_CONSOLIDATION_2026_06_28.md) | Current vs historical docs map after the June 28 drift pass |
| [DOCS_AUDIT_2026.md](./DOCS_AUDIT_2026.md) | Documentation audit summary |

If older docs disagree with these core docs, trust code + migrations first, then the core docs, then contracts/journeys. Treat old plans and work orders as historical unless linked from this front door.

---

## Layered Reference

The repo keeps a three-layer model. Use it for domain-specific depth after the core docs above.

### Layer 1 - Laws

- [ARCHITECTURE_CONSTITUTION.md](./ARCHITECTURE_CONSTITUTION.md) - security, clients, RLS, mutations
- [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md) - module ownership map
- [EVENTS_SOURCE_OF_TRUTH.md](./EVENTS_SOURCE_OF_TRUTH.md) - event lifecycle
- [COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md](./COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md) - orgs, invites, posts
- [BRAND_CONSTITUTION.md](./BRAND_CONSTITUTION.md) + [BRAND_SYSTEM.md](./BRAND_SYSTEM.md)

### Layer 2 - Contracts

- [contracts/INDEX.md](./contracts/INDEX.md) - per-domain invariants

### Layer 3 - Journeys

- [journeys/INDEX.md](./journeys/INDEX.md) - acceptance flows by persona

---

## Other Entry Points

| Path | Purpose |
| --- | --- |
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | Full catalog of docs and layers |
| [guides/LOCAL_DEV_AND_AUTH.md](./guides/LOCAL_DEV_AND_AUTH.md) | Supabase redirect URLs for localhost |
| [database/MIGRATIONS.md](./database/MIGRATIONS.md) | SQL apply order |
| [development/ENGINEERING_COMMANDS.md](./development/ENGINEERING_COMMANDS.md) | Cursor command doctrine |
| [development/BRANCHING.md](./development/BRANCHING.md) | `develop` to `main` workflow |
| [imports/LOCAL_EVENT_INGESTION.md](./imports/LOCAL_EVENT_INGESTION.md) | Multi-source event ingestion architecture |
| [vizb-payments-pricing-and-payouts.md](./vizb-payments-pricing-and-payouts.md) | Internal payment, pricing, and payout record |

---

## Schema Truth Rule

When docs disagree with the database:

1. Applied SQL wins: `supabase/migrations/*.sql` on the linked project, plus historical `scripts/*.sql` bootstrap.
2. Fix docs and types; do not change applied migrations in place.
3. See [OPERATIONS.md](./OPERATIONS.md) for the bootstrap vs CLI delta story.

---

## Cross-Repo Boundary

ViZb is the Next.js/Supabase events app. The sibling `mosaic-backend` repo is a separate Express/MongoDB service for Mosaic Biz Hub. Do not copy backend route contracts into this repo unless a real integration is added.

---

## Reusable Pattern

This `docs/` layout is designed to port to sibling projects:

```text
docs/
  README.md
  SYSTEM_DESIGN.md
  ARCHITECTURE_OVERVIEW.md
  DEVELOPER_GUIDE.md
  REPO_MAP.md
  OPERATIONS.md
  DECISIONS.md
  contracts/
  journeys/
```

Keep product-specific laws in Layer 1; keep cross-repo patterns in the core files.
