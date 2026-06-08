# Agent onboarding — ViBE / ViZb

**Last updated:** June 8, 2026

Five-minute path for a new AI agent or developer.

## Read in order

1. **`docs/ARCHITECTURE_OVERVIEW.md`** — 5-minute system orientation (June 2026).
2. **`VIBE_PROJECT_CONTEXT_PROMPT.md`** — Full pre-change checklist (ViBE Operating Doctrine).
3. **`database_schema_audit.md`** — Where SQL lives and how audits work.
4. **`docs/README.md`** — Documentation front door; links to SYSTEM_DESIGN, DEVELOPER_GUIDE, OPERATIONS.
5. **`docs/DOCUMENTATION_INDEX.md`** — Legacy full spine: Layer 1–3, contracts, journeys, guides.
6. **`docs/development/LLM_GUARDRAILS.md`** — Preflight + clean-code guardrails + footguns.
7. **`docs/development/BRANCHING.md`** — PRs target **`develop`** (merge commit); release **`develop` → `main`** (merge commit only — **do not squash-merge into `main`**).
8. **`docs/ARCHITECTURE_CONSTITUTION.md`** — Non-negotiables (short).
9. **`docs/diagrams/airport-model.md`** — Zones for `/plan`, `/triage`, `/debug`.  
10. **`docs/diagrams/README.md`** — Which other diagram to open (auth, roles, infra, lifecycle).

## Feature entrypoints (common)

- **Public feed posts (MVP):**
  - Plan + SQL/RLS: `docs/plans/POSTS_MVP.md`
  - Contract: `docs/contracts/community_posts.md`
  - Journey: `docs/journeys/public_discovery_to_member.md`
  - Public routes:
    - `/` ("From ViZb" module)
    - `/p` (all posts)
    - `/p/[slug]` (post detail)
  - Admin routes (staff admin):
    - `/admin` (overview → Posts card)
    - `/admin/posts`
    - `/admin/posts/new`
    - `/admin/posts/[id]`

## Before pushing code

- Run **`npm run typecheck`**, **`npm run test`**, **`npm run lint`**, **`npm run build`** (or use **`/verify`**).
- Prefer a **feature branch** off **`develop`** and a **PR into `develop`** (merge commit); use **`/ship`** to push your **current branch**. Supabase schema: **`docs/operations/SUPABASE_PRODUCTION_MIGRATIONS.md`**.
- For architecture or docs work, start from **`docs/README.md`** and **`docs/SYSTEM_DESIGN.md`**; older specs/work-orders may be historical.

## Commands

Doctrine: **`docs/development/ENGINEERING_COMMANDS.md`**  
One-page map: **`docs/CURSOR_COMMANDS_REFERENCE.md`**
