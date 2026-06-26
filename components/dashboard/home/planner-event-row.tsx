import Link from "next/link"
import type { MyVibesEventRow } from "@/lib/events/my-vibes-queries"
import type { MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import { formatDashboardEventWhen } from "@/lib/events/event-display-format"
import { GlassCard } from "@/components/ui/glass-card"
import { EventCalendarActions } from "@/components/dashboard/tickets/event-calendar-actions"

export type PlannerRowKind = "plan" | "saved"

export function PlannerEventRow({
  kind,
  title,
  slug,
  startsAt,
  endsAt,
  city,
  venueName,
  ticketId,
  status,
  siteOrigin,
}: {
  kind: PlannerRowKind
  title: string
  slug: string
  startsAt: string
  endsAt: string | null
  city: string
  venueName: string
  ticketId?: string
  status?: string
  siteOrigin: string
}) {
  const when = formatDashboardEventWhen(startsAt, endsAt)
  const eventUrl = `${siteOrigin}/events/${slug}`

  return (
    <GlassCard className="rounded-none p-4 md:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
            {kind === "plan" ? "Locked in" : "Saved"}
            {status ? ` · ${status === "checked_in" ? "Checked in" : "Confirmed"}` : ""}
          </p>
          <Link
            href={`/events/${slug}`}
            className="mt-1 block font-serif text-lg font-bold text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)]"
          >
            {title}
          </Link>
          <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
            {when} · {venueName} · {city}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {ticketId ? (
            <Link
              href={`/tickets/${ticketId}`}
              className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] hover:bg-[color:var(--neon-a)]/22"
            >
              View ticket
            </Link>
          ) : (
            <Link
              href={`/events/${slug}`}
              className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] hover:bg-[color:var(--neon-a)]/22"
            >
              Lock it in
            </Link>
          )}
          <EventCalendarActions
            title={title}
            startsAt={startsAt}
            venueName={venueName}
            city={city}
            eventUrl={eventUrl}
            className="mt-0"
            analyticsContext={{ source: "dashboard_planner" }}
          />
          <a
            href={`mailto:?subject=${encodeURIComponent(`Pull up to ${title}`)}&body=${encodeURIComponent(`I'm thinking about this. Join me?\n\n${eventUrl}`)}`}
            className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-hairline)] px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-text0)]"
          >
            Invite friend
          </a>
          <Link
            href={`/events/${slug}`}
            className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-hairline)] px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-text0)]"
          >
            View details
          </Link>
        </div>
      </div>
    </GlassCard>
  )
}

export function plannerRowFromTicket(preview: MemberHomeTicketPreview, siteOrigin: string) {
  return (
    <PlannerEventRow
      key={preview.ticketId}
      kind="plan"
      title={preview.title}
      slug={preview.slug}
      startsAt={preview.startsAt}
      endsAt={preview.endsAt}
      city={preview.city}
      venueName={preview.venueName}
      ticketId={preview.ticketId}
      status={preview.status}
      siteOrigin={siteOrigin}
    />
  )
}

export function plannerRowFromSaved(event: MyVibesEventRow, siteOrigin: string, hasTicket: boolean) {
  if (hasTicket) return null
  return (
    <PlannerEventRow
      key={event.id}
      kind="saved"
      title={event.title}
      slug={event.slug}
      startsAt={event.starts_at}
      endsAt={event.ends_at}
      city={event.city}
      venueName={event.venue_name}
      siteOrigin={siteOrigin}
    />
  )
}
