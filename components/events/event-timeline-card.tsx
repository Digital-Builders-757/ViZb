"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Clock } from "lucide-react"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
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
}

export function EventTimelineCard({
  event,
  index,
  isSignedIn,
  isSaved,
  vibeAuthHref,
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

  return (
    <GlassCard
      interactive
      role="article"
      className={`vibe-glass-panel relative flex flex-col ${
        isEven ? "md:flex-row" : "md:flex-row-reverse"
      } gap-0 md:gap-8 rounded-2xl bg-[color:var(--neon-surface)]/18 p-0 shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_10%,transparent)]`}
    >
      {/* Flyer column: categories above image (chips do not cover flyer art) */}
      <div
        className={`relative flex w-full flex-col overflow-hidden md:w-1/2 ${
          isEven ? "md:rounded-l-2xl md:rounded-r-none" : "md:rounded-r-2xl md:rounded-l-none"
        } rounded-t-2xl md:rounded-t-none`}
      >
        <div className="shrink-0 border-b border-[color:var(--neon-hairline)] px-4 pb-2.5 pt-4">
          <div className="flex flex-wrap gap-1.5">
            {event.categories.length > 0 ? (
              event.categories.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur"
                >
                  {formatCategoryLabel(c)}
                </span>
              ))
            ) : (
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-3 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
                Event
              </span>
            )}
          </div>
        </div>

        <div className="relative min-h-[280px] flex-1 overflow-hidden md:min-h-[420px]">
          <Link
            href={detailHref}
            className="group/flyer relative block h-full min-h-[280px] outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--neon-bg0)] md:min-h-[420px]"
          >
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-2/3 bg-gradient-to-t from-[color:var(--neon-bg0)]/95 via-[color:var(--neon-bg0)]/30 to-transparent"
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
                  <p className="mt-2 font-mono text-xs uppercase tracking-widest text-muted-foreground">
                    {monthShort}
                  </p>
                </div>
              </div>
            )}

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover/flyer:opacity-100" />
          </Link>

          <div className="absolute right-4 top-4 z-20 max-w-[calc(100%-2rem)] sm:max-w-[min(min(50vw,22rem),calc(100%-2rem))]">
            <MyVibesButton
              eventId={event.id}
              eventSlug={event.slug}
              isSignedIn={isSignedIn}
              initialSaved={isSaved}
              authHref={vibeAuthHref}
              variant="timeline"
            />
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="relative w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-6 md:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 0% 0%, rgb(0 209 255 / 0.10), transparent 55%), radial-gradient(ellipse 70% 55% at 100% 100%, rgb(157 77 255 / 0.08), transparent 55%)",
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
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)]">
                {event.org_name}
              </span>
              <span className="w-1 h-1 bg-[color:var(--neon-text2)]/60 rounded-full" />
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-[color:var(--neon-text2)]">
                <Clock className="w-3 h-3" />
                {startLabel}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-[color:var(--neon-text0)] mt-4 transition-colors duration-300 text-balance leading-tight group-hover/detail:text-[color:var(--neon-a)]">
              {event.title}
            </h3>
          </div>

          {/* Bottom: Venue + City */}
          <div className="mt-6 md:mt-8 pt-4 border-t border-[color:var(--neon-hairline)]">
            <div className="flex items-center gap-2 text-sm text-[color:var(--neon-text0)]">
              <MapPin className="w-4 h-4 text-[color:var(--neon-a)] shrink-0" />
              <span className="truncate">{event.venue_name}</span>
            </div>
            <p className="text-xs text-[color:var(--neon-text2)] mt-1 ml-6 uppercase tracking-wider">
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
