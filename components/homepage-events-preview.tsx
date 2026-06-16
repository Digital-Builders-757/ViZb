import Link from "next/link"

import { EventsFeaturedMoment } from "@/components/events/events-featured-moment"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"
import { OceanDivider } from "@/components/ui/ocean-divider"
import type { HomepageEventsPreviewData } from "@/lib/events/homepage-events"
import { eventsListingQuery } from "@/lib/events/listing-query"

interface HomepageEventsPreviewProps {
  data: HomepageEventsPreviewData
}

export function HomepageEventsPreview({ data }: HomepageEventsPreviewProps) {
  const { staffPicksMoment, topCategories, eventsLoadError } = data
  const hasEvents = Boolean(staffPicksMoment) || topCategories.some((cat) => cat.count > 0)

  return (
    <section
      aria-labelledby="homepage-events-heading"
      className="px-4 py-10 sm:px-8 md:py-14"
    >
      <div className="mx-auto max-w-[1200px]">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          What&apos;s happening
        </p>
        <h2
          id="homepage-events-heading"
          className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] sm:text-3xl md:text-4xl"
        >
          Pull up to the next ViBE.
        </h2>
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-[color:var(--neon-text1)] sm:text-base">
          Parties, workshops, pop-ups, open mics, and community moments across Virginia.
        </p>

        {eventsLoadError ? (
          <div
            role="alert"
            className="mt-6 max-w-lg rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 backdrop-blur"
          >
            <p className="font-mono text-[10px] uppercase tracking-widest text-amber-200">
              Events couldn&apos;t load
            </p>
            <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
              Try refreshing the page. You can still browse the events page below.
            </p>
          </div>
        ) : null}

        {hasEvents ? (
          <>
            {staffPicksMoment ? (
              <div className="mt-8">
                <EventsFeaturedMoment moment={staffPicksMoment} />
              </div>
            ) : null}

            <OceanDivider variant="soft" density="sparse" className="my-10" />

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                Top categories
              </p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {topCategories.map((cat) => (
                  <Link
                    key={cat.category}
                    href={`/events${eventsListingQuery({ category: cat.category })}`}
                    className="events-neon-card events-neon-card-hover events-card-surface events-card-surface-hover group relative overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)]/90 p-5 transition-colors hover:border-[color:var(--neon-a)]/50"
                  >
                    <div
                      className="events-card-hover-radial-preview pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden
                    />
                    <div className="relative z-[1]">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <h3 className="font-serif text-xl font-bold text-[color:var(--neon-text0)]">
                          {cat.label}
                        </h3>
                        {cat.count > 0 ? (
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                            {cat.count} upcoming
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-[color:var(--neon-text1)]">
                        {cat.microcopy}
                      </p>
                      <span className="mt-4 inline-block font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] group-hover:underline">
                        Explore {cat.label.toLowerCase()} →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        ) : (
          <EmptyStateCard
            className="mt-10"
            kicker="Events"
            title="The next wave is loading."
            description="Browse the full events page or check back soon."
          >
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
              <NeonLink href="/events" shape="pill" size="default">
                Explore events
              </NeonLink>
              <NeonLink href="/host/apply" variant="secondary" shape="pill" size="default">
                Create event
              </NeonLink>
            </div>
          </EmptyStateCard>
        )}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <NeonLink href="/events" shape="pill" size="default">
            Explore all events
          </NeonLink>
          <NeonLink href="/host/apply" variant="secondary" shape="pill" size="default">
            Create event
          </NeonLink>
        </div>
      </div>
    </section>
  )
}
