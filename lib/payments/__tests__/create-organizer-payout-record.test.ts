import { describe, expect, it, vi } from "vitest"

import { createOrganizerPayoutRecordForOrder } from "@/lib/payments/create-organizer-payout-record"
import { ORGANIZER_PAYOUT_STATUS } from "@/lib/payments/organizer-payout-types"

const ORDER_ID = "11111111-1111-4111-8111-111111111111"
const EVENT_ID = "22222222-2222-4222-8222-222222222222"
const ORGANIZER_ID = "33333333-3333-4333-8333-333333333333"

function buildAdmin({
  existingPayout = null as { id: string } | null,
  order = {
    id: ORDER_ID,
    event_id: EVENT_ID,
    ticket_subtotal_cents: 2000,
    vizb_service_fee_cents: 200,
    processing_fee_cents: 97,
    buyer_total_cents: 2297,
    organizer_payout_cents: 2000,
    status: "completed",
    payment_status: "paid",
    refund_status: "none",
    dispute_status: "none",
    payout_blocked: false,
    payout_blocked_reason: null,
  },
  event = {
    id: EVENT_ID,
    created_by: ORGANIZER_ID,
    starts_at: "2026-06-01T19:00:00.000Z",
    ends_at: "2026-06-01T22:00:00.000Z",
  },
  stripeAccount = {
    stripe_account_id: "acct_test",
    payouts_enabled: true,
  },
}: {
  existingPayout?: { id: string } | null
  order?: Record<string, unknown>
  event?: Record<string, unknown>
  stripeAccount?: Record<string, unknown> | null
} = {}) {
  const insertSpy = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      maybeSingle: vi.fn().mockResolvedValue({ data: { id: "payout-1" }, error: null }),
    }),
  })

  return {
    admin: {
      from: vi.fn((table: string) => {
        if (table === "organizer_payouts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: existingPayout, error: null }),
              }),
            }),
            insert: insertSpy,
          }
        }
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
              }),
            }),
          }
        }
        if (table === "events") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: event, error: null }),
              }),
            }),
          }
        }
        if (table === "organizer_stripe_accounts") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({ data: stripeAccount, error: null }),
              }),
            }),
          }
        }
        throw new Error(`Unexpected table ${table}`)
      }),
    },
    insertSpy,
  }
}

describe("createOrganizerPayoutRecordForOrder", () => {
  it("skips free orders", async () => {
    const { admin } = buildAdmin({
      order: {
        id: ORDER_ID,
        event_id: EVENT_ID,
        ticket_subtotal_cents: 0,
        organizer_payout_cents: 0,
        vizb_service_fee_cents: 0,
        processing_fee_cents: 0,
        buyer_total_cents: 0,
        status: "completed",
        payment_status: "paid",
        refund_status: "none",
        dispute_status: "none",
        payout_blocked: false,
        payout_blocked_reason: null,
      },
    })

    const result = await createOrganizerPayoutRecordForOrder(admin as never, ORDER_ID)
    expect(result).toEqual({ created: false, skipped: true, reason: "free_order" })
  })

  it("creates pending payout with future available_on", async () => {
    vi.stubEnv("VIZB_PAYOUT_DELAY_HOURS", "24")
    const { admin, insertSpy } = buildAdmin()

    const result = await createOrganizerPayoutRecordForOrder(admin as never, ORDER_ID)
    expect(result).toEqual({ created: true, payoutId: "payout-1" })
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        order_id: ORDER_ID,
        organizer_payout_cents: 2000,
        status: ORGANIZER_PAYOUT_STATUS.pending,
        stripe_connected_account_id: "acct_test",
        available_on: "2026-06-02T22:00:00.000Z",
      }),
    )
    vi.unstubAllEnvs()
  })

  it("creates blocked payout when order payout is blocked", async () => {
    const { admin, insertSpy } = buildAdmin({
      order: {
        id: ORDER_ID,
        event_id: EVENT_ID,
        ticket_subtotal_cents: 2000,
        vizb_service_fee_cents: 200,
        processing_fee_cents: 97,
        buyer_total_cents: 2297,
        organizer_payout_cents: 2000,
        status: "completed",
        payment_status: "paid",
        refund_status: "none",
        dispute_status: "none",
        payout_blocked: true,
        payout_blocked_reason: "refund",
      },
    })

    await createOrganizerPayoutRecordForOrder(admin as never, ORDER_ID)
    expect(insertSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ORGANIZER_PAYOUT_STATUS.blocked,
        blocked_reason: "refund",
      }),
    )
  })

  it("is idempotent when payout already exists", async () => {
    const { admin } = buildAdmin({ existingPayout: { id: "existing" } })
    const result = await createOrganizerPayoutRecordForOrder(admin as never, ORDER_ID)
    expect(result).toEqual({ created: false, existing: true, payoutId: "existing" })
  })
})
