# Contract: events

**Status:** STUB  
**Spec:** `docs/VIBE_APP_SPECIFICATION.md` (events schema + RLS)  
**Layer 1:** `docs/EVENTS_SOURCE_OF_TRUTH.md`  
**Code:** `app/actions/event.ts`, `app/events/**`, `app/(dashboard)/organizer/**`, admin review UI

## Invariants

- Event visibility follows **status + RLS**; public routes are Manifest reads only.  
- Mutations go through Server Actions; explicit `select` lists.

## Lifecycle

Current `event_status` values (see `scripts/003_create_enums.sql` + `scripts/008_fix_enum_values.sql` + latest migrations):
- `draft`
- `pending_review`
- `published`
- `rejected`
- `cancelled`
- `archived` (soft-delete / hide)

**Archive semantics (MVP):**
- `archived` events should not appear on public discovery (`/events`, previews).
- Archived events are read-only for org members (policy-level lock).
- Staff admin can archive from the admin event manager.

**Migrations:**
- `scripts/022_add_event_archived.sql`
- `scripts/023_lock_archived_events.sql`
- `scripts/024_allow_staff_update_archived.sql` (fix: allow staff to update archived for unarchive/moderation)

## RSVP capacity (optional)

- Column **`events.rsvp_capacity`** (nullable integer): whole-event cap on confirmed/check-in RSVPs.
- Applied via `scripts/026_event_rsvp_capacity.sql` / `supabase/migrations/20260410120000_event_rsvp_capacity.sql`.
- Organizer create/edit validates the cap is not below current occupancy; public RSVP uses the occupancy RPC. See **`docs/contracts/rsvps.md`**.
