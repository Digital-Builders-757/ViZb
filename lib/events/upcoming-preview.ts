import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"

/** Minimal row shape for dashboard cards (explicit select; matches public events feed). */
interface PublicEventRow {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  category: string
  flyer_url: string | null
}

export interface DashboardEventPreview {
  id: string
  title: string
  slug: string
  starts_at: string
  ends_at: string | null
  venue_name: string
  city: string
  category: string
  flyer_url: string | null
}

const SELECT =
  "id, title, slug, starts_at, ends_at, venue_name, city, category, flyer_url"

function isUpcomingOrOngoing(e: Pick<PublicEventRow, "starts_at" | "ends_at">, now: Date): boolean {
  if (e.ends_at) return new Date(e.ends_at).getTime() >= now.getTime()
  return new Date(e.starts_at).getTime() >= now.getTime()
}

/**
 * Next N published events that are upcoming or in progress (same rules as `/events` timeline).
 */
export async function getDashboardUpcomingEventPreviews(limit: number): Promise<DashboardEventPreview[]> {
  if (!isServerSupabaseConfigured() || limit <= 0) {
    return []
  }

  const supabase = await createClient()
  const now = new Date()
  const pastCutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const { data, error } = await supabase
    .from("events")
    .select(SELECT)
    .eq("status", "published")
    .gte("starts_at", pastCutoff.toISOString())
    .order("starts_at", { ascending: true })
    .limit(80)

  if (error || !data) {
    return []
  }

  const rows = data as PublicEventRow[]

  return rows
    .filter((e) => isUpcomingOrOngoing(e, now))
    .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime())
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      title: e.title,
      slug: e.slug,
      starts_at: e.starts_at,
      ends_at: e.ends_at,
      venue_name: e.venue_name,
      city: e.city,
      category: e.category,
      flyer_url: e.flyer_url,
    }))
}

export function formatDashboardEventWhen(startsAt: string, endsAt: string | null): string {
  const df = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const startLabel = df.format(new Date(startsAt))
  if (!endsAt) return startLabel
  const endLabel = df.format(new Date(endsAt))
  if (startLabel === endLabel) return startLabel
  return `${startLabel} – ${endLabel}`
}

export function formatCategoryLabel(category: string): string {
  if (!category) return "Event"
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
}
