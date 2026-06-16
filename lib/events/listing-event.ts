import type { TicketStub } from "@/lib/events/discovery-filters"

/** Normalized public event row for `/events` listing surfaces. */
export type ListingEvent = {
  id: string
  title: string
  slug: string
  description: string | null
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
  org_name: string
  org_slug: string | null
  event_kind: "official" | "community"
  is_staff_pick: boolean
  ticket_types: TicketStub[]
}

export type ListingTicketStatus = "free" | "paid" | "rsvp" | "none"

function tierOnSale(row: TicketStub, now: Date): boolean {
  if (row.sales_starts_at && new Date(row.sales_starts_at) > now) return false
  if (row.sales_ends_at && new Date(row.sales_ends_at) < now) return false
  return true
}

/** Lowest on-sale tier price in cents, or null when no priced tiers are on sale. */
export function getListingLowestPriceCents(ticketTypes: TicketStub[], now: Date = new Date()): number | null {
  let lowest: number | null = null
  for (const row of ticketTypes) {
    if (!tierOnSale(row, now)) continue
    const price = typeof row.price_cents === "number" ? row.price_cents : Number(row.price_cents)
    if (!Number.isFinite(price)) continue
    if (lowest === null || price < lowest) lowest = price
  }
  return lowest
}

export function getListingEventPriceLabel(
  ticketTypes: TicketStub[],
  opts?: { isCommunity?: boolean; now?: Date },
): string | null {
  if (opts?.isCommunity) return "Free listing"
  const now = opts?.now ?? new Date()
  const lowest = getListingLowestPriceCents(ticketTypes, now)
  if (lowest === null) {
    return ticketTypes.length === 0 ? "Free RSVP" : null
  }
  if (lowest === 0) return "Free"
  return `From $${(lowest / 100).toFixed(0)}`
}

/** True when the listing supports ViZb-native RSVP or ticket checkout (not external community listings). */
export function listingOffersVizbTickets(
  ticketTypes: TicketStub[],
  opts?: { isCommunity?: boolean; now?: Date },
): boolean {
  if (opts?.isCommunity) return false
  return getListingEventPriceLabel(ticketTypes, opts) !== null
}

export function getListingTicketStatus(
  ticketTypes: TicketStub[],
  opts?: { isCommunity?: boolean; now?: Date },
): ListingTicketStatus {
  if (opts?.isCommunity) return "free"
  const now = opts?.now ?? new Date()
  const onSale = ticketTypes.filter((t) => tierOnSale(t, now))
  if (onSale.length === 0) return ticketTypes.length > 0 ? "none" : "rsvp"
  const hasPaid = onSale.some((t) => (t.price_cents ?? 0) > 0)
  const hasFree = onSale.some((t) => (t.price_cents ?? 0) === 0)
  if (hasPaid) return "paid"
  if (hasFree) return "free"
  return "rsvp"
}
