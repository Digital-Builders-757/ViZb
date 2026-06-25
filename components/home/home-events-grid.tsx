import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { HomeEventGridCard } from "@/components/home/home-event-grid-card"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"
import type { HomepageEventsPreviewData } from "@/lib/events/homepage-events"

interface HomeEventsGridProps {
  data: HomepageEventsPreviewData
}

export function HomeEventsGrid({ data }: HomeEventsGridProps) {
  const { gridEvents, eventsLoadError } = data

  return (
    <section id="events" className="relative w-full scroll-mt-24 pb-16 pt-4 md:pt-8">
      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-10 flex flex-col justify-between gap-6 md:mb-16 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-widest text-[color:var(--neon-a)]">
              Staff Picks
            </h2>
            <h3 className="text-4xl font-black text-[color:var(--neon-text0)] md:text-5xl">
              Curated <span className="home-redesign-text-gradient">Experiences</span>
            </h3>
          </div>
          <Link
            href="/events"
            className="group inline-flex items-center gap-2 font-medium text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-a)]"
          >
            View All Events
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {eventsLoadError ? (
          <div
            role="alert"
            className="mb-8 max-w-lg rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 backdrop-blur"
          >
            <p className="text-sm font-bold uppercase tracking-widest text-amber-200">
              Events couldn&apos;t load
            </p>
            <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
              Try refreshing the page or browse the full events calendar.
            </p>
          </div>
        ) : null}

        {gridEvents.length > 0 ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {gridEvents.map((event) => (
              <HomeEventGridCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <EmptyStateCard
            kicker="Events"
            title="The next wave is loading."
            description="Browse the full events page or check back soon."
          >
            <NeonLink href="/events" shape="pill" size="default">
              Explore all events
            </NeonLink>
          </EmptyStateCard>
        )}
      </div>
    </section>
  )
}
