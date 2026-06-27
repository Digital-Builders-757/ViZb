import Image from "next/image"
import Link from "next/link"
import {
  Bookmark,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  Ticket,
  UserPlus,
} from "lucide-react"
import type { MyVibesEventRow } from "@/lib/events/my-vibes-queries"
import type { MemberHomeTicketPreview } from "@/lib/dashboard/member-home-data"
import {
  formatDashboardEventTimeShort,
  formatDashboardEventWhen,
} from "@/lib/events/event-display-format"
import { cn } from "@/lib/utils"

export type PlannerRowKind = "plan" | "saved"

function plannerDateParts(startsAt: string): { month: string; day: string; weekday: string } {
  const date = new Date(startsAt)
  const month = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
  }).format(date)
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    day: "2-digit",
  }).format(date)
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(date)
  return { month, day, weekday }
}

function statusLabel(kind: PlannerRowKind, status?: string): string {
  if (status === "checked_in") return "Checked in"
  if (status) return "Confirmed"
  return kind === "plan" ? "Ticket ready" : "Saved"
}

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
  flyerUrl,
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
  flyerUrl?: string | null
  siteOrigin: string
}) {
  const when = formatDashboardEventWhen(startsAt, endsAt)
  const time = formatDashboardEventTimeShort(startsAt, endsAt)
  const eventUrl = `${siteOrigin}/events/${slug}`
  const date = plannerDateParts(startsAt)
  const isPlan = kind === "plan"
  const Icon = isPlan ? CheckCircle2 : Bookmark
  const primaryHref = ticketId ? `/tickets/${ticketId}` : `/events/${slug}`
  const primaryLabel = ticketId ? "View ticket" : "Lock it in"
  const calendarHref = `/api/calendar/ics?slug=${encodeURIComponent(slug)}`
  const inviteHref = `mailto:?subject=${encodeURIComponent(`Pull up to ${title}`)}&body=${encodeURIComponent(`I'm thinking about this. Join me?\n\n${eventUrl}`)}`

  const accentClass = isPlan
    ? "border-[color:var(--neon-a)]/40 bg-[color:var(--neon-a)]/12 text-[color:var(--neon-a)]"
    : "border-[color:var(--neon-b)]/40 bg-[color:var(--neon-b)]/12 text-[color:var(--neon-b)]"

  return (
    <article className="planner-tide-row group overflow-hidden rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/28 p-3 backdrop-blur transition-[border-color,box-shadow] hover:border-[color:color-mix(in_srgb,var(--neon-a)_42%,var(--neon-hairline))] hover:shadow-[0_0_24px_rgba(0,209,255,0.1)] sm:p-4">
      <div className="grid gap-4 sm:grid-cols-[5.75rem_minmax(0,1fr)] lg:grid-cols-[6.25rem_minmax(0,1fr)_auto] lg:items-start">
        <div className="flex gap-3 sm:block">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg1)] sm:h-[7.25rem] sm:w-full">
            {flyerUrl ? (
              <Image
                src={flyerUrl}
                alt=""
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="120px"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(0,209,255,0.18),rgba(157,77,255,0.14))]">
                <Icon className="h-6 w-6 text-[color:var(--neon-a)]" aria-hidden />
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/55 to-transparent" />
          </div>
          <div className="flex min-w-0 flex-col justify-center sm:mt-2 sm:block sm:text-center">
            <p className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
              {date.weekday}
            </p>
            <p className="font-serif text-2xl font-bold leading-none text-[color:var(--neon-text0)]">
              {date.day}
            </p>
            <p className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-a)]">
              {date.month}
            </p>
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-normal",
                accentClass,
              )}
            >
              <Icon className="h-3.5 w-3.5" aria-hidden />
              {statusLabel(kind, status)}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
              {when}
            </span>
          </div>

          <Link
            href={`/events/${slug}`}
            className="mt-2 block text-balance font-serif text-xl font-bold leading-tight text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]"
          >
            {title}
          </Link>

          <div className="mt-3 grid gap-2 text-sm leading-relaxed text-[color:var(--neon-text1)] md:grid-cols-2">
            <p className="flex min-w-0 items-start gap-2">
              <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--neon-a)]" aria-hidden />
              <span className="min-w-0">{time}</span>
            </p>
            <p className="flex min-w-0 items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--neon-b)]" aria-hidden />
              <span className="min-w-0 break-words">
                {venueName} - {city}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 lg:min-w-[11rem]">
          <Link
            href={primaryHref}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/14 px-4 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text0)] transition-colors hover:bg-[color:var(--neon-a)]/24"
          >
            {ticketId ? <Ticket className="h-4 w-4" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
            {primaryLabel}
          </Link>
          <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
            <a
              href={calendarHref}
              download
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/24 px-3 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text1)] transition-colors hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-text0)]"
            >
              <CalendarPlus className="h-4 w-4" aria-hidden />
              <span>Calendar</span>
            </a>
            <a
              href={inviteHref}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/24 px-3 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text1)] transition-colors hover:border-[color:var(--neon-b)]/40 hover:text-[color:var(--neon-text0)]"
            >
              <UserPlus className="h-4 w-4" aria-hidden />
              <span>Invite</span>
            </a>
            <Link
              href={`/events/${slug}`}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/24 px-3 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text1)] transition-colors hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-text0)]"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              <span>Details</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
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
      flyerUrl={preview.flyerUrl}
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
      flyerUrl={event.flyer_url}
      siteOrigin={siteOrigin}
    />
  )
}
