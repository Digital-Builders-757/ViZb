import { describe, expect, it } from "vitest"
import { buildStaffPicksMoment } from "@/lib/events/discovery-featured-moments"
import type { ListingEvent } from "@/lib/events/listing-event"
import { getListingEventPriceLabel, getListingTicketStatus, listingOffersVizbTickets } from "@/lib/events/listing-event"
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

  it("does not treat community Free listing as ViZb ticketing", () => {
    const communityOpts = { isCommunity: true as const }
    expect(getListingEventPriceLabel([], communityOpts)).toBe("Free listing")
    expect(listingOffersVizbTickets([], communityOpts)).toBe(false)
    expect(
      listingOffersVizbTickets(
        [{ price_cents: 2000, sales_starts_at: null, sales_ends_at: null }],
        communityOpts,
      ),
    ).toBe(false)
    expect(listingOffersVizbTickets([], { isCommunity: false })).toBe(true)
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

describe("buildStaffPicksMoment", () => {
  it("returns staff picks moment when at least two staff picks exist", () => {
    const events = [
      mockEvent({ id: "a", is_staff_pick: true }),
      mockEvent({ id: "b", is_staff_pick: true, slug: "b" }),
      mockEvent({ id: "c", slug: "c" }),
    ]
    const moment = buildStaffPicksMoment(events)
    expect(moment?.kind).toBe("staff_picks")
    expect(moment?.events).toHaveLength(2)
  })

  it("returns null when fewer than two staff picks exist", () => {
    expect(buildStaffPicksMoment([mockEvent({ is_staff_pick: true })])).toBeNull()
  })
})
