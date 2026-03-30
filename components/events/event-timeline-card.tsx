"use client"

import Image from "next/image"
import Link from "next/link"
import { MapPin, Clock } from "lucide-react"
import { formatCategoryLabel } from "@/lib/events/event-display-format"

interface EventTimelineCardProps {
  event: {
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
  }
  index: number
}

export function EventTimelineCard({ event, index }: EventTimelineCardProps) {
  const start = new Date(event.starts_at)

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
    <Link
      href={`/events/${event.slug}`}
      className="group block"
    >
      <article
        className={`relative flex flex-col ${
          isEven ? "md:flex-row" : "md:flex-row-reverse"
        } gap-0 md:gap-8 overflow-hidden border border-border hover:border-primary/40 transition-all duration-500 bg-card`}
      >
        {/* Flyer Image */}
        <div className="relative w-full md:w-1/2 aspect-[4/5] sm:aspect-[3/4] md:aspect-auto md:min-h-[420px] overflow-hidden">
          {event.flyer_url ? (
            <Image
              src={event.flyer_url}
              alt={`Flyer for ${event.title}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover group-hover:scale-105 transition-all duration-700"
            />
          ) : (
            <div className="absolute inset-0 bg-secondary flex items-center justify-center">
              <div className="text-center">
                <span className="text-6xl md:text-8xl font-bold text-primary/20 font-mono">
                  {dayNumber}
                </span>
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-2">
                  {monthShort}
                </p>
              </div>
            </div>
          )}

          {/* Category badges */}
          <div className="absolute top-4 left-4 z-10 flex max-w-[min(100%,calc(100%-2rem))] flex-wrap gap-1.5">
            {event.categories.length > 0 ? (
              event.categories.map((c) => (
                <span
                  key={c}
                  className="bg-primary text-background text-[10px] sm:text-xs uppercase tracking-widest font-mono px-3 py-1.5"
                >
                  {formatCategoryLabel(c)}
                </span>
              ))
            ) : (
              <span className="bg-primary text-background text-[10px] sm:text-xs uppercase tracking-widest font-mono px-3 py-1.5">
                Event
              </span>
            )}
          </div>

          {/* Neon glow overlay on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-t from-primary/20 via-transparent to-transparent" />
        </div>

        {/* Event Details */}
        <div className="relative w-full md:w-1/2 flex flex-col justify-between p-5 sm:p-6 md:p-10">
          {/* Top: Org + Time */}
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-primary">
                {event.org_name}
              </span>
              <span className="w-1 h-1 bg-muted-foreground rounded-full" />
              <span className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-muted-foreground">
                <Clock className="w-3 h-3" />
                {startLabel}
              </span>
            </div>

            {/* Title */}
            <h3 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-4 group-hover:text-primary transition-colors duration-300 text-balance leading-tight">
              {event.title}
            </h3>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-muted-foreground mt-4 leading-relaxed line-clamp-3">
                {event.description}
              </p>
            )}
          </div>

          {/* Bottom: Venue + City */}
          <div className="mt-6 md:mt-8 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span className="truncate">{event.venue_name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1 ml-6 uppercase tracking-wider">
              {event.city}
            </p>
          </div>

          {/* Hover arrow */}
          <div className="absolute top-5 sm:top-6 md:top-10 right-5 sm:right-6 md:right-10 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-300">
            <span className="text-primary text-xl">&rarr;</span>
          </div>
        </div>
      </article>
    </Link>
  )
}
