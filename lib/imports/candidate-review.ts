import type {
  CandidateDuplicateStatus,
  CandidateReviewStatus,
} from "@/lib/imports/types"

export type CandidateReviewRow = {
  id: string
  source_key: string
  source_event_id: string
  source_url: string | null
  source_attribution: string | null
  source_payload: Record<string, unknown>
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
  image_url: string | null
  categories: string[]
  classifications: Record<string, unknown>
  organizer_hints: Record<string, unknown>
  external_ticket_url: string | null
  review_status: CandidateReviewStatus
  duplicate_status: CandidateDuplicateStatus
  canonical_event_id: string | null
  duplicate_match_evidence: Record<string, unknown>
  rejection_reason: string | null
  suppressed_until: string | null
  last_import_run_id: string | null
  last_imported_at: string
}

export type CandidateReviewAction =
  | "reject"
  | "suppress"
  | "mark_likely_duplicate"
  | "dismiss_duplicate"
  | "link"
  | "merge"
  | "undo"
  | "publish"

export type CandidateReviewInput = {
  action: CandidateReviewAction
  notes?: string | null
  canonicalEventId?: string | null
  suppressedUntil?: string | null
}

export type CandidateReviewPlan =
  | {
      ok: true
      patch: Record<string, unknown>
      auditAction: string
      newReviewStatus: CandidateReviewStatus | null
      newDuplicateStatus?: CandidateDuplicateStatus
    }
  | { ok: false; error: string }

const TERMINAL_STATUSES: CandidateReviewStatus[] = ["approved_listing", "merged"]

export function canPublishCandidate(candidate: Pick<CandidateReviewRow, "review_status" | "duplicate_status">): {
  allowed: boolean
  reason?: string
} {
  if (candidate.review_status === "approved_listing") {
    return { allowed: false, reason: "Already published as an approved listing." }
  }
  if (candidate.review_status === "rejected") {
    return { allowed: false, reason: "Rejected candidates cannot be published without re-import." }
  }
  if (candidate.review_status === "suppressed") {
    return { allowed: false, reason: "Suppressed candidates must be unsuppressed first." }
  }
  if (candidate.duplicate_status === "likely") {
    return { allowed: false, reason: "Resolve possible duplicate status before publishing." }
  }
  if (candidate.duplicate_status === "exact") {
    return { allowed: false, reason: "Exact duplicate — link or merge instead of publishing." }
  }
  return { allowed: true }
}

