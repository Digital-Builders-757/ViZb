"use client"

import { useCallback, useMemo, useState } from "react"
import { EventTimelineCard } from "@/components/events/event-timeline-card"
import { EventsFeaturedMoment } from "@/components/events/events-featured-moment"
import {
  EventQuickPreviewPanel,
  saveEventsListingScroll,
} from "@/components/events/event-quick-preview-panel"
import { TimelineDateHeader } from "@/components/events/timeline-date-header"
import type { FeaturedMoment } from "@/lib/events/discovery-featured-moments"
import type { ListingEvent } from "@/lib/events/listing-event"

export interface EventsTimelineInteractiveProps {
  dateKeys: string[]
  grouped: Record<string, ListingEvent[]>
  pastEvents: ListingEvent[]
  featuredByDateIndex: Record<number, FeaturedMoment>
  isSignedIn: boolean
  savedEventIds: string[]
  siteOrigin: string
  hasUpcoming: boolean
  hasPast: boolean
  initialRunningIndex?: number
}

export function EventsTimelineInteractive({
  dateKeys,
  grouped,
  pastEvents,
  featuredByDateIndex,
  isSignedIn,
  savedEventIds,
  siteOrigin,
  hasUpcoming,
  hasPast,
  initialRunningIndex = 0,
}: EventsTimelineInteractiveProps) {
  const savedSet = useMemo(() => new Set(savedEventIds), [savedEventIds])
  const [previewEvent, setPreviewEvent] = useState<ListingEvent | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const openPreview = useCallback((event: ListingEvent) => {
    saveEventsListingScroll()
    setPreviewEvent(event)
    setPreviewOpen(true)
  }, [])

  let runningIndex = initialRunningIndex

  return (
    <>
      {hasUpcoming ? (
        <div className="relative">
          <div className="events-timeline-line hidden md:block absolute left-[5px] top-0 bottom-0 w-px" />

          {dateKeys.map((dateKey, di) => {
            const dateObj = new Date(`${dateKey}T12:00:00-05:00`)
            const eventsForDate = grouped[dateKey]
            const featured = featuredByDateIndex[di]

            return (
              <div key={dateKey}>
                <TimelineDateHeader
                  date={dateObj}
                  isFirst={di === 0}
                  chapterLabel={di === 0 ? "This week's signal" : null}
                />

                <div className="mt-6 flex flex-col gap-7 md:ml-10 md:mt-8 md:gap-9">
                  {eventsForDate.map((event) => {
                    const card = (
                      <EventTimelineCard
                        key={event.id}
                        event={event}
                        index={runningIndex}
                        timelineIndex={runningIndex}
                        featured={event.is_staff_pick}
                        isSignedIn={isSignedIn}
                        isSaved={savedSet.has(event.id)}
                        interactive={false}
                        ticketTypes={event.ticket_types}
                        eventKind={event.event_kind}
                        siteOrigin={siteOrigin}
                        onPreview={() => openPreview(event)}
                      />
                    )
                    runningIndex++
                    return card
                  })}
                </div>

                {featured ? (
                  <div className="md:ml-10">
                    <EventsFeaturedMoment moment={featured} />
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>
      ) : null}

      {hasPast ? (
        <div className={hasUpcoming ? "mt-20 md:mt-28" : ""}>
          <div className="mb-9 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--neon-text2)]/45" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
              Recent past
            </span>
            <div className="flex-1 border-t border-[color:var(--neon-hairline)]/60" />
          </div>
          <p className="-mt-5 mb-8 max-w-prose text-xs text-[color:var(--neon-text2)]">
            What just happened, still worth a look for vibes, recaps, and follow-ups.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
            {pastEvents.map((event) => (
              <div
                key={event.id}
                className="events-timeline-card-enter transition-[opacity,transform] duration-300"
                style={{ ["--timeline-index" as string]: runningIndex }}
              >
                <EventTimelineCard
                  event={event}
                  index={runningIndex}
                  timelineIndex={runningIndex}
                  isSignedIn={isSignedIn}
                  isSaved={savedSet.has(event.id)}
                  tone="archive"
                  interactive={false}
                  ticketTypes={event.ticket_types}
                  eventKind={event.event_kind}
                  siteOrigin={siteOrigin}
                  onPreview={() => openPreview(event)}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <EventQuickPreviewPanel
        event={previewEvent}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        isSignedIn={isSignedIn}
        isSaved={previewEvent ? savedSet.has(previewEvent.id) : false}
        eventUrl={previewEvent ? `${siteOrigin}/events/${previewEvent.slug}` : ""}
      />
    </>
  )
}
