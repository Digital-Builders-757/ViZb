# Contract: RSVPs, free tickets & orders

**Status:** MVP — **free RSVP + $0 tickets** + **Stripe Checkout** for paid tiers (requires DB migration `030` / `20260411120000_stripe_checkout_fulfillment.sql` + Stripe env)

**Last updated:** April 17, 2026

## Goal (V1 shipped)

Deliver a **free RSVP** flow that:

- Lets an authenticated user RSVP on a **published** event (optional **RSVP cap** on `events.rsvp_capacity`).
- Persists entitlement in **`event_registrations`** and issues a **`tickets`** row (16-char hex **`ticket_code`**) via **`mint_free_rsvp_ticket_for_registration`** ($0 completed **`orders`** + line item). A **confirmed** or **checked_in** RSVP must always have a matching **`tickets`** row (`event_registration_id`); the app **self-heals** on `/events/[slug]` when a registration exists without a ticket (legacy/orphan data) by calling the same mint RPC again.
- Surfaces passes in the member wallet at **`/tickets`** and **`/tickets/[ticketId]`** ( **`/dashboard/tickets`** remains an alias).
- Lets organizers define **free** tiers on **`ticket_types`** (name, sort, optional per-tier capacity, optional sale window); public event page can show a **tier chooser** when multiple $0 tiers are on sale.

## Data model

### `public.event_registrations`

- Source: `scripts/025_create_event_registrations.sql` (and matching `supabase/migrations/*_create_event_registrations.sql` if present in your project).
- Uniqueness: one registration per `(event_id, user_id)`.
- Status (MVP): `confirmed | cancelled | checked_in`.
- Check-in / undo still mutate this row; wallet QR signing continues to use **registration id** (`rid`) for door compatibility.

### `public.ticket_types` / `orders` / `order_items` / `tickets`

- Source: `supabase/migrations/20260410142142_tickets_core_free_rsvp.sql` (mirror: `scripts/028_tickets_core_free_rsvp.sql`).
- Tier editor extensions (capacity, sale window, org CRUD policies, optional mint arg): `supabase/migrations/20260410144936_ticket_types_org_crud_and_mint_tier.sql` (mirror: `scripts/029_ticket_types_org_crud_and_mint_tier.sql`).
- **Free RSVP:** one **`tickets`** row per registration (`event_registration_id` UNIQUE), tied to a $0 **`ticket_type`** (including the seeded default **RSVP** tier).

### `public.events.rsvp_capacity`

- Optional whole-event cap; occupancy via **`published_event_rsvp_occupied_count`** RPC.
- Source: `supabase/migrations/20260410120000_event_rsvp_capacity.sql` (mirror: `scripts/026_event_rsvp_capacity.sql`).

## RLS expectations (summary)

- Attendees read their own **`tickets`** / **`event_registrations`** as enforced in migrations.
- Org members read registrations / tickets for events in their org; staff read broadly.
- **`ticket_types`**: anon may **SELECT** tiers for **published** events; org editors manage tiers for their events.
- Inserts: authenticated RSVP only when event is **published** and caps allow (app + DB triggers/constraints).

## App surfaces

- Public event detail: `/events/[slug]` — `EventRsvpCta` + optional free-tier list.
- Member wallet: **`/tickets`**, **`/tickets/[ticketId]`**; alias **`/dashboard/tickets`**.
- Organizer: `/organizer/[slug]/events/[eventSlug]` — **Ticket types** panel; attendees panel includes RSVP cap display when set.

## Code owners

- RSVP + mint: `app/actions/registrations.ts`, `lib/tickets/mint-free-rsvp-ticket.ts`
- Ticket types (organizer): `app/actions/ticket-types.ts`
- Wallet UI: `components/dashboard/tickets/*`, `components/events/event-rsvp-cta.tsx`
- Check-in server actions: `app/actions/checkin.ts`, `app/actions/undo-checkin.ts`, `app/actions/organizer-checkin.ts`, `app/actions/organizer-undo-checkin.ts`
- Shared wallet helpers: `lib/dashboard/ticket-wallet-shared.ts`

## Paid checkout (Stripe)

- Server action: `app/actions/ticket-checkout.ts` → `createTicketCheckoutSession` (published event, paid tier, capacities).
- Webhook: `POST /api/stripe/webhook` handles `checkout.session.completed` and calls `fulfill_stripe_checkout_for_ticket` with **service_role** (idempotent on `orders.stripe_checkout_session_id`).
- Env: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SITE_URL` (success/cancel URLs).

## Door QR (check-in)

- Server HMAC signing: set **`TICKET_QR_SECRET`** (≥16 characters) on the **Next.js server** for every deployment that should show member **door QR** codes and accept scans at **`POST /api/checkin/scan`**. Without it, wallet copy explains that QR is unavailable and the scan API returns `scanner_not_configured`.
- Token payload uses registration id **`rid`** and event id **`eid`** (see `lib/ticket-qr-token.ts`).

## Known limitations

- **Refunds** are manual in Stripe; canceling an RSVP in-app does not refund card charges.
- One ticket per checkout session (no multi-quantity line items yet).
- More than one free RSVP ticket per registration is not in scope for v1.
- Attendee identity display still limited to `profiles.display_name` (see `member_profiles` contract).
