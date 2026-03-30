/triage

Intent: Turn chaos into a ranked hit list.

MODE: ANALYSIS ONLY  
DO NOT write, modify, or suggest code.

────────────────────────────────────────────
STEP 0 — MANDATORY CONTEXT
────────────────────────────────────────────
Read:

- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/diagrams/airport-model.md`

If the issue touches auth, middleware, redirects, profiles, payments, RLS: cite relevant code paths (file + short summary) before proposing.

Request if missing: errors, repro, routes, environment, last known good commit.

────────────────────────────────────────────
STEP 1 — ISSUE INVENTORY
────────────────────────────────────────────
Each issue: symptom, repro, expected vs actual, environment, evidence.

────────────────────────────────────────────
STEP 2 — AIRPORT ZONES
────────────────────────────────────────────
Per issue: zone(s) from airport model; **RED ZONE: YES/NO** and which subsystem.

────────────────────────────────────────────
STEP 3 — PRIORITIZATION
────────────────────────────────────────────
P0 / P1 / P2 with justification. Containment for P0/P1 without risky refactors.

────────────────────────────────────────────
STEP 4 — ATTACK PLAN
────────────────────────────────────────────
Smallest safe sequence; what **not** to touch.

Ask only: “Which single P0/P1 should we tackle first?”
