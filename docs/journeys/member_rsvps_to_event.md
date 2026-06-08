# Journey: member RSVPs or buys a ticket

**Status:** MVP  
**Contracts:** `docs/contracts/rsvps.md`, `docs/contracts/checkins.md`

## Happy path — free RSVP

1. Signed-in member opens a **published** event detail page (`/events/[slug]`).
2. If multiple `$0` tiers are on sale, member selects one; otherwise the default free RSVP tier is implied.
3. Member taps **RSVP**.
4. `app/actions/registrations.ts` upserts `event_registrations`.
5. `mint_free_rsvp_ticket_for_registration` creates a completed `$0` order, line item, and `tickets` row.
6. Member opens `/tickets` or `/tickets/[ticketId]` and sees the pass.

## Happy path — paid tier

1. Signed-in member selects a paid ticket tier on event detail.
2. `createTicketCheckoutSession` creates a pending order and Stripe Checkout session.
3. Member completes payment on Stripe.
4. Stripe posts `checkout.session.completed` to `/api/stripe/webhook`.
5. Webhook verifies the signature, records idempotency in `webhook_logs`, then calls `fulfill_stripe_ticket_order`.
6. Member returns to ViZb and sees ticket state in the wallet.

## Edge cases

- **Capacity reached:** whole-event cap or tier capacity blocks RSVP/checkout with a clear error.
- **Already RSVP’d:** free RSVP remains refresh-safe; minting self-heals missing legacy tickets.
- **Payment failed/expired:** webhook updates order state; no ticket is minted.
- **Community event:** CTA opens external RSVP URL; ViZb does not mint a ticket.

## Acceptance

- Entitlement is durable in `event_registrations`, `orders`, `order_items`, and `tickets`.
- Client redirect is not treated as fulfillment proof; webhook is source of truth.
- Wallet and event CTA stay consistent after RSVP, checkout, cancellation, and check-in.
