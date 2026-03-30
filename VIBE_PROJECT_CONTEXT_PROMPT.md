# ViBE — project context prompt (pre-change checklist)

**Last updated:** March 23, 2026

**ViBE Operating Doctrine:** default preamble for agents. Paste before non-trivial work. Repo codename **ViZb**.

---

## 1. Product

ViBE is an **events discovery and community ticketing** platform (Virginia/DMV creative culture): discovery, RSVP/tickets, organizer tools, admin review, brand-forward UX. Protect **event truth**, **member identity**, and **brand cohesion**.

---

## 2. Documentation spine (read what applies)

| Layer | Files |
|-------|--------|
| **1 — Laws** | `docs/ARCHITECTURE_CONSTITUTION.md`, `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`, `docs/BRAND_CONSTITUTION.md`, `docs/EVENTS_SOURCE_OF_TRUTH.md`, `docs/COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md`, `docs/CODING_STANDARDS.md`, `database_schema_audit.md` |
| **1 — Brand depth** | `docs/BRAND_SYSTEM.md`, `docs/brand/*` (voice, visual, content patterns) |
| **2 — Contracts** | `docs/contracts/INDEX.md` + per-domain `.md`; interim detail in `docs/VIBE_APP_SPECIFICATION.md` |
| **3 — Journeys** | `docs/journeys/INDEX.md` + per-journey `.md` |
| **Index** | `docs/DOCUMENTATION_INDEX.md` |
| **Diagrams** | `docs/diagrams/README.md`, `airport-model.md`, others by topic |
| **Status (root)** | `MVP_STATUS.md`, `PRODUCT_STATUS_REPORT.md`, `BRAND_STATUS.md`, `PAST_PROGRESS_HISTORY.md`; detail in `docs/MVP_STATUS_ROADMAP.md` |
| **Errors** | `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md` |

---

## 3. Schema and migrations

- Ground truth: **`scripts/*.sql`**. Never rewrite applied migrations; add new scripts (or `supabase migration new` when standard).
- **`database_schema_audit.md`** + **`docs/VIBE_APP_SPECIFICATION.md`** §5–6.

---

## 4. Code boundaries

- Supabase: `lib/supabase/client.ts` / `server.ts`. **No DB writes in Client Components** — Server Actions only.
- No `select('*')`. Middleware = session gate. **`app/auth/callback/route.ts`** — no open redirects.
- Profiles via DB trigger (`scripts/004_create_profiles.sql`).

---

## 5. Cursor workflow

`/plan`, `/implement`, `/verify`, `/continue`, `/ship`, `/pr`, `/triage`, `/debug`, `/redzone`, `/schema`, `/docs-sync`, `/release`, `/retro`, `/summarize`

**ViBE-specific:** `/brand-check`, `/event-flow`, `/content-sync` — see `docs/development/ENGINEERING_COMMANDS.md`.

---

## 6. Verification

`npm run typecheck`, `npm run test`, `npm run lint`, `npm run build`.

---

## 7. If uncertain

Ask for errors, routes, RLS/auth/middleware touch, and environment (local/staging/prod).
