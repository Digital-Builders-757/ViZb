"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Clock } from "lucide-react"
import { formatCategoryLabel, sliceCategoriesForDisplay } from "@/lib/events/event-display-format"
import { MyVibesButton } from "@/components/events/my-vibes-button"
import { GlassCard } from "@/components/ui/glass-card"

interface EventTimelineCardProps {
  event: {
    id: string
    title: string
    slug: string
    starts_at: string
    ends_at: string | null
    venue_name: string
    city: string
    categories: string[]
    flyer_url: string | null
    org_name: string
    org_slug: string | null
  }
  index: number
  isSignedIn: boolean
  isSaved: boolean
  vibeAuthHref: string
  /** `archive` = past events: quieter emphasis, smaller type rhythm. */
  tone?: "default" | "archive"
}

export function EventTimelineCard({
  event,
  index,
  isSignedIn,
  isSaved,
  vibeAuthHref,
  tone = "default",
}: EventTimelineCardProps) {
  const start = new Date(event.starts_at)
  const detailHref = `/events/${event.slug}`

  // Always display in America/New_York (ET) for Virginia audience
  const startLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).format(start)

  const dayNumber = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    day: "numeric",
  }).format(start)

  const monthShort = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
  }).format(start)

  const isEven = index % 2 === 0
  const { visible: visibleCategories, extraCount: extraCategoryCount } = sliceCategoriesForDisplay(
    event.categories,
    2,
  )

  const isArchive = tone === "archive"

  return (
    <GlassCard
      interactive
      role="article"
      className={`vibe-glass-panel relative flex flex-col ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      } gap-0 ${isArchive ? "md:gap-6" : "md:gap-8"} rounded-2xl p-0 ${
        isArchive
          ? "bg-[color:var(--neon-surface)]/10 shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-hairline)_55%,transparent)]"
          : "bg-[color:var(--neon-surface)]/18 shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_10%,transparent)]"
      }`}
    >
      {/* Flyer column: fixed-height image area (categories live in details column) */}
      <div
        className={`relative flex w-full flex-col overflow-hidden md:w-1/2 ${
          isEven ? "md:rounded-l-2xl md:rounded-r-none" : "md:rounded-r-2xl md:rounded-l-none"
        } rounded-t-2xl md:rounded-t-none`}
      >
        <div
          className={`relative w-full shrink-0 overflow-hidden ${
            isArchive ? "min-h-[240px] md:min-h-[360px]" : "min-h-[280px] md:min-h-[420px]"
          }`}
        >
          <Link
            href={detailHref}
            className={`group/flyer relative block h-full outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--neon-bg0)] ${
              isArchive ? "min-h-[240px] md:min-h-[360px]" : "min-h-[280px] md:min-h-[420px]"
            }`}
          >
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-[color:var(--neon-bg0)]/88 via-[color:var(--neon-bg0)]/28 to-transparent"
              aria-hidden
            />
            {event.flyer_url ? (
              <Image
                src={event.flyer_url}
                alt={`Flyer for ${event.title}`}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover/flyer:scale-105"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-secondary">
                <div className="text-center">
                  <span className="font-mono text-6xl font-bold text-primary/20 md:text-8xl">
                    {dayNumber}
                  </span>
                  <p className="mt-2 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
                    {monthShort}
                  </p>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/flyer:opacity-100" />
          </Link>

          <div className="absolute right-3 top-3 z-20 max-w-[min(100%-1.5rem,calc(100%-2rem))] sm:right-4 sm:top-4 sm:max-w-[min(min(50vw,22rem),calc(100%-2rem))]">
            <MyVibesButton
              eventId={event.id}
              eventSlug={event.slug}
              isSignedIn={isSignedIn}
              initialSaved={isSaved}
              authHref={vibeAuthHref}
              variant="timeline"
              compact
            />
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div
        className={`relative flex w-full flex-col justify-between md:w-1/2 ${
          isArchive ? "p-5 sm:p-6 md:p-8" : "p-5 sm:p-6 md:p-10"
        }`}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 0% 0%, rgb(0 209 255 / 0.14), transparent 55%), radial-gradient(ellipse 70% 55% at 100% 100%, rgb(157 77 255 / 0.11), transparent 55%)",
          }}
          aria-hidden
        />
        <Link
          href={detailHref}
          className="group/detail relative z-[1] flex h-full flex-col justify-between outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--neon-bg0)]"
        >
          {/* Top: Org + Time */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`text-[10px] sm:text-xs font-mono uppercase tracking-widest ${
                  isArchive ? "text-[color:var(--neon-text2)]" : "text-[color:var(--neon-a)]"
                }`}
              >
                {event.org_name}
              </span>
              <span className="h-1 w-1 rounded-full bg-[color:var(--neon-text2)]/60" />
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-[color:var(--neon-text2)]">
                <Clock className="h-3 w-3 shrink-0" />
                {startLabel}
              </span>
            </div>

            {/* Title */}
            <h3
              className={`mt-4 text-balance font-bold leading-[1.15] transition-colors duration-300 ${
                isArchive
                  ? "line-clamp-3 font-serif text-xl text-[color:var(--neon-text1)] sm:text-2xl md:text-3xl group-hover/detail:text-[color:var(--neon-a)]/90"
                  : "line-clamp-4 font-serif text-2xl text-[color:var(--neon-text0)] sm:text-3xl md:text-4xl group-hover/detail:text-[color:var(--neon-a)]"
              }`}
            >
              {event.title}
            </h3>

            {visibleCategories.length > 0 ? (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                {visibleCategories.map((c, i) => (
                  <span
                    key={`${c}-${i}`}
                    className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur"
                  >
                    {formatCategoryLabel(c)}
                  </span>
                ))}
                {extraCategoryCount > 0 ? (
                  <span
                    className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]"
                    aria-label={`${extraCategoryCount} more categories`}
                  >
                    +{extraCategoryCount} more
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Bottom: Venue + City */}
          <div
            className={`mt-6 border-t border-[color:var(--neon-hairline)] pt-4 md:mt-8 ${
              isArchive ? "opacity-90" : ""
            }`}
          >
            <div
              className={`flex items-center gap-2 text-sm ${
                isArchive ? "text-[color:var(--neon-text1)]" : "text-[color:var(--neon-text0)]"
              }`}
            >
              <MapPin
                className={`h-4 w-4 shrink-0 ${isArchive ? "text-[color:var(--neon-text2)]" : "text-[color:var(--neon-a)]"}`}
              />
              <span className="line-clamp-2">{event.venue_name}</span>
            </div>
            <p className="ml-6 mt-1 text-xs uppercase tracking-wider text-[color:var(--neon-text2)]">
              {event.city}
            </p>
          </div>

          {/* Hover arrow */}
          <div className="absolute top-0 right-0 opacity-0 group-hover/detail:opacity-100 translate-x-2 group-hover/detail:translate-x-0 transition-all duration-300">
            <span className="text-primary text-xl">&rarr;</span>
          </div>
        </Link>
      </div>
    </GlassCard>
  )
}
