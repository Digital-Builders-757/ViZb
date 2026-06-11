import Link from "next/link"

import { EventTimelineCard } from "@/components/events/event-timeline-card"
import { TimelineDateHeader } from "@/components/events/timeline-date-header"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { normalizeCategories } from "@/lib/events/categories"
import { fetchMySavedEventIds } from "@/lib/events/my-vibes-queries"
import {
  isPublicListingEventStatus,
  PUBLIC_EVENT_LISTING_STATUS,
} from "@/lib/events/public-listing"

const HOME_TIMELINE_LIMIT = 12

interface HomeTimelineEvent {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
  org_name: string
  org_slug: string | null
  event_kind: "official" | "community"
  is_staff_pick: boolean
}

type PublicEventRow = {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
  status?: string | null
  event_kind?: string | null
  is_staff_pick?: boolean | null
  organizations: { name: string; slug: string } | null
}

const MOCK_EVENTS: HomeTimelineEvent[] = [
  {
    id: "mock-1",
    title: "The Matrix Party",
    slug: "the-matrix-party",
    starts_at: "2026-04-12T01:00:00.000Z",
    ends_at: null,
    venue_name: "Downtown",
    city: "Norfolk",
    categories: ["party"],
    flyer_url: "/vibe-event-party.jpg",
    org_name: "VIZB",
    org_slug: "vizb",
    event_kind: "official",
    is_staff_pick: false,
  },
  {
    id: "mock-2",
    title: "BeatNight 757",
    slug: "beatnight-757",
    starts_at: "2026-04-14T02:00:00.000Z",
    ends_at: null,
    venue_name: "Waterside",
    city: "Virginia Beach",
    categories: ["concert"],
    flyer_url: "/vibe-event-dj.jpg",
    org_name: "VIZB",
    org_slug: "vizb",
    event_kind: "official",
    is_staff_pick: true,
  },
  {
    id: "mock-3",
    title: "Creators Mixer",
    slug: "creators-mixer",
    starts_at: "2026-04-17T23:00:00.000Z",
    ends_at: null,
    venue_name: "Arts District",
    city: "Richmond",
    categories: ["networking"],
    flyer_url: "/vibe-creative-workshop-real.jpg",
    org_name: "VIZB",
    org_slug: "vizb",
    event_kind: "community",
    is_staff_pick: false,
  },
]

function flattenEventRow(e: PublicEventRow): HomeTimelineEvent {
  return {
    id: e.id,
    title: e.title,
    slug: e.slug,
    starts_at: e.starts_at,
    ends_at: e.ends_at,
    venue_name: e.venue_name,
    city: e.city,
    categories: normalizeCategories(e.categories),
    flyer_url: e.flyer_url,
    org_name: e.organizations?.name ?? "VIZB",
    org_slug: e.organizations?.slug ?? null,
    event_kind: e.event_kind === "community" ? "community" : "official",
    is_staff_pick: Boolean(e.is_staff_pick),
  }
}

function isUpcomingOrOngoing(e: HomeTimelineEvent, now: Date): boolean {
  if (e.ends_at) return new Date(e.ends_at).getTime() >= now.getTime()
  return new Date(e.starts_at).getTime() >= now.getTime()
}

const etDateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})

export async function HomeTimelineSection() {
  const now = new Date()
  let events: HomeTimelineEvent[] = []
  let isSignedIn = false
  let savedIdSet = new Set<string>()

  const supabaseConfigured = isServerSupabaseConfigured()

  if (supabaseConfigured) {
    const supabase = await createClient()

    const { data } = await supabase
      .from("events")
      .select(
        `
        id,
        title,
        slug,
        starts_at,
        ends_at,
        venue_name,
        city,
        categories,
        flyer_url,
        status,
        event_kind,
        is_staff_pick,
        organizations ( name, slug )
      `,
      )
      .eq("status", PUBLIC_EVENT_LISTING_STATUS)
      .gte("starts_at", new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order("starts_at", { ascending: true })
      .limit(HOME_TIMELINE_LIMIT * 2)

    const rows = ((data as PublicEventRow[] | null) ?? []).filter((row) =>
      isPublicListingEventStatus(row.status),
    )
    events = rows
      .map(flattenEventRow)
      .filter((e) => isUpcomingOrOngoing(e, now))
      .slice(0, HOME_TIMELINE_LIMIT)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      isSignedIn = true
      const savedIds = await fetchMySavedEventIds(supabase, user.id)
      savedIdSet = new Set(savedIds)
    }
  } else if (process.env.NODE_ENV === "production") {
    await createClient()
  }

  // Dev-only placeholder when Supabase is not wired — never mask an empty live feed.
  if (!supabaseConfigured && events.length === 0) {
    events = MOCK_EVENTS
  }

  const grouped: Record<string, HomeTimelineEvent[]> = {}
  for (const event of events) {
    const dateKey = etDateFormatter.format(new Date(event.starts_at))
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(event)
  }

  const dateKeys = Object.keys(grouped).sort()
  let runningIndex = 0
  return (
    <section id="timeline" className="scroll-mt-24 px-4 pb-16 pt-4 sm:px-8 md:pb-20 md:pt-6">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex items-end justify-between gap-4 border-b border-[color:var(--neon-hairline)] pb-6">
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
              The timeline
            </span>
            <h2 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] sm:text-3xl">
              What&apos;s happening
            </h2>
          </div>
          <Link
            href="/events#timeline"
            className="vibe-focus-ring shrink-0 rounded-sm font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] transition-colors hover:text-[color:var(--neon-text0)] sm:text-[11px]"
          >
            View full timeline →
          </Link>
        </div>

        {dateKeys.length > 0 ? (
          <div className="relative mt-8">
            <div className="absolute bottom-0 left-[5px] top-0 hidden w-px bg-[color:var(--neon-a)]/25 shadow-[0_0_10px_rgb(0_209_255/0.18)] md:block" />

            {dateKeys.map((dateKey, di) => {
              const dateObj = new Date(dateKey + "T12:00:00-05:00")
              const eventsForDate = grouped[dateKey]

              return (
                <div key={dateKey}>
                  <TimelineDateHeader date={dateObj} isFirst={di === 0} />

                  <div className="mt-6 flex flex-col gap-7 md:ml-10 md:mt-8 md:gap-9">
                    {eventsForDate.map((event) => {
                      const card = (
                        <EventTimelineCard
                          key={event.id}
                          event={event}
                          index={runningIndex}
                          isSignedIn={isSignedIn}
                          isSaved={savedIdSet.has(event.id)}
                          interactive={false}
                        />
                      )
                      runningIndex++
                      return card
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyStateCard
            className="mt-10"
            kicker="Timeline"
            title="Nothing on the calendar yet"
            description="Check back soon for new listings across Virginia."
          >
            <NeonLink href="/host/apply" variant="secondary" shape="pill" size="sm">
              Host with VIZB
            </NeonLink>
          </EmptyStateCard>
        )}
      </div>
    </section>
  )
}
