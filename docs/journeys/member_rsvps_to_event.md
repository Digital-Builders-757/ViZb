# Journey: member RSVPs and receives a free ticket

**Status:** MVP (**free path** shipped; paid tiers later)  
**Contracts:** `docs/contracts/rsvps.md`

## Happy path (current)

1. Signed-in member opens **published** event detail (`/events/[slug]`).
2. If multiple **$0** tiers are on sale, member picks a tier; otherwise the default free tier is implied.
3. Member taps **RSVP**; app upserts **`event_registrations`** and calls **`mint_free_rsvp_ticket_for_registration`** so a **`tickets`** row exists with a **`ticket_code`**.
4. Member opens **`/tickets`** (or **`/tickets/[ticketId]`**) and sees upcoming pass with calendar / wallet actions when configured.

## Edge cases

- **RSVP cap:** whole-event cap (`events.rsvp_capacity`) or tier capacity can block RSVP with a clear error.
- **Already RSVP’d:** idempotent success; mint ensures a ticket row exists.
- **Cancel RSVP:** registration cancelled; ticket behavior follows DB/RLS (see migrations).

## Acceptance

- Entitlement reflected in DB (`event_registrations` + `tickets`); refresh-safe.
- Wallet and public event CTA stay consistent after check-in (paths revalidated).

## Next (roadmap)

- Paid tier selection, Stripe checkout, webhook minting — see `docs/MVP_STATUS_ROADMAP.md` Phase 4.
