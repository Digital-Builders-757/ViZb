"use client"

import { useCallback, useMemo, useState } from "react"
import { EventTimelineCard } from "@/components/events/event-timeline-card"
import {
  EventQuickPreviewPanel,
  saveEventsListingScroll,
} from "@/components/events/event-quick-preview-panel"
import { TimelineDateHeader } from "@/components/events/timeline-date-header"
import type { ListingEvent } from "@/lib/events/listing-event"

export interface EventsTimelineInteractiveProps {
  dateKeys: string[]
  grouped: Record<string, ListingEvent[]>
  isSignedIn: boolean
  savedEventIds: string[]
  siteOrigin: string
  hasUpcoming: boolean
  initialRunningIndex?: number
}

export function EventsTimelineInteractive({
  dateKeys,
  grouped,
  isSignedIn,
  savedEventIds,
  siteOrigin,
  hasUpcoming,
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
            const eventsForDate = grouped[dateKey]

            return (
              <div key={dateKey}>
                <TimelineDateHeader
                  dateKey={dateKey}
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
              </div>
            )
          })}
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
