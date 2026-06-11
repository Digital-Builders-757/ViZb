# ViZb documentation

**Last updated:** June 10, 2026

> **Current status:** MVP shipped — paid Stripe ticketing live (checkout, webhook, `/admin/diagnostics/stripe`, `/admin/revenue`), door QR check-in, admin posts, discovery polish. Deep status: [MVP_STATUS_ROADMAP.md](./MVP_STATUS_ROADMAP.md). Current follow-ups: [plans/NEXT_ROADMAP.md](./plans/NEXT_ROADMAP.md).

Start here. This repo documents **ViZb** (VIZB in UI) — an events discovery and ticketing platform for the Virginia/DMV creative community, built as a **Next.js 16 + Supabase** monolith on Vercel.

---

## Who should read what

| Reader | Start with | Then |
|--------|------------|------|
| New engineer | [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) |
| AI agent | [../AGENT_ONBOARDING.md](../AGENT_ONBOARDING.md) | [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) |
| Architect / lead | [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | [DECISIONS.md](./DECISIONS.md) |
| Operator / release | [OPERATIONS.md](./OPERATIONS.md) | [troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md](./troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md) |
| Feature work | Domain contract in [contracts/](./contracts/) | Layer 1 law for that domain |

---

## Core docs (June 2026 rewrite)

| Doc | Purpose |
|-----|---------|
| [SYSTEM_DESIGN.md](./SYSTEM_DESIGN.md) | Full system design: domains, data flows, auth, integrations, risks |
| [ARCHITECTURE_OVERVIEW.md](./ARCHITECTURE_OVERVIEW.md) | Short orientation for developers and agents |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Local setup, commands, env, testing, safe contribution |
| [REPO_MAP.md](./REPO_MAP.md) | Where logic lives in the repository |
| [OPERATIONS.md](./OPERATIONS.md) | Deploy, migrations, integrations, failure points |
| [DECISIONS.md](./DECISIONS.md) | Architectural decisions (ADR-style) |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | What to keep, merge, rewrite, or archive from old docs |
| [DOCS_AUDIT_2026.md](./DOCS_AUDIT_2026.md) | Documentation audit summary |

If older docs disagree with these core docs, trust code + migrations first, then the core docs, then contracts/journeys. Treat old plans and work-orders as historical unless linked from this front door.

---

## Layered reference (existing spine)

The repo keeps a **three-layer** model. Use it for domain-specific depth after the core docs above.

### Layer 1 — Laws (non-negotiables)

- [ARCHITECTURE_CONSTITUTION.md](./ARCHITECTURE_CONSTITUTION.md) — security, clients, RLS, mutations
- [ARCHITECTURE_SOURCE_OF_TRUTH.md](./ARCHITECTURE_SOURCE_OF_TRUTH.md) — module ownership map
- [EVENTS_SOURCE_OF_TRUTH.md](./EVENTS_SOURCE_OF_TRUTH.md) — event lifecycle
- [COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md](./COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md) — orgs, invites, posts
- [BRAND_CONSTITUTION.md](./BRAND_CONSTITUTION.md) + [BRAND_SYSTEM.md](./BRAND_SYSTEM.md)

### Layer 2 — Contracts

- [contracts/INDEX.md](./contracts/INDEX.md) — per-domain invariants

### Layer 3 — Journeys

- [journeys/INDEX.md](./journeys/INDEX.md) — acceptance flows by persona

---

## Other entry points

| Path | Purpose |
|------|---------|
| [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) | Legacy full index (being superseded by this file for navigation) |
| [guides/LOCAL_DEV_AND_AUTH.md](./guides/LOCAL_DEV_AND_AUTH.md) | Supabase redirect URLs for localhost |
| [database/MIGRATIONS.md](./database/MIGRATIONS.md) | SQL apply order |
| [development/ENGINEERING_COMMANDS.md](./development/ENGINEERING_COMMANDS.md) | Cursor command doctrine |
| [development/BRANCHING.md](./development/BRANCHING.md) | `develop` → `main` workflow |

---

## Schema truth rule

When docs disagree with the database:

1. **Applied SQL wins** — `supabase/migrations/*.sql` on the linked project, plus historical `scripts/*.sql` bootstrap.
2. Fix docs and types; do not change applied migrations in place.
3. See [OPERATIONS.md](./OPERATIONS.md) for bootstrap vs CLI delta story.

---

## Reusable pattern (other repos)

This `docs/` layout is designed to port to sibling projects:

```
docs/
  README.md              # front door
  SYSTEM_DESIGN.md       # deep architecture
  ARCHITECTURE_OVERVIEW.md
  DEVELOPER_GUIDE.md
  REPO_MAP.md
  OPERATIONS.md
  DECISIONS.md
  contracts/             # domain invariants
  journeys/              # acceptance flows
```

Keep product-specific laws in Layer 1; keep cross-repo patterns in the six core files.
