import Image from "next/image"
import Link from "next/link"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import {
  formatCategoryLabels,
  formatDashboardEventWhen,
} from "@/lib/events/upcoming-preview"
import type { ScoredRecommendation } from "@/lib/events/member-recommendations"
import { eventKindBadgeLong } from "@/lib/events/event-kind"

export interface ForYouRailProps {
  items: ScoredRecommendation[]
  hasSignals: boolean
  usedFallback: boolean
}

export function ForYouRail({ items, hasSignals, usedFallback }: ForYouRailProps) {
  return (
    <section aria-labelledby="for-you-heading">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2
            id="for-you-heading"
            className="font-serif text-xl font-bold text-[color:var(--neon-text0)] md:text-2xl"
          >
            For You
          </h2>
          <p className="mt-1 text-[15px] leading-relaxed text-[color:var(--neon-text2)]">
            {!hasSignals
              ? "Set your cities and categories on your profile for sharper picks, showing popular upcoming events for now."
              : usedFallback
                ? "We could not find strong matches yet, here are staff picks and soon events."
                : "Picked from your preferences, saves, and RSVPs."}
          </p>
        </div>
        <NeonLink href="/events?discover=for-you" shape="pill" className="shrink-0 text-xs">
          See all
        </NeonLink>
      </div>

      {!hasSignals ? (
        <div className="mb-4">
          <NeonLink href="/profile#culture-preferences" shape="pill" className="text-xs">
            Set preferences
          </NeonLink>
        </div>
      ) : null}

      <div className="flex flex-col gap-4">
        {items.length > 0 ? (
          items.map((ev) => (
            <Link key={ev.id} href={`/events/${ev.slug}`} className="block">
              <GlassCard
                className="overflow-hidden p-0 transition-[box-shadow,transform] hover:shadow-[var(--vibe-neon-glow-subtle)] active:scale-[0.99]"
                emphasis
              >
                <div className="flex flex-col md:flex-row">
                  {ev.flyer_url ? (
                    <div className="relative aspect-[16/9] w-full shrink-0 md:aspect-auto md:h-36 md:w-48">
                      <Image
                        src={ev.flyer_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 192px"
                      />
                    </div>
                  ) : null}
                  <div className="space-y-2 p-4 md:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      {ev.is_staff_pick ? (
                        <span className="rounded-full border border-[color:var(--neon-hairline)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-b)]">
                          ViZb pick
                        </span>
                      ) : null}
                      {ev.event_kind === "community" ? (
                        <span className="rounded-full border border-[color:var(--neon-hairline)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-text2)]">
                          {eventKindBadgeLong("community")}
                        </span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-bold text-[color:var(--neon-text0)]">{ev.title}</h3>
                    <p className="text-sm text-[color:var(--neon-text1)]">
                      {ev.city} · {formatDashboardEventWhen(ev.starts_at, ev.ends_at)}
                    </p>
                    <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[color:var(--neon-a)]">
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
              Browse events
            </NeonLink>
          </EmptyStateCard>
        )}
      </div>
    </section>
  )
}
