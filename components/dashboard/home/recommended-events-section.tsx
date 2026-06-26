import Image from "next/image"
import Link from "next/link"
import type { ForYouFeed } from "@/lib/events/for-you-queries"
import {
  formatCategoryLabels,
  formatDashboardEventWhen,
} from "@/lib/events/upcoming-preview"
import { eventKindBadgeLong } from "@/lib/events/event-kind"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { SectionTitle } from "@/components/ui/section-title"

export function RecommendedEventsSection({ forYou }: { forYou: ForYouFeed }) {
  const items = forYou.items.slice(0, 6)

  return (
    <section aria-labelledby="recommended-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SectionTitle kicker="Recommended for you" title="Picked for your vibe" />
        <NeonLink href="/events" shape="pill" className="shrink-0 text-xs">
          Browse all events
        </NeonLink>
      </div>

      <p className="max-w-2xl text-[15px] leading-relaxed text-[color:var(--neon-text2)]">
        {!forYou.hasSignals
          ? "Set your cities and categories for sharper picks. Showing popular upcoming events for now."
          : forYou.usedFallback
            ? "Staff picks and soon events while we learn your taste."
            : "From your preferences, saves, and RSVPs."}
      </p>

      {!forYou.hasSignals ? (
        <NeonLink href="/profile#culture-preferences" shape="pill" className="text-xs">
          Set preferences
        </NeonLink>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.length > 0 ? (
          items.map((ev) => (
            <Link key={ev.id} href={`/events/${ev.slug}`} className="block">
              <GlassCard className="overflow-hidden rounded-none p-0 transition-[box-shadow,transform] hover:shadow-[var(--vibe-neon-glow-subtle)] active:scale-[0.99]">
                <div className="flex flex-col sm:flex-row">
                  {ev.flyer_url ? (
                    <div className="relative aspect-[16/9] w-full shrink-0 sm:aspect-auto sm:h-32 sm:w-36">
                      <Image
                        src={ev.flyer_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 144px"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {ev.is_staff_pick ? (
                        <span className="rounded-none border border-[color:var(--neon-hairline)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-b)]">
                          ViZb pick
                        </span>
                      ) : null}
                      {ev.event_kind === "community" ? (
                        <span className="rounded-none border border-[color:var(--neon-hairline)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-text2)]">
                          {eventKindBadgeLong("community")}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[color:var(--neon-text0)]">{ev.title}</h3>
                    <p className="text-sm text-[color:var(--neon-text1)]">
                      {ev.city} · {formatDashboardEventWhen(ev.starts_at, ev.ends_at)}
                    </p>
                    <span className="inline-flex rounded-none border border-[color:var(--neon-hairline)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)]">
                      {formatCategoryLabels(ev.categories)}
                    </span>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))
        ) : (
          <EmptyStateCard
            kicker="Nothing matched"
            title="Browse the timeline"
            description="Published events will appear here once we have upcoming listings."
          >
            <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
              Browse all events
            </NeonLink>
          </EmptyStateCard>
        )}
      </div>
    </section>
  )
}
