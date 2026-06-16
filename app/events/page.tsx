import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { logError } from "@/lib/log"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EventsDiscoveryHero } from "@/components/events/events-discovery-hero"
import { EventsSearchBar } from "@/components/events/events-search-bar"
import { EventsTideFilters } from "@/components/events/events-tide-filters"
import { EventsTimelineInteractive } from "@/components/events/events-timeline-interactive"
import { EventsFeaturedMoment } from "@/components/events/events-featured-moment"
import { TimelineJourneyBridge } from "@/components/events/timeline-journey-bridge"
import { TimelineSectionIntro } from "@/components/events/timeline-section-intro"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"
import { OceanDivider } from "@/components/ui/ocean-divider"
import Link from "next/link"
import type { Metadata } from "next"
import {
  isValidEventCategory,
  normalizeCategories,
} from "@/lib/events/categories"
import {
  DISCOVERY_PRESET_OPTIONS,
  applyDiscoveryPreset,
  compareEventsByCityThenTime,
  eventMatchesSearch,
  parseDiscoveryParam,
  parseSortParam,
  type DiscoveryPreset,
  type TicketStub,
} from "@/lib/events/discovery-filters"
import { buildStaffPicksMoment } from "@/lib/events/discovery-featured-moments"
import type { ListingEvent } from "@/lib/events/listing-event"
import {
  buildCityFilterOptions,
  eventsListingQuery,
  normalizeCityLabel,
  parseCityParam,
  type ListingQueryOpts,
} from "@/lib/events/listing-query"
import { getPublicSiteOrigin } from "@/lib/public-site-url"
import { fetchMySavedEventIds } from "@/lib/events/my-vibes-queries"
import { isEventUpcomingOrOngoing } from "@/lib/events/event-schedule"
import { fetchMemberPreferences } from "@/lib/member/load-preferences"
import { rankEventsForMember } from "@/lib/events/member-recommendations"
import { CausticBackdrop } from "@/components/ui/caustic-backdrop"
import { isPublicListingEventStatus } from "@/lib/events/public-listing"

export const dynamic = "force-dynamic"

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
  event_kind?: string | null
  is_staff_pick?: boolean | null
  ticket_types?: TicketStub[] | null
  organizations: { name: string; slug: string } | null
}

interface FlatEvent extends ListingEvent {}

