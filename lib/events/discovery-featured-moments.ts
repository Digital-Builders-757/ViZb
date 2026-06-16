import type { ListingEvent } from "@/lib/events/listing-event"

export type FeaturedMomentKind = "staff_picks"

export type FeaturedMoment = {
  kind: FeaturedMomentKind
  title: string
  subtitle: string
  events: ListingEvent[]
  emptyHint?: string
}

const STAFF_PICKS_COPY = {
  title: "Staff picks",
  subtitle: "Curated highlights from the ViZb team.",
  emptyHint: "No staff picks in view right now.",
}

/**
 * Staff picks rail for hero / homepage — neon-card horizontal scroll.
 */
export function buildStaffPicksMoment(pool: ListingEvent[]): FeaturedMoment | null {
  const staff = pool.filter((e) => e.is_staff_pick).slice(0, 4)
  if (staff.length < 2) return null
  return {
    kind: "staff_picks",
    title: STAFF_PICKS_COPY.title,
    subtitle: STAFF_PICKS_COPY.subtitle,
    events: staff,
    emptyHint: STAFF_PICKS_COPY.emptyHint,
  }
}
