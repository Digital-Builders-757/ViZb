import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { ThreeBackgroundWrapper } from "@/components/three-background-wrapper"
import { EventTimelineCard } from "@/components/events/event-timeline-card"
import { TimelineDateHeader } from "@/components/events/timeline-date-header"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { Calendar } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { EVENT_CATEGORY_OPTIONS, normalizeCategories } from "@/lib/events/categories"
import { formatCategoryLabel, sliceCategoriesForDisplay } from "@/lib/events/event-display-format"
import { fetchMySavedEventIds } from "@/lib/events/my-vibes-queries"

export const metadata: Metadata = {
  title: "Events | VIZB",
  description: "Explore upcoming events across Virginia. Parties, mixers, workshops, and more.",
  openGraph: {
    title: "Events | VIZB",
    description: "Explore upcoming events across Virginia. Parties, mixers, workshops, and more.",
  },
}

interface PublicEventRow {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
  status: string
  organizations: { name: string; slug: string } | null
}

interface FlatEvent {
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
}

/** Public listing chips: `slug` is the `?category=` query value (must match `events.categories` text). */
const EVENT_LISTING_FILTERS = [
  { slug: "all" as const, label: "All" },
  ...EVENT_CATEGORY_OPTIONS.map((o) => ({ slug: o.value, label: o.label })),
] as const

function eventsListingQuery(opts: { category?: string | null; vibes?: boolean }): string {
  const sp = new URLSearchParams()
  if (opts.category && opts.category !== "all") {
    sp.set("category", opts.category.toLowerCase())
  }
  if (opts.vibes) sp.set("vibes", "1")
  const q = sp.toString()
  return q ? `?${q}` : ""
}

