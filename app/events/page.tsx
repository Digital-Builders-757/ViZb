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
import { formatCategoryLabel, sliceCategoriesForDisplay } from "@/lib/events/event-display-format"
import { eventKindBadgeShort, STAFF_PICK_BADGE_CLASS, STAFF_PICK_BADGE_LABEL } from "@/lib/events/event-kind"
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
  event_kind?: string | null
  is_staff_pick?: boolean | null
  ticket_types?: TicketStub[] | null
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
  event_kind: "official" | "community"
  is_staff_pick: boolean
  ticket_types: TicketStub[]
}

/** Public listing chips: `slug` is the `?category=` query value (must match `events.categories` text). */
const EVENT_LISTING_FILTERS = [
  { slug: "all" as const, label: "All" },
  ...EVENT_CATEGORY_OPTIONS.map((o) => ({ slug: o.value, label: o.label })),
] as const

type ListingQueryOpts = {
  category?: string | null
  vibes?: boolean
  discover?: DiscoveryPreset | null
  q?: string | null
  sort?: "soonest" | "city"
}

/** Serialize `/events` query string; preserves filters, vibes, discovery, search, sort. */
function eventsListingQuery(opts: ListingQueryOpts): string {
  const sp = new URLSearchParams()
  if (opts.category && opts.category !== "all") {
    sp.set("category", opts.category.toLowerCase())
  }
  if (opts.vibes) sp.set("vibes", "1")
  if (opts.discover) sp.set("discover", opts.discover)
  const trimmed = typeof opts.q === "string" ? opts.q.trim() : ""
  if (trimmed) sp.set("q", trimmed)
  if (opts.sort === "city") sp.set("sort", "city")
  const q = sp.toString()
  return q ? `?${q}` : ""
}

