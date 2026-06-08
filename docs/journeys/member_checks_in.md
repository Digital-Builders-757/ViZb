# Journey: member checks in at door

**Status:** MVP  
**Contracts:** `docs/contracts/checkins.md`, `docs/contracts/rsvps.md`

## Happy path

1. Member opens a ticket from `/tickets` or `/tickets/[ticketId]`.
2. Ticket shows event details and a door QR when `TICKET_QR_SECRET` is configured.
3. Organizer opens `/organizer/[slug]/events/[eventSlug]/check-in`.
4. Organizer scans the QR.
5. `POST /api/checkin/scan` validates the signed token and event scope.
6. Registration status changes from `confirmed` to `checked_in`.
7. Organizer UI shows admitted state; member ticket reflects checked-in status on refresh.

## Manual path

- Organizer/admin can manually check in or undo check-in from the event management surfaces.
- Manual actions use Server Actions and the same org/staff authorization model.

## Acceptance

- Unsigned or wrong-event QR payloads are rejected.
- Missing `TICKET_QR_SECRET` disables scanner acceptance instead of allowing insecure scans.
- Org members cannot check in attendees for another org’s event unless they are `staff_admin`.
- Undo returns the registration to `confirmed`, not `cancelled`.