export default async function EventsExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; vibes?: string }>
}) {
  const { category: activeFilter, vibes: vibesParam } = await searchParams
  const vibesFilter = vibesParam === "1" || vibesParam === "true"

  // Use current time as the upcoming/past split -- simple, no timezone edge cases
  const now = new Date()

  // Past events cutoff: 30 days ago
  const pastCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const pastCutoffISO = pastCutoff.toISOString()

  let allEvents: PublicEventRow[] | null = null

  if (isServerSupabaseConfigured()) {
    const supabase = await createClient()

    const selectFields = `
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
    organizations ( name, slug )
  `

    // Upcoming + happening now:
    //   If ends_at exists: include when ends_at >= now (still happening)
    //   If ends_at is null: include when starts_at >= now
    // Supabase doesn't support OR across columns easily, so fetch broadly and filter in JS
    let upcomingQuery = supabase
      .from("events")
      .select(selectFields)
      .eq("status", "published")
      .gte("starts_at", pastCutoffISO)
      .order("starts_at", { ascending: true })

    // Past events: separate query with same broad fetch, filtered in JS
    let pastQuery = supabase
      .from("events")
      .select(selectFields)
      .eq("status", "published")
      .gte("starts_at", pastCutoffISO)
      .order("starts_at", { ascending: false })

    // Apply category filter (event must include this tag in its categories array)
    if (activeFilter && activeFilter !== "all") {
      upcomingQuery = upcomingQuery.contains("categories", [activeFilter.toLowerCase()])
      pastQuery = pastQuery.contains("categories", [activeFilter.toLowerCase()])
    }

    // Fetch all events from the last 30 days onward in one query (category filter applied above)
    const { data } = await upcomingQuery
    allEvents = data as PublicEventRow[] | null
  } else if (process.env.NODE_ENV === "production") {
    await createClient()
  }

  let eventsUser: { id: string } | null = null
  let savedEventIds: string[] = []
  if (isServerSupabaseConfigured()) {
    const supabaseAuth = await createClient()
    const {
      data: { user },
    } = await supabaseAuth.auth.getUser()
    if (user) {
      eventsUser = { id: user.id }
      savedEventIds = await fetchMySavedEventIds(supabaseAuth, user.id)
    }
  }

  const savedIdSet = new Set(savedEventIds)
  const isSignedInForVibes = !!eventsUser
  const vibeAuthHref = `/login?redirect=${encodeURIComponent(`/events${eventsListingQuery({ category: activeFilter ?? undefined, vibes: vibesFilter })}`)}`

  // Map to flat format with org fallbacks
  function flattenEvents(rows: PublicEventRow[] | null): FlatEvent[] {
    return (rows ?? []).map((e) => ({
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
    }))
  }

  const allFlat = flattenEvents(allEvents as PublicEventRow[] | null)

  // Split: upcoming/ongoing vs past
  // An event is "upcoming or ongoing" if:
  //   - ends_at exists and ends_at >= now (still happening), OR
  //   - ends_at is null and starts_at >= now (hasn't started yet)
  function isUpcomingOrOngoing(e: FlatEvent): boolean {
    if (e.ends_at) return new Date(e.ends_at).getTime() >= now.getTime()
    return new Date(e.starts_at).getTime() >= now.getTime()
  }

  let flatUpcoming = allFlat
    .filter(isUpcomingOrOngoing)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  let flatPast = allFlat
    .filter((e) => !isUpcomingOrOngoing(e))
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    .slice(0, 12)

  const vibesSignedOutGate = vibesFilter && !isSignedInForVibes

  if (vibesSignedOutGate) {
    flatUpcoming = []
    flatPast = []
  } else if (vibesFilter && isSignedInForVibes) {
    flatUpcoming = flatUpcoming.filter((e) => savedIdSet.has(e.id))
    flatPast = flatPast.filter((e) => savedIdSet.has(e.id))
  }

  // Simple “Trending” strip: earliest upcoming items (no extra query)
  const trending = flatUpcoming.slice(0, 3)

  // ET timezone formatter for date grouping (Virginia audience)
  const etDateFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })

  // Group upcoming by ET date
  const grouped: Record<string, FlatEvent[]> = {}
  for (const event of flatUpcoming) {
    const dateKey = etDateFormatter.format(new Date(event.starts_at))
    if (!grouped[dateKey]) grouped[dateKey] = []
    grouped[dateKey].push(event)
  }

  const dateKeys = Object.keys(grouped).sort()
  const hasUpcoming = dateKeys.length > 0
  const hasPast = flatPast.length > 0
  const hasEvents = hasUpcoming || hasPast

  let runningIndex = 0

  return (
    <main className="relative min-h-screen bg-[color:var(--neon-bg0)] overflow-hidden">
      {/* Three.js particle background -- fixed behind all content */}
      <div className="fixed inset-0 z-0">
        <ThreeBackgroundWrapper />
      </div>

      {/* Dark overlay for text readability */}
      <div className="fixed inset-0 bg-[color:var(--neon-bg0)]/45 z-[1]" />

      {/* Floating neon orbs */}
      <div className="fixed top-20 right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl animate-pulse z-[1]" />
      <div
        className="fixed bottom-32 left-10 z-[1] h-32 w-32 rounded-full bg-[color:var(--neon-a)]/15 blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="fixed top-1/2 right-1/4 z-[1] h-24 w-24 rounded-full bg-[color:var(--neon-b)]/10 blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      />

      {/* All page content above the background */}
      <div className="relative z-10">
      <Navbar />

      {/* Hero Header */}
      <section className="px-4 pb-14 pt-24 sm:px-8 sm:pb-16 md:pb-20 md:pt-32">
        <div className="mx-auto max-w-[1200px]">
          <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[color:var(--neon-a)]" />
            Virginia Events
          </span>
          <h1 className="mt-5 md:mt-6">
            <span className="headline-xl block uppercase text-[color:var(--neon-text0)]">
              {"What's"}
            </span>
            <span className="headline-xl neon-gradient-text block uppercase">Happening</span>
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
            Scroll the timeline. Find your next experience. From underground parties to creative workshops,             {"it's"} all here.
          </p>

          {/* Filter bar */}
          <div className="mt-10 flex items-center gap-2 overflow-x-auto border-t border-[color:var(--neon-hairline)]/35 pt-8 scrollbar-none sm:gap-3 md:mt-12">
            {EVENT_LISTING_FILTERS.map((cat) => {
              const isActive =
                cat.slug === "all"
                  ? !activeFilter || activeFilter === "all"
                  : activeFilter === cat.slug
              const categoryParam = cat.slug === "all" ? undefined : cat.slug
              const href =
                cat.slug === "all"
                  ? `/events${eventsListingQuery({ vibes: vibesFilter })}`
                  : `/events${eventsListingQuery({ category: categoryParam, vibes: vibesFilter })}`

              return (
                <Link
                  key={cat.slug}
                  href={href}
                  className={`vibe-focus-ring inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all whitespace-nowrap sm:min-h-[44px] sm:px-4 sm:text-xs ${
                    isActive
                      ? "border-[color:var(--neon-a)]/55 bg-[color:var(--neon-surface)]/70 text-[color:var(--neon-text0)] shadow-[0_0_22px_rgba(0,209,255,0.16)]"
                      : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:color-mix(in_srgb,var(--neon-text1)_82%,var(--neon-text2))] hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/28 hover:text-[color:var(--neon-text0)] hover:shadow-[0_0_18px_rgba(0,209,255,0.10)]"
                  }`}
                >
                  {cat.label}
                </Link>
              )
            })}
            <Link
              href={
                vibesFilter
                  ? `/events${eventsListingQuery({ category: activeFilter ?? undefined })}`
                  : `/events${eventsListingQuery({ category: activeFilter ?? undefined, vibes: true })}`
              }
              className={`vibe-focus-ring inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all whitespace-nowrap sm:min-h-[44px] sm:px-4 sm:text-xs ${
                vibesFilter
                  ? "border-[color:var(--neon-b)]/45 bg-[color:var(--neon-surface)]/70 text-[color:var(--neon-text0)] shadow-[0_0_22px_rgba(157,77,255,0.14)]"
                  : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:color-mix(in_srgb,var(--neon-text1)_82%,var(--neon-text2))] hover:border-[color:var(--neon-b)]/40 hover:bg-[color:var(--neon-surface)]/28 hover:text-[color:var(--neon-text0)]"
              }`}
            >
              My Vibes
            </Link>
          </div>
        </div>
      </section>

      {/* Ocean wave divider */}
      <OceanDivider variant="hero" density="normal" />

      {/* Trending strip — compact glance cards (distinct from full timeline below) */}
      {trending.length > 0 ? (
        <section className="px-4 pb-2 pt-8 sm:px-8 md:pt-10">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Trending this weekend
                </p>
                <p className="mt-1 text-xs text-[color:var(--neon-text1)]/90">Quick picks — open the timeline for the full story.</p>
              </div>
              <Link
                href="/events#timeline"
                className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] transition-colors hover:text-[color:var(--neon-text0)]"
              >
                Full timeline →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {trending.map((e) => {
                const { visible: trendCats, extraCount: trendCatExtra } = sliceCategoriesForDisplay(
                  e.categories,
                  1,
                )
                return (
                <Link
                  key={e.id}
                  href={`/events/${e.slug}`}
                  className="group relative overflow-hidden rounded-xl border border-[color:var(--neon-hairline)]/90 bg-[color:var(--neon-surface)]/18 p-3.5 backdrop-blur transition-all duration-300 hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/26 hover:shadow-[0_0_32px_rgba(0,209,255,0.12)] sm:p-4"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(800px circle at 15% 0%, rgba(0,209,255,0.14), transparent 50%)",
                    }}
                    aria-hidden
                  />

                  <div className="relative z-[1] flex items-start gap-3.5">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/35 shadow-inner">
                      {e.flyer_url ? (
                        <Image
                          src={e.flyer_url}
                          alt={e.title}
                          fill
                          sizes="64px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    </div>

                    <div className="min-h-[4.25rem] min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold leading-snug text-[color:var(--neon-text0)]">
                        {e.title}
                      </p>
                      <p className="mt-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                        {new Intl.DateTimeFormat("en-US", {
                          timeZone: "America/New_York",
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(e.starts_at))}{" "}
                        <span className="text-[color:var(--neon-text2)]/70">·</span> {e.city}
                      </p>
                      {trendCats.length > 0 ? (
                        <p className="mt-2 flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-black/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)] sm:text-[10px]">
                            {formatCategoryLabel(trendCats[0])}
                          </span>
                          {trendCatExtra > 0 ? (
                            <span
                              className="font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)]/80 sm:text-[10px]"
                              aria-label={`${trendCatExtra} more categories`}
                            >
                              +{trendCatExtra} more
                            </span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
                )
              })}
            </div>
          </div>
        </section>
      ) : null}

      {/* Ocean wave divider before timeline */}
      {trending.length > 0 && <OceanDivider variant="soft" density="sparse" />}

      {/* Timeline Section */}
      <section id="timeline" className="scroll-mt-24 px-4 py-14 sm:px-8 md:py-20">
        <div className="mx-auto max-w-[1200px]">
          {vibesSignedOutGate ? (
            <div
              role="status"
              className="mb-12 rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 px-5 py-6 backdrop-blur md:px-8 md:py-7"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                My Vibes
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[color:var(--neon-text1)]">
                Sign in to see events you&apos;ve saved to your personal timeline.
              </p>
              <Link
                href={vibeAuthHref}
                className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-6 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:bg-[color:var(--neon-a)]/22"
              >
                Sign in to save
              </Link>
            </div>
          ) : null}

          {hasEvents ? (
            <>
              {/* Upcoming Events */}
              {hasUpcoming && (
                <div className="relative">
                  {/* Vertical timeline line -- desktop only */}
                  <div className="hidden md:block absolute left-[5px] top-0 bottom-0 w-px bg-[color:var(--neon-a)]/25 shadow-[0_0_10px_rgb(0_209_255/0.18)]" />

                  {dateKeys.map((dateKey, di) => {
                    // dateKey is YYYY-MM-DD in ET; parse as noon ET for display
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
                                isSignedIn={isSignedInForVibes}
                                isSaved={savedIdSet.has(event.id)}
                                vibeAuthHref={vibeAuthHref}
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
              )}

              {/* Past Events */}
              {hasPast && (
                <div className={hasUpcoming ? "mt-20 md:mt-28" : ""}>
                  <div className="mb-9 flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-[color:var(--neon-text2)]/45" />
                    <span className="text-[11px] font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
                      Recent past
                    </span>
                    <div className="flex-1 border-t border-[color:var(--neon-hairline)]/60" />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-3">
                    {flatPast.map((event) => {
                      const card = (
                        <div
                          key={event.id}
                          className="transition-[opacity,transform] duration-300 hover:opacity-100 md:opacity-[0.93]"
                        >
                          <EventTimelineCard
                            event={event}
                            index={runningIndex}
                            isSignedIn={isSignedInForVibes}
                            isSaved={savedIdSet.has(event.id)}
                            vibeAuthHref={vibeAuthHref}
                            tone="archive"
                          />
                        </div>
                      )
                      runningIndex++
                      return card
                    })}
                  </div>
                </div>
              )}
            </>
          ) : vibesSignedOutGate ? null : (
            /* Empty State */
            <div className="flex flex-col items-center py-16 text-center md:py-28">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/15 md:h-24 md:w-24">
                <Calendar className="h-8 w-8 text-[color:var(--neon-text2)] md:h-10 md:w-10" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)]">
                {vibesFilter && isSignedInForVibes
                  ? "My Vibes"
                  : activeFilter && activeFilter !== "all"
                    ? "No results"
                    : "Coming soon"}
              </span>
              <h2 className="mt-4 max-w-lg text-balance font-serif text-2xl font-bold text-[color:var(--neon-text0)] sm:text-3xl md:text-4xl">
                {vibesFilter && isSignedInForVibes
                  ? "No saved events match this view"
                  : activeFilter && activeFilter !== "all"
                    ? `No ${activeFilter} events found`
                    : "The timeline is loading"}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[color:var(--neon-text1)] sm:text-base">
                {vibesFilter && isSignedInForVibes
                  ? "Save events from the timeline with the My Vibes control, or widen your filters."
                  : activeFilter && activeFilter !== "all"
                    ? "Try a different category or check back later."
                    : "Events are being curated by organizers across Virginia. Check back soon or join the movement."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                {vibesFilter && isSignedInForVibes ? (
                  <>
                    <Link
                      href={`/events${eventsListingQuery({ category: activeFilter && activeFilter !== "all" ? activeFilter : undefined })}`}
                      className="text-xs uppercase tracking-widest bg-primary text-background px-8 py-4 hover:shadow-[0_0_30px_rgba(13,64,255,0.5)] transition-all text-center"
                    >
                      Clear My Vibes filter
                    </Link>
                    <Link
                      href="/events"
                      className="text-xs uppercase tracking-widest border border-border text-foreground px-8 py-4 hover:border-primary hover:text-primary transition-colors text-center"
                    >
                      Explore events
                    </Link>
                  </>
                ) : activeFilter && activeFilter !== "all" ? (
                  <Link
                    href="/events"
                    className="text-xs uppercase tracking-widest bg-primary text-background px-8 py-4 hover:shadow-[0_0_30px_rgba(13,64,255,0.5)] transition-all text-center"
                  >
                    View All Events
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="text-xs uppercase tracking-widest bg-primary text-background px-8 py-4 hover:shadow-[0_0_30px_rgba(13,64,255,0.5)] transition-all text-center"
                    >
                      Join VIZB
                    </Link>
                    <Link
                      href="/host/apply"
                      className="text-xs uppercase tracking-widest border border-border text-foreground px-8 py-4 hover:border-primary hover:text-primary transition-colors text-center"
                    >
                      Host an Event
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <Footer />
      </div>
    </main>
  )
}
