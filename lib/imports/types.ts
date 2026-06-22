/**
 * Shared types for multi-source event ingestion (#266).
 */

export const CANDIDATE_REVIEW_STATUSES = [
  "pending_review",
  "needs_changes",
  "approved_listing",
  "rejected",
  "suppressed",
  "stale",
  "cancelled",
  "merged",
] as const

export type CandidateReviewStatus = (typeof CANDIDATE_REVIEW_STATUSES)[number]

export const CANDIDATE_DUPLICATE_STATUSES = ["none", "exact", "likely"] as const

export type CandidateDuplicateStatus = (typeof CANDIDATE_DUPLICATE_STATUSES)[number]

export type ImportTrigger = "manual" | "cron"

export type SourceWindow = {
  rangeStartIso: string
  rangeEndIso: string
  metadata?: Record<string, unknown>
}

export type SourcePage = {
  records: unknown[]
  pageNumber: number
  hasMore: boolean
  metadata?: Record<string, unknown>
}

export type SourceReadiness = {
  ready: boolean
  enabled: boolean
  configured: boolean
  code?:
    | "disabled"
    | "missing_credentials"
    | "not_registered"
    | "registry_disabled"
    | "overlap_in_progress"
    | "invalid_geography"
  message?: string
}

export type SourceHealth = {
  sourceKey: string
  ready: SourceReadiness
  lastCheckedAt: string
  details?: Record<string, unknown>
}

export type NormalizedEventCandidate = {
  source_key: string
  source_event_id: string
  source_url: string | null
  source_attribution: string | null
  source_payload: Record<string, unknown>
  source_payload_hash: string
  source_status: string | null
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  timezone: string | null
  venue_name: string | null
  address: string | null
  city: string | null
  region: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  image_url: string | null
  categories: string[]
  classifications: Record<string, unknown>
  organizer_hints: Record<string, unknown>
  external_ticket_url: string | null
}

export type ExistingCandidateRow = {
  id: string
  review_status: CandidateReviewStatus
  source_payload_hash: string | null
  duplicate_status: CandidateDuplicateStatus
  canonical_event_id: string | null
  suppressed_until: string | null
}

export type ImportRunSummary = {
  ok: boolean
  skipped?: boolean
  reason?: string
  runId?: string
  sourceKey: string
  found: number
  created: number
  updated: number
  skippedRecords: number
  errors: string[]
}

export type RunSourceImportOptions = {
  sourceKey: string
  trigger: ImportTrigger
  triggeredBy?: string | null
  window?: SourceWindow
}
