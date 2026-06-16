# ViZB Payments, Pricing, and Payouts

**Internal record — ViBE LLC / ViZB platform**  
**Last updated:** June 2026  
**Audience:** Elaine, Lionel, staff admins, and engineers  
**Status:** Matches shipped code as of the Connect + payout ledger milestone

This document explains how ViZB charges buyers, records orders, pays organizers, and handles refunds and disputes. It is written for company records and day-to-day operations—not for public legal copy.

> **Security:** This doc describes behavior only. It does not contain API keys, webhook secrets, or database credentials.

---

## 1. Overview

**ViZB** is operated by **ViBE LLC**. ViZB is a platform where:

- **Buyers** discover events and purchase tickets (or RSVP for free).
- **Organizers** create events and receive payouts for paid ticket sales.
- **ViZB** earns a **service fee** on each paid ticket.

**Money flow (high level):**

1. Buyer pays through **Stripe Checkout** on ViZB.
2. Funds land in the **ViBE LLC / ViZB Stripe platform account** first (separate charges model).
3. After the event and a configured waiting period—and if no refund or dispute blocks release—ViZB sends the organizer their share via **Stripe Connect Express** (transfer to the organizer’s connected account).
4. ViZB keeps the **ViZb service fee** on the platform account.

**Free events** use RSVP only. No Stripe payment, no organizer payout, no service fee.

**Paid events** require the event organizer to complete **Stripe Connect Express onboarding** and have **`payouts_enabled`** before paid tickets can be sold.

---

## 2. Fee policy

All amounts are stored in the database as **integer cents** (USD).

| Rule | Value |
|------|--------|
| **ViZB service fee** | **5%** of ticket face value, **plus $1.00 per paid ticket**, rounded up on the percentage portion |
| **Processing fee** | Passed through to the buyer; estimated at **2.9% + $0.30** (Stripe card processing) |
| **Organizer payout** | **Ticket face value only** (equals ticket subtotal for a single ticket) |
| **Minimum paid ticket** | **$5.00** |
| **Free admission** | **$0 RSVP** — not sold through Stripe Checkout |

**What ViZB keeps:** the ViZB service fee (5% + $1/ticket).

**What the buyer pays:** ticket + ViZB service fee + processing fee.

**What the organizer receives:** the ticket face value (via Connect transfer after release).

**Source of truth in code:** `lib/payments/vizb-pricing-config.ts` and `lib/payments/calculate-vizb-ticket-pricing.ts`.

---

## 3. Fee examples

Single ticket, quantity 1. Values below are from the official pricing calculator used in production and tests.

| Ticket price | ViZB service fee | Processing fee | **Buyer pays** | **Organizer payout** |
|-------------:|-----------------:|---------------:|-----------------:|---------------------:|
| $5.00 | $1.25 | $0.50 | **$6.75** | $5.00 |
| $10.00 | $1.50 | $0.66 | **$12.16** | $10.00 |
| $20.00 | $2.00 | $0.97 | **$22.97** | $20.00 |
| $30.00 | $2.50 | $1.28 | **$33.78** | $30.00 |
| $50.00 | $3.50 | $1.91 | **$55.41** | $50.00 |
| $100.00 | $6.00 | $3.48 | **$109.48** | $100.00 |

**How to read this:** The “ViZB service fee” column is platform revenue. The “processing fee” is shown to the buyer so Stripe’s card fees are covered; it is not extra profit for ViZB. The organizer always receives the ticket price column only.

---

## 4. Checkout flow

End-to-end path for one paid ticket:

### Step 1 — Buyer selects a paid tier

On the event page, the buyer chooses an active paid ticket tier (not the free RSVP tier).

### Step 2 — App calculates fees

The server uses `calculateVizbTicketPricing()` (same math as the buyer preview). Guards include:

- Event is published and not ended
- Tier is active and in stock
- Price is at least $5
- Organizer is **Connect payout-ready** (`payouts_enabled`)

### Step 3 — Buyer sees the breakdown

The UI preview shows ticket subtotal, ViZB service fee, processing fee, and buyer total. This uses the same builder as checkout: `lib/payments/build-ticket-checkout-presentation.ts`.

### Step 4 — Pending order is created

A row is inserted in `public.orders` with status `pending_payment` and the canonical fee columns (see Section 5).

### Step 5 — Stripe Checkout session

Stripe Checkout receives **three line items** that sum exactly to `buyer_total_cents`:

1. Ticket (face value)
2. ViZB service fee
3. Payment processing fee

Metadata on the session includes `order_id`, `event_id`, `organizer_id`, and the fee amounts in cents for auditability.

### Step 6 — Buyer pays on Stripe

Buyer completes payment on Stripe’s hosted checkout page.

