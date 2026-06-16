import { matchesWeekend } from "@/lib/events/discovery-filters"
import type { ListingEvent } from "@/lib/events/listing-event"

export type FeaturedMomentKind = "staff_picks" | "weekend_wave" | "new_this_week" | "city_spotlight"

export type FeaturedMoment = {
  kind: FeaturedMomentKind
  title: string
  subtitle: string
  events: ListingEvent[]
  emptyHint?: string
}

const MOMENT_COPY: Record<
  FeaturedMomentKind,
  { title: string; subtitle: string; emptyHint: string }
> = {
  staff_picks: {
    title: "Staff picks",
    subtitle: "Curated highlights from the ViZb team.",
    emptyHint: "No staff picks in this stretch, check ViZb picks above.",
  },
  weekend_wave: {
    title: "Weekend wave",
    subtitle: "Friday night through Sunday, plan your pull-up.",
    emptyHint: "No weekend events in view. Try This weekend filter.",
  },
  new_this_week: {
    title: "New this week",
    subtitle: "Fresh dates landing on the timeline.",
    emptyHint: "Nothing new this week, browse the full timeline below.",
  },
  city_spotlight: {
    title: "City spotlight",
    subtitle: "Where the crowd is gathering next.",
    emptyHint: "Pick a city filter to spotlight a region.",
  },
}

function wrap(kind: FeaturedMomentKind, events: ListingEvent[], cityLabel?: string): FeaturedMoment {
  const copy = MOMENT_COPY[kind]
  return {
    kind,
    title: kind === "city_spotlight" && cityLabel ? `${cityLabel} spotlight` : copy.title,
    subtitle: copy.subtitle,
    events,
    emptyHint: copy.emptyHint,
  }
}

function pickSpotlightCity(events: ListingEvent[]): string | null {
  const counts = new Map<string, number>()
  for (const e of events) {
    const c = e.city.trim()
    if (!c) continue
    counts.set(c, (counts.get(c) ?? 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  return top?.[0] ?? null
}

/**
 * Insert featured moments after timeline date-group indices (0 = after first day group).
 * Reuses existing pool data; does not remove events from the main list.
 */
export function planFeaturedMoments(
  dateKeys: string[],
  grouped: Record<string, ListingEvent[]>,
  pool: ListingEvent[],
  now: Date,
): Map<number, FeaturedMoment> {
  const out = new Map<number, FeaturedMoment>()
  if (dateKeys.length === 0 || pool.length === 0) return out

  const staff = pool.filter((e) => e.is_staff_pick).slice(0, 4)
  if (staff.length >= 2) {
    out.set(0, wrap("staff_picks", staff))
  }

  if (dateKeys.length >= 2) {
    const weekend = pool.filter((e) => matchesWeekend(e.starts_at, now)).slice(0, 4)
    if (weekend.length >= 2) {
      out.set(1, wrap("weekend_wave", weekend))
    }
  }

  if (dateKeys.length >= 3) {
    const weekMs = 7 * 24 * 60 * 60 * 1000
    const horizon = now.getTime() + weekMs
    const fresh = pool
      .filter((e) => {
        const t = new Date(e.starts_at).getTime()
        return t >= now.getTime() && t <= horizon
      })
      .slice(0, 4)
    if (fresh.length >= 2) {
      out.set(2, wrap("new_this_week", fresh))
    }
  }

  if (dateKeys.length >= 2) {
    const spotlightCity = pickSpotlightCity(pool)
    if (spotlightCity) {
      const cityEvents = pool.filter((e) => e.city === spotlightCity).slice(0, 4)
      if (cityEvents.length >= 2 && !out.has(1)) {
        out.set(1, wrap("city_spotlight", cityEvents, spotlightCity))
      } else if (cityEvents.length >= 2 && dateKeys.length >= 4 && !out.has(3)) {
        out.set(3, wrap("city_spotlight", cityEvents, spotlightCity))
      }
    }
  }

  return out
}
