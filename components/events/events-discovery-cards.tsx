import Image from "next/image"
import Link from "next/link"

import { EventFlyerFallback } from "@/components/events/event-flyer-fallback"
import { formatCategoryLabel, sliceCategoriesForDisplay } from "@/lib/events/event-display-format"
import { STAFF_PICK_BADGE_CLASS, STAFF_PICK_BADGE_LABEL } from "@/lib/events/event-kind"
import { getListingEventPriceLabel, listingOffersVizbTickets, type ListingEvent } from "@/lib/events/listing-event"

const ET = "America/New_York"

function formatEventDateLabel(startsAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: ET,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(startsAt))
}

function flyerDateParts(startsAt: string): { dayNumber: string; monthShort: string } {
  return {
    dayNumber: new Intl.DateTimeFormat("en-US", { timeZone: ET, day: "numeric" }).format(
      new Date(startsAt),
    ),
    monthShort: new Intl.DateTimeFormat("en-US", { timeZone: ET, month: "short" }).format(
      new Date(startsAt),
    ),
  }
}

/** Featured hero card — large flyer banner + full event details. */
export function EventDiscoveryHeroCard({ e }: { e: ListingEvent }) {
  const { visible: cats } = sliceCategoriesForDisplay(e.categories, 2)
  const dateLabel = formatEventDateLabel(e.starts_at)
  const listingOpts = { isCommunity: e.event_kind === "community" } as const
  const priceLabel = getListingEventPriceLabel(e.ticket_types, listingOpts)
  const offersVizbTickets = listingOffersVizbTickets(e.ticket_types, listingOpts)
  const { dayNumber, monthShort } = flyerDateParts(e.starts_at)

  return (
    <Link
      href={`/events/${e.slug}`}
      className="events-neon-card events-neon-card-hover group relative flex h-full flex-col overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)]/90 bg-[color:var(--neon-surface)]/20 backdrop-blur hover:border-[color:var(--neon-a)]/50 hover:bg-[color:var(--neon-surface)]/26"
    >
      <div
        className="events-card-hover-radial-hero pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        aria-hidden
      />

      <div className="relative flex min-h-56 w-full flex-1 overflow-hidden bg-black/40 md:min-h-[22rem] lg:min-h-[26rem]">
        {e.flyer_url ? (
          <Image
            src={e.flyer_url}
            alt={e.title}
            fill
            sizes="(max-width: 768px) 88vw, 560px"
            className="object-cover object-center transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <EventFlyerFallback dayNumber={dayNumber} monthShort={monthShort} variant="banner" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/90 via-[color:var(--neon-bg0)]/40 to-transparent" />
        {e.is_staff_pick ? (
          <span
            className={`absolute left-3 top-3 z-[2] inline-flex ${STAFF_PICK_BADGE_CLASS} px-2 py-0.5 font-mono text-[9px]`}
          >
            {STAFF_PICK_BADGE_LABEL}
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 z-[1] p-4">
          <p className="line-clamp-2 text-lg font-bold leading-snug text-[color:var(--neon-text0)]">{e.title}</p>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            {dateLabel} <span className="text-[color:var(--neon-text2)]/70">·</span> {e.city}
          </p>
          {e.venue_name ? (
            <p className="mt-0.5 truncate text-xs text-[color:var(--neon-text1)]/80">{e.venue_name}</p>
          ) : null}
        </div>
      </div>

      <div className="relative z-[1] flex shrink-0 items-end justify-between gap-2 p-4 pt-3">
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {cats.map((c) => (
            <span
              key={c}
              className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-black/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)]"
            >
              {formatCategoryLabel(c)}
            </span>
          ))}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          {priceLabel ? (
            <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
              {priceLabel}
            </span>
          ) : null}
          <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] group-hover:underline">
            {offersVizbTickets ? "Get tickets →" : "View event →"}
          </span>
        </div>
      </div>
    </Link>
  )
}

/** Shared compact glance card for discovery rails. */
export function EventDiscoveryCompactCard({
  e,
  variant,
  size = "default",
}: {
  e: ListingEvent
  variant: "default" | "staffPick"
  size?: "default" | "compact"
}) {
  const { visible: trendCats, extraCount: trendCatExtra } = sliceCategoriesForDisplay(e.categories, 1)
  const isStaffRail = variant === "staffPick"
  const isCompact = size === "compact"
  const borderHover = isStaffRail
    ? "hover:border-amber-500/50 hover:bg-[color:var(--neon-surface)]/26 hover:shadow-[0_0_28px_var(--events-glow-shadow-hover-amber)]"
    : "hover:border-[color:var(--neon-a)]/50 hover:bg-[color:var(--neon-surface)]/26 hover:shadow-[0_0_32px_var(--events-glow-shadow-hover)]"
  const { dayNumber, monthShort } = flyerDateParts(e.starts_at)

  return (
    <Link
      href={`/events/${e.slug}`}
      className={`events-neon-card events-neon-card-hover group relative overflow-hidden rounded-2xl border bg-[color:var(--neon-surface)]/20 backdrop-blur ${
        isCompact ? "p-2.5" : "p-3.5 sm:p-4"
      } ${
        isStaffRail ? "border-amber-500/35" : "border-[color:var(--neon-hairline)]/90"
      } ${borderHover}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
          isStaffRail ? "events-card-hover-radial-compact-staff" : "events-card-hover-radial-compact"
        }`}
        aria-hidden
      />

      <div className={`relative z-[1] flex items-start ${isCompact ? "gap-2.5" : "gap-3.5"}`}>
        <div
          className={`relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/35 shadow-inner ${
            isCompact ? "h-12 w-12" : "h-16 w-16"
          }`}
        >
          {e.flyer_url ? (
            <Image
              src={e.flyer_url}
              alt={e.title}
              fill
              sizes={isCompact ? "48px" : "64px"}
              className="object-cover object-[center_15%] transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <EventFlyerFallback dayNumber={dayNumber} monthShort={monthShort} variant="thumb" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/50 via-transparent to-transparent" />
        </div>

        <div className={`min-w-0 flex-1 ${isCompact ? "min-h-[3.25rem]" : "min-h-[4.25rem]"}`}>
          {isStaffRail || e.is_staff_pick ? (
            <p className="mb-1">
              <span className={`inline-flex ${STAFF_PICK_BADGE_CLASS} px-2 py-0.5 font-mono text-[9px]`}>
                {STAFF_PICK_BADGE_LABEL}
              </span>
            </p>
          ) : null}
          <p
            className={`line-clamp-2 font-semibold leading-snug text-[color:var(--neon-text0)] ${
              isCompact ? "text-[13px]" : "text-sm"
            }`}
          >
            {e.title}
          </p>
          <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            {formatEventDateLabel(e.starts_at)}{" "}
            <span className="text-[color:var(--neon-text2)]/70">·</span> {e.city}
          </p>
          {trendCats.length > 0 ? (
            <p className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
              <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-black/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)] sm:text-[10px]">
                {formatCategoryLabel(trendCats[0])}
              </span>
              {trendCatExtra > 0 ? (
                <span
                  className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)]/80 sm:text-[10px]"
                  aria-label={`${trendCatExtra} more categories`}
                >
                  +{trendCatExtra} more
                </span>
              ) : null}
            </p>
          ) : null}
        </div>
      </div>
    </Link>
  )
}
