# Order fee and payout fields

Canonical money and lifecycle columns on `public.orders`. All amounts are **integer USD cents**.

## Money fields

| Column | Meaning |
|--------|---------|
| `ticket_subtotal_cents` | Ticket face value total (what the organizer earns before Connect fees). |
| `vizb_service_fee_cents` | ViZb platform service fee (launch: 5% + $1.00 per paid ticket). |
| `processing_fee_cents` | Card processing fee passed through to the buyer. |
| `buyer_total_cents` | Total charged to the buyer. Must equal ticket + ViZb + processing. |
| `organizer_payout_cents` | Amount scheduled for organizer payout (equals ticket face value for paid tiers). |

**Constraint:** `buyer_total_cents = ticket_subtotal_cents + vizb_service_fee_cents + processing_fee_cents`

Legacy columns `subtotal_cents`, `platform_fee_cents`, and `total_cents` mirror the canonical names via a `BEFORE INSERT OR UPDATE` trigger for backward compatibility.

## Stripe references

| Column | Meaning |
|--------|---------|
| `stripe_checkout_session_id` | Stripe Checkout Session id when paid checkout starts. |
| `stripe_payment_intent_id` | PaymentIntent id after checkout creation / payment. |
| `stripe_charge_id` | Charge id captured from webhooks for refunds/disputes. |

## Status fields

| Column | Values | Meaning |
|--------|--------|---------|
| `payment_status` | `created`, `checkout_started`, `paid`, `failed`, `canceled` | Buyer payment lifecycle. |
| `payout_status` | `not_required`, `pending`, `blocked`, `released`, `failed` | Organizer Connect payout lifecycle. |
| `refund_status` | `none`, `pending`, `partial`, `full` | Refund state from Stripe webhooks. |
| `dispute_status` | `none`, `disputed`, `won`, `lost` (+ legacy `warning_closed`) | Chargeback/dispute state. |

Free RSVP orders (`ticket_subtotal_cents = 0`) use `payment_status = paid` and `payout_status = not_required` without Stripe Checkout.

Paid checkout flow:

1. Pending order inserted with `payment_status = created`, `payout_status = pending`.
2. Stripe session created → `checkout_started`.
3. Webhook fulfillment → `paid` + ticket minted; payout stays `pending` until Connect release.
4. Refund/dispute webhooks → `payout_status = blocked` (unless already `released`).

Application helpers: `lib/orders/order-payment-fields.ts`, pricing: `lib/payments/calculate-vizb-ticket-pricing.ts`.
