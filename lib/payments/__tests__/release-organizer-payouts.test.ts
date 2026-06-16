import { beforeEach, describe, expect, it, vi } from "vitest"

import { releaseOrganizerPayouts } from "@/lib/payments/release-organizer-payouts"
import { ORGANIZER_PAYOUT_STATUS } from "@/lib/payments/organizer-payout-types"

const mockTransferCreate = vi.fn()

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    transfers: { create: mockTransferCreate },
    paymentIntents: { retrieve: vi.fn() },
  }),
}))

const PAYOUT_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const ORDER_ID = "11111111-1111-4111-8111-111111111111"
const EVENT_ID = "22222222-2222-4222-8222-222222222222"
const ORGANIZER_ID = "33333333-3333-4333-8333-333333333333"

const basePayout = {
  id: PAYOUT_ID,
  order_id: ORDER_ID,
  event_id: EVENT_ID,
  organizer_id: ORGANIZER_ID,
  stripe_connected_account_id: "acct_test",
  organizer_payout_cents: 2000,
  vizb_service_fee_cents: 200,
  processing_fee_cents: 97,
  buyer_total_cents: 2297,
  status: ORGANIZER_PAYOUT_STATUS.pending,
  available_on: "2020-01-01T00:00:00.000Z",
  stripe_transfer_id: null,
  blocked_reason: null,
  failure_reason: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
}

const baseOrder = {
  id: ORDER_ID,
  status: "completed",
  payment_status: "paid",
  refund_status: "none",
  dispute_status: "none",
  payout_blocked: false,
  payout_blocked_reason: null,
  payout_released_at: null,
  stripe_charge_id: "ch_test",
  stripe_payment_intent_id: "pi_test",
}

function buildReleaseAdmin(payouts: typeof basePayout[]) {
  let payoutUpdateCount = 0
  let orderUpdateCount = 0

  const admin = {
    from: vi.fn((table: string) => {
      if (table === "organizer_payouts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: payouts, error: null }),
          }),
          update: vi.fn((patch: Record<string, unknown>) => ({
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockImplementation(async () => {
                payoutUpdateCount += 1
                if (patch.status === ORGANIZER_PAYOUT_STATUS.releasing) {
                  return { data: { ...basePayout, ...patch }, error: null }
                }
                return { data: null, error: null }
              }),
            }),
          })),
        }
      }
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: baseOrder, error: null }),
            }),
          }),
          update: vi.fn(() => {
            orderUpdateCount += 1
            return { eq: vi.fn().mockResolvedValue({ error: null }) }
          }),
        }
      }
      if (table === "organizer_stripe_accounts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: {
                  organizer_id: ORGANIZER_ID,
                  stripe_account_id: "acct_test",
                  payouts_enabled: true,
                  charges_enabled: true,
                  details_submitted: true,
                },
                error: null,
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    }),
    payoutUpdateCount: () => payoutUpdateCount,
    orderUpdateCount: () => orderUpdateCount,
  }

  return admin
}

describe("releaseOrganizerPayouts", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTransferCreate.mockResolvedValue({ id: "tr_test_123" })
  })

  it("creates Stripe transfer and marks payout released", async () => {
    const admin = buildReleaseAdmin([basePayout])
    const result = await releaseOrganizerPayouts(admin as never, { limit: 5 })

    expect(result.released).toBe(1)
    expect(mockTransferCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 2000,
        destination: "acct_test",
        source_transaction: "ch_test",
      }),
      { idempotencyKey: `organizer-payout-${PAYOUT_ID}` },
    )
    expect(admin.orderUpdateCount()).toBeGreaterThan(0)
  })

  it("blocks payout when order has refund", async () => {
    const admin = buildReleaseAdmin([basePayout])
    const from = admin.from as ReturnType<typeof vi.fn>
    from.mockImplementation((table: string) => {
      if (table === "organizer_payouts") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
            is: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({ data: [basePayout], error: null }),
          }),
          update: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnThis(), in: vi.fn().mockResolvedValue({ error: null }) }),
        }
      }
      if (table === "orders") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { ...baseOrder, refund_status: "full" },
                error: null,
              }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table ${table}`)
    })

    const result = await releaseOrganizerPayouts(admin as never)
    expect(result.blocked).toBe(1)
    expect(mockTransferCreate).not.toHaveBeenCalled()
  })

  it("skips payout that is not available yet", async () => {
    const admin = buildReleaseAdmin([])
    const result = await releaseOrganizerPayouts(admin as never)
    expect(result).toEqual({ scanned: 0, released: 0, blocked: 0, failed: 0, skipped: 0 })
    expect(mockTransferCreate).not.toHaveBeenCalled()
  })
})
