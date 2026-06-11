import Link from "next/link"
import { ArrowLeft, QrCode } from "lucide-react"

import { requireAdmin } from "@/lib/auth-helpers"
import { isEventUpcomingOrOngoing } from "@/lib/events/event-schedule"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

type CheckInEventRow = {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
}

function formatEventWhen(startsAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(startsAt))
}

export default async function AdminCheckInHubPage() {
  await requireAdmin()

  if (!isServerSupabaseConfigured()) {
    return (
      <GlassCard className="p-6">
        <p className="text-sm text-muted-foreground">Supabase is not configured.</p>
        <NeonLink href="/admin" className="mt-4 inline-flex" variant="secondary">
          Back to admin
        </NeonLink>
      </GlassCard>
    )
  }

  const supabase = await createClient()
  const now = new Date()
  const lookback = new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString()

  const { data: rows } = await supabase
    .from("events")
    .select("id, title, slug, starts_at, ends_at, venue_name, city, status")
    .eq("status", "published")
    .gte("starts_at", lookback)
    .order("starts_at", { ascending: true })
    .limit(40)

  const events = ((rows ?? []) as CheckInEventRow[]).filter((event) =>
    isEventUpcomingOrOngoing(event.starts_at, event.ends_at, now.getTime()),
  )

  return (
    <div className="min-w-0 space-y-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-neon-a transition-colors"
      >
        <ArrowLeft className="w-3 h-3" />
        Back to admin
      </Link>

      <header className="min-w-0">
        <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">Door operations</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          Staff check-in
        </h1>
        <p className="mt-2 max-w-prose text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Pick an event to open the door scanner. Scan ticket QR codes or paste backup tokens to admit guests.
        </p>
      </header>

      {events.length === 0 ? (
        <GlassCard className="p-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            No live events
          </p>
          <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
            There are no published upcoming events in the next window. Open a specific event from admin to scan past
            doors if needed.
          </p>
          <NeonLink href="/admin/events" className="mt-4 inline-flex" variant="secondary">
            Browse all events
          </NeonLink>
        </GlassCard>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => (
            <li key={event.id}>
              <Link
                href={`/admin/events/${event.id}/check-in`}
                className="group block rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 p-4 backdrop-blur transition-colors hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/26"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <p className="font-serif text-lg font-semibold text-[color:var(--neon-text0)] group-hover:text-[color:var(--neon-a)]">
                      {event.title}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                      {formatEventWhen(event.starts_at)} · {event.city}
                    </p>
                    {event.venue_name ? (
                      <p className="mt-1 truncate text-xs text-[color:var(--neon-text1)]">{event.venue_name}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-full border border-[color:var(--neon-a)]/40 bg-[color:var(--neon-a)]/10 px-5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)]">
                    <QrCode className="h-4 w-4" />
                    Open scanner
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <GlassCard className="p-4">
        <p className="text-xs text-[color:var(--neon-text2)]">
          Requires <span className="font-mono">TICKET_QR_SECRET</span> in the environment. Org owners can also scan from
          their organizer event pages.
        </p>
      </GlassCard>
    </div>
  )
}
