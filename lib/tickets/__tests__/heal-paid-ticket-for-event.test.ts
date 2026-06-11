import { describe, expect, it, vi } from "vitest"

import { healPaidTicketForEvent } from "@/lib/tickets/heal-paid-ticket-for-event"

vi.mock("@/lib/stripe/env", () => ({
  isStripeCheckoutConfigured: vi.fn(() => true),
}))

vi.mock("@/lib/stripe/server", () => ({
  getStripe: vi.fn(),
}))

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: vi.fn(),
}))

vi.mock("@/lib/stripe/fulfill-checkout-session", () => ({
  fulfillPaidCheckoutSession: vi.fn(),
}))

const userId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa"
const eventId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb"
const orderId = "cccccccc-cccc-4ccc-8ccc-cccccccccccc"

describe("healPaidTicketForEvent", () => {
  it("returns existing ticket when order already has one", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "orders") {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            gt: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: [{ id: orderId, status: "completed", total_cents: 2500, stripe_checkout_session_id: "cs_1" }],
              error: null,
            }),
          }
        }
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          maybeSingle: vi.fn().mockResolvedValue({
            data: { id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" },
            error: null,
          }),
        }
      }),
    }

    const result = await healPaidTicketForEvent(supabase as never, userId, eventId)
    expect(result).toEqual({ ticketId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd" })
  })

  it("returns null when no paid orders exist", async () => {
    const supabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        gt: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }

    const result = await healPaidTicketForEvent(supabase as never, userId, eventId)
    expect(result).toBeNull()
  })
})
