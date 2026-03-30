# Documentation overhaul plan — 2026 (ViBE / ViZb)

**Last updated:** March 23, 2026  
**Status:** Design / hygiene (living document)

## Goals

1. Keep **stable paths** for Cursor commands and onboarding (`/plan`, `/ship`, `/continue`, etc.).
2. Grow **subdirectory READMEs** so every major `docs/*` area has an entry point.
3. Avoid mass renames that break links or command prompts.

## Approach (recommended)

**Approach A — incremental**

- Add missing index files (`contracts/INDEX.md`, `journeys/INDEX.md`, troubleshooting, diagrams).
- **Diagrams:** keep `docs/diagrams/README.md` + `airport-model.md` stable; other `docs/diagrams/*.md` files follow the same *shape* as the TOTL set (auth, roles, infra, core sequence, full map) but with ViBE-specific content.
- Add **`docs/ARCHITECTURE_CONSTITUTION.md`** as the short Layer-1 law doc; keep **`ARCHITECTURE_SOURCE_OF_TRUTH.md`** for depth.
- Archive superseded docs under `docs/archive/` with a one-line pointer in `DOCUMENTATION_INDEX.md` when moved.
- Do **not** rename the immutable paths listed in `docs/development/ENGINEERING_COMMANDS.md` without updating every command file the same PR.

## Acceptance criteria

- [ ] `docs/DOCUMENTATION_INDEX.md` lists all spine files and new folders.
- [ ] Every meaningful `docs/*/` subtree has a `README.md` or `INDEX.md`.
- [ ] Core command paths resolve: architecture + **brand + events + community** Layer 1 docs, index, `database_schema_audit.md`, `airport-model`, MVP/product status, common errors.
- [ ] Optional: CI job that checks presence of core files (future).

## Optional “Approach C”

Maintain **`docs/CURSOR_COMMANDS_REFERENCE.md`** as a one-page table: command → required reads.
