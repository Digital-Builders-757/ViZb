# Engineering commands — ViBE Operating Doctrine (Cursor)

**Last updated:** April 6, 2026

**Cursor commands:** `.cursor/commands/*.md`  
**Rules:** `.cursor/rules/*.mdc`  
**Git:** Commit all of `.cursor/` except **`.cursor/mcp.json`** (secrets). Root `.gitignore` lists only `mcp.json`.

**Shared non-negotiables:** `docs/ARCHITECTURE_CONSTITUTION.md`, `docs/BRAND_CONSTITUTION.md` for visible work, `.cursor/rules/no-client-db-writes.mdc`.

---

## Verification (npm)

| Purpose | Command |
|---------|---------|
| Types | `npm run typecheck` |
| Unit tests | `npm run test` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| CI subset (no lint) | `npm run ci` |

**`/verify`** and **`/ship`:** `npm run typecheck` → `npm run test` → `npm run lint` → `npm run build` (stop on first failure). Same sequence as **`npm run ci`**.

**Playwright:** not configured; see **`/playwright-smoke`**.

---

## Git merge policy (release boundary)

- **Default branch for new work:** open PRs **into `develop`**, not **`main`**, unless it is a documented hotfix workflow.
- **Integrate with merge commits:** `gh pr merge --merge` (or GitHub UI **Create a merge commit**). Do **not** squash-merge **into `main`** — see `docs/development/BRANCHING.md` (“Merge commits vs squash”).
- **Release:** PR **`develop` → `main`** using **merge commit** only.

---

## Command roles

| Command | Role |
|---------|------|
| **`/plan`** | Design only; reads constitution, **immutable paths**, diagrams, SQL. |
| **`/implement`** | Approved plan only; minimal diff. |
| **`/verify`** | Pre-ship checks. |
| **`/continue`** | Next increment; may hand off to `/ship` / `/pr` (see `continue-auto-ship.mdc`). |
| **`/ship`** | Run checks, commit, push **current branch** (prefer **`feat/*` / `fix/*` off `develop`**); open PR → **`develop`**. See `docs/development/BRANCHING.md`. |
| **`/pr`** | Feature branch → **`develop`**, or release **`develop` → `main`** (merge commit default). |
| **`/triage`** | Rank issues; airport zones. |
| **`/debug`** | Evidence-first RCA. |
| **`/redzone`** | Middleware, auth, RLS, webhooks. |
| **`/schema`** | New SQL only; audit + spec updates. |
| **`/docs-sync`** | Doc update checklist. |
| **`/playwright-smoke`** | E2E when exists. |
| **`/release`** | `docs/releasenotes/` artifact. |
| **`/retro`** | Lessons → docs. |
| **`/summarize`** | Agent handoff prompt. |
| **`/brand-check`** | UI/copy vs `BRAND_CONSTITUTION` + `docs/brand/*`. |
| **`/event-flow`** | Change vs `EVENTS_SOURCE_OF_TRUTH` + event contracts + journeys. |
| **`/content-sync`** | Landing / app / email / social alignment + `PRODUCT_STATUS_REPORT`. |

---

## Immutable paths (“altar stones”)

Do not rename without updating **every** command and onboarding reference:

- `README.md`
- `AGENT_ONBOARDING.md`
- `VIBE_PROJECT_CONTEXT_PROMPT.md`
- `database_schema_audit.md`
- `PRODUCT_STATUS_REPORT.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/ARCHITECTURE_SOURCE_OF_TRUTH.md`
- `docs/BRAND_CONSTITUTION.md`
- `docs/EVENTS_SOURCE_OF_TRUTH.md`
- `docs/COMMUNITY_OPERATIONS_SOURCE_OF_TRUTH.md`
- `docs/development/ENGINEERING_COMMANDS.md`
- `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`

**Strongly stable (product + status):**

- `docs/MVP_STATUS_ROADMAP.md`, `MVP_STATUS.md`, `BRAND_STATUS.md`, `PAST_PROGRESS_HISTORY.md`
- `docs/BRAND_SYSTEM.md`, `docs/diagrams/airport-model.md`, `docs/contracts/INDEX.md`, `docs/journeys/INDEX.md`
