"use client"

import Image from "next/image"
import Link from "next/link"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import {
  formatCategoryLabel,
  formatDashboardEventEtDetailLines,
} from "@/lib/events/event-display-format"
import { ArrowLeft, CalendarPlus, ExternalLink, Share2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MyVibesButton } from "@/components/events/my-vibes-button"

export interface DashboardCalendarEventDetailProps {
  event: DashboardCalendarEvent
  onBack: () => void
  initialSaved: boolean
  onSavedChange?: (nextSaved: boolean) => void
}

function hostedByLabel(event: DashboardCalendarEvent): string {
  const n = event.host_org_name?.trim()
  if (n) return n
  return "VIZB"
}

export function DashboardCalendarEventDetail({
  event,
  onBack,
  initialSaved,
  onSavedChange,
}: DashboardCalendarEventDetailProps) {
  const icsHref = `/api/calendar/ics?slug=${encodeURIComponent(event.slug)}`
  const vibeAuthHref = `/login?redirect=${encodeURIComponent(`/dashboard`)}`

  async function copyShareLink() {
    const path = `/events/${event.slug}`
    const absolute =
      typeof window !== "undefined" && window.location.origin
        ? `${window.location.origin}${path}`
        : path
    try {
      await navigator.clipboard.writeText(absolute)
      toast.success("Link copied")
    } catch {
      toast.error("Could not copy link")
    }
  }

  const whenLine = formatDashboardEventEtDetailLines(event.starts_at, event.ends_at)

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 self-start rounded-lg px-1 py-1 font-mono text-xs text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-a)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to day
      </button>

      <div className="overflow-hidden rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 shadow-[0_0_24px_rgba(0,209,255,0.08)]">
        {event.flyer_url ? (
          <div className="relative aspect-[4/3] w-full bg-[color:var(--neon-bg1)]">
            <Image
              src={event.flyer_url}
              alt={`${event.title} flyer`}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 400px"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)] via-[color:var(--neon-bg0)]/25 to-transparent"
              aria-hidden
            />
          </div>
        ) : (
          <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-[color:var(--neon-a)]/20 via-[color:var(--neon-b)]/15 to-[color:var(--neon-c)]/10">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/80 to-transparent"
              aria-hidden
            />
          </div>
        )}

        <div className="space-y-3 p-4">
          <h3 className="font-serif text-lg font-bold leading-snug text-[color:var(--neon-text0)]">
            {event.title}
          </h3>
          <p className="text-sm text-[color:var(--neon-text1)]">{whenLine}</p>
          <p className="text-sm text-[color:var(--neon-text1)]">
            {event.city}
            {event.venue_name ? ` · ${event.venue_name}` : ""}
          </p>

          <div className="flex min-w-0 flex-wrap gap-1.5">
            {(event.categories?.length ?? 0) > 0 ? (
              event.categories.map((c) => (
                <span
                  key={`${event.id}-${c}`}
                  className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/45 px-2.5 py-0.5 font-mono text-[10px] font-medium text-[color:var(--neon-text1)] shadow-[0_0_12px_rgba(0,209,255,0.06)]"
                >
                  {formatCategoryLabel(c)}
                </span>
              ))
            ) : (
              <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/45 px-2.5 py-0.5 font-mono text-[10px] text-[color:var(--neon-text1)]">
                Event
              </span>
            )}
          </div>

          <p className="border-t border-[color:var(--neon-hairline)]/80 pt-3 text-xs text-[color:var(--neon-text2)]">
            <span className="font-mono uppercase tracking-wider">Hosted by</span>{" "}
            <span className="text-[color:var(--neon-text1)]">{hostedByLabel(event)}</span>
          </p>

          <div className="flex flex-col gap-2 pt-1">
            <MyVibesButton
              key={`${event.id}-${initialSaved}`}
              eventId={event.id}
              eventSlug={event.slug}
              isSignedIn
              initialSaved={initialSaved}
              authHref={vibeAuthHref}
              variant="dashboard"
              onSavedChange={onSavedChange}
            />
            <Button
              asChild
              size="sm"
              className="h-10 border border-[color:var(--neon-hairline)] bg-[color:var(--neon-a)]/15 text-[color:var(--neon-text0)] shadow-[0_0_18px_rgb(0_209_255/0.12)] hover:bg-[color:var(--neon-a)]/25"
            >
              <Link href={`/events/${event.slug}`}>
                <ExternalLink className="h-4 w-4" aria-hidden />
                View event
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="h-10 border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 text-[color:var(--neon-text0)] hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))] hover:bg-[color:var(--neon-surface)]/45"
            >
              <a href={icsHref} download>
                <CalendarPlus className="h-4 w-4" aria-hidden />
                Add to calendar
              </a>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-10 border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 text-[color:var(--neon-text0)] hover:border-[color:color-mix(in_srgb,var(--neon-b)_35%,var(--neon-hairline))]"
              onClick={() => void copyShareLink()}
            >
              <Share2 className="h-4 w-4" aria-hidden />
              Share
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
