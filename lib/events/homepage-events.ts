import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { logError } from "@/lib/log"
import {
  type EventCategoryValue,
  isValidEventCategory,
  normalizeCategories,
} from "@/lib/events/categories"
import type { TicketStub } from "@/lib/events/discovery-filters"
import { formatCategoryLabel } from "@/lib/events/event-display-format"
import { isEventUpcomingOrOngoing } from "@/lib/events/event-schedule"
import type { FeaturedMoment } from "@/lib/events/discovery-featured-moments"
import { buildStaffPicksMoment } from "@/lib/events/discovery-featured-moments"
import type { ListingEvent } from "@/lib/events/listing-event"
import { isPublicListingEventStatus } from "@/lib/events/public-listing"

const QUERY_LIMIT = 80
const GRID_MAX = 9
const FALLBACK_CATEGORIES: EventCategoryValue[] = ["workshop", "party"]

const CATEGORY_MICROCOPY: Record<EventCategoryValue, string> = {
  workshop: "Hands-on builds, skill nights, and creative tech labs.",
  party: "Culture, music, nightlife, and celebration.",
  networking: "Meet people building, hosting, creating, and moving Virginia forward.",
  social: "Low-pressure hangs, community mixers, and real-world connection.",
  music: "Live music, DJs, performances, and sounds worth showing up for.",
  concert: "Live music, performances, and crowd energy.",
  open_mic: "Artists, poets, comics, and creators taking the mic.",
  other: "Unexpected experiences worth leaving the house for.",
}

export type HomepageCategoryPreview = {
  category: EventCategoryValue
  label: string
  microcopy: string
  count: number
}

export type HomepageEventsPreviewData = {
  staffPicksMoment: FeaturedMoment | null
  topCategories: HomepageCategoryPreview[]
  gridEvents: ListingEvent[]
  eventsLoadError: boolean
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

const SELECT_FIELDS = `
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

function flattenEventRow(e: PublicEventRow): ListingEvent {
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
    event_kind: e.event_kind === "community" ? "community" : "official",
    is_staff_pick: Boolean(e.is_staff_pick),
    ticket_types,
  }
}

export function pickFeaturedEvent(upcoming: ListingEvent[]): ListingEvent | null {
  const official = upcoming.find((e) => e.event_kind === "official")
  return official ?? upcoming[0] ?? null
}

export function pickHomeGridEvents(upcoming: ListingEvent[]): ListingEvent[] {
  const staffFirst = upcoming.filter((e) => e.is_staff_pick)
  const rest = upcoming.filter((e) => !e.is_staff_pick)
  const merged: ListingEvent[] = []
  const seen = new Set<string>()

  for (const e of [...staffFirst, ...rest]) {
    if (merged.length >= GRID_MAX) break
    if (seen.has(e.id)) continue
    merged.push(e)
    seen.add(e.id)
  }

  return merged
}

export function computeTopCategories(events: ListingEvent[]): HomepageCategoryPreview[] {
  const counts = new Map<EventCategoryValue, number>()
  for (const e of events) {
    for (const c of e.categories) {
      if (isValidEventCategory(c)) {
        counts.set(c, (counts.get(c) ?? 0) + 1)
      }
    }
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1])
  const picked: HomepageCategoryPreview[] = []

  for (const [category, count] of sorted) {
    if (picked.length >= 2) break
    picked.push({
      category,
      label: formatCategoryLabel(category),
      microcopy: CATEGORY_MICROCOPY[category],
      count,
    })
  }

  for (const fallback of FALLBACK_CATEGORIES) {
    if (picked.length >= 2) break
    if (picked.some((p) => p.category === fallback)) continue
    picked.push({
      category: fallback,
      label: formatCategoryLabel(fallback),
      microcopy: CATEGORY_MICROCOPY[fallback],
      count: counts.get(fallback) ?? 0,
    })
  }

  return picked
}

function emptyPreview(eventsLoadError = false): HomepageEventsPreviewData {
  return {
    staffPicksMoment: null,
    topCategories: computeTopCategories([]),
    gridEvents: [],
    eventsLoadError,
  }
}

export async function getHomepageEventsPreview(): Promise<HomepageEventsPreviewData> {
  if (!isServerSupabaseConfigured()) {
    if (process.env.NODE_ENV === "production") {
      await createClient()
    }
    return emptyPreview(false)
  }

  const supabase = await createClient()
  const now = new Date()
  const pastCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from("events")
    .select(SELECT_FIELDS)
    .eq("status", "published")
    .gte("starts_at", pastCutoff.toISOString())
    .order("starts_at", { ascending: true })
    .limit(QUERY_LIMIT)

  if (error) {
    logError("homepage.events", error)
    return emptyPreview(true)
  }

  const rows = ((data as unknown as PublicEventRow[] | null) ?? []).filter((row) =>
    isPublicListingEventStatus(row.status),
  )

  const upcoming = rows
    .map(flattenEventRow)
    .filter((e) => isEventUpcomingOrOngoing(e.starts_at, e.ends_at, now.getTime()))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())

  const staffPicksMoment = buildStaffPicksMoment(upcoming)
  const topCategories = computeTopCategories(upcoming)
  const gridEvents = pickHomeGridEvents(upcoming)

  return {
    staffPicksMoment,
    topCategories,
    gridEvents,
    eventsLoadError: false,
  }
}
