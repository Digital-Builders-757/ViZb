import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import type { DashboardCalendarEvent } from "./dashboard-calendar"
import { eventStartsInEasternMonth } from "./dashboard-calendar"
import { normalizeCategories } from "@/lib/events/categories"

const SELECT =
  "id, title, slug, starts_at, ends_at, venue_name, city, categories, flyer_url"

/**
 * Published events whose start falls on a calendar day in the given month (Eastern time).
 * Query window is padded for UTC/Eastern drift at month edges.
 */
export async function getPublishedEventsForDashboardMonth(
  year: number,
  monthIndex: number,
): Promise<DashboardCalendarEvent[]> {
  if (!isServerSupabaseConfigured()) {
    return []
  }

  const u0 = Date.UTC(year, monthIndex, 1)
  const u1 = Date.UTC(year, monthIndex + 1, 1)
  const queryStart = new Date(u0 - 5 * 24 * 60 * 60 * 1000).toISOString()
  const queryEnd = new Date(u1 + 5 * 24 * 60 * 60 * 1000).toISOString()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .select(SELECT)
    .eq("status", "published")
    .gte("starts_at", queryStart)
    .lt("starts_at", queryEnd)
    .order("starts_at", { ascending: true })
    .limit(400)

  if (error || !data) {
    return []
  }

  return (data as DashboardCalendarEvent[])
    .map((e) => ({
      ...e,
      categories: normalizeCategories(e.categories),
    }))
    .filter((e) => eventStartsInEasternMonth(e.starts_at, year, monthIndex))
}