### Step 7 — Webhook fulfillment

Stripe sends webhooks to `POST /api/stripe/webhook`. On successful payment:

- `checkout.session.completed` and/or `payment_intent.succeeded` triggers fulfillment
- RPC `fulfill_stripe_ticket_order` marks the order **completed**, sets `payment_status = paid`, mints the ticket
- An **organizer payout ledger row** is created in `public.organizer_payouts` (status `pending`, with `available_on` scheduled)

If webhooks are delayed, the buyer’s success page can call a sync action that runs the same fulfillment path.

**Important:** Payment to ViZB happens at checkout. Organizer transfer happens **later** (Section 6).

---

## 5. Database source of truth

Primary tables:

- **`public.orders`** — buyer payment, fee breakdown, refund/dispute flags
- **`public.organizer_payouts`** — one ledger row per paid order for Connect release
- **`public.organizer_stripe_accounts`** — Connect Express account per organizer user

### Money fields on `orders`

| Field | Meaning |
|-------|---------|
| `ticket_subtotal_cents` | Ticket face value (what the event priced the tier at) |
| `vizb_service_fee_cents` | ViZB platform fee (5% + $1/ticket) |
| `processing_fee_cents` | Processing fee passed through to the buyer |
| `buyer_total_cents` | Total charged to the buyer |
| `organizer_payout_cents` | Amount owed to the organizer at release (equals ticket face value for standard paid tiers) |

**Constraint:**  
`buyer_total_cents = ticket_subtotal_cents + vizb_service_fee_cents + processing_fee_cents`

Legacy columns `subtotal_cents`, `platform_fee_cents`, and `total_cents` mirror the canonical names via a database trigger for older reports.

### Status fields on `orders`

| Field | Values | Meaning |
|-------|--------|---------|
| `payment_status` | `created`, `checkout_started`, `paid`, `failed`, `canceled` | Buyer payment lifecycle |
| `payout_status` | `not_required`, `pending`, `blocked`, `released`, `failed` | Organizer payout lifecycle on the order |
| `refund_status` | `none`, `pending`, `partial`, `full` | Refund state from Stripe |
| `dispute_status` | `none`, `disputed`, `won`, `lost`, `warning_closed` | Chargeback / dispute state |

Related operational columns:

- `payout_blocked` / `payout_blocked_reason` — manual or automatic hold on payout
- `payout_released_at` — timestamp when organizer transfer completed
- `stripe_checkout_session_id`, `stripe_payment_intent_id`, `stripe_charge_id` — Stripe references for support and webhooks

### Organizer payout ledger (`organizer_payouts`)

Each paid fulfilled order gets one row with its own `status` (`pending`, `blocked`, `releasing`, `released`, `failed`), `available_on` (earliest release time), `stripe_transfer_id`, and `blocked_reason` / `failure_reason`.

See also: `docs/database/ORDER_FEE_FIELDS.md` (engineer reference).

---

## 6. Stripe Connect flow

ViZB uses **Stripe Connect Express** with **separate charges and transfers**:

- The **buyer pays ViZB** (platform account).
- The **organizer is paid later** via a **transfer** to their connected account.

### Organizer onboarding

1. Organizer opens **Organizer → Payments** (`/organizer/{slug}/payments`).
2. Clicks **Connect Stripe** — creates an Express connected account stored in `organizer_stripe_accounts`.
3. Completes Stripe’s onboarding flow and returns to ViZB.
4. Stripe webhook `account.updated` syncs `charges_enabled`, `payouts_enabled`, and `details_submitted`.

### Selling paid tickets

Before checkout or creating paid tiers, ViZB checks that the event’s organizer (`events.created_by`) has **`payouts_enabled = true`**. If not:

- Paid ticket tiers cannot be published/created
- Checkout is blocked with a clear message
- **Free RSVP still works**

### After a successful payment

1. Order is marked paid; ticket is issued.
2. **`organizer_payouts` row** is created with status `pending` (or `blocked` if refund/dispute/hold already applies).
3. **`available_on`** is set to **event end time + payout delay** (default **48 hours**; configurable 24–72 via `VIZB_PAYOUT_DELAY_HOURS`). If the event has no end time, start time is used as the base.

### Payout release

An hourly job (`GET /api/cron/release-payouts`, protected by `CRON_SECRET`) and staff admins can release eligible payouts:

1. Confirm no refund, dispute, manual hold, or canceled payment state
2. Confirm organizer still `payouts_enabled`
3. Create Stripe **transfer** with `source_transaction` linked to the original charge
4. Store `stripe_transfer_id`; set payout and order to **released**

Release is **idempotent** (same payout cannot be transferred twice).

---

## 7. Refunds and disputes

### Refunds

