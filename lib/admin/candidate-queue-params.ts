import type { CandidateDuplicateStatus, CandidateReviewStatus } from "@/lib/imports/types"

export const CANDIDATE_QUEUE_DEFAULT_PAGE_SIZE = 25
export const CANDIDATE_QUEUE_MAX_PAGE_SIZE = 100
export const CANDIDATE_QUEUE_FRESHNESS_FILTERS = ["recent", "stale"] as const

export type CandidateQueueFreshnessFilter = (typeof CANDIDATE_QUEUE_FRESHNESS_FILTERS)[number]

export type CandidateQueueFilters = {
  sourceKey?: string
  reviewStatus?: CandidateReviewStatus
  duplicateStatus?: CandidateDuplicateStatus
  freshness?: CandidateQueueFreshnessFilter
  runId?: string
  city?: string
  startsFrom?: string
  startsTo?: string
  page: number
  pageSize: number
}

export type CandidateQueueSearchParams = {
  source?: string
  reviewStatus?: string
  duplicateStatus?: string
  freshness?: string
  runId?: string
  city?: string
  startsFrom?: string
  startsTo?: string
  page?: string
  pageSize?: string
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(String(value ?? "").trim(), 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return Math.min(parsed, max)
}

function parseFreshness(value: string | undefined): CandidateQueueFreshnessFilter | undefined {
  const normalized = value?.trim()
  return normalized === "recent" || normalized === "stale" ? normalized : undefined
}

export function parseCandidateQueueParams(
  searchParams: CandidateQueueSearchParams = {},
): CandidateQueueFilters {
  return {
    sourceKey: searchParams.source?.trim() || undefined,
    reviewStatus: (searchParams.reviewStatus?.trim() || undefined) as CandidateReviewStatus | undefined,
    duplicateStatus: (searchParams.duplicateStatus?.trim() || undefined) as
      | CandidateDuplicateStatus
      | undefined,
    freshness: parseFreshness(searchParams.freshness),
    runId: searchParams.runId?.trim() || undefined,
    city: searchParams.city?.trim() || undefined,
    startsFrom: searchParams.startsFrom?.trim() || undefined,
    startsTo: searchParams.startsTo?.trim() || undefined,
    page: parsePositiveInt(searchParams.page, 1, 10_000),
    pageSize: parsePositiveInt(
      searchParams.pageSize,
      CANDIDATE_QUEUE_DEFAULT_PAGE_SIZE,
      CANDIDATE_QUEUE_MAX_PAGE_SIZE,
    ),
  }
}

export function buildCandidateQueueQueryString(
  filters: CandidateQueueFilters,
  overrides: Partial<CandidateQueueFilters> = {},
): string {
  const merged = { ...filters, ...overrides }
  const params = new URLSearchParams()
  if (merged.sourceKey) params.set("source", merged.sourceKey)
  if (merged.reviewStatus) params.set("reviewStatus", merged.reviewStatus)
  if (merged.duplicateStatus) params.set("duplicateStatus", merged.duplicateStatus)
  if (merged.freshness) params.set("freshness", merged.freshness)
  if (merged.runId) params.set("runId", merged.runId)
  if (merged.city) params.set("city", merged.city)
  if (merged.startsFrom) params.set("startsFrom", merged.startsFrom)
  if (merged.startsTo) params.set("startsTo", merged.startsTo)
  if (merged.page > 1) params.set("page", String(merged.page))
  if (merged.pageSize !== CANDIDATE_QUEUE_DEFAULT_PAGE_SIZE) {
    params.set("pageSize", String(merged.pageSize))
  }
  return params.toString()
}
