# Contract: RSVPs & orders

**Status:** MVP in progress

## Goal (V1)

Ship a minimal, real end-to-end **free RSVP** flow that:
- lets an authenticated user RSVP on a **published** event
- shows RSVPs in **My Tickets**
- gives staff/org admins a foundation for future **check-in** operations

## Data model

### `public.event_registrations`
- Source: `scripts/025_create_event_registrations.sql`
- Uniqueness: one registration per `(event_id, user_id)`
- Status (MVP): `confirmed | cancelled | checked_in`

## RLS expectations
- A user can read their own registrations.
- Org members can read registrations for events in their org.
- Staff can read everything.
- Insert: authenticated users can RSVP only for `events.status='published'`.

## App surfaces
- Public event detail: `/events/[slug]` (CTA: RSVP)
- Member wallet: `/dashboard/tickets`

## Code owners
- RSVP server actions: `app/actions/registrations.ts`
- RSVP UI: `components/events/event-rsvp-cta.tsx`
- Check-in server actions: `app/actions/checkin.ts`, `app/actions/undo-checkin.ts`, `app/actions/organizer-checkin.ts`, `app/actions/organizer-undo-checkin.ts`

## Known limitations (intentional for MVP)
- Paid tickets not implemented yet.
- No quantity / ticket types yet.
- No Stripe checkout/webhooks yet.
- Attendee identity display is limited to `profiles.display_name` (email/phone not part of the public profile contract).
