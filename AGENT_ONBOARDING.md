# Agent onboarding — ViBE / ViZb

**Last updated:** April 1, 2026

Five-minute path for a new AI agent or developer.

## Read in order

1. **`VIBE_PROJECT_CONTEXT_PROMPT.md`** — Full pre-change checklist (ViBE Operating Doctrine).
2. **`database_schema_audit.md`** — Where SQL lives and how audits work.
3. **`docs/DOCUMENTATION_INDEX.md`** — Spine: Layer 1–3, contracts, journeys, guides.
4. **`docs/ARCHITECTURE_CONSTITUTION.md`** — Non-negotiables (short).
5. **`docs/diagrams/airport-model.md`** — Zones for `/plan`, `/triage`, `/debug`.  
6. **`docs/diagrams/README.md`** — Which other diagram to open (auth, roles, infra, lifecycle).

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
- Use **`/ship`** for commit + push + doc hygiene when the batch is ready.

## Commands

Doctrine: **`docs/development/ENGINEERING_COMMANDS.md`**  
One-page map: **`docs/CURSOR_COMMANDS_REFERENCE.md`**
