import type { SupabaseClient } from "@supabase/supabase-js"
import {
  CANDIDATE_QUEUE_DEFAULT_PAGE_SIZE,
  CANDIDATE_QUEUE_MAX_PAGE_SIZE,
  parseCandidateQueueParams,
  type CandidateQueueSearchParams,
} from "@/lib/admin/candidate-queue-params"

export type ImportRunRow = {
  id: string
  source: string
  status: string
  environment: string | null
  trigger_type: string | null
  started_at: string
  finished_at: string | null
  candidates_found: number
  candidates_created: number
  candidates_updated: number
  candidates_skipped: number
  events_found: number
  events_created: number
  events_updated: number
  events_skipped: number
  error_message: string | null
}

export type ImportRunHistoryResult = {
  rows: ImportRunRow[]
  total: number
  page: number
  pageSize: number
  sourceKey?: string
  error: string | null
}

const RUN_SELECT =
  "id, source, status, environment, trigger_type, started_at, finished_at, candidates_found, candidates_created, candidates_updated, candidates_skipped, events_found, events_created, events_updated, events_skipped, error_message"

export function parseImportRunParams(searchParams: { source?: string; page?: string; pageSize?: string } = {}) {
  const base = parseCandidateQueueParams(searchParams as CandidateQueueSearchParams)
  return {
    sourceKey: searchParams.source?.trim() || undefined,
    page: base.page,
    pageSize: base.pageSize,
  }
}

export function formatImportRunTriggerLabel(triggerType: string | null): string {
  if (triggerType === "cron") return "Cron"
  if (triggerType === "manual") return "Manual"
  return "Unknown"
}

export function summarizeImportRun(row: Pick<ImportRunRow, "status" | "error_message" | "candidates_skipped" | "events_skipped">): string {
  const skipped = Math.max(row.candidates_skipped ?? 0, row.events_skipped ?? 0)
  if (row.status === "failed") {
    return row.error_message ?? "Import failed."
  }
  if (row.status === "completed" && skipped > 0) {
    return row.error_message
      ? `${row.error_message} (${skipped} skipped)`
      : `${skipped} record(s) skipped during import.`
  }
  if (row.error_message) return row.error_message
  return "—"
}

export async function loadImportRunHistory(
  supabase: SupabaseClient,
  searchParams: { source?: string; page?: string; pageSize?: string } = {},
): Promise<ImportRunHistoryResult> {
  const { sourceKey, page, pageSize } = parseImportRunParams(searchParams)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase
    .from("event_import_runs")
    .select(RUN_SELECT, { count: "exact" })
    .order("started_at", { ascending: false })

  if (sourceKey) {
    query = query.eq("source", sourceKey)
  }

  const { data, error, count } = await query.range(from, to)

  if (error) {
    return { rows: [], total: 0, page, pageSize, sourceKey, error: error.message }
  }

  return {
    rows: (data ?? []) as ImportRunRow[],
    total: count ?? 0,
    page,
    pageSize,
    sourceKey,
    error: null,
  }
}

export { CANDIDATE_QUEUE_DEFAULT_PAGE_SIZE, CANDIDATE_QUEUE_MAX_PAGE_SIZE }
