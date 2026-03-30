# Cursor commands → required reads

**Last updated:** March 23, 2026

Quick map: slash command → **minimum** docs to open first.

| Command | Read first |
|---------|------------|
| `/plan` | `docs/ARCHITECTURE_CONSTITUTION.md`, `docs/DOCUMENTATION_INDEX.md`, `database_schema_audit.md`, `docs/diagrams/airport-model.md`, optional diagrams per `docs/diagrams/README.md`, relevant `scripts/*.sql` |
| `/implement` | Same as `/plan` + diagrams from `/plan`; UI/copy also `docs/BRAND_CONSTITUTION.md` |
| `/verify` | (none — npm scripts) |
| `/continue` | Constitution, index, airport model, `docs/MVP_STATUS_ROADMAP.md` or `MVP_STATUS.md` |
| `/ship` | `docs/MVP_STATUS_ROADMAP.md`, `PRODUCT_STATUS_REPORT.md` if product claims changed, `docs/troubleshooting/COMMON_ERRORS_QUICK_REFERENCE.md`, index |
| `/pr` | `docs/development/BRANCHING.md`, diff vs base |
| `/triage` | Constitution, index, airport model |
| `/debug` | Constitution, index, airport model |
| `/redzone` | Constitution, airport model, `docs/VIBE_APP_SPECIFICATION.md` auth/RLS, `database_schema_audit.md` |
| `/schema` | `database_schema_audit.md`, spec §5–6, constitution |
| `/docs-sync` | Index, constitution |
| `/playwright-smoke` | `docs/development/ENGINEERING_COMMANDS.md` |
| `/release` | `docs/releasenotes/README.md` |
| `/retro` | Index + affected contracts/journeys |
| `/summarize` | `VIBE_PROJECT_CONTEXT_PROMPT.md`, `docs/MVP_STATUS_ROADMAP.md`, git status |
| `/brand-check` | `docs/BRAND_CONSTITUTION.md`, `docs/brand/VOICE_AND_MESSAGING.md`, `docs/brand/VISUAL_SYSTEM.md` → `docs/BRAND_SYSTEM.md` |
| `/event-flow` | `docs/EVENTS_SOURCE_OF_TRUTH.md`, `docs/contracts/events.md`, `rsvps.md`, `checkins.md`, `docs/journeys/member_rsvps_to_event.md`, `docs/diagrams/core-transaction-sequence.md` |
| `/content-sync` | `docs/brand/CONTENT_PATTERNS.md`, `docs/brand/VOICE_AND_MESSAGING.md`, `PRODUCT_STATUS_REPORT.md` |

Full doctrine: **`docs/development/ENGINEERING_COMMANDS.md`**.
