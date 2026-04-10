# Database migrations (scripts/*.sql + Supabase CLI)

This repo uses **numbered SQL scripts** in `scripts/` as a **manual mirror** and **`supabase/migrations/*.sql`** as the **CLI-applied** history for linked projects.

**Deploy / verify on a remote Supabase project:** see **`docs/operations/SUPABASE_PRODUCTION_MIGRATIONS.md`** (`supabase migration list`, `supabase db push`, post-checks).

## Apply order

Apply scripts in **ascending numeric order**.

At minimum, shared environments used for event workflows should have applied:
- `003_create_enums.sql`
- `004_create_profiles.sql`
- `005_create_organizations.sql`
- `013_create_events.sql`
- `014_create_event_flyers_bucket.sql`
- `017_event_review_metadata.sql`
- `018_guard_review_fields_trigger.sql`
- `019_staff_event_create_and_flyer_storage.sql`
- `020_event_categories_array.sql`
- `022_add_event_archived.sql`
- `023_lock_archived_events.sql`
- `024_allow_staff_update_archived.sql` (fix: staff can update archived events to restore/moderate)
- `025_create_event_registrations.sql` (free RSVP foundation)
- `026_event_rsvp_capacity.sql` (optional `events.rsvp_capacity`, occupancy RPC, RSVP cap trigger)
- `028_tickets_core_free_rsvp.sql` (`ticket_types`, `orders`, `order_items`, `tickets`, `mint_free_rsvp_ticket_for_registration` RPC; free RSVP = $0 completed order)
- `029_ticket_types_org_crud_and_mint_tier.sql` (per-tier `capacity` / sale window; org CRUD policies on `ticket_types`; anon read tiers for published events; mint RPC optional `p_ticket_type_id`)

## Quick verification

- Run `scripts/verify_019_020_applied.sql` in Supabase SQL Editor.
- Spot-check: in `public.events`, confirm columns exist that the app expects (`categories`, review metadata, `archived` support), and that staff/admin flows can UPDATE archived rows after `024`.

## Notes

- Scripts are written to be **forward-safe** where possible (idempotent policies, `IF EXISTS`, etc.), but you should still apply them carefully.
- If you see enum errors in the app, check `003_create_enums.sql` + `008_fix_enum_values.sql` + later `010a_*` additions.
