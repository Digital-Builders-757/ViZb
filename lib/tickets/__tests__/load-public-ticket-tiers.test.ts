import { describe, expect, it } from "vitest"

import {
  partitionPublicTicketTiers,
  type PublicFreeTier,
  type PublicPaidTier,
} from "@/lib/tickets/load-public-ticket-tiers"

describe("partitionPublicTicketTiers", () => {
  const now = new Date("2026-06-15T12:00:00.000Z")

  it("splits free and paid tiers on sale", () => {
    const { freeTicketTiers, paidTicketTiers } = partitionPublicTicketTiers(
      [
        { id: "free-1", name: "RSVP", price_cents: 0, is_active: true },
        { id: "paid-1", name: "GA", price_cents: 2500, is_active: true },
      ],
      now,
    )
    expect(freeTicketTiers).toEqual<PublicFreeTier[]>([{ id: "free-1", name: "RSVP" }])
    expect(paidTicketTiers).toEqual<PublicPaidTier[]>([
      { id: "paid-1", name: "GA", price_cents: 2500 },
    ])
  })

  it("skips inactive tiers", () => {
    const { paidTicketTiers } = partitionPublicTicketTiers(
      [{ id: "paid-1", name: "GA", price_cents: 2500, is_active: false }],
      now,
    )
    expect(paidTicketTiers).toEqual([])
  })

  it("respects legacy sales_starts_at / sales_ends_at windows", () => {
    const { paidTicketTiers } = partitionPublicTicketTiers(
      [
        {
          id: "future",
          name: "Early bird",
          price_cents: 1000,
          is_active: true,
          sales_starts_at: "2026-06-16T00:00:00.000Z",
        },
        {
          id: "live",
          name: "GA",
          price_cents: 2500,
          is_active: true,
          sales_ends_at: "2026-06-20T00:00:00.000Z",
        },
        {
          id: "ended",
          name: "Late",
          price_cents: 3000,
          is_active: true,
          sales_ends_at: "2026-06-14T00:00:00.000Z",
        },
      ],
      now,
    )
    expect(paidTicketTiers.map((t) => t.id)).toEqual(["live"])
  })

  it("respects sales_start_at / sales_end_at when present", () => {
    const { paidTicketTiers } = partitionPublicTicketTiers(
      [
        {
          id: "live",
          name: "GA",
          price_cents: 2500,
          is_active: true,
          sales_start_at: "2026-06-01T00:00:00.000Z",
          sales_end_at: "2026-06-20T00:00:00.000Z",
        },
      ],
      now,
    )
    expect(paidTicketTiers).toHaveLength(1)
  })
})