Stripe webhooks (`charge.refunded`, `refund.updated`) update the order:

- `refund_status` becomes `pending`, `partial`, or `full`
- Full refunds may mark the order `refunded` and void the ticket
- **`payout_status` and the payout ledger move to `blocked`** with reason `refund` (unless payout was already released)

### Disputes

Stripe webhooks (`charge.dispute.created`, `charge.dispute.closed`) update `dispute_status`:

- Open disputes **block payout** immediately
- If the organizer **wins** the dispute and there is no refund, payout may return to `pending`
- If the organizer **loses**, payout stays blocked

### Processing fees

Stripe processing fees are **largely non-recoverable** when a charge is refunded. ViZB currently **passes processing through to the buyer** at checkout; on refund, platform and organizer economics may not fully reverse the processing portion. Treat processing as **typically retained by Stripe**, not returned to ViZB or the buyer.

### Already-released payouts

If a payout was **released** and a refund or dispute happens afterward, ViZB does **not** automatically claw back the transfer in software today. Operations may need a **manual reversal, offset, or future balance adjustment** with the organizer. Flag these in admin review.

---

## 8. Admin operations

Staff admins (`profiles.platform_role = staff_admin`) use the **Payments review** area:

| Route | Purpose |
|-------|---------|
| `/admin/payments` | List paid orders with fee breakdown and filters |
| `/admin/payments/orders/{id}` | Full audit for one order |
| `/admin/payments/payouts` | Payout ledger: pending, blocked, released, failed |

Legacy summary view: `/admin/revenue` (completed-order totals; not the payout ledger).

### Reviewing payments

Admins can verify:

- Buyer, event, organizer
- Ticket subtotal, ViZB fee, processing fee, buyer total, organizer payout
- Payment, refund, dispute, and payout status
- Stripe session, payment intent, and charge IDs
- Why a payout is blocked (`blocked_reason`, `failure_reason`, order hold)

### Releasing a payout manually (MVP)

On an eligible payout, admin clicks **Release payout** and confirms in a dialog. The system **will not release** if:

- Payout is already released
- Payout or order is blocked (refund, dispute, manual hold)
- Organizer is not Connect payout-ready
- Payment is not in a completed/paid state

Admins **may** release before the scheduled `available_on` time during MVP (automation still waits for that window).

### Placing or removing a hold

- **Place hold** — sets a **manual** block on the order and payout ledger (`payout_blocked_reason = manual`).
- **Remove hold** — only clears **manual** holds, and only when no active refund or dispute exists.

### Disputed payments

Use the order detail and payout ledger to see dispute status. Do not release until dispute is resolved or policy allows. Document any manual settlement outside the app.

---

## 9. Open decisions

These product/policy choices are **not fully finalized** in code or legal copy:

| Topic | Options / notes |
|-------|------------------|
| **Final payout delay** | Code supports **24, 48, or 72 hours** after event end (default **48**). Pick one for Terms and ops. |
| **Refundable ViZB service fee?** | Today fees are charged at checkout; full refund flow voids the ticket but fee refund policy for buyers is **TBD**. |
| **Refundable processing fee?** | Processing is passed to the buyer; on refund, Stripe typically keeps processing cost — **TBD** whether buyer sees partial refund. |
| **Organizer absorbs fees** | Future option: organizer chooses to absorb ViZB or processing fees instead of passing to buyer. **Not built.** |
| **Premium organizer pricing** | Future tiered platform fees for partners. **Not built.** |
| **Clawback after release** | If payout released then refunded/disputed, manual reversal process **TBD**. |

Record decisions here when Elaine and Lionel sign off; update this doc and any public Terms accordingly.

---

## Quick reference (engineers)

| Topic | Location |
|-------|----------|
| Pricing constants | `lib/payments/vizb-pricing-config.ts` |
| Fee calculator | `lib/payments/calculate-vizb-ticket-pricing.ts` |
| Checkout line items + metadata | `lib/payments/build-ticket-checkout-presentation.ts` |
| Checkout action | `app/actions/ticket-checkout.ts` |
| Webhook handlers | `app/api/stripe/webhook/route.ts`, `lib/stripe/webhook-handlers.ts` |
| Connect onboarding | `app/actions/organizer-stripe-connect.ts` |
| Payout record creation | `lib/payments/create-organizer-payout-record.ts` |
| Payout release | `lib/payments/release-organizer-payouts.ts` |
| Admin actions | `app/actions/admin-payments.ts` |
| Migrations | `supabase/migrations/20260616150000_order_fee_payout_canonical_fields.sql`, `20260616160000_organizer_stripe_accounts.sql`, `20260616170000_organizer_payouts.sql` |

---

*ViBE LLC — internal use. Update this file when pricing, payout timing, or refund policy changes.*