export default async function EventsExplorePage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string
    city?: string
    vibes?: string
    discover?: string
    q?: string
    sort?: string
  }>
}) {
  const sp = await searchParams
  const { category: activeFilter, vibes: vibesParam } = sp
  const rawCity = parseCityParam(sp.city)
  const activeCity = rawCity ? normalizeCityLabel(rawCity) : null
  const vibesFilter = vibesParam === "1" || vibesParam === "true"
  const discoveryPreset = parseDiscoveryParam(sp.discover)
  const forYouMode = sp.discover === "for-you"
  const searchQRaw = typeof sp.q === "string" ? sp.q : Array.isArray(sp.q) ? sp.q[0] : ""
  const searchQ = searchQRaw ?? ""
  const sortMode = parseSortParam(sp.sort)

  // Use current time as the upcoming/past split -- simple, no timezone edge cases
  const now = new Date()

  // Query window: include recently started events so ongoing multi-day listings are not missed
  const pastCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const pastCutoffISO = pastCutoff.toISOString()

  let allEvents: PublicEventRow[] | null = null
  let eventsLoadError = false

  let supabase: Awaited<ReturnType<typeof createClient>> | null = null

  if (isServerSupabaseConfigured()) {
    supabase = await createClient()

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
    event_kind,
    is_staff_pick,
    ticket_types ( price_cents, sales_starts_at, sales_ends_at ),
    organizations ( name, slug )
  `

    let upcomingQuery = supabase
      .from("events")
      .select(selectFields)
      .eq("status", "published")
      .gte("starts_at", pastCutoffISO)
      .order("starts_at", { ascending: true })
      .limit(120)

    const categorySlug =
      activeFilter && activeFilter !== "all" ? activeFilter.toLowerCase() : null
    if (categorySlug && isValidEventCategory(categorySlug)) {
      upcomingQuery = upcomingQuery.contains("categories", [categorySlug])
    }

    const { data, error } = await upcomingQuery
    if (error) {
      logError("events.discovery", error, { category: categorySlug ?? "all" })
      eventsLoadError = true
    }
    allEvents = (data as PublicEventRow[] | null)?.filter((row) =>
      isPublicListingEventStatus(row.status),
    ) ?? null
  } else if (process.env.NODE_ENV === "production") {
    await createClient()
  }

  let eventsUser: { id: string } | null = null
  let savedEventIds: string[] = []
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      eventsUser = { id: user.id }
      savedEventIds = await fetchMySavedEventIds(supabase, user.id)
    }
  }

  const savedIdSet = new Set(savedEventIds)
  const isSignedInForVibes = !!eventsUser

  const listingOptsBase: ListingQueryOpts = {
    category: activeFilter ?? undefined,
    city: activeCity ?? undefined,
    vibes: vibesFilter,
    discover: discoveryPreset ?? undefined,
    q: searchQ || undefined,
    sort: sortMode,
  }

  const vibeAuthHref = `/login?redirect=${encodeURIComponent(`/events${eventsListingQuery(listingOptsBase)}`)}`

  // Map to flat format with org fallbacks
  function flattenEvents(rows: PublicEventRow[] | null): FlatEvent[] {
    return (rows ?? []).map((e) => {
      const rawTT = e.ticket_types
      const ticket_types: TicketStub[] = Array.isArray(rawTT)
        ? rawTT.map((t) => ({
            price_cents: t.price_cents ?? null,
            sales_starts_at: t.sales_starts_at ?? null,
            sales_ends_at: t.sales_ends_at ?? null,
          }))
        : []
      const desc =
        typeof (e as { description?: unknown }).description === "string"
          ? (e as { description: string }).description
          : null
      return {
        id: e.id,
        title: e.title,
        slug: e.slug,
        description: desc,
        starts_at: e.starts_at,
        ends_at: e.ends_at,
        venue_name: e.venue_name,
        city: e.city,
        categories: normalizeCategories(e.categories),
        flyer_url: e.flyer_url,
        org_name: e.organizations?.name ?? "VIZB",
        org_slug: e.organizations?.slug ?? null,
        event_kind:
          ((e as { event_kind?: string | null }).event_kind === "community"
            ? "community"
            : "official"),
        is_staff_pick: Boolean((e as { is_staff_pick?: boolean | null }).is_staff_pick),
        ticket_types,
      }
    })
  }

  const allFlat = flattenEvents(allEvents as PublicEventRow[] | null)

  // Split: upcoming/ongoing vs past (coalesce(ends_at, starts_at) > now)
  let upcomingBase = allFlat
    .filter((e) => isEventUpcomingOrOngoing(e.starts_at, e.ends_at, now.getTime()))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  if (forYouMode && eventsUser && supabase) {
    const prefs = await fetchMemberPreferences(supabase, eventsUser.id)
    const ranked = rankEventsForMember(
      upcomingBase.map((e) => ({
        ...e,
        org_id: undefined,
      })),
      {
        preferenceCategories: prefs.categories,
        preferenceHomeCities: prefs.homeCities,
        savedCategories: [],
        rsvpCategories: [],
      },
      60,
      now.getTime(),
    )
    const order = new Map(ranked.map((r, i) => [r.id, i]))
    upcomingBase = [...upcomingBase].sort(
      (a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999),
    )
  }

  const vibesSignedOutGate = vibesFilter && !isSignedInForVibes

  if (vibesSignedOutGate) {
    upcomingBase = []
  } else if (vibesFilter && isSignedInForVibes) {
    upcomingBase = upcomingBase.filter((e) => savedIdSet.has(e.id))
  }

  const hasUnfilteredUpcoming = upcomingBase.length > 0

  const hasTimelineFilters = Boolean(activeCity || discoveryPreset || searchQ.trim())

  function passesDiscoveryAndSearch(e: FlatEvent): boolean {
    if (activeCity && normalizeCityLabel(e.city).toLowerCase() !== activeCity.toLowerCase()) return false
    if (forYouMode) {
      // Ranking handled above; only apply search here.
    } else if (discoveryPreset && !applyDiscoveryPreset(discoveryPreset, e, now)) return false
    if (
      !eventMatchesSearch({
        title: e.title,
        venue_name: e.venue_name,
        city: e.city,
        description: e.description,
        categories: e.categories,
        orgName: e.org_name,
        q: searchQ,
      })
    )
      return false
    return true
  }

  const staffPicksMoment = buildStaffPicksMoment(upcomingBase)
  const showStaffPicksFeatured =
    !hasTimelineFilters && !vibesFilter && staffPicksMoment !== null

  let flatUpcoming = upcomingBase.filter(passesDiscoveryAndSearch)

  if (sortMode === "city") {
    flatUpcoming = [...flatUpcoming].sort(compareEventsByCityThenTime)
  }

  const filteredTimelineEmptyButPoolHasEvents =
    !vibesSignedOutGate &&
    flatUpcoming.length === 0 &&
    hasUnfilteredUpcoming

  const hasPoolEvents = hasUnfilteredUpcoming
  const activeDiscoveryLabel = discoveryPreset
    ? (DISCOVERY_PRESET_OPTIONS.find((o) => o.value === discoveryPreset)?.label ?? discoveryPreset)
    : null

  /** Clear discovery + search while keeping category + vibes + sort shape as needed */
  function listingClearDiscovery(): ListingQueryOpts {
    return {
      category: activeFilter ?? undefined,
      city: activeCity ?? undefined,
      vibes: vibesFilter,
      sort: sortMode === "city" ? "city" : undefined,
    }
  }

  /** Clear everything except vibes */
  function listingBare(): ListingQueryOpts {
    return {
      vibes: vibesFilter,
    }
  }

  function ql(overrides: Partial<ListingQueryOpts> = {}): string {
    return eventsListingQuery({ ...listingOptsBase, ...overrides })
  }

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
  const cityFilterOptions = buildCityFilterOptions(upcomingBase)
  const siteOrigin = getPublicSiteOrigin()

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--neon-bg0)]">
      <CausticBackdrop variant="editorial" />

      {/* All page content above the background */}
      <div className="relative z-10">
      <Navbar />

      {/* Hero + search + tide filters */}
      <EventsDiscoveryHero upcomingCount={upcomingBase.length}>
        <EventsSearchBar
          searchQ={searchQ}
          activeFilter={activeFilter}
          activeCity={activeCity}
          vibesFilter={vibesFilter}
          discoveryPreset={discoveryPreset}
          sortMode={sortMode}
          clearSearchHref={`/events${ql({ q: undefined })}`}
        />
      </EventsDiscoveryHero>

      <OceanDivider variant="hero" density="sparse" />

      <section className="px-4 pb-3 sm:px-8">
        <div className="mx-auto max-w-[1200px]">
          {eventsLoadError ? (
            <div
              role="alert"
              className="mb-6 max-w-lg rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 backdrop-blur"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-200">Events couldn&apos;t load</p>
              <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                Try refreshing the page. If this keeps happening, our team has been notified via server logs.
              </p>
            </div>
          ) : null}

          <EventsTideFilters
            listingBase={listingOptsBase}
            activeFilter={activeFilter}
            activeCity={activeCity}
            vibesFilter={vibesFilter}
            discoveryPreset={discoveryPreset}
            cityOptions={cityFilterOptions}
            searchQ={searchQ}
          />
        </div>
      </section>

      {showStaffPicksFeatured && staffPicksMoment ? (
        <section className="px-4 pb-0 pt-3 sm:px-8 md:pt-4">
          <div className="mx-auto max-w-[1200px]">
            <EventsFeaturedMoment moment={staffPicksMoment} />
          </div>
        </section>
      ) : null}

      <TimelineJourneyBridge showStaffPicksFeatured={showStaffPicksFeatured} upcomingCount={flatUpcoming.length} />

      {/* Timeline Section */}
      <section id="timeline" className="events-timeline-section scroll-mt-24 px-4 pb-14 pt-10 sm:px-8 md:pb-20 md:pt-12">
        <div className="events-timeline-shell mx-auto max-w-[1200px]">
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

          {hasPoolEvents && !vibesSignedOutGate ? (
            <>
              <TimelineSectionIntro
                activeDiscoveryLabel={activeDiscoveryLabel}
                searchQ={searchQ}
                sortMode={sortMode}
                showFilters
              />
              <div className="mb-10 flex flex-wrap justify-end gap-2 md:-mt-6">
                <Link
                  href={ql({ sort: undefined })}
                  className={`rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    sortMode !== "city"
                      ? "border-[color:var(--neon-a)]/50 bg-[color:var(--neon-surface)]/50 text-[color:var(--neon-text0)]"
                      : "border-[color:var(--neon-hairline)] text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/35"
                  }`}
                >
                  Soonest
                </Link>
                <Link
                  href={ql({ sort: "city" })}
                  className={`rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest transition-colors ${
                    sortMode === "city"
                      ? "border-[color:var(--neon-a)]/50 bg-[color:var(--neon-surface)]/50 text-[color:var(--neon-text0)]"
                      : "border-[color:var(--neon-hairline)] text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/35"
                  }`}
                >
                  By city
                </Link>
              </div>
            </>
          ) : null}

          {filteredTimelineEmptyButPoolHasEvents ? (
            <div
              role="status"
              className="mb-10 rounded-2xl border border-amber-500/35 bg-amber-500/5 px-5 py-6 text-left md:px-8"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-200/95">
                No matches
              </p>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-[color:var(--neon-text1)]">
                Nothing in the timeline matched this combo. Clear discovery or search to see everything in view, or
                browse rails above.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href={`/events${eventsListingQuery(listingClearDiscovery())}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-6 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] hover:bg-[color:var(--neon-a)]/20"
                >
                  Clear discovery &amp; search
                </Link>
                <Link
                  href={`/events${eventsListingQuery(listingBare())}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--neon-hairline)] px-6 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
                >
                  All upcoming (keep My Vibes)
                </Link>
                <Link
                  href={`/events${eventsListingQuery({})}`}
                  className="inline-flex min-h-11 items-center justify-center px-4 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] hover:underline"
                >
                  Reset everything →
                </Link>
              </div>
            </div>
          ) : null}

          {hasPoolEvents ? (
            <EventsTimelineInteractive
              dateKeys={dateKeys}
              grouped={grouped}
              isSignedIn={isSignedInForVibes}
              savedEventIds={savedEventIds}
              siteOrigin={siteOrigin}
              hasUpcoming={hasUpcoming}
            />
          ) : vibesSignedOutGate ? null : eventsLoadError ? null : (
            <div className="mx-auto max-w-xl py-16 md:py-28">
              <EmptyStateCard
                className="text-center"
                kicker={
                  vibesFilter && isSignedInForVibes
                    ? "My Vibes"
                    : activeFilter && activeFilter !== "all"
                      ? "No results"
                      : "No events yet"
                }
                title={
                  vibesFilter && isSignedInForVibes
                    ? "No saved events match this view"
                    : activeFilter && activeFilter !== "all"
                      ? `No ${activeFilter} events found`
                      : "No events are published yet"
                }
                description={
                  vibesFilter && isSignedInForVibes
                    ? "Save events from the timeline with the My Vibes control, or widen your filters."
                    : activeFilter && activeFilter !== "all"
                      ? "Try a different category or check back later."
                      : "Organizers are still loading the calendar. Check back soon or use a different filter."
                }
              >
                <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
                  {vibesFilter && isSignedInForVibes ? (
                    <>
                      <NeonLink
                        href={`/events${ql({
                          vibes: false,
                          category:
                            activeFilter && activeFilter !== "all" ? activeFilter : undefined,
                        })}`}
                        shape="pill"
                        size="default"
                      >
                        Clear My Vibes filter
                      </NeonLink>
                      <NeonLink href="/events" variant="secondary" shape="pill" size="default">
                        Explore events
                      </NeonLink>
                    </>
                  ) : activeFilter && activeFilter !== "all" ? (
                    <NeonLink href="/events" shape="pill" size="default">
                      View all events
                    </NeonLink>
                  ) : (
                    <>
                      <NeonLink href="/signup" shape="pill" size="default">
                        Join VIZB
                      </NeonLink>
                      <NeonLink href="/host/apply" variant="secondary" shape="pill" size="default">
                        Host an event
                      </NeonLink>
                    </>
                  )}
                </div>
              </EmptyStateCard>
            </div>
          )}
        </div>
      </section>

      <Footer />
      </div>
    </main>
  )
}
