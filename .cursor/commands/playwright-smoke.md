/playwright-smoke

Intent: Fast E2E regression once Playwright is configured.

MODE: EXECUTION

────────────────────────────────────────────
CURRENT REPO STATUS
────────────────────────────────────────────
**Playwright is not configured** in this repository yet. Before E2E exists:

1. Run **`npm run test`** (Vitest).
2. Run **`/verify`** for typecheck + lint + build.
3. Manually smoke critical routes (login, signup, dashboard) if auth changed.

State clearly when reporting: **E2E: NOT CONFIGURED — Vitest + manual only.**

────────────────────────────────────────────
WHEN PLAYWRIGHT EXISTS (TARGET LAYOUT)
────────────────────────────────────────────
Add specs under `tests/e2e/` or `tests/auth/` and run, for example:

```text
npx playwright test --project=chromium --reporter=list --workers=1
```

Include auth gate, signup/callback, and dashboard access specs. Expand this command file with exact paths once files land.

────────────────────────────────────────────
REPORTING
────────────────────────────────────────────
Pass/fail per suite, flakiness, top suspected causes if red, or **BLOCKED BY APP RUNTIME** with error text.
