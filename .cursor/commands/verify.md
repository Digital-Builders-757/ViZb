/verify

Intent: Go/no-go before `/ship`. Run project checks and report pass/fail.

MODE: EXECUTION

────────────────────────────────────────────
MANDATORY CHECKS (STOP ON FIRST FAILURE)
────────────────────────────────────────────
Run and report full output on failure:

1. `npm run typecheck`
2. `npm run test`
3. `npm run lint` (`eslint .` — Next 16 removed `next lint` CLI)
4. `npm run build`

Or run **`npm run ci`** once (same four steps).

────────────────────────────────────────────
OPTIONAL (WHEN RELEVANT)
────────────────────────────────────────────
- When Playwright E2E exists, use `/playwright-smoke` for route regression.
- After schema changes, follow `/schema` verification and update `database_schema_audit.md` + spec.

────────────────────────────────────────────
OUTPUT FORMAT
────────────────────────────────────────────
Return:
- **Go / No-Go**
- Which step failed (if any)
- Smallest next fix

If the environment blocks a check (missing env, Supabase unreachable), classify as **BLOCKED** with symptom; still report which gates ran.
