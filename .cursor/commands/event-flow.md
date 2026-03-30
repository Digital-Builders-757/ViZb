/event-flow

Intent: Validate product changes against **event lifecycle** and related contracts.

MODE: ANALYSIS first; code only if explicitly requested

────────────────────────────────────────────
STEP 0 — READ
────────────────────────────────────────────
- `docs/EVENTS_SOURCE_OF_TRUTH.md`
- `docs/contracts/events.md`
- `docs/contracts/rsvps.md`
- `docs/contracts/checkins.md`
- `docs/journeys/member_rsvps_to_event.md`
- `docs/diagrams/core-transaction-sequence.md`
- Relevant `scripts/*.sql` if schema/status touched

────────────────────────────────────────────
STEP 1 — MAP CHANGE
────────────────────────────────────────────
State which lifecycle stage(s) are affected (draft → submit → review → publish → attend).

────────────────────────────────────────────
STEP 2 — CONSISTENCY
────────────────────────────────────────────
- RLS / status rules still coherent?  
- Manifest (public) vs organizer vs admin surfaces still correct?  
- Journeys that need updating — list files.

────────────────────────────────────────────
OUTPUT
────────────────────────────────────────────
GO / NO-GO for shipping from an **event-truth** perspective, with bullet rationale.
