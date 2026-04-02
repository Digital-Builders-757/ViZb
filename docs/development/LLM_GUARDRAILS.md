# LLM Guardrails — ViZb (clean code + low-drama shipping)

**Purpose:** Make it easy for any LLM (or new dev) to contribute without breaking architecture, style, or production.

## Non‑negotiables (do not violate)

1) **Schema is truth**
- If code and DB disagree, fix drift.
- New tables/columns ship with **RLS** and a numbered `scripts/*.sql` migration.

2) **Server components by default**
- Only add `"use client"` when required.
- Keep client boundaries small.

3) **No silent permission changes**
- Any change to who can read/update/delete must include:
  - updated SQL policy/migration (if needed)
  - docs update (contract/journey)
  - quick manual verification notes

4) **Prefer soft delete**
- Default to `archived`/`status` transitions over hard delete.
- Only add hard delete behind explicit admin-only “danger zone” UX.

5) **One UI system**
- Use existing primitives/tokens (GlassCard / NeonLink / design tokens).
- Avoid introducing new UI libraries.

---

## Preflight checklist (before committing)

Run these locally:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`

If migrations changed:
- ensure a new numbered `scripts/0xx_*.sql` exists
- ensure docs link the migration and expected rollout steps

---

## Git + PR hygiene

- Batch changes by intent:
  - 1 commit per cohesive feature/fix (2–3 commits max per PR)
- PR body should include:
  - **Summary**
  - **Setup/Migrations** (if any)
  - **Test plan**
  - **Manual verification** steps

---

## Common footguns (and how to avoid them)

### PowerShell quoting
- Always quote `git commit -m "..."` messages.
- Avoid bashisms like `head`.

### Searching in repo
- Prefer `git grep`.
- In Windows shells, regex/quotes can be painful—use `cmd /c` + `findstr` for quick scans.

### Browser Relay clicking
- If click-by-ref is flaky, navigate by URL for verification.

### Enum drift
- If app code uses a status value, the enum must contain it (`scripts/008_fix_enum_values.sql` pattern).

---

## Where to document changes

- **Layer 1 laws:** `docs/*SOURCE_OF_TRUTH*.md`
- **Contracts (Layer 2):** `docs/contracts/*.md`
- **Journeys (Layer 3):** `docs/journeys/*.md`
- **Quick errors:** `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`
