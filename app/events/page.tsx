import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { logError } from "@/lib/log"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { EventTimelineCard } from "@/components/events/event-timeline-card"
import { TimelineDateHeader } from "@/components/events/timeline-date-header"
import { EventFlyerFallback } from "@/components/events/event-flyer-fallback"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"
import { OceanDivider } from "@/components/ui/ocean-divider"
import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import {
  EVENT_CATEGORY_OPTIONS,
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
import { formatCategoryLabel, sliceCategoriesForDisplay } from "@/lib/events/event-display-format"
import { STAFF_PICK_BADGE_CLASS, STAFF_PICK_BADGE_LABEL } from "@/lib/events/event-kind"
import { buildDiscoveryRails } from "@/lib/events/discovery-rails"
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

/** Featured hero card — large flyer banner + full event details. Used as the first card in "Starting soon". */
function EventHeroCard({ e }: { e: FlatEvent }) {
  const { visible: cats } = sliceCategoriesForDisplay(e.categories, 2)
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(e.starts_at))

  const lowestPrice =
    e.ticket_types.length > 0
      ? Math.min(...e.ticket_types.map((t) => t.price_cents ?? 0))
      : null
  const priceLabel =
    lowestPrice === null ? null : lowestPrice === 0 ? "Free" : `From $${(lowestPrice / 100).toFixed(0)}`

  return (
    <Link
      href={`/events/${e.slug}`}
      className="events-neon-card events-neon-card-hover group relative flex flex-col overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)]/90 bg-[color:var(--neon-surface)]/20 backdrop-blur hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/26"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ background: "radial-gradient(800px circle at 20% 0%, rgba(0,209,255,0.13), transparent 55%)" }}
        aria-hidden
      />

      {/* Flyer banner */}
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-black/40 md:h-56">
        {e.flyer_url ? (
          <Image
            src={e.flyer_url}
            alt={e.title}
            fill
            sizes="(max-width: 768px) 88vw, 560px"
            className="object-cover object-[center_15%] transition-transform duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <EventFlyerFallback
            dayNumber={new Intl.DateTimeFormat("en-US", {
              timeZone: "America/New_York",
              day: "numeric",
            }).format(new Date(e.starts_at))}
            monthShort={new Intl.DateTimeFormat("en-US", {
              timeZone: "America/New_York",
              month: "short",
            }).format(new Date(e.starts_at))}
            variant="banner"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/75 via-[color:var(--neon-bg0)]/15 to-transparent" />
        {e.is_staff_pick ? (
          <span
            className={`absolute left-3 top-3 inline-flex ${STAFF_PICK_BADGE_CLASS} px-2 py-0.5 font-mono text-[9px]`}
          >
            {STAFF_PICK_BADGE_LABEL}
          </span>
        ) : null}
      </div>

      {/* Details */}
      <div className="relative z-[1] flex flex-1 flex-col gap-2 p-4">
        <p className="line-clamp-2 text-lg font-bold leading-snug text-[color:var(--neon-text0)]">{e.title}</p>
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
          {dateLabel} <span className="text-[color:var(--neon-text2)]/70">·</span> {e.city}
        </p>
        {e.venue_name ? (
          <p className="truncate text-xs text-[color:var(--neon-text1)]/80">{e.venue_name}</p>
        ) : null}
        <div className="mt-auto flex items-end justify-between gap-2 pt-2">
          <div className="flex min-w-0 flex-wrap gap-1.5">
            {cats.map((c) => (
              <span
                key={c}
                className="inline-flex rounded-full border border-[color:var(--neon-hairline)] bg-black/25 px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest text-[color:var(--neon-text2)]"
              >
                {formatCategoryLabel(c)}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-0.5">
            {priceLabel ? (
              <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                {priceLabel}
              </span>
            ) : null}
            <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)] group-hover:underline">
              {priceLabel ? "Get tickets →" : "View event →"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/** Shared compact glance card for rails (starting soon / ViZb picks). */
function EventsCompactGlanceCard({
  e,
  variant,
  size = "default",
}: {
  e: FlatEvent
  variant: "default" | "staffPick"
  size?: "default" | "compact"
}) {
  const { visible: trendCats, extraCount: trendCatExtra } = sliceCategoriesForDisplay(e.categories, 1)
  const isStaffRail = variant === "staffPick"
  const isCompact = size === "compact"
  const borderHover = isStaffRail
    ? "hover:border-amber-500/45 hover:bg-[color:var(--neon-surface)]/26 hover:shadow-[0_0_28px_rgba(245,158,11,0.12)]"
    : "hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/26 hover:shadow-[0_0_32px_rgba(0,209,255,0.12)]"

  return (
    <Link
      href={`/events/${e.slug}`}
      className={`events-neon-card events-neon-card-hover group relative overflow-hidden rounded-2xl border bg-[color:var(--neon-surface)]/20 backdrop-blur ${
        isCompact ? "p-2.5" : "p-3.5 sm:p-4"
      } ${
        isStaffRail ? "border-amber-500/35" : "border-[color:var(--neon-hairline)]/90"
      } ${borderHover}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: isStaffRail
            ? "radial-gradient(800px circle at 15% 0%, rgba(245,158,11,0.14), transparent 50%)"
            : "radial-gradient(800px circle at 15% 0%, rgba(0,209,255,0.14), transparent 50%)",
        }}
        aria-hidden
      />

      <div className={`relative z-[1] flex items-start ${isCompact ? "gap-2.5" : "gap-3.5"}`}>
        <div
          className={`relative shrink-0 overflow-hidden rounded-lg border border-white/10 bg-black/35 shadow-inner ${
            isCompact ? "h-12 w-12" : "h-16 w-16"
          }`}
        >
          {e.flyer_url ? (
            <Image
              src={e.flyer_url}
              alt={e.title}
              fill
              sizes={isCompact ? "48px" : "64px"}
              className="object-cover object-[center_15%] transition-transform duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <EventFlyerFallback
              dayNumber={new Intl.DateTimeFormat("en-US", {
                timeZone: "America/New_York",
                day: "numeric",
              }).format(new Date(e.starts_at))}
              monthShort={new Intl.DateTimeFormat("en-US", {
                timeZone: "America/New_York",
                month: "short",
              }).format(new Date(e.starts_at))}
              variant="thumb"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/50 via-transparent to-transparent" />
        </div>

        <div className={`min-w-0 flex-1 ${isCompact ? "min-h-[3.25rem]" : "min-h-[4.25rem]"}`}>
          {isStaffRail || e.is_staff_pick ? (
            <p className="mb-1">
              <span className={`inline-flex ${STAFF_PICK_BADGE_CLASS} px-2 py-0.5 font-mono text-[9px]`}>
                {STAFF_PICK_BADGE_LABEL}
              </span>
            </p>
          ) : null}
          <p
            className={`line-clamp-2 font-semibold leading-snug text-[color:var(--neon-text0)] ${
              isCompact ? "text-[13px]" : "text-sm"
            }`}
          >
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
  const forYouMode = sp.discover === "for-you"
  const searchQRaw = typeof sp.q === "string" ? sp.q : Array.isArray(sp.q) ? sp.q[0] : ""
  const searchQ = searchQRaw ?? ""
  const sortMode = parseSortParam(sp.sort)

  // Use current time as the upcoming/past split -- simple, no timezone edge cases
  const now = new Date()

  // Past events cutoff: 30 days ago
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

  let flatPastBase = allFlat
    .filter((e) => !isEventUpcomingOrOngoing(e.starts_at, e.ends_at, now.getTime()))
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

  const { trending, staffPicks } = buildDiscoveryRails(upcomingBase)
  const showDiscoveryRails = trending.length > 0 || staffPicks.length > 0

  function passesDiscoveryAndSearch(e: FlatEvent): boolean {
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
  let runningIndex = 0

  return (
    <main className="relative min-h-screen overflow-hidden bg-[color:var(--neon-bg0)]">
      <CausticBackdrop variant="editorial" />

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
          <p className="mt-6 max-w-prose text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
            Scroll the timeline. Underground parties, creative workshops, and everything in between.
          </p>
          <p className="mt-4 max-w-prose text-xs leading-relaxed text-[color:var(--neon-text2)] sm:text-sm">
            <span className="font-mono uppercase tracking-widest text-[color:var(--neon-a)]/90">DMV &amp; beyond</span>
            {" · "}Norfolk, Virginia Beach, Richmond, Charlottesville, and the 757. All times Eastern.
          </p>

          {eventsLoadError ? (
            <div
              role="alert"
              className="mt-6 max-w-lg rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 backdrop-blur"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-amber-200">Events couldn&apos;t load</p>
              <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                Try refreshing the page. If this keeps happening, our team has been notified via server logs.
              </p>
            </div>
          ) : null}

          {/* Search */}
          <form
            method="get"
            action="/events"
            className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:items-center sm:gap-3"
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
              className="vibe-focus-ring shrink-0 rounded-full border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-7 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-[background-color,box-shadow] hover:bg-[color:var(--neon-a)]/22 hover:shadow-[var(--vibe-neon-glow-subtle)]"
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

          {/* Filters — category + time presets in labeled rows */}
          <div className="mt-10 flex flex-col gap-3 border-t border-[color:var(--neon-hairline)]/35 pt-8 md:mt-12">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                Browse
              </p>
              {discoveryPreset || searchQ.trim() || (activeFilter && activeFilter !== "all") || vibesFilter ? (
                <Link
                  href={`/events${eventsListingQuery(listingBare())}`}
                  className="inline-flex min-h-[36px] shrink-0 items-center rounded-full border border-dashed border-[color:var(--neon-hairline)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-text0)]"
                >
                  Reset all
                </Link>
              ) : null}
            </div>
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
            </div>
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
                    <p className="mt-1 max-w-prose text-xs text-[color:var(--neon-text1)]/90">
                      ViZb official picks first. Tap through for tickets and RSVP.
                    </p>
                  </div>
                </div>

                {/* Mobile: snap scroll carousel */}
                <div className="mt-5 flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-2 md:hidden">
                  {trending.map((e) => (
                    <div key={e.id} className="snap-start w-[88vw] shrink-0">
                      <EventsCompactGlanceCard e={e} variant="default" />
                    </div>
                  ))}
                </div>

                {/* Desktop: hero + sidebar layout */}
                <div className="mt-5 hidden md:grid md:grid-cols-[3fr_2fr] md:gap-4 lg:grid-cols-[5fr_3fr]">
                  {/* Featured hero card — first event */}
                  <EventHeroCard e={trending[0]} />

                  {/* Sidebar — remaining events stacked */}
                  {trending.length > 1 ? (
                    <div className="flex flex-col gap-4">
                      {trending.slice(1).map((e) => (
                        <EventsCompactGlanceCard key={e.id} e={e} variant="default" />
                      ))}
                    </div>
                  ) : null}
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
                    <p className="mt-1 max-w-prose text-xs text-[color:var(--neon-text1)]/90">
                      Highlights from our team. Official and community listings mixed together.
                    </p>
                  </div>
                </div>

                {/* Mobile: snap scroll carousel */}
                <div className="mt-5 flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory scrollbar-none pb-2 md:hidden">
                  {staffPicks.map((e) => (
                    <div key={`pick-mob-${e.id}`} className="snap-start w-[88vw] shrink-0">
                      <EventsCompactGlanceCard e={e} variant="staffPick" />
                    </div>
                  ))}
                </div>

                {/* Desktop: 3-column grid */}
                <div className="mt-5 hidden md:grid md:grid-cols-3 md:gap-4">
                  {staffPicks.map((e) => (
                    <EventsCompactGlanceCard key={`pick-${e.id}`} e={e} variant="staffPick" />
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
                  <div className="hidden md:block absolute left-[5px] top-0 bottom-0 w-px bg-[color:var(--neon-a)]/25 shadow-[0_0_18px_rgb(0_209_255/0.28)]" />

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
                            tone="archive"
                            interactive={false}
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