/** Shared compact glance card for rails (starting soon / local picks). */
function EventsCompactGlanceCard({
  e,
  variant,
}: {
  e: FlatEvent
  variant: "default" | "local" | "staffPick"
}) {
  const { visible: trendCats, extraCount: trendCatExtra } = sliceCategoriesForDisplay(e.categories, 1)
  const isLocal = variant === "local"
  const isStaffRail = variant === "staffPick"
  const borderHover = isStaffRail
    ? "hover:border-amber-500/45 hover:bg-[color:var(--neon-surface)]/26 hover:shadow-[0_0_28px_rgba(245,158,11,0.12)]"
    : isLocal
    ? "hover:border-violet-500/50 hover:bg-[color:var(--neon-surface)]/26 hover:shadow-[0_0_32px_rgba(139,92,246,0.14)]"
    : "hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/26 hover:shadow-[0_0_32px_rgba(0,209,255,0.12)]"

  return (
    <Link
      href={`/events/${e.slug}`}
      className={`group relative overflow-hidden rounded-xl border bg-[color:var(--neon-surface)]/18 p-3.5 backdrop-blur transition-all duration-300 sm:p-4 ${
        isStaffRail ? "border-amber-500/35" : isLocal ? "border-violet-500/35" : "border-[color:var(--neon-hairline)]/90"
      } ${borderHover}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isStaffRail
            ? "radial-gradient(800px circle at 15% 0%, rgba(245,158,11,0.14), transparent 50%)"
            : isLocal
              ? "radial-gradient(800px circle at 15% 0%, rgba(139,92,246,0.16), transparent 50%)"
              : "radial-gradient(800px circle at 15% 0%, rgba(0,209,255,0.14), transparent 50%)",
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
          {isStaffRail || e.is_staff_pick ? (
            <p className="mb-1">
              <span className={`inline-flex ${STAFF_PICK_BADGE_CLASS} px-2 py-0.5 font-mono text-[9px]`}>
                {STAFF_PICK_BADGE_LABEL}
              </span>
            </p>
          ) : null}
          {isLocal ? (
            <p className="mb-1">
              <span className="inline-flex rounded-full border border-violet-500/45 bg-violet-500/12 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-violet-100">
                {eventKindBadgeShort("community")}
              </span>
            </p>
          ) : null}
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
}

export default async function EventsExplorePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; vibes?: string; discover?: string; q?: string; sort?: string }>
}) {
  const sp = await searchParams
  const { category: activeFilter, vibes: vibesParam } = sp
  const vibesFilter = vibesParam === "1" || vibesParam === "true"
  const discoveryPreset = parseDiscoveryParam(sp.discover)
  const searchQRaw = typeof sp.q === "string" ? sp.q : Array.isArray(sp.q) ? sp.q[0] : ""
  const searchQ = searchQRaw ?? ""
  const sortMode = parseSortParam(sp.sort)

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
    event_kind,
    is_staff_pick,
    ticket_types ( price_cents, sales_starts_at, sales_ends_at ),
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

    // Apply category filter (event must include this tag in its categories array)
    if (activeFilter && activeFilter !== "all") {
      upcomingQuery = upcomingQuery.contains("categories", [activeFilter.toLowerCase()])
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

  const listingOptsBase: ListingQueryOpts = {
    category: activeFilter ?? undefined,
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

  // Split: upcoming/ongoing vs past
  function isUpcomingOrOngoing(e: FlatEvent): boolean {
    if (e.ends_at) return new Date(e.ends_at).getTime() >= now.getTime()
    return new Date(e.starts_at).getTime() >= now.getTime()
  }

  let upcomingBase = allFlat
    .filter(isUpcomingOrOngoing)
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  let flatPastBase = allFlat
    .filter((e) => !isUpcomingOrOngoing(e))
    .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())
    .slice(0, 12)

  const vibesSignedOutGate = vibesFilter && !isSignedInForVibes

  if (vibesSignedOutGate) {
    upcomingBase = []
    flatPastBase = []
  } else if (vibesFilter && isSignedInForVibes) {
    upcomingBase = upcomingBase.filter((e) => savedIdSet.has(e.id))
    flatPastBase = flatPastBase.filter((e) => savedIdSet.has(e.id))
  }

  const hasUnfilteredUpcoming = upcomingBase.length > 0
  const hasUnfilteredPast = flatPastBase.length > 0

  const localPicks = upcomingBase.filter((e) => e.event_kind === "community").slice(0, 6)
  const staffPicks = upcomingBase.filter((e) => e.is_staff_pick).slice(0, 6)
  const officialSoon = upcomingBase.filter((e) => e.event_kind === "official")
  const trending =
    officialSoon.length > 0 ? officialSoon.slice(0, 3) : upcomingBase.slice(0, 3)
  const showDiscoveryRails =
    !vibesSignedOutGate && (trending.length > 0 || localPicks.length > 0 || staffPicks.length > 0)

  function passesDiscoveryAndSearch(e: FlatEvent): boolean {
    if (discoveryPreset && !applyDiscoveryPreset(discoveryPreset, e, now)) return false
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

  let flatUpcoming = upcomingBase.filter(passesDiscoveryAndSearch)
  let flatPast = flatPastBase.filter(passesDiscoveryAndSearch)

  if (sortMode === "city") {
    flatUpcoming = [...flatUpcoming].sort(compareEventsByCityThenTime)
    flatPast = [...flatPast].sort(compareEventsByCityThenTime)
  }

  const filteredTimelineEmptyButPoolHasEvents =
    !vibesSignedOutGate &&
    flatUpcoming.length === 0 &&
    flatPast.length === 0 &&
    (hasUnfilteredUpcoming || hasUnfilteredPast)

  const hasPoolEvents = hasUnfilteredUpcoming || hasUnfilteredPast
  const activeDiscoveryLabel = discoveryPreset
    ? (DISCOVERY_PRESET_OPTIONS.find((o) => o.value === discoveryPreset)?.label ?? discoveryPreset)
    : null

  /** Clear discovery + search while keeping category + vibes + sort shape as needed */
  function listingClearDiscovery(): ListingQueryOpts {
    return {
      category: activeFilter ?? undefined,
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
  const hasPast = flatPast.length > 0
  const hasTimelineContent = hasUpcoming || hasPast

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
          <p className="mt-4 max-w-xl text-xs leading-relaxed text-[color:var(--neon-text2)] sm:text-sm">
            <span className="font-mono uppercase tracking-widest text-[color:var(--neon-a)]/90">DMV &amp; beyond</span>
            {" · "}Norfolk, Virginia Beach, Richmond, Charlottesville, and the 757 — anchored in Eastern time.
          </p>

          {/* Search */}
          <form
            method="get"
            action="/events"
            className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row sm:items-center sm:gap-3"
            role="search"
          >
            {activeFilter && activeFilter !== "all" ? (
              <input type="hidden" name="category" value={activeFilter} />
            ) : null}
            {vibesFilter ? <input type="hidden" name="vibes" value="1" /> : null}
            {discoveryPreset ? <input type="hidden" name="discover" value={discoveryPreset} /> : null}
            {sortMode === "city" ? <input type="hidden" name="sort" value="city" /> : null}
            <label htmlFor="events-q" className="sr-only">
              Search events
            </label>
            <input
              id="events-q"
              type="search"
              name="q"
              defaultValue={searchQ}
              placeholder="Search title, venue, city…"
              className="vibe-focus-ring min-h-11 w-full max-w-md rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/25 px-5 py-3 font-mono text-xs text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)] backdrop-blur md:min-h-12"
              autoComplete="off"
            />
            <button
              type="submit"
              className="vibe-focus-ring shrink-0 rounded-full border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-7 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors hover:bg-[color:var(--neon-a)]/22"
            >
              Search
            </button>
            {searchQ.trim() ? (
              <Link
                href={ql({ q: undefined })}
                className="shrink-0 text-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-text0)] hover:underline"
              >
                Clear search
              </Link>
            ) : null}
          </form>

          {/* Category bar */}
          <div className="mt-10 flex flex-col gap-4 border-t border-[color:var(--neon-hairline)]/35 pt-8 md:mt-12">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
              Category
            </p>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none sm:gap-3">
            {EVENT_LISTING_FILTERS.map((cat) => {
              const isActive =
                cat.slug === "all"
                  ? !activeFilter || activeFilter === "all"
                  : activeFilter === cat.slug
              const categoryParam = cat.slug === "all" ? undefined : cat.slug
              const href =
                cat.slug === "all"
                  ? `/events${ql({ category: undefined })}`
                  : `/events${ql({ category: categoryParam })}`

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
              href={vibesFilter ? ql({ vibes: false }) : ql({ vibes: true })}
              className={`vibe-focus-ring inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all whitespace-nowrap sm:min-h-[44px] sm:px-4 sm:text-xs ${
                vibesFilter
                  ? "border-[color:var(--neon-b)]/45 bg-[color:var(--neon-surface)]/70 text-[color:var(--neon-text0)] shadow-[0_0_22px_rgba(157,77,255,0.14)]"
                  : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:color-mix(in_srgb,var(--neon-text1)_82%,var(--neon-text2))] hover:border-[color:var(--neon-b)]/40 hover:bg-[color:var(--neon-surface)]/28 hover:text-[color:var(--neon-text0)]"
              }`}
            >
              My Vibes
            </Link>
            </div>

            {/* Discovery presets */}
            <p className="mt-5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
              Discovery
            </p>
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none sm:gap-3">
              {DISCOVERY_PRESET_OPTIONS.map((d) => {
                const active = discoveryPreset === d.value
                const href = active ? `/events${ql({ discover: undefined })}` : `/events${ql({ discover: d.value })}`
                return (
                  <Link
                    key={d.value}
                    href={href}
                    className={`vibe-focus-ring inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all whitespace-nowrap sm:min-h-[44px] sm:px-4 sm:text-xs ${
                      active
                        ? "border-violet-500/55 bg-violet-500/10 text-[color:var(--neon-text0)] shadow-[0_0_18px_rgba(139,92,246,0.2)]"
                        : "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:color-mix(in_srgb,var(--neon-text1)_82%,var(--neon-text2))] hover:border-violet-500/35 hover:bg-[color:var(--neon-surface)]/26"
                    }`}
                  >
                    {d.label}
                  </Link>
                )
              })}
              {discoveryPreset || searchQ.trim() ? (
                <Link
                  href={`/events${eventsListingQuery(listingBare())}`}
                  className="inline-flex min-h-[40px] shrink-0 items-center rounded-full border border-dashed border-[color:var(--neon-hairline)] px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-text0)]"
                >
                  Reset filters
                </Link>
              ) : null}
            </div>
            <p className="max-w-xl text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
              <span className="font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Family-friendly</span>{" "}
              highlights workshops &amp; socials for now — tag-driven filters can tighten this later.
            </p>
          </div>
        </div>
      </section>

      {/* Ocean wave divider */}
      <OceanDivider variant="hero" density="normal" />

      {showDiscoveryRails ? (
        <>
          {trending.length > 0 ? (
            <section className="px-4 pb-2 pt-8 sm:px-8 md:pt-10">
              <div className="mx-auto max-w-[1200px]">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                      Starting soon
                    </p>
                    <p className="mt-1 text-xs text-[color:var(--neon-text1)]/90">
                      ViZb official picks first — then tap through for tickets &amp; RSVP.
                    </p>
                  </div>
                  <Link
                    href="/events#timeline"
                    className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] transition-colors hover:text-[color:var(--neon-text0)]"
                  >
                    Full timeline →
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {trending.map((e) => (
                    <EventsCompactGlanceCard key={e.id} e={e} variant="default" />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {staffPicks.length > 0 ? (
            <section className="px-4 pb-2 pt-6 sm:px-8 md:pt-8">
              <div className="mx-auto max-w-[1200px]">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-amber-200/90">
                      ViZb picks
                    </p>
                    <p className="mt-1 max-w-lg text-xs text-[color:var(--neon-text1)]/90">
                      Editorial highlights our team thinks you&apos;ll love — mixed official and community listings.
                    </p>
                  </div>
                  <Link
                    href="/events#timeline"
                    className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] transition-colors hover:text-[color:var(--neon-text0)]"
                  >
                    Full timeline →
                  </Link>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {staffPicks.map((e) => (
                    <EventsCompactGlanceCard key={`pick-${e.id}`} e={e} variant="staffPick" />
                  ))}
                </div>
              </div>
            </section>
          ) : null}

          {localPicks.length > 0 ? (
            <section className="px-4 pb-2 pt-6 sm:px-8 md:pt-8">
              <div className="mx-auto max-w-[1200px]">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-widest text-violet-200/90">
                      Local &amp; community lineup
                    </p>
                    <p className="mt-1 max-w-lg text-xs text-[color:var(--neon-text1)]/90">
                      Third-party listings — RSVP opens on the host&apos;s site. Always double-check details.
                    </p>
                  </div>
                </div>
                <div className="scrollbar-none mt-5 flex gap-4 overflow-x-auto pb-1">
                  {localPicks.map((e) => (
                    <div key={e.id} className="w-[min(100%,320px)] shrink-0">
                      <EventsCompactGlanceCard e={e} variant="local" />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {/* Ocean wave divider before timeline */}
      {showDiscoveryRails ? <OceanDivider variant="soft" density="sparse" /> : null}

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

          {hasPoolEvents && !vibesSignedOutGate ? (
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  Full timeline
                </p>
                {activeDiscoveryLabel || searchQ.trim() ? (
                  <p className="mt-2 text-xs text-[color:var(--neon-text1)]">
                    {activeDiscoveryLabel ? <>Vibe: {activeDiscoveryLabel}</> : null}
                    {activeDiscoveryLabel && searchQ.trim() ? <> · </> : null}
                    {searchQ.trim() ? <>Search: “{searchQ.trim()}”</> : null}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[color:var(--neon-text1)]">
                    Sorted {sortMode === "city" ? "by city, then time" : "by start time"} (Eastern).
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
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
            </div>
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
                    : "No events yet"}
              </span>
              <h2 className="mt-4 max-w-lg text-balance font-serif text-2xl font-bold text-[color:var(--neon-text0)] sm:text-3xl md:text-4xl">
                {vibesFilter && isSignedInForVibes
                  ? "No saved events match this view"
                  : activeFilter && activeFilter !== "all"
                    ? `No ${activeFilter} events found`
                    : "No events are published yet"}
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed text-[color:var(--neon-text1)] sm:text-base">
                {vibesFilter && isSignedInForVibes
                  ? "Save events from the timeline with the My Vibes control, or widen your filters."
                  : activeFilter && activeFilter !== "all"
                    ? "Try a different category or check back later."
                    : "Organizers are still loading the calendar. Check back soon or use a different filter."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mt-10">
                {vibesFilter && isSignedInForVibes ? (
                  <>
                    <Link
                      href={`/events${ql({
                        vibes: false,
                        category:
                          activeFilter && activeFilter !== "all" ? activeFilter : undefined,
                      })}`}
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
