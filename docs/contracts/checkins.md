# Contract: check-in

**Status:** MVP  
**Code:** `app/api/checkin/scan/route.ts`, `app/actions/checkin.ts`, `app/actions/undo-checkin.ts`, `app/actions/organizer-checkin.ts`, `app/actions/organizer-undo-checkin.ts`, `lib/checkin-scan-permissions.ts`, `lib/ticket-qr-token.ts`  
**Data:** `event_registrations`, `tickets`, `orders`, `ticket_types`  
**Env:** `TICKET_QR_SECRET`

## Purpose

Door check-in converts a confirmed registration into an admitted attendee state without bypassing RSVP/ticket truth.

## Invariants

- Check-in state is stored on `event_registrations.status`.
- Valid status transitions are `confirmed` → `checked_in` and `checked_in` → `confirmed` for undo.
- Scanner QR payloads must be HMAC-signed with `TICKET_QR_SECRET`.
- Organizer check-in is org-scoped. Staff admin can operate across events.
- Client UI never decides authorization; route handlers/actions verify event scope before mutation.
- Missing scanner secret must fail closed (`scanner_not_configured`) rather than accepting unsigned tokens.

## Surfaces

| Surface | Purpose |
|---------|---------|
| `/admin/check-in` | Staff hub — pick an upcoming event and open its door scanner |
| `/admin/events/[id]/check-in` | Staff door scanner for a specific platform event |
| `/organizer/[slug]/events/[eventSlug]/check-in` | Door scanner and attendee workflow |
| `POST /api/checkin/scan` | QR token verification + check-in mutation |
| Organizer event detail | Manual check-in / undo controls |
| Admin event detail | Staff manual check-in / undo controls |
| `/tickets/[ticketId]` | Member ticket and QR display when configured |

## Data flow

```text
Member shows ticket QR
  -> scanner posts token + eventId to /api/checkin/scan
  -> token signature validates rid/eid
  -> app confirms scanner permission for event/org
  -> event_registrations.status = checked_in
  -> affected pages revalidate
```

Manual check-in uses server actions instead of the API route, but the same org/staff scope rules apply.

## RLS expectations

- Members can read their own registrations/tickets.
- Org members can read registrations/tickets for events in their org.
- Staff admin can read and update broadly.
- RLS remains the final authority; app gates are defense in depth.

## Known limits

- This is an MVP door flow, not a full audit log. The durable state is the registration status and timestamps.
- Refunds and payment disputes are outside check-in; paid order state is handled by Stripe/webhook flows.
