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

## Open mic category + lineup (V1)

- Event category tag **`open_mic`** is allowed on `events.categories` (CHECK constraint; see `supabase/migrations/20260417202850_add_open_mic_event_category.sql`). App source of truth for values: `lib/events/categories.ts`.
- Table **`event_lineup_entries`** stores ordered performer rows per event (`lineup_entry_status` enum). Migration: `supabase/migrations/20260417210000_event_lineup_entries.sql`.
- **RLS:** Anonymous users may read only a **public slice**: parent event is **`published`**, categories include **`open_mic`**, row **`is_public`**, status **`confirmed`** or **`performed`**. Org members with roles **`owner` / `admin` / `editor`** and **`staff_admin`** may read and mutate rows for that event (same pattern as `ticket_types` policies).
- **Public URL:** `/lineup/[eventSlug]` — must apply the same **explicit** `is_public` + status filters in the query even for authenticated clients (org members get broader SELECT via RLS; the public page must not rely on RLS alone).
- **Dashboard:** Organizer event page and admin event detail show **`OpenMicLineupPanel`** when the event categories include **`open_mic`**.
- Full UX and QA checklist: **`docs/OPEN_MIC_LINEUP.md`**.
