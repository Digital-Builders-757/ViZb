/redzone

Intent: Strict protocol for middleware, auth callback, profile bootstrap, webhooks, RLS.

MODE: DESIGN → IMPLEMENT (only after approval)

────────────────────────────────────────────
STEP 0 — DECLARATION
────────────────────────────────────────────
**RED ZONE INVOLVED: YES**  
Which: middleware, auth/callback, profile bootstrap, Stripe webhooks, RLS/triggers/policies — and why.

────────────────────────────────────────────
STEP 1 — MANDATORY READING
────────────────────────────────────────────
- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/diagrams/airport-model.md`
- `docs/DOCUMENTATION_INDEX.md`
- Auth/session: `docs/VIBE_APP_SPECIFICATION.md` (auth sections), `docs/contracts/INDEX.md`
- Schema/RLS: `database_schema_audit.md`, relevant `scripts/*.sql`
- Payments (if applicable): `docs/VIBE_APP_SPECIFICATION.md` payments sections

────────────────────────────────────────────
STEP 2 — SHOW CURRENT CODE
────────────────────────────────────────────
Snippets with paths; plain-English behavior summary.

────────────────────────────────────────────
STEP 3 — SMALLEST DIFF
────────────────────────────────────────────
Files, behavior change, why minimal. Address: redirects, bootstrap gaps, RLS, idempotency.

────────────────────────────────────────────
STEP 4 — REGRESSION CHECKLIST
────────────────────────────────────────────
Manual steps, Vitest, red-zone edge cases.

STOP and ask: “Approve this minimal plan? YES/NO.”

After YES: implement, re-run checklist, summarize files changed.
