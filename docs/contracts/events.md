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

## Event kind + external RSVP (local / community listings)

- Columns **`events.event_kind`** (`official` \| `community`, default `official`) and **`events.external_rsvp_url`** (nullable http(s) URL).
- Migration: `supabase/migrations/20260505163945_add_event_kind_and_external_rsvp.sql`.
- **`community`** rows are intended for third-party listings: **submit for review** requires a valid **`external_rsvp_url`** (no in-app flyer requirement). **`official`** rows keep the existing flyer requirement before review.
- **`createEvent`:** `event_kind=community` is accepted only for **staff_admin** creating under the **platform** org (see `lib/orgs/platform-org.ts`); otherwise the row stays `official`.
- **Public:** `/events` and `/events/[slug]` label **`community`** rows **Local Event** (not ViZb-hosted); primary RSVP is the external link (`target="_blank"`, `rel="noopener noreferrer"`).

## Staff pick + listing reports (trust layer)

- Column **`events.is_staff_pick`** (boolean, default **false**): when **true**, public surfaces show a calm **Staff pick** badge (alongside **`event_kind`** labels) and the event may appear in the **`ViZb picks`** rail on **`/events`**. Toggle from **staff admin** on **`/admin/events/[id]`** (Trust & discovery). Server Action: **`setEventStaffPickFromAdmin`** in **`app/actions/event-trust.ts`** (revalidates **`/events`**, **`/events/[slug]`**, home, admin).
- Table **`event_listing_reports`**: **`event_id`**, **`user_id`** (authenticated reporter), **`body`** (10–2000 chars), **`created_at`**. **Unique** **`(event_id, user_id)`** — one open report payload per member per listing (resubmit blocked until uniqueness changes). Inserts allowed only when the parent **`events.status`** is **`published`**. **`staff_admin`** can **SELECT** all rows for moderation; there is no end-user SELECT policy.
- Migration: **`supabase/migrations/20260505184652_event_staff_pick_and_listing_reports.sql`**.
- **Public UX:** **`Report listing`** on **`/events/[slug]`** (signed-in submits; signed-out sees sign-in prompt). Staff queue: **`/admin/event-listing-reports`**.
- **Verified vs community listings:** **`official`** events continue to read as **ViZb Event** (in-app ticketing/RSVP where enabled); **`community`** rows remain clearly third-party (**Local Event** + external RSVP copy).

## Public detail view counter (organizer metrics)

- Column **`events.public_detail_view_count`** (bigint, default **0**): incremented by **`increment_event_public_detail_views(p_slug)`** when **`POST /api/events/[slug]/view`** runs for a **published** row (approximate beacon per page visit).
- Migration: **`supabase/migrations/20260505195500_event_public_detail_views.sql`**.

## Open mic category + lineup (V1)

- Event category tag **`open_mic`** is allowed on `events.categories` (CHECK constraint; see `supabase/migrations/20260417202850_add_open_mic_event_category.sql`). App source of truth for values: `lib/events/categories.ts`.
- Table **`event_lineup_entries`** stores ordered performer rows per event (`lineup_entry_status` enum). Migration: `supabase/migrations/20260417210000_event_lineup_entries.sql`.
- **RLS:** Anonymous users may read only a **public slice**: parent event is **`published`**, categories include **`open_mic`**, row **`is_public`**, status **`confirmed`** or **`performed`**. Org members with roles **`owner` / `admin` / `editor`** and **`staff_admin`** may read and mutate rows for that event (same pattern as `ticket_types` policies).
- **Public URL:** `/lineup/[eventSlug]` — must apply the same **explicit** `is_public` + status filters in the query even for authenticated clients (org members get broader SELECT via RLS; the public page must not rely on RLS alone). Absolute share links use **`NEXT_PUBLIC_SITE_URL`** + `/lineup/{slug}` (see **`lib/public-site-url.ts`**).
- **Dashboard:** Organizer event page and admin event detail show **`OpenMicLineupPanel`** when the event categories include **`open_mic`**.
- Full UX and QA checklist: **`docs/OPEN_MIC_LINEUP.md`**.
