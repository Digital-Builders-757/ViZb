# ViBE — Documentation spine (**ViBE Operating Doctrine**)

**Last Updated:** April 10, 2026

Single entry point for the **events + community + brand** platform (repo **ViZb**). Everything else is reference or archive.

---

## Root directory (“always-on”)

| File | Purpose |
|------|---------|
| `README.md` | Overview, install, branching, doc pointers |
| `AGENT_ONBOARDING.md` | Short agent / AI path |
| `VIBE_PROJECT_CONTEXT_PROMPT.md` | Full pre-change checklist (paste as default context) |
| `database_schema_audit.md` | Schema audit + script pointers |
| `MVP_STATUS.md` | MVP at a glance → links **`docs/MVP_STATUS_ROADMAP.md`** |
| `PRODUCT_STATUS_REPORT.md` | Executive product snapshot |
| `PAST_PROGRESS_HISTORY.md` | Shipped milestones log |
| `BRAND_STATUS.md` | Brand health / initiatives |
| `PERFORMANCE_REPORT.md` | Performance notes |
| `REFACTOR_PLAN.md` | Refactor backlog |

---

## `docs/` layout (by function)

| Path | Purpose |
|------|---------|
| `DOCUMENTATION_INDEX.md` | **This file** |
| `ARCHITECTURE_CONSTITUTION.md` | Layer 1 — engineering non-negotiables |
| `ARCHITECTURE_SOURCE_OF_TRUTH.md` | Layer 1 — module map |
| `BRAND_CONSTITUTION.md` | Layer 1 — brand laws (summary; detail in `BRAND_SYSTEM`) |
| `EVENTS_SOURCE_OF_TRUTH.md` | Layer 1 — event lifecycle & truth boundaries |
| `COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md` | Layer 1 — members, orgs, invites, host flows |
| `VIBE_APP_SPECIFICATION.md` | MVP spec — schema, RLS, auth, payments, routes |
| `BRAND_SYSTEM.md` | Canonical visual + voice tokens |
| `CODING_STANDARDS.md` | Code style |
| `MVP_STATUS_ROADMAP.md` | Deep MVP status, migrations, phases |
| `PROJECT_PLAN_PHASE1.md` | Phase 1 file plan |
| `DEVELOPER_ONBOARDING.md` | Human developer start |
| `DOCS_OVERHAUL_PLAN_2026.md` | Hygiene, immutable paths, archive rules |
| `CURSOR_COMMANDS_REFERENCE.md` | Command → required reads |
| `development/ENGINEERING_COMMANDS.md` | **Canonical Cursor command doctrine** |
| `development/LLM_GUARDRAILS.md` | **How to contribute cleanly (LLMs + humans)** — preflight + footguns |
| `development/PUSH_FORWARD_ROADMAP.md` | Priorities after env/Supabase hardening — what to do next |
| `development/BRANCHING.md` | `develop` / `main` |
| `brand/` | Voice, content, social, event creative patterns |
| `diagrams/` | Conceptual architecture maps |
| `contracts/` | Layer 2 — `INDEX.md` + per-domain `.md` |
| `journeys/` | Layer 3 — `INDEX.md` + per-journey `.md` |
| `guides/` | Setup how-tos — start with `guides/LOCAL_DEV_AND_AUTH.md` for dev + auth; auth email via Resend: `guides/SUPABASE_AUTH_EMAIL_RESEND.md` |
| `audits/`, `community/`, `content/`, `events/`, `features/`, `marketing/`, `operations/`, `performance/`, `security/`, `tests/` | Topic READMEs — add docs as you build |
| `operations/WALLET_PASSES_SETUP.md` | Apple + Google Wallet issuer/env checklist for ticket passes (`.pkpass`, save JWT) |
| `troubleshooting/` | Errors (`COMMON_ERRORS_QUICK_REFERENCE.md`) |
| `releasenotes/` | `/release` archive |
| `plans/`, `archive/` | Plans + superseded docs |

---

## New: Posts MVP (public feed)

- Plan/SQL/RLS: `docs/plans/POSTS_MVP.md`
- Contract: `docs/contracts/community_posts.md`
- Public routes:
  - `/` ("From ViZb" module)
  - `/p` (all posts)
  - `/p/[slug]` (post detail)
- Admin routes (staff admin):
  - `/admin` (overview → Posts card; **All Users** table with optional **Delete user** when `SUPABASE_SERVICE_ROLE_KEY` is set server-side; apply migration `supabase/migrations/20260410200000_auth_user_delete_foreign_keys.sql` so deletes are not blocked by FKs)
  - `/admin/posts` (list + filters)
  - `/admin/posts/new` (create)
  - `/admin/posts/[id]` (edit)
