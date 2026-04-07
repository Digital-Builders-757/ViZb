import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import type { DashboardCalendarEvent } from "./dashboard-calendar"
import { normalizeCategories } from "@/lib/events/categories"

const MS_DAY = 24 * 60 * 60 * 1000

const SELECT =
  "id, title, slug, starts_at, ends_at, venue_name, city, categories, flyer_url, organizations(name)"

type EventQueryRow = Omit<DashboardCalendarEvent, "host_org_name" | "categories"> & {
  categories: string[] | null
  organizations: { name: string } | { name: string }[] | null
}

function organizationNameFromRow(raw: EventQueryRow["organizations"]): string | null {
  if (!raw) return null
  if (Array.isArray(raw)) return raw[0]?.name?.trim() ?? null
  if (typeof raw === "object" && raw !== null && "name" in raw) {
    const n = String((raw as { name: string }).name).trim()
    return n || null
  }
  return null
}

/**
 * Published events for the member dashboard planner: viewed month ± padding plus up to 30 days
 * ahead of "now" for agenda. Supports week strips and agenda without an Eastern-month filter.
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
  const monthPaddedStart = u0 - 21 * MS_DAY
  const monthPaddedEnd = u1 + 21 * MS_DAY
  const agendaTail = Date.now() + 30 * MS_DAY
  const rangeEndMs = Math.max(monthPaddedEnd, agendaTail)
  const queryStart = new Date(monthPaddedStart).toISOString()
  const queryEnd = new Date(rangeEndMs).toISOString()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("events")
    .select(SELECT)
    .eq("status", "published")
    .gte("starts_at", queryStart)
    .lt("starts_at", queryEnd)
    .order("starts_at", { ascending: true })
    .limit(500)

  if (error || !data) {
    return []
  }

  return (data as unknown as EventQueryRow[]).map((e) => {
    const { organizations: orgRow, ...rest } = e
    return {
      ...rest,
      host_org_name: organizationNameFromRow(orgRow),
      categories: normalizeCategories(e.categories),
    }
  })
}
