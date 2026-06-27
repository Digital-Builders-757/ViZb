"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { MyVibesEventRow } from "@/lib/events/my-vibes-queries"
import { removeEventFromMyVibes } from "@/app/actions/vibes"
import { formatDashboardEventWhen } from "@/lib/events/event-display-format"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { SectionTitle } from "@/components/ui/section-title"
import { DashboardEmptyState } from "@/components/dashboard/home/dashboard-empty-state"

export function SavedNotDecidedSection({
  events,
  siteOrigin,
}: {
  events: MyVibesEventRow[]
  siteOrigin: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleRemove(eventId: string, slug: string) {
    startTransition(async () => {
      await removeEventFromMyVibes(eventId, slug)
      router.refresh()
    })
  }

  return (
    <section aria-labelledby="saved-not-decided-heading" className="space-y-5">
      <SectionTitle kicker="Saved but not decided" title="Still deciding?" />

      {events.length === 0 ? (
        <DashboardEmptyState
          kicker="Clear runway"
          title="Nothing on your maybe list"
          description="Save events from the timeline when something catches your eye. They'll show here until you lock it in."
        >
          <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
            Explore events
          </NeonLink>
        </DashboardEmptyState>
      ) : (
        <ul className="space-y-3">
          {events.slice(0, 6).map((ev) => {
            const eventUrl = `${siteOrigin}/events/${ev.slug}`
            return (
              <li key={ev.id}>
                <GlassCard className="rounded-none p-4 md:p-5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <Link
                        href={`/events/${ev.slug}`}
                        className="font-serif text-lg font-bold text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)]"
                      >
                        {ev.title}
                      </Link>
                      <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                        {formatDashboardEventWhen(ev.starts_at, ev.ends_at)} · {ev.city}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/events/${ev.slug}`}
                        className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] hover:bg-[color:var(--neon-a)]/22"
                      >
                        Lock it in
                      </Link>
                      <a
                        href={`mailto:?subject=${encodeURIComponent(`This could be our move: ${ev.title}`)}&body=${encodeURIComponent(eventUrl)}`}
                        className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-hairline)] px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
                      >
                        Invite someone
                      </a>
                      <Link
                        href="/profile#culture-preferences"
                        className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-hairline)] px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
                      >
                        Remind me later
                      </Link>
                      <Link
                        href={`/events/${ev.slug}`}
                        className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-hairline)] px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
                      >
                        View details
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => handleRemove(ev.id, ev.slug)}
                        className="inline-flex min-h-10 items-center rounded-none border border-[color:var(--neon-hairline)] px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:border-red-400/40 hover:text-red-200 disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </GlassCard>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
