"use client"

import Image from "next/image"
import Link from "next/link"
import { useEffect, useRef } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { EventCardCalendarButton } from "@/components/events/event-card-calendar-button"
import { MyVibesButton } from "@/components/events/my-vibes-button"
import { EventFlyerFallback } from "@/components/events/event-flyer-fallback"
import { NeonLink } from "@/components/ui/neon-link"
import { buildEventAuthHref } from "@/lib/auth/post-login-intent"
import { formatCategoryLabel, sliceCategoriesForDisplay } from "@/lib/events/event-display-format"
import {
  getListingEventPriceLabel,
  getListingTicketStatus,
  type ListingEvent,
} from "@/lib/events/listing-event"
import { MapPin, Clock } from "lucide-react"

const SCROLL_KEY = "vizb-events-listing-scroll"

export function saveEventsListingScroll() {
  if (typeof window === "undefined") return
  sessionStorage.setItem(SCROLL_KEY, String(window.scrollY))
}

export function restoreEventsListingScroll() {
  if (typeof window === "undefined") return
  const raw = sessionStorage.getItem(SCROLL_KEY)
  if (raw == null) return
  sessionStorage.removeItem(SCROLL_KEY)
  const y = Number.parseInt(raw, 10)
  if (Number.isFinite(y)) {
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: "auto" }))
  }
}

export interface EventQuickPreviewPanelProps {
  event: ListingEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
  isSignedIn: boolean
  isSaved: boolean
  eventUrl: string
}

export function EventQuickPreviewPanel({
  event,
  open,
  onOpenChange,
  isSignedIn,
  isSaved,
  eventUrl,
}: EventQuickPreviewPanelProps) {
  const closedByUser = useRef(false)

  useEffect(() => {
    if (!open && closedByUser.current) {
      restoreEventsListingScroll()
      closedByUser.current = false
    }
  }, [open])

  if (!event) return null

  const start = new Date(event.starts_at)
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

  const priceLabel = getListingEventPriceLabel(event.ticket_types, {
    isCommunity: event.event_kind === "community",
  })
  const ticketStatus = getListingTicketStatus(event.ticket_types, {
    isCommunity: event.event_kind === "community",
  })
  const { visible: cats } = sliceCategoriesForDisplay(event.categories, 3)
  const analyticsContext = { event_slug: event.slug, source: "events_preview" as const }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) closedByUser.current = true
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/95 p-0 sm:max-w-lg">
        <div className="relative h-44 w-full overflow-hidden bg-black/50 sm:h-52">
          {event.flyer_url ? (
            <Image src={event.flyer_url} alt="" fill sizes="512px" className="object-cover object-[center_15%]" />
          ) : (
            <EventFlyerFallback
              dayNumber={new Intl.DateTimeFormat("en-US", {
                timeZone: "America/New_York",
                day: "numeric",
              }).format(start)}
              monthShort={new Intl.DateTimeFormat("en-US", {
                timeZone: "America/New_York",
                month: "short",
              }).format(start)}
              variant="banner"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg1)] via-[color:var(--neon-bg1)]/20 to-transparent" />
        </div>

        <div className="space-y-4 p-5 sm:p-6">
          <DialogHeader className="space-y-2 text-left">
            <DialogTitle className="font-serif text-xl text-[color:var(--neon-text0)] sm:text-2xl">
              {event.title}
            </DialogTitle>
            <DialogDescription className="sr-only">Quick preview for {event.title}</DialogDescription>
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
              {event.org_name}
            </p>
          </DialogHeader>

          <div className="flex flex-wrap gap-2 text-xs text-[color:var(--neon-text1)]">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[color:var(--neon-a)]" aria-hidden />
              {startLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-[color:var(--neon-a)]" aria-hidden />
              {event.venue_name}, {event.city}
            </span>
          </div>

          {cats.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {cats.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-[color:var(--neon-hairline)] px-2.5 py-1 font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)]"
                >
                  {formatCategoryLabel(c)}
                </span>
              ))}
            </div>
          ) : null}

          {event.description ? (
            <p className="line-clamp-4 text-sm leading-relaxed text-[color:var(--neon-text1)]">
              {event.description}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            {priceLabel ? (
              <span className="rounded-full border border-[color:var(--neon-a)]/40 bg-[color:var(--neon-a)]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                {priceLabel}
              </span>
            ) : null}
            {ticketStatus === "paid" ? (
              <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                Tickets on sale
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[color:var(--neon-hairline)] pt-4">
            <NeonLink href={`/events/${event.slug}`} variant="primary" size="sm" shape="pill">
              {ticketStatus === "paid" ? "Get tickets" : "Full details"}
            </NeonLink>
            <MyVibesButton
              eventId={event.id}
              eventSlug={event.slug}
              isSignedIn={isSignedIn}
              initialSaved={isSaved}
              authHref={buildEventAuthHref(event.slug, "save_event")}
              analyticsContext={analyticsContext}
              variant="timeline"
              compact
            />
            <EventCardCalendarButton
              title={event.title}
              startsAt={event.starts_at}
              venueName={event.venue_name}
              city={event.city}
              eventUrl={eventUrl}
              analyticsContext={analyticsContext}
            />
          </div>

          <Link
            href={`/events/${event.slug}`}
            className="block font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-a)]"
          >
            Open full event page →
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
