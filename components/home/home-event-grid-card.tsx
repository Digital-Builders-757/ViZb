import Image from "next/image"
import Link from "next/link"
import { Clock, MapPin } from "lucide-react"

import { EventFlyerFallback } from "@/components/events/event-flyer-fallback"
import {
  formatCategoryLabel,
  formatEventTimeRangeWithZone,
} from "@/lib/events/event-display-format"
import { EVENT_DISPLAY_TIMEZONE } from "@/lib/events/eastern-datetime"
import type { ListingEvent } from "@/lib/events/listing-event"
import { getListingEventPriceLabel } from "@/lib/events/listing-event"

const CATEGORY_PILL_CLASS: Record<string, string> = {
  party: "border-[color:var(--neon-c)]/45 bg-[color:var(--neon-c)]/18 text-[color:var(--neon-text0)]",
  concert: "border-[color:var(--neon-b)]/45 bg-[color:var(--neon-b)]/18 text-[color:var(--neon-text0)]",
  networking: "border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/16 text-[color:var(--neon-a)]",
  workshop: "border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/16 text-[color:var(--neon-a)]",
  social: "border-[color:var(--neon-b)]/45 bg-[color:var(--neon-b)]/18 text-[color:var(--neon-text0)]",
  open_mic: "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/60 text-[color:var(--neon-text0)]",
  other: "border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/16 text-[color:var(--neon-a)]",
}

function categoryPillClass(category: string): string {
  const key = category.toLowerCase()
  return CATEGORY_PILL_CLASS[key] ?? CATEGORY_PILL_CLASS.other
}

function formatEventTimeRange(startsAt: string, endsAt: string | null): string {
  return formatEventTimeRangeWithZone(startsAt, endsAt)
}

function ctaLabel(priceLabel: string | null): string {
  if (!priceLabel) return "View Event"
  const lower = priceLabel.toLowerCase()
  if (lower.includes("free")) return "RSVP Now"
  return "Get Tickets"
}

export function HomeEventGridCard({ event }: { event: ListingEvent }) {
  const start = new Date(event.starts_at)
  const monthShort = Number.isNaN(start.getTime())
    ? "---"
    : new Intl.DateTimeFormat("en-US", { timeZone: EVENT_DISPLAY_TIMEZONE, month: "short" }).format(
        start,
      )
  const dayNumber = Number.isNaN(start.getTime())
    ? "?"
    : new Intl.DateTimeFormat("en-US", { timeZone: EVENT_DISPLAY_TIMEZONE, day: "numeric" }).format(
        start,
      )

  const primaryCategory = event.categories[0] ?? "other"
  const categoryLabel = formatCategoryLabel(primaryCategory)
  const priceLabel = getListingEventPriceLabel(event.ticket_types, {
    isCommunity: event.event_kind === "community",
  })
  const location = [event.venue_name, event.city].filter(Boolean).join(", ")
  const timeRange = formatEventTimeRange(event.starts_at, event.ends_at)

  return (
    <Link
      href={`/events/${event.slug}`}
      className="home-redesign-glass-card group flex h-full flex-col overflow-hidden rounded-xl"
    >
      <div className="relative h-52 w-full overflow-hidden bg-[#1a1c26] sm:h-56">
        {event.flyer_url ? (
          <Image
            src={event.flyer_url}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <EventFlyerFallback
            dayNumber={dayNumber}
            monthShort={monthShort}
            variant="banner"
            className="h-full w-full"
          />
        )}
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#0f1016] via-transparent to-transparent" />
        <div className="absolute left-4 top-4 z-20 flex gap-2">
          <span
            className={`${categoryPillClass(primaryCategory)} rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-normal backdrop-blur`}
          >
            {categoryLabel}
          </span>
        </div>
        <div className="home-redesign-glass absolute right-4 top-4 z-20 rounded-xl border-none bg-black/50 px-3 py-2 text-center backdrop-blur-md">
          <div className="text-xs font-bold uppercase text-[color:var(--neon-a)]">{monthShort}</div>
          <div className="text-xl font-black leading-none text-white">{dayNumber}</div>
        </div>
      </div>

      <div className="flex flex-grow flex-col p-5 sm:p-6">
        <h3 className="mb-3 line-clamp-2 text-xl font-bold leading-tight text-[color:var(--neon-text0)] transition-colors group-hover:text-[color:var(--neon-a)]">
          {event.title}
        </h3>
        <div className="mb-6 flex-grow space-y-2">
          <div className="flex items-start gap-2 text-sm leading-relaxed text-[color:var(--neon-text2)]">
            <MapPin className="h-4 w-4 shrink-0" />
            <span className="line-clamp-2">{location}</span>
          </div>
          <div className="flex items-start gap-2 text-sm leading-relaxed text-[color:var(--neon-text2)]">
            <Clock className="h-4 w-4 shrink-0" />
            <span className="line-clamp-2">{timeRange}</span>
          </div>
        </div>
        <div className="mt-auto flex flex-col gap-3 border-t border-[color:var(--neon-hairline)]/55 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="min-w-0 text-base font-bold text-[color:var(--neon-text0)]">
            {priceLabel ?? "See details"}
          </span>
          <span className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-lg border border-[color:var(--neon-a)]/35 bg-[color:var(--neon-a)]/10 px-4 py-2 text-center text-sm font-bold text-[color:var(--neon-a)] transition-all group-hover:bg-[color:var(--neon-a)] group-hover:text-[color:var(--neon-bg0)]">
            {ctaLabel(priceLabel)}
          </span>
        </div>
      </div>
    </Link>
  )
}
