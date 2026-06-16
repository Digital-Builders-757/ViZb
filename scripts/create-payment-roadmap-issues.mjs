import { execSync } from "node:child_process"

const issues = [
  {
    title: "Centralize VIZB pricing config",
    milestone: "M1 — Fee System Fix",
    labels: "priority: high,type: feature,area: pricing,area: docs",
    body: `## Goal
Single source of truth for launch pricing constants and env overrides.

## Context
Launch model: 5% + $1.00/ticket, $5 min paid ticket, processing fee passed to buyer (separate issues). Today fee defaults live in \`lib/payments/ticket-fees.ts\` and \`.env.example\` with $0 fixed fee and $0.50 min tier validation elsewhere.

## Tasks
- [ ] Document canonical pricing constants in one module (percent, fixed per ticket, min ticket cents)
- [ ] Align \`.env.example\` with launch defaults
- [ ] Remove scattered magic numbers from UI copy validators

## Acceptance criteria
- [ ] One module exports launch defaults and env parsing
- [ ] Admin diagnostics reflect configured values
- [ ] No conflicting min-price constants across the repo

## Dependencies
- Blocks: Enforce $5 minimum paid ticket rule, Align shared fee calculation helper

## References
- docs/payment-system-audit.md`,
  },
  {
    title: "Align shared fee calculation helper with launch fee model",
    milestone: "M1 — Fee System Fix",
    labels: "priority: high,type: refactor,area: pricing,area: checkout",
    body: `## Goal
Update the existing fee helper to match launch pricing: **5% + $1.00 per paid ticket** (not per order).

## Context
\`lib/payments/ticket-fees.ts\` exists but fixed fee defaults to 0¢ and is applied per order while qty=1.

## Tasks
- [ ] Default fixed fee to 100¢ per ticket
- [ ] Apply fixed fee per ticket (respect future qty > 1)
- [ ] Update checkout + preview callers
- [ ] Extend unit tests

## Acceptance criteria
- [ ] $5 ticket → fee $1.25 (5% + $1)
- [ ] $25 ticket → fee $2.25
- [ ] Tests cover env overrides

## Dependencies
- Depends on: Centralize VIZB pricing config`,
  },
  {
    title: "Enforce $5 minimum paid ticket rule",
    milestone: "M1 — Fee System Fix",
    labels: "priority: high,type: feature,area: pricing,area: checkout",
    body: `## Goal
Enforce **$5.00 minimum** paid ticket price at tier creation and checkout.

## Context
\`MIN_PAID_TICKET_CENTS = 50\` today (Stripe floor). Launch requires $5.00.

## Tasks
- [ ] Update \`paid-tier-validation.ts\` to 500¢
- [ ] Align organizer/admin UI copy
- [ ] Re-validate at checkout session creation
- [ ] Add tests

## Acceptance criteria
- [ ] Tiers below $5 rejected on create/update
- [ ] Checkout rejects sub-$5 tiers defensively
- [ ] Free RSVP tiers unchanged

## Dependencies
- Depends on: Centralize VIZB pricing config`,
  },
  {
    title: "Add pricing calculation tests",
    milestone: "M1 — Fee System Fix",
    labels: "priority: medium,type: test,area: pricing",
    body: `## Goal
Regression tests for launch fee math across helper, checkout action, and UI preview.

## Context
Closed #176 covered checkout regression; launch fee model needs expanded matrix.

## Tasks
- [ ] Extend \`lib/payments/__tests__/ticket-fees.test.ts\`
- [ ] Add cases to \`app/actions/__tests__/ticket-checkout.test.ts\`
- [ ] Cover $5 min edge cases

## Acceptance criteria
- [ ] CI fails if fee formula or min price regresses
- [ ] Documented examples match launch model

## Dependencies
- Depends on: Align shared fee calculation helper with launch fee model`,
  },
  {
    title: "Update checkout preview fee breakdown",
    milestone: "M2 — Checkout + Stripe Receipt Alignment",
    labels: "priority: high,type: feature,area: checkout,area: pricing",
    body: `## Goal
Buyer-facing pre-checkout breakdown shows ticket subtotal, ViZb fee, processing fee (when added), and total.

## Context
\`EventRsvpCta\` shows subtotal · ViZb fee · Total today; processing passthrough not shown yet.

## Tasks
- [ ] Update preview copy/layout for full buyer-paid total
- [ ] Match labels to Stripe Checkout line items
- [ ] Mobile-friendly layout

## Acceptance criteria
- [ ] Preview total matches Stripe session total
- [ ] Processing fee visible when enabled

## Dependencies
- Depends on: Align shared fee calculation helper; processing fee issue (future)`,
  },
  {
    title: "Align Stripe Checkout line items with VIZB fee model",
    milestone: "M2 — Checkout + Stripe Receipt Alignment",
    labels: "priority: high,type: feature,area: checkout,area: stripe",
    body: `## Goal
Stripe Checkout session line items reflect launch fee model (ticket, platform fee, processing fee when enabled).

## Context
\`createTicketCheckoutSession\` creates two line items today (ticket + platform fee).

## Tasks
- [ ] Add processing fee line item when passthrough enabled
- [ ] Rename line items for buyer clarity
- [ ] Keep metadata for webhook fulfillment

## Acceptance criteria
- [ ] Line items sum to order \`total_cents\`
- [ ] Fulfillment RPC amount check still passes

## Dependencies
- Depends on: Align shared fee calculation helper, Store full fee breakdown on orders`,
  },
  {
    title: "Store full fee breakdown on orders",
    milestone: "M2 — Checkout + Stripe Receipt Alignment",
    labels: "priority: high,type: feature,area: database,area: pricing",
    body: `## Goal
Persist processing fee and per-ticket fee components on \`orders\` for receipts, admin, and payouts.

## Context
Today: \`subtotal_cents\`, \`platform_fee_cents\`, \`total_cents\` with CHECK \`total = subtotal + platform_fee\`. Processing fee will break this constraint.

## Tasks
- [ ] New migration: \`processing_fee_cents\`, optional fee snapshot JSON
- [ ] Update CHECK constraint for new total formula
- [ ] Snapshot fees at order creation

## Acceptance criteria
- [ ] Order row auditable after checkout
- [ ] Admin revenue can show full breakdown

## Dependencies
- Blocks: Align Stripe Checkout line items, Add admin order and payout breakdown view`,
  },
  {
    title: "Sync organizer Stripe account status from webhooks",
    milestone: "M3 — Stripe Connect Organizer Onboarding",
    labels: "priority: high,type: feature,area: connect,area: webhooks,area: database",
    body: `## Goal
Keep org Connect capability flags current via Stripe webhooks.

## Context
#230 adds DB fields; onboarding alone is insufficient without \`account.updated\` sync.

## Tasks
- [ ] Handle \`account.updated\` (and related) webhooks
- [ ] Update org payout status flags
- [ ] Staff diagnostics for requirements due

## Acceptance criteria
- [ ] Org payout-ready state matches Stripe Dashboard
- [ ] Idempotent webhook processing

## Dependencies
- Depends on: #230 Add organizer payout setup status to organizations`,
  },
  {
    title: "Add payout release function for organizers",
    milestone: "M4 — Organizer Payout Engine",
    labels: "priority: high,type: feature,area: payouts,area: database",
    body: `## Goal
Release organizer net revenue after hold period, respecting refund/dispute blocks.

## Context
Ledger (#234) records amounts; release moves status from pending → available → paid.

## Tasks
- [ ] Define release eligibility rules (event ended, hold days, no blocks)
- [ ] Implement release RPC or job
- [ ] Set \`payout_released_at\` on order/ledger rows
- [ ] Organizer-visible status

## Acceptance criteria
- [ ] Blocked orders never release
- [ ] Release is idempotent and auditable

## Dependencies
- Depends on: #234, Add refund and dispute payout blocking`,
  },
  {
    title: "Add refund and dispute payout blocking",
    milestone: "M5 — Refunds, Disputes, and Risk Controls",
    labels: "priority: high,type: feature,area: webhooks,area: payouts",
    body: `## Goal
Ensure refunds and disputes block organizer payout until resolved.

## Context
Initial webhook hardening landed in repo (charge.refunded, refund.updated, dispute events). Verify in staging/prod and wire to ledger release.

## Tasks
- [ ] Verify webhook handlers in deployed env
- [ ] Connect \`payout_blocked\` to ledger release (#237+)
- [ ] Admin visibility for blocked orders
- [ ] Document Stripe Dashboard event subscriptions

## Acceptance criteria
- [ ] Full refund voids ticket and blocks payout
- [ ] Open dispute blocks payout immediately
- [ ] Duplicate webhook events ignored

## Dependencies
- Related: Store full fee breakdown on orders`,
  },
  {
    title: "Add admin order and payout breakdown view",
    milestone: "M5 — Refunds, Disputes, and Risk Controls",
    labels: "priority: medium,type: feature,area: admin,area: payouts",
    body: `## Goal
Staff admin view of order fees, payout status, refund/dispute flags (extends closed #126).

## Context
\`/admin/revenue\` shows subtotal vs platform fee; no payout/refund/dispute columns.

## Tasks
- [ ] Extend revenue loader with new order fields
- [ ] Show payout_blocked, refund_status, dispute_status
- [ ] Link to Stripe session/charge IDs

## Acceptance criteria
- [ ] Staff can reconcile a paid order end-to-end
- [ ] Not confused with Stripe net settlement

## Dependencies
- Depends on: Store full fee breakdown on orders`,
  },
]

for (const issue of issues) {
  const labels = issue.labels
  const cmd = `gh issue create --title "${issue.title.replace(/"/g, '\\"')}" --milestone "${issue.milestone}" --label "${labels}" --body-file -`
  try {
    const out = execSync(cmd, { input: issue.body, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] })
    console.log("CREATED:", out.trim())
  } catch (e) {
    console.error("FAILED:", issue.title, e.stderr?.toString() || e.message)
  }
}
