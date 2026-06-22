import type { SupabaseClient } from "@supabase/supabase-js"
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
  last_imported_at: string
}

export type CandidateQueueResult = {
  rows: CandidateQueueRow[]
  total: number
  page: number
  pageSize: number
  filters: CandidateQueueFilters
  error: string | null
}

const QUEUE_SELECT =
  "id, source_key, source_event_id, title, starts_at, venue_name, city, categories, review_status, duplicate_status, last_imported_at"

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
