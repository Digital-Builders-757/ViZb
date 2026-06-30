import type { SupabaseClient } from "@supabase/supabase-js"
import { getStaleThresholdMs } from "@/lib/imports/geography/freshness"
import {
  type CandidateQueueFilters,
  CANDIDATE_QUEUE_DEFAULT_PAGE_SIZE,
  parseCandidateQueueParams,
  type CandidateQueueSearchParams,
} from "@/lib/admin/candidate-queue-params"

export type CandidateQueueRow = {
  id: string
  source_key: string
  source_event_id: string
  title: string
  starts_at: string
  venue_name: string | null
  city: string | null
  categories: string[]
  review_status: string
  duplicate_status: string
  last_seen_at: string
  last_imported_at: string
  last_import_run_id: string | null
}

export type CandidateQueueResult = {
  rows: CandidateQueueRow[]
  total: number
  page: number
  pageSize: number
  filters: CandidateQueueFilters
  error: string | null
}

export type CandidateSourceOption = {
  source_key: string
  display_name: string
}

const QUEUE_SELECT =
  "id, source_key, source_event_id, title, starts_at, venue_name, city, categories, review_status, duplicate_status, last_seen_at, last_imported_at, last_import_run_id"

export { parseCandidateQueueParams, type CandidateQueueFilters, type CandidateQueueSearchParams }

export async function loadCandidateQueue(
  supabase: SupabaseClient,
  searchParams: CandidateQueueSearchParams = {},
): Promise<CandidateQueueResult> {
  const filters = parseCandidateQueueParams(searchParams)
  const from = (filters.page - 1) * filters.pageSize
  const to = from + filters.pageSize - 1

  let query = supabase
    .from("event_candidates")
    .select(QUEUE_SELECT, { count: "exact" })
    .order("last_imported_at", { ascending: false })

  if (filters.sourceKey) {
    query = query.eq("source_key", filters.sourceKey)
  }
  if (filters.reviewStatus) {
    query = query.eq("review_status", filters.reviewStatus)
  }
  if (filters.duplicateStatus) {
    query = query.eq("duplicate_status", filters.duplicateStatus)
  }
  if (filters.runId) {
    query = query.eq("last_import_run_id", filters.runId)
  }
  if (filters.freshness) {
    const threshold = new Date(getStaleThresholdMs()).toISOString()
    query = filters.freshness === "stale"
      ? query.lt("last_seen_at", threshold)
      : query.gte("last_seen_at", threshold)
  }
  if (filters.city) {
    query = query.ilike("city", `%${filters.city}%`)
  }
  if (filters.startsFrom) {
    query = query.gte("starts_at", filters.startsFrom)
  }
  if (filters.startsTo) {
    query = query.lte("starts_at", filters.startsTo)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return {
      rows: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      filters,
      error: error.message,
    }
  }

  return {
    rows: (data ?? []) as CandidateQueueRow[],
    total: count ?? 0,
    page: filters.page,
    pageSize: filters.pageSize,
    filters,
    error: null,
  }
}

export async function loadCandidateSourceOptions(
  supabase: SupabaseClient,
): Promise<{ sources: CandidateSourceOption[]; error: string | null }> {
  const { data, error } = await supabase
    .from("event_sources")
    .select("source_key, display_name")
    .order("source_key")

  if (error) {
    return { sources: [], error: error.message }
  }

  return {
    sources: ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      source_key: String(row.source_key),
      display_name: String(row.display_name),
    })),
    error: null,
  }
}

export async function loadCandidateQueueCities(
  supabase: SupabaseClient,
): Promise<{ cities: string[]; error: string | null }> {
  const { data, error } = await supabase
    .from("event_candidates")
    .select("city")
    .not("city", "is", null)
    .order("city")
    .limit(500)

  if (error) {
    return { cities: [], error: error.message }
  }

  const unique = [...new Set((data ?? []).map((row) => String(row.city).trim()).filter(Boolean))]
  unique.sort((a, b) => a.localeCompare(b))
  return { cities: unique, error: null }
}

export function getDefaultCandidateQueueFilters(): CandidateQueueFilters {
  return parseCandidateQueueParams({ reviewStatus: "pending_review" })
}
