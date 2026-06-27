"use client"

import Image from "next/image"
import Link from "next/link"
import type { DashboardCalendarEvent } from "@/lib/events/dashboard-calendar"
import {
  formatCategoryLabel,
  formatDashboardEventEtDetailLines,
} from "@/lib/events/event-display-format"
import { ArrowLeft, CalendarPlus, ExternalLink, MapPin, Share2, UserRound } from "lucide-react"
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
  const host = hostedByLabel(event)

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 self-start rounded-md px-1 py-1 font-mono text-xs text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-a)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)]"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to day
      </button>

      <article className="planner-tide-row overflow-hidden rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 shadow-[0_0_24px_rgba(0,209,255,0.08)]">
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
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)] via-[color:var(--neon-bg0)]/20 to-transparent"
              aria-hidden
            />
          </div>
        ) : (
          <div className="relative aspect-[4/3] w-full bg-[linear-gradient(135deg,rgba(0,209,255,0.18),rgba(157,77,255,0.12),rgba(255,78,205,0.08))]">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/80 to-transparent"
              aria-hidden
            />
          </div>
        )}

        <div className="space-y-4 p-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)]">
              Selected move
            </p>
            <h3 className="mt-1 text-balance font-serif text-xl font-bold leading-snug text-[color:var(--neon-text0)]">
              {event.title}
            </h3>
          </div>

          <div className="grid gap-2">
            <p className="flex items-start gap-2 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/32 px-3 py-2 text-sm leading-relaxed text-[color:var(--neon-text1)]">
              <CalendarPlus className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--neon-a)]" aria-hidden />
              <span>{whenLine}</span>
            </p>
            <p className="flex items-start gap-2 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/32 px-3 py-2 text-sm leading-relaxed text-[color:var(--neon-text1)]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--neon-b)]" aria-hidden />
              <span>
                {event.city}
                {event.venue_name ? ` - ${event.venue_name}` : ""}
              </span>
            </p>
            <p className="flex items-start gap-2 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)]/32 px-3 py-2 text-sm leading-relaxed text-[color:var(--neon-text1)]">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--neon-a)]" aria-hidden />
              <span>Hosted by {host}</span>
            </p>
          </div>

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

          <div className="grid gap-2 border-t border-[color:var(--neon-hairline)]/80 pt-4">
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
              className="h-10 rounded-lg border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/18 text-[color:var(--neon-text0)] shadow-[0_0_18px_rgb(0_209_255/0.12)] hover:bg-[color:var(--neon-a)]/28"
            >
              <Link href={`/events/${event.slug}`}>
                <ExternalLink className="h-4 w-4" aria-hidden />
                View event
              </Link>
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="h-10 rounded-lg border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 text-[color:var(--neon-text0)] hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))] hover:bg-[color:var(--neon-surface)]/45"
              >
                <a href={icsHref} download>
                  <CalendarPlus className="h-4 w-4" aria-hidden />
                  Add
                </a>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-10 rounded-lg border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/30 text-[color:var(--neon-text0)] hover:border-[color:color-mix(in_srgb,var(--neon-b)_35%,var(--neon-hairline))]"
                onClick={() => void copyShareLink()}
              >
                <Share2 className="h-4 w-4" aria-hidden />
                Share
              </Button>
            </div>
          </div>
        </div>
      </article>
    </div>
  )
}
