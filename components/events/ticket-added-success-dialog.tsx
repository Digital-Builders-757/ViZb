"use client"

import Link from "next/link"
import { CalendarPlus, Download } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { NeonButton } from "@/components/ui/neon-button"
import {
  buildGoogleCalendarUrl,
  buildIcsContent,
  downloadIcsBlob,
} from "@/components/dashboard/tickets/event-calendar-actions"

export type TicketAddedSuccessVariant = "rsvp" | "paid"

export function TicketAddedSuccessDialog({
  open,
  onOpenChange,
  ticketId,
  eventTitle,
  startsAt,
  venueName,
  city,
  eventUrl,
  variant = "rsvp",
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId?: string | null
  eventTitle: string
  startsAt: string
  venueName: string
  city: string
  /** Absolute or path URL shown in calendar description */
  eventUrl: string
  variant?: TicketAddedSuccessVariant
}) {
  const start = new Date(startsAt)
  const calendarEnd = Number.isNaN(start.getTime()) ? null : new Date(start.getTime() + 2 * 60 * 60 * 1000)
  const location = [venueName, city].filter(Boolean).join(", ")
  const details = `VIZB event\n${eventUrl}`

  const googleHref =
    calendarEnd
      ? buildGoogleCalendarUrl({
          title: eventTitle,
          start,
          end: calendarEnd,
          location,
          details,
        })
      : null

  const openTicketHref = ticketId ? `/tickets/${ticketId}` : "/tickets"
  const openTicketLabel = ticketId ? "Open My Ticket" : "Open My Tickets"

  const bodyCopy =
    variant === "paid"
      ? "Payment received. Your ticket should appear in My Tickets shortly—refresh there if you do not see it yet."
      : "You’re on the list. Your RSVP is saved and your ticket is now in My Tickets."

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[color:var(--neon-text0)]">Added to My Tickets</DialogTitle>
          <DialogDescription className="text-[color:var(--neon-text1)]">{bodyCopy}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          <NeonButton asChild fullWidth shape="xl">
            <Link href={openTicketHref} onClick={() => onOpenChange(false)}>
              {openTicketLabel}
            </Link>
          </NeonButton>

          {googleHref && calendarEnd ? (
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <a
                href={googleHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 w-full flex-1 items-center justify-center gap-2 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-a)]"
              >
                <CalendarPlus className="h-4 w-4 shrink-0" aria-hidden />
                Add to Google Calendar
              </a>
              <button
                type="button"
                onClick={() => {
                  const ics = buildIcsContent({
                    title: eventTitle,
                    start,
                    end: calendarEnd,
                    location,
                    description: details,
                  })
                  downloadIcsBlob(eventTitle, ics)
                }}
                className="inline-flex min-h-11 w-full flex-1 items-center justify-center gap-2 rounded-xl border border-[color:var(--neon-hairline)] bg-transparent px-4 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text1)] transition-colors hover:border-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
              >
                <Download className="h-4 w-4 shrink-0" aria-hidden />
                Download .ics
              </button>
            </div>
          ) : null}
        </div>

        <DialogFooter className="sm:justify-stretch">
          <NeonButton
            type="button"
            variant="ghost"
            fullWidth
            shape="xl"
            onClick={() => onOpenChange(false)}
          >
            Done
          </NeonButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
