import { describe, expect, it } from "vitest"
import { planFeaturedMoments } from "@/lib/events/discovery-featured-moments"
import type { ListingEvent } from "@/lib/events/listing-event"
import { getListingEventPriceLabel, getListingTicketStatus } from "@/lib/events/listing-event"
import { matchesPaid } from "@/lib/events/discovery-filters"

function mockEvent(overrides: Partial<ListingEvent> = {}): ListingEvent {
  return {
    id: "e1",
    title: "Test",
    slug: "test",
    description: null,
    starts_at: "2026-06-14T22:00:00.000Z",
    ends_at: null,
    venue_name: "Venue",
    city: "Norfolk",
    categories: ["party"],
    flyer_url: null,
    org_name: "Org",
    org_slug: null,
    event_kind: "official",
    is_staff_pick: false,
    ticket_types: [{ price_cents: 1500, sales_starts_at: null, sales_ends_at: null }],
    ...overrides,
  }
}

describe("listing event display", () => {
  it("labels paid and free tiers", () => {
    expect(getListingEventPriceLabel([{ price_cents: 2000, sales_starts_at: null, sales_ends_at: null }])).toBe(
      "From $20",
    )
    expect(getListingTicketStatus([{ price_cents: 0, sales_starts_at: null, sales_ends_at: null }])).toBe("free")
    expect(getListingTicketStatus([{ price_cents: 500, sales_starts_at: null, sales_ends_at: null }])).toBe("paid")
  })

  it("matches paid discovery preset", () => {
    const now = new Date("2026-06-12T12:00:00.000Z")
    expect(
      matchesPaid({
        isCommunity: false,
        ticketTypes: [{ price_cents: 1000, sales_starts_at: null, sales_ends_at: null }],
        now,
      }),
    ).toBe(true)
    expect(matchesPaid({ isCommunity: true, ticketTypes: [{ price_cents: 1000, sales_starts_at: null, sales_ends_at: null }], now })).toBe(
      false,
    )
  })
})

describe("planFeaturedMoments", () => {
  it("inserts staff picks after first date group when enough picks exist", () => {
    const events = [
      mockEvent({ id: "a", is_staff_pick: true }),
      mockEvent({ id: "b", is_staff_pick: true, slug: "b" }),
      mockEvent({ id: "c", slug: "c" }),
    ]
    const grouped = { "2026-06-14": events }
    const moments = planFeaturedMoments(["2026-06-14"], grouped, events, new Date("2026-06-12T12:00:00.000Z"))
    expect(moments.get(0)?.kind).toBe("staff_picks")
    expect(moments.get(0)?.events).toHaveLength(2)
  })
})