- Journeys:
  - `docs/journeys/public_discovery_to_member.md`
  - `docs/journeys/admin_publishes_post.md`


### `docs/diagrams/` (conceptual maps)

| File | Role |
|------|------|
| `README.md` | When to open which diagram |
| `airport-model.md` | Always-on zones (Manifest, Locks, …) |
| `signup-bootstrap-flow.md` | Auth / callback / routes |
| `role-surfaces.md` | Role dashboards |
| `infrastructure-flow.md` | RSC, actions, integrations |
| `core-transaction-sequence.md` | Attendee + organizer sequences |
| `system-map-full.md` | Rare inventory — verify in repo |

---

## Three-layer source of truth

### Layer 1 — Global laws

| Document | Governs |
|----------|---------|
| `docs/ARCHITECTURE_CONSTITUTION.md` | Middleware, clients, RLS, selects, mutations |
| `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md` | File ownership |
| `docs/BRAND_CONSTITUTION.md` | Brand laws (identity, dark-first, type, palette summary) |
| `docs/BRAND_SYSTEM.md` | Full visual + voice tokens |
| `docs/EVENTS_SOURCE_OF_TRUTH.md` | Event lifecycle, manifest, review, RSVP truth |
| `docs/COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md` | Members, orgs, invites, host apply |
| `docs/VIBE_APP_SPECIFICATION.md` (§5–6) | Schema + RLS detail |
| `docs/CODING_STANDARDS.md` | Code conventions |
| `database_schema_audit.md` | Schema audit cadence |

**Laws:**

1. **Schema is truth** — `scripts/*.sql` win over prose.  
2. **Brand is truth** — `BRAND_CONSTITUTION` + `BRAND_SYSTEM` + `docs/brand/*`.  
3. **Event truth** — discovery and attendance match DB + RLS (`EVENTS_SOURCE_OF_TRUTH`).  
4. **One brain per domain** — contracts + `ARCHITECTURE_SOURCE_OF_TRUTH`.  
5. **RLS before shipping** — new tables ship with policies.

### Layer 2 — Domain contracts

**`docs/contracts/INDEX.md`** — `auth.md`, `events.md`, `rsvps.md`, `checkins.md`, `member_profiles.md`, etc.  
Interim: **`docs/VIBE_APP_SPECIFICATION.md`**.

### Layer 3 — Journeys

**`docs/journeys/INDEX.md`** — guest, member, host, admin, sponsor flows.

---

## Cursor workflow

- **Doctrine:** `docs/development/ENGINEERING_COMMANDS.md`  
- **Quick map:** `docs/CURSOR_COMMANDS_REFERENCE.md`  
- **Commands:** `.cursor/commands/*.md`  
- **Rules:** `.cursor/rules/*.mdc`  
- **Git:** only **`.cursor/mcp.json`** is ignored (commit commands + rules).

**ViBE commands:** `/brand-check`, `/event-flow`, `/content-sync` plus standard `/plan`, `/implement`, `/verify`, `/continue`, `/ship`, `/pr`, …

---

## Quick starts

### New developer / agent

1. `AGENT_ONBOARDING.md` or `VIBE_PROJECT_CONTEXT_PROMPT.md`  
2. `docs/DEVELOPER_ONBOARDING.md`  
3. `docs/CODING_STANDARDS.md` + `docs/BRAND_CONSTITUTION.md`  
4. `docs/VIBE_APP_SPECIFICATION.md` as needed  

### Feature work

1. Relevant `docs/contracts/*.md` + Layer 1 domain doc (`EVENTS_*` or `COMMUNITY_*`)  
2. Schema: spec §5 + `scripts/*.sql`  
3. Update `docs/journeys/*` when UX ships  
4. UI/copy: `/brand-check`; cross-surface copy: `/content-sync`  

### Troubleshooting

1. `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`  
2. Spec §6 (RLS)  
3. `/debug`  

---

## Update order (reduce drift)

1. SQL / migration proof  
2. Spec §5–6 + `database_schema_audit.md`  
3. Layer 2 contract  
4. Layer 3 journey  
5. Layer 1 laws (`ARCHITECTURE_*`, `BRAND_CONSTITUTION`, `EVENTS_*`, `COMMUNITY_*`)  
6. `PRODUCT_STATUS_REPORT.md` / `MVP_STATUS.md` when product claims change  

**Evidence rule:** mark unverified claims **UNVERIFIED**.

---

## Naming

- **ALL_CAPS** root / major laws  
- **Contracts:** `docs/contracts/<domain>.md`  
- **Journeys:** `docs/journeys/<snake_case>.md`  
