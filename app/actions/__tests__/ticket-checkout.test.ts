/**
 * Checkout session creation guards — rejects invalid tiers/events without live Stripe calls.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mockRequireAuth = vi.fn()
const mockFrom = vi.fn()
const mockRpc = vi.fn()
const mockServiceFrom = vi.fn()
const mockStripeCreate = vi.fn()

vi.mock("@/lib/auth-helpers", () => ({
  requireAuth: () => mockRequireAuth(),
}))

vi.mock("@/lib/stripe/env", () => ({
  isStripeCheckoutConfigured: () => true,
}))

vi.mock("@/lib/stripe/server", () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: mockStripeCreate,
        retrieve: vi.fn(),
      },
    },
  }),
}))

vi.mock("@/lib/supabase/service-role", () => ({
  createServiceRoleClient: () => ({
    from: mockServiceFrom,
    rpc: vi.fn(),
  }),
}))

vi.mock("@/lib/public-site-url", () => ({
  getPublicSiteOrigin: () => "https://example.com",
}))

function chainable(result: { data: unknown; error: unknown; count?: number }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(result),
    single: vi.fn().mockResolvedValue(result),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
  }
  return chain
}

const EVENT_ID = "11111111-1111-4111-8111-111111111111"
const TIER_ID = "22222222-2222-4222-8222-222222222222"

const baseEnv = { ...process.env }

afterEach(() => {
  process.env = { ...baseEnv }
  vi.unstubAllEnvs()
})

describe("createTicketCheckoutSession", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAuth.mockResolvedValue({
      user: { id: "user-1", email: "buyer@example.com" },
      supabase: { from: mockFrom, rpc: mockRpc },
    })
    mockRpc.mockResolvedValue({ data: 0, error: null })
    mockStripeCreate.mockResolvedValue({
      id: "cs_test_123",
      url: "https://checkout.stripe.com/pay/cs_test_123",
      payment_intent: "pi_test_123",
    })
  })

  it("rejects free tiers", async () => {
    const ttChain = chainable({
      data: {
        id: TIER_ID,
        event_id: EVENT_ID,
        name: "Free",
        price_cents: 0,
        currency: "usd",
        is_active: true,
      },
      error: null,
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === "ticket_types") return ttChain
      return chainable({ data: null, error: null })
    })

    const { createTicketCheckoutSession } = await import("@/app/actions/ticket-checkout")
    const result = await createTicketCheckoutSession({ eventId: EVENT_ID, ticketTypeId: TIER_ID })
    expect(result.error).toMatch(/free/i)
    expect(mockStripeCreate).not.toHaveBeenCalled()
  })

  it("rejects inactive tiers", async () => {
    const ttChain = chainable({
      data: {
        id: TIER_ID,
        event_id: EVENT_ID,
        name: "GA",
        price_cents: 2500,
        currency: "usd",
        is_active: false,
      },
      error: null,
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === "ticket_types") return ttChain
      return chainable({ data: null, error: null })
    })

    const { createTicketCheckoutSession } = await import("@/app/actions/ticket-checkout")
    const result = await createTicketCheckoutSession({ eventId: EVENT_ID, ticketTypeId: TIER_ID })
    expect(result.error).toMatch(/not active/i)
  })

  it("rejects unpublished events", async () => {
    const ttChain = chainable({
      data: {
        id: TIER_ID,
        event_id: EVENT_ID,
        name: "GA",
        price_cents: 2500,
        currency: "usd",
        is_active: true,
      },
      error: null,
    })
    const evChain = chainable({
      data: { id: EVENT_ID, status: "draft", slug: "draft-event", title: "Draft", rsvp_capacity: null },
      error: null,
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === "ticket_types") return ttChain
      if (table === "events") return evChain
      return chainable({ data: null, error: null })
    })

    const { createTicketCheckoutSession } = await import("@/app/actions/ticket-checkout")
    const result = await createTicketCheckoutSession({ eventId: EVENT_ID, ticketTypeId: TIER_ID })
    expect(result.error).toMatch(/not available/i)
  })

  it("creates checkout with ticket + fee line items when fee > 0", async () => {
    const ttChain = chainable({
      data: {
        id: TIER_ID,
        event_id: EVENT_ID,
        name: "GA",
        price_cents: 2000,
        currency: "usd",
        is_active: true,
        quantity_total: null,
      },
      error: null,
    })
    const evChain = chainable({
      data: { id: EVENT_ID, status: "published", slug: "live-event", title: "Live", rsvp_capacity: null },
      error: null,
    })
    const regChain = chainable({ data: null, error: null })
    const ticketsCountChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
      }),
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === "ticket_types") return ttChain
      if (table === "events") return evChain
      if (table === "event_registrations") return regChain
      if (table === "tickets") return ticketsCountChain
      return chainable({ data: null, error: null })
    })

    const orderInsertChain = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }
    const orderItemsChain = {
      insert: vi.fn().mockResolvedValue({ error: null }),
    }
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === "orders") return orderInsertChain
      if (table === "order_items") return orderItemsChain
      return chainable({ data: null, error: null })
    })

    const { createTicketCheckoutSession } = await import("@/app/actions/ticket-checkout")
    const result = await createTicketCheckoutSession({ eventId: EVENT_ID, ticketTypeId: TIER_ID })

    expect(result.url).toContain("checkout.stripe.com")
    expect(mockStripeCreate).toHaveBeenCalledOnce()
    const args = mockStripeCreate.mock.calls[0][0]
    expect(args.line_items).toHaveLength(2)
    expect(args.line_items[0].price_data.unit_amount).toBe(2000)
    expect(args.line_items[1].price_data.unit_amount).toBe(100)
    expect(orderInsertChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        subtotal_cents: 2000,
        platform_fee_cents: 100,
        total_cents: 2100,
      }),
    )
  })

  it("rejects sold-out tiers", async () => {
    const ttChain = chainable({
      data: {
        id: TIER_ID,
        event_id: EVENT_ID,
        name: "GA",
        price_cents: 2500,
        currency: "usd",
        is_active: true,
        quantity_total: 2,
      },
      error: null,
    })
    const evChain = chainable({
      data: { id: EVENT_ID, status: "published", slug: "live-event", title: "Live", rsvp_capacity: null },
      error: null,
    })
    const regChain = chainable({ data: null, error: null })
    const ticketsSoldChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            { event_registrations: { status: "confirmed" } },
            { event_registrations: { status: "checked_in" } },
          ],
          error: null,
        }),
      }),
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === "ticket_types") return ttChain
      if (table === "events") return evChain
      if (table === "event_registrations") return regChain
      if (table === "tickets") return ticketsSoldChain
      return chainable({ data: null, error: null })
    })

    const { createTicketCheckoutSession } = await import("@/app/actions/ticket-checkout")
    const result = await createTicketCheckoutSession({ eventId: EVENT_ID, ticketTypeId: TIER_ID })
    expect(result.error).toMatch(/sold out/i)
    expect(mockStripeCreate).not.toHaveBeenCalled()
  })

  it("skips fee line item when platform fee is zero", async () => {
    vi.stubEnv("TICKET_PLATFORM_FEE_PERCENT", "0")
    vi.stubEnv("TICKET_PLATFORM_FEE_FIXED_CENTS", "0")

    const ttChain = chainable({
      data: {
        id: TIER_ID,
        event_id: EVENT_ID,
        name: "GA",
        price_cents: 1500,
        currency: "usd",
        is_active: true,
        quantity_total: null,
      },
      error: null,
    })
    const evChain = chainable({
      data: { id: EVENT_ID, status: "published", slug: "live-event", title: "Live", rsvp_capacity: null },
      error: null,
    })
    const regChain = chainable({ data: null, error: null })
    const ticketsCountChain = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    }

    mockFrom.mockImplementation((table: string) => {
      if (table === "ticket_types") return ttChain
      if (table === "events") return evChain
      if (table === "event_registrations") return regChain
      if (table === "tickets") return ticketsCountChain
      return chainable({ data: null, error: null })
    })

    const orderInsertChain = {
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { id: "order-1" }, error: null }),
        }),
      }),
      update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) }),
    }
    mockServiceFrom.mockImplementation((table: string) => {
      if (table === "orders") return orderInsertChain
      if (table === "order_items") return { insert: vi.fn().mockResolvedValue({ error: null }) }
      return chainable({ data: null, error: null })
    })

    const { createTicketCheckoutSession } = await import("@/app/actions/ticket-checkout")
    const result = await createTicketCheckoutSession({ eventId: EVENT_ID, ticketTypeId: TIER_ID })

    expect(result.url).toContain("checkout.stripe.com")
    const args = mockStripeCreate.mock.calls[0][0]
    expect(args.line_items).toHaveLength(1)
    expect(args.line_items[0].price_data.unit_amount).toBe(1500)
  })
})
