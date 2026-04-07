import Link from "next/link"
import type { SupabaseClient } from "@supabase/supabase-js"
import { CalendarPlus } from "lucide-react"
import { fetchMyVibesThisWeekGrouped } from "@/lib/events/my-vibes-queries"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

export async function MyVibesThisWeek({
  supabase,
  userId,
}: {
  supabase: SupabaseClient
  userId: string
}) {
  const grouped = await fetchMyVibesThisWeekGrouped(supabase, userId, 14)
  const dayKeys = Object.keys(grouped).sort()

  return (
    <section aria-labelledby="my-vibes-week-heading" className="scroll-mt-24">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h2
            id="my-vibes-week-heading"
            className="font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl"
          >
            My Vibes — This Week
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text2)]">
            Saved events in the next two weeks (Eastern dates).
          </p>
        </div>
        <a
          href="/api/calendar/ics?myVibes=1"
          download
          className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] shadow-[0_0_16px_rgba(0,209,255,0.08)] transition-colors hover:border-[color:color-mix(in_srgb,var(--neon-a)_45%,var(--neon-hairline))] hover:bg-[color:var(--neon-surface)]/50"
        >
          <CalendarPlus className="h-4 w-4 text-[color:var(--neon-a)]" aria-hidden />
          Add My Vibes to Calendar
        </a>
      </div>

      {dayKeys.length === 0 ? (
        <GlassCard className="mt-5 p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Nothing saved yet
          </p>
          <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
            Explore the timeline and tap <span className="text-[color:var(--neon-a)]">My Vibes</span> on any
            card to pin it here.
          </p>
          <NeonLink href="/events" className="mt-5 inline-flex" shape="xl" fullWidth>
            Explore events
          </NeonLink>
        </GlassCard>
      ) : (
        <div className="mt-5 space-y-6">
          {dayKeys.map((dateKey) => {
            const rows = grouped[dateKey]
            const dateObj = new Date(dateKey + "T12:00:00-05:00")
            const dayLabel = new Intl.DateTimeFormat("en-US", {
              timeZone: "America/New_York",
              weekday: "long",
              month: "long",
              day: "numeric",
            }).format(dateObj)

            return (
              <div key={dateKey}>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                  {dayLabel}
                </p>
                <ul className="mt-3 space-y-3">
                  {rows.map((ev) => (
                    <li key={ev.id}>
                      <GlassCard className="p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <Link
                              href={`/events/${ev.slug}`}
                              className="font-semibold text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)]"
                            >
                              {ev.title}
                            </Link>
                            <p className="mt-1 text-sm text-[color:var(--neon-text2)]">
                              {new Intl.DateTimeFormat("en-US", {
                                timeZone: "America/New_York",
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              }).format(new Date(ev.starts_at))}{" "}
                              · {ev.city}
                            </p>
                            {ev.categories[0] ? (
                              <span className="mt-2 inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/40 px-2.5 py-0.5 font-mono text-[10px] text-[color:var(--neon-text1)]">
                                {formatCategoryLabel(ev.categories[0])}
                              </span>
                            ) : null}
                          </div>
                          <NeonLink
                            href={`/events/${ev.slug}`}
                            variant="secondary"
                            size="sm"
                            className="sm:shrink-0"
                          >
                            Details
                          </NeonLink>
                        </div>
                      </GlassCard>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
