/continue

Intent: Resume the best current thread without re-explaining the goal.

MODE: EXECUTION

────────────────────────────────────────────
STEP 0 — MANDATORY CONTEXT
────────────────────────────────────────────
Read:

- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/diagrams/airport-model.md`
- `docs/MVP_STATUS_ROADMAP.md`

Also: `git status`, dirty files, recent verification if any.

────────────────────────────────────────────
STEP 1 — NEXT THREAD
────────────────────────────────────────────
Priority:

1. Same workstream as current dirty files  
2. Shared primitives / high leverage  
3. Roadmap-safe work if deploy validation is blocked  
4. Avoid new domains until the current thread is done  

If unrelated dirty files exist: do not touch unless asked.

────────────────────────────────────────────
STEP 2 — SMALLEST USEFUL INCREMENT
────────────────────────────────────────────
One meaningful step. Avoid scope creep and unrelated rewrites.

────────────────────────────────────────────
STEP 2.5 — AUTO-HANDOFF TO /ship
────────────────────────────────────────────
If the dirty set is one coherent batch and the honest next step is commit/push (checks pass, no higher-value local step left), transition to **`/ship`** in the same turn. See `.cursor/rules/continue-auto-ship.mdc`.

If unrelated dirty files exist, ship only the intended subset.

────────────────────────────────────────────
STEP 2.75 — AUTO-HANDOFF TO /pr
────────────────────────────────────────────
If work is already pushed and the next step is PR coordination (**feature → `develop`**, or **release `develop` → `main`**), run **`/pr`** in the same turn. Avoid duplicate PRs (see `pr.md` and `docs/development/BRANCHING.md`).

────────────────────────────────────────────
STEP 3 — VERIFY
────────────────────────────────────────────
At minimum `npm run lint` for small edits; add `typecheck` / `test` / `build` when shared or risky files change.

────────────────────────────────────────────
OUTPUT FORMAT
────────────────────────────────────────────
Unless you handed off to `/ship` or `/pr`, return: thread continued, why, files changed, checks, next step.