export function buildCandidateReviewPlan(
  candidate: CandidateReviewRow,
  input: CandidateReviewInput,
): CandidateReviewPlan {
  const previousReviewStatus = candidate.review_status
  const notes = input.notes?.trim() || null

  switch (input.action) {
    case "reject": {
      if (TERMINAL_STATUSES.includes(candidate.review_status)) {
        return { ok: false, error: "Approved or merged candidates cannot be rejected." }
      }
      return {
        ok: true,
        patch: {
          review_status: "rejected",
          rejection_reason: notes,
          updated_at: new Date().toISOString(),
        },
        auditAction: "reject",
        newReviewStatus: "rejected",
      }
    }
    case "suppress": {
      if (TERMINAL_STATUSES.includes(candidate.review_status)) {
        return { ok: false, error: "Approved or merged candidates cannot be suppressed." }
      }
      const suppressedUntil = input.suppressedUntil?.trim() || null
      return {
        ok: true,
        patch: {
          review_status: "suppressed",
          suppressed_until: suppressedUntil,
          rejection_reason: notes,
          updated_at: new Date().toISOString(),
        },
        auditAction: "suppress",
        newReviewStatus: "suppressed",
      }
    }
    case "mark_likely_duplicate": {
      return {
        ok: true,
        patch: {
          duplicate_status: "likely",
          duplicate_match_evidence: {
            ...(candidate.duplicate_match_evidence ?? {}),
            marked_by_staff: true,
            marked_at: new Date().toISOString(),
            notes,
          },
          updated_at: new Date().toISOString(),
        },
        auditAction: "staff_edit",
        newReviewStatus: previousReviewStatus,
        newDuplicateStatus: "likely",
      }
    }
    case "dismiss_duplicate": {
      if (candidate.duplicate_status === "none") {
        return { ok: false, error: "Candidate is not flagged as a duplicate." }
      }
      return {
        ok: true,
        patch: {
          duplicate_status: "none",
          duplicate_match_evidence: {
            ...(candidate.duplicate_match_evidence ?? {}),
            dismissed_at: new Date().toISOString(),
            dismissed_notes: notes,
          },
          updated_at: new Date().toISOString(),
        },
        auditAction: "dismiss_duplicate",
        newReviewStatus: previousReviewStatus,
        newDuplicateStatus: "none",
      }
    }
    case "link": {
      const canonicalEventId = input.canonicalEventId?.trim()
      if (!canonicalEventId) {
        return { ok: false, error: "Canonical event ID is required." }
      }
      if (!/^[0-9a-f-]{36}$/i.test(canonicalEventId)) {
        return { ok: false, error: "Invalid canonical event ID." }
      }
      return {
        ok: true,
        patch: {
          canonical_event_id: canonicalEventId,
          updated_at: new Date().toISOString(),
        },
        auditAction: "link",
        newReviewStatus: previousReviewStatus,
      }
    }
    case "merge": {
      const canonicalEventId = input.canonicalEventId?.trim()
      if (!canonicalEventId) {
        return { ok: false, error: "Canonical event ID is required." }
      }
      if (!/^[0-9a-f-]{36}$/i.test(canonicalEventId)) {
        return { ok: false, error: "Invalid canonical event ID." }
      }
      if (candidate.review_status === "approved_listing") {
        return { ok: false, error: "Approved listings cannot be merged." }
      }
      return {
        ok: true,
        patch: {
          review_status: "merged",
          duplicate_status: "exact",
          canonical_event_id: canonicalEventId,
          duplicate_match_evidence: {
            ...(candidate.duplicate_match_evidence ?? {}),
            merged_by_staff: true,
            merged_at: new Date().toISOString(),
            merge_notes: notes,
          },
          updated_at: new Date().toISOString(),
        },
        auditAction: "merge",
        newReviewStatus: "merged",
        newDuplicateStatus: "exact",
      }
    }
    case "undo": {
      if (candidate.review_status !== "merged") {
        return { ok: false, error: "Only merged candidates can be undone." }
      }
      return {
        ok: true,
        patch: {
          review_status: "pending_review",
          duplicate_status: "none",
          canonical_event_id: null,
          duplicate_match_evidence: {
            ...(candidate.duplicate_match_evidence ?? {}),
            merge_undone_at: new Date().toISOString(),
            undo_notes: notes,
          },
          updated_at: new Date().toISOString(),
        },
        auditAction: "undo",
        newReviewStatus: "pending_review",
        newDuplicateStatus: "none",
      }
    }
    case "publish": {
      const publishCheck = canPublishCandidate(candidate)
      if (!publishCheck.allowed) {
        return { ok: false, error: publishCheck.reason ?? "Cannot publish this candidate." }
      }
      return {
        ok: true,
        patch: {},
        auditAction: "approve",
        newReviewStatus: "approved_listing",
      }
    }
    default:
      return { ok: false, error: "Unsupported review action." }
  }
}

export function extractPriceHint(candidate: Pick<CandidateReviewRow, "classifications" | "source_payload">): string | null {
  const classifications = candidate.classifications ?? {}
  const priceRange = classifications.priceRange as { min?: number; max?: number; currency?: string } | undefined
  if (priceRange?.min != null || priceRange?.max != null) {
    const currency = priceRange.currency ?? "USD"
    if (priceRange.min != null && priceRange.max != null && priceRange.min !== priceRange.max) {
      return `${currency} ${priceRange.min}–${priceRange.max}`
    }
    const value = priceRange.min ?? priceRange.max
    return value != null ? `${currency} ${value}` : null
  }

  const payload = candidate.source_payload ?? {}
  const priceRanges = payload.priceRanges as Array<{ min?: number; max?: number; currency?: string }> | undefined
  const first = priceRanges?.[0]
  if (first?.min != null || first?.max != null) {
    const currency = first.currency ?? "USD"
    const value = first.min ?? first.max
    return value != null ? `${currency} ${value}` : null
  }

  return null
}

export function extractOrganizerLabel(
  candidate: Pick<CandidateReviewRow, "organizer_hints" | "source_attribution">,
): string | null {
  const hints = candidate.organizer_hints ?? {}
  const name =
    (typeof hints.name === "string" && hints.name) ||
    (typeof hints.organizer_name === "string" && hints.organizer_name) ||
    null
  return name ?? candidate.source_attribution
}
