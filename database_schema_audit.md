# Database schema audit — ViBE / ViZb

**Last updated:** April 11, 2026

## Purpose

Single **root** checklist for “what exists in the database” and how it is verified. Authoritative column-level definitions remain in:

- `docs/VIBE_APP_SPECIFICATION.md` (Sections 5–6: schema + RLS)
- `scripts/*.sql` (executed migration scripts in this repo)

If this file disagrees with executed SQL, **the SQL wins** — update this audit in the same change set.

---

## Migration / script inventory

Scripts are applied in **numeric order** (see `docs/MVP_STATUS_ROADMAP.md` migration map for status). New work should follow the team rule:

- **Preferred (Supabase CLI):** `supabase migration new <description>` → SQL under `supabase/migrations/` (when CLI is adopted).
- **Current repo pattern:** numbered files under `scripts/` until migrations are fully moved; **never edit scripts that already ran in shared environments** — add a new script instead.

**Recent script (verify against your Supabase project):**

- `20260410120000_event_rsvp_capacity.sql` — optional `events.rsvp_capacity`, `published_event_rsvp_occupied_count`, RSVP cap enforcement (mirror: `scripts/026_event_rsvp_capacity.sql`).
- `20260410142142_tickets_core_free_rsvp.sql` — `ticket_types`, `orders`, `order_items`, `tickets`, `mint_free_rsvp_ticket_for_registration` (mirror: `scripts/028_tickets_core_free_rsvp.sql`).
- `20260410144936_ticket_types_org_crud_and_mint_tier.sql` — tier capacity / sale window, org CRUD on `ticket_types`, mint RPC optional tier id (mirror: `scripts/029_ticket_types_org_crud_and_mint_tier.sql`).
- `20260411120000_stripe_checkout_fulfillment.sql` — Stripe Checkout fulfillment RPC + unique `orders.stripe_checkout_session_id` (mirror: `scripts/030_stripe_checkout_fulfillment.sql`).
- `20260407120000_event_saves.sql` (`supabase/migrations/`) — `event_saves` (per-user saved published events): RLS select/insert/delete own rows; unique `(user_id, event_id)`; indexes `(user_id, created_at DESC)` and `(event_id)`.
- `019_staff_event_create_and_flyer_storage.sql` — `events_insert_staff` RLS; storage `event-flyers` INSERT/UPDATE also allows `staff_admin` (path still `org_id/event_id/...`).
- `020_event_categories_array.sql` — replaces `events.category` with `events.categories TEXT[]` (validated set + GIN index).
- `021_seed_design_events.sql` — **data only** (not schema): optional published events + org `vibe-design-preview` for UI/design previews; detects **`events.categories`** vs legacy **`events.category`**; run manually in SQL Editor (see `docs/guides/LOCAL_DEV_AND_AUTH.md` §9).
- `verify_019_020_applied.sql` — **read-only** checks (SQL Editor): confirms **`019`** RLS/storage policies and **`020`** `events.categories` + index/constraint; use on prod/staging before assuming schema parity.

---

## Quick audit checklist (run when schema changes)

1. [ ] New/changed tables have **RLS enabled** and policies documented in the spec.
2. [ ] No new **client-side** writes; Server Actions use the canonical clients.
3. [ ] **Enums** aligned across SQL, spec, and app code (no orphan values).
4. [ ] **Storage buckets** (if any) have policies matching the spec.
5. [ ] Update **`docs/VIBE_APP_SPECIFICATION.md`** and the relevant **`docs/contracts/*`** entry when behavior or ownership changes.
6. [ ] Update **`docs/MVP_STATUS_ROADMAP.md`** migration map if script numbers/purpose change.

---

## Environment notes

- **Local:** use Supabase project credentials in `.env.local` (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- **Production:** schema changes only through reviewed migrations and controlled apply — never from the app.

---

## Optional: deep verification

When the repo adds automation (e.g. `supabase db diff`, schema tests, or type generation), document the exact commands in `docs/development/ENGINEERING_COMMANDS.md` and link here.
