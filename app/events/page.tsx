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
import { normalizeCategories } from "@/lib/events/categories"
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
  description: string | null
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
  description: string | null
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  categories: string[]
  flyer_url: string | null
  org_name: string
  org_slug: string | null
}

const FILTER_CATEGORIES = ["All", "Party", "Networking", "Workshop", "Concert", "Social", "Other"] as const

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
    description,
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
      description: e.description,
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
      <div className="fixed inset-0 bg-[color:var(--neon-bg0)]/55 z-[1]" />

      {/* Floating neon orbs */}
      <div className="fixed top-20 right-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl animate-pulse z-[1]" />
      <div className="fixed bottom-32 left-10 w-32 h-32 bg-[#00BDFF]/15 rounded-full blur-3xl animate-pulse z-[1]" style={{ animationDelay: "1s" }} />
      <div className="fixed top-1/2 right-1/4 w-24 h-24 bg-[#0C74E8]/10 rounded-full blur-3xl animate-pulse z-[1]" style={{ animationDelay: "2s" }} />

      {/* All page content above the background */}
      <div className="relative z-10">
      <Navbar />

      {/* Hero Header */}
      <section className="pt-24 sm:pt-28 md:pt-32 pb-12 md:pb-16 px-4 sm:px-8">
        <div className="max-w-[1200px] mx-auto">
          <span className="text-xs uppercase tracking-widest text-[color:var(--neon-a)] font-mono inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-[color:var(--neon-a)] rounded-full animate-pulse" />
            Virginia Events
          </span>
          <h1 className="mt-4 md:mt-6">
            <span className="block headline-xl text-[color:var(--neon-text0)] uppercase">
              {"What's"}
            </span>
            <span className="block headline-xl uppercase neon-gradient-text">
              Happening
            </span>
          </h1>
          <p className="text-base sm:text-lg text-[color:var(--neon-text1)] mt-6 max-w-lg leading-relaxed">
            Scroll the timeline. Find your next experience. From underground parties to creative workshops, {"it's"} all here.
          </p>

          {/* Filter bar */}
          <div className="mt-8 flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none md:mt-10">
            {FILTER_CATEGORIES.map((cat) => {
              const isActive = cat === "All"
                ? !activeFilter || activeFilter === "all"
                : activeFilter === cat.toLowerCase()
              const catSlug = cat === "All" ? undefined : cat.toLowerCase()
              const href =
                cat === "All"
                  ? `/events${eventsListingQuery({ vibes: vibesFilter })}`
                  : `/events${eventsListingQuery({ category: catSlug, vibes: vibesFilter })}`

              return (
                <Link
                  key={cat}
                  href={href}
                  className={`vibe-focus-ring inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all whitespace-nowrap sm:min-h-[44px] sm:px-4 sm:text-xs ${
                    isActive
                      ? "border-[color:var(--neon-a)]/55 bg-[color:var(--neon-surface)]/70 text-[color:var(--neon-text0)] shadow-[0_0_22px_rgba(0,209,255,0.16)]"
                      : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/28 hover:text-[color:var(--neon-text0)] hover:shadow-[0_0_18px_rgba(0,209,255,0.10)]"
                  }`}
                >
                  {cat}
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
                  : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:var(--neon-text2)] hover:border-[color:var(--neon-b)]/40 hover:bg-[color:var(--neon-surface)]/28 hover:text-[color:var(--neon-text0)]"
              }`}
            >
              My Vibes
            </Link>
          </div>
        </div>
      </section>

      {/* Ocean wave divider */}
      <OceanDivider variant="hero" density="normal" />

      {/* Trending strip */}
      {trending.length > 0 ? (
        <section className="px-4 pt-10 sm:px-8 md:pt-12">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                Trending this weekend
              </p>
              <Link
                href="/events"
                className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] hover:brightness-110"
              >
                Timeline →
              </Link>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {trending.map((e) => (
                <Link
                  key={e.id}
                  href={`/events/${e.slug}`}
                  className="group relative overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 p-3 backdrop-blur transition hover:border-[color:var(--neon-a)]/35 hover:shadow-[0_0_24px_rgba(0,209,255,0.10)]"
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    style={{
                      background:
                        "radial-gradient(900px circle at 20% 10%, rgba(0,209,255,0.12), transparent 55%)",
                    }}
                    aria-hidden
                  />

                  <div className="relative z-[1] flex items-center gap-3">
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                      {e.flyer_url ? (
                        <Image
                          src={e.flyer_url}
                          alt={e.title}
                          fill
                          sizes="56px"
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[color:var(--neon-text0)]">
                        {e.title}
                      </p>
                      <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                        {e.city} · {new Intl.DateTimeFormat("en-US", {
                          timeZone: "America/New_York",
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        }).format(new Date(e.starts_at))}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full border border-[color:var(--neon-hairline)] bg-black/25 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                      {e.categories[0] ?? "Event"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* Ocean wave divider before timeline */}
      {trending.length > 0 && <OceanDivider variant="soft" density="sparse" />}

      {/* Timeline Section */}
      <section className="px-4 py-12 sm:px-8 md:py-20">
        <div className="max-w-[1200px] mx-auto">
          {vibesSignedOutGate ? (
            <div
              role="status"
              className="mb-10 rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-4 py-4 backdrop-blur md:px-6 md:py-5"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                My Vibes
              </p>
              <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
                Sign in to see events you&apos;ve saved.
              </p>
              <Link
                href={vibeAuthHref}
                className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/15 px-5 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:bg-[color:var(--neon-a)]/25"
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

                        <div className="flex flex-col gap-6 md:gap-8 mt-6 md:mt-8 md:ml-10">
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
                <div className={hasUpcoming ? "mt-16 md:mt-24" : ""}>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full" />
                    <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                      Recent Past Events
                    </span>
                    <div className="flex-1 border-t border-border" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {flatPast.map((event) => {
                      const card = (
                        <div key={event.id} className="opacity-70 hover:opacity-100 transition-opacity">
                          <EventTimelineCard
                            event={event}
                            index={runningIndex}
                            isSignedIn={isSignedInForVibes}
                            isSaved={savedIdSet.has(event.id)}
                            vibeAuthHref={vibeAuthHref}
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
            <div className="flex flex-col items-center text-center py-16 md:py-32">
              <div className="w-20 h-20 md:w-24 md:h-24 border border-border rounded-full flex items-center justify-center mb-8">
                <Calendar className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
              </div>
              <span className="text-xs font-mono uppercase tracking-widest text-primary">
                {vibesFilter && isSignedInForVibes
                  ? "My Vibes"
                  : activeFilter && activeFilter !== "all"
                    ? "No Results"
                    : "Coming Soon"}
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mt-4 text-balance">
                {vibesFilter && isSignedInForVibes
                  ? "No saved events match this view"
                  : activeFilter && activeFilter !== "all"
                    ? `No ${activeFilter} Events Found`
                    : "The Timeline Is Loading"}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground mt-4 max-w-md leading-relaxed">
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
