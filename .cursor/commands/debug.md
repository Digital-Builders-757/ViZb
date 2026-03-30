/debug

Intent: Fast root-cause mapping with evidence. No code yet.

MODE: DESIGN ONLY  
DO NOT write, modify, or suggest code.

────────────────────────────────────────────
STEP 0 — MANDATORY CONTEXT
────────────────────────────────────────────
Read:

- `docs/ARCHITECTURE_CONSTITUTION.md`
- `docs/DOCUMENTATION_INDEX.md`
- `docs/diagrams/airport-model.md`

Red-zone issues: show relevant existing code snippets first, then analyze.

────────────────────────────────────────────
STEP 1 — REPRO + EVIDENCE
────────────────────────────────────────────
URLs/routes, stack traces, network, env (local/prod), recent schema changes.

Redirect loops: start URL → final URL → chain.

────────────────────────────────────────────
STEP 2 — FAILURE SURFACE (AIRPORT)
────────────────────────────────────────────
Where this symptom can originate (Security, Terminal, Staff, Locks, Ticketing…).

────────────────────────────────────────────
STEP 3 — HYPOTHESES
────────────────────────────────────────────
3–7 ordered by likelihood. For each: confirm / falsify evidence; smallest inspection step.

────────────────────────────────────────────
STEP 4 — INSTRUMENTATION (MINIMAL)
────────────────────────────────────────────
What to log or inspect **without** behavior change.

Ask only: “Paste the requested logs/traces and we’ll narrow to one root cause.”
