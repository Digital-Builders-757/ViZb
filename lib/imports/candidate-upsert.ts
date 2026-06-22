import type {
  CandidateReviewStatus,
  ExistingCandidateRow,
  NormalizedEventCandidate,
} from "@/lib/imports/types"

export type CandidateUpsertResult =
  | { action: "insert"; row: Record<string, unknown> }
  | { action: "update"; id: string; patch: Record<string, unknown> }
  | { action: "skip"; reason: string }

function isSuppressedActive(suppressedUntil: string | null): boolean {
  if (!suppressedUntil) return false
  const until = Date.parse(suppressedUntil)
  if (!Number.isFinite(until)) return false
  return until > Date.now()
}

function normalizedFields(candidate: NormalizedEventCandidate): Record<string, unknown> {
  return {
    title: candidate.title,
    description: candidate.description,
    starts_at: candidate.starts_at,
    ends_at: candidate.ends_at,
    timezone: candidate.timezone,
    venue_name: candidate.venue_name,
    address: candidate.address,
    city: candidate.city,
    region: candidate.region,
    postal_code: candidate.postal_code,
    latitude: candidate.latitude,
    longitude: candidate.longitude,
    image_url: candidate.image_url,
    categories: candidate.categories,
    classifications: candidate.classifications,
    organizer_hints: candidate.organizer_hints,
    external_ticket_url: candidate.external_ticket_url,
  }
}

function sourceFields(candidate: NormalizedEventCandidate, now: string): Record<string, unknown> {
  return {
    source_url: candidate.source_url,
    source_attribution: candidate.source_attribution,
    source_payload: candidate.source_payload,
    source_payload_hash: candidate.source_payload_hash,
    source_status: candidate.source_status,
    last_seen_at: now,
    last_imported_at: now,
  }
}

/**
 * Pure merge rules for candidate re-import (no DB).
 */
export function buildCandidateUpsertPlan(
  candidate: NormalizedEventCandidate,
  existing: ExistingCandidateRow | null,
  importRunId: string | null,
): CandidateUpsertResult {
  const now = new Date().toISOString()
  const baseSource = sourceFields(candidate, now)
  const content = normalizedFields(candidate)

  if (!existing) {
    return {
      action: "insert",
      row: {
        source_key: candidate.source_key,
        source_event_id: candidate.source_event_id,
        ...baseSource,
        ...content,
        review_status: "pending_review" satisfies CandidateReviewStatus,
        duplicate_status: "none",
        first_seen_at: now,
        last_import_run_id: importRunId,
        updated_at: now,
      },
    }
  }

  const basePatch: Record<string, unknown> = {
    ...baseSource,
    last_import_run_id: importRunId,
    updated_at: now,
  }

  if (existing.review_status === "approved_listing" || existing.review_status === "merged") {
    return { action: "update", id: existing.id, patch: basePatch }
  }

  if (existing.review_status === "rejected" || existing.review_status === "suppressed") {
    const prevHash = existing.source_payload_hash?.trim() || ""
    if (prevHash && prevHash === candidate.source_payload_hash) {
      return { action: "skip", reason: `${existing.review_status}_unchanged` }
    }
    if (
      existing.review_status === "suppressed" &&
      isSuppressedActive(existing.suppressed_until)
    ) {
      return { action: "skip", reason: "suppressed_active" }
    }
    return {
      action: "update",
      id: existing.id,
      patch: {
        ...basePatch,
        ...content,
        review_status: "pending_review",
        rejection_reason: null,
        suppressed_until: null,
      },
    }
  }

  if (
    existing.review_status === "pending_review" ||
    existing.review_status === "needs_changes" ||
    existing.review_status === "stale" ||
    existing.review_status === "cancelled"
  ) {
    return {
      action: "update",
      id: existing.id,
      patch: {
        ...basePatch,
        ...content,
        review_status:
          existing.review_status === "stale" || existing.review_status === "cancelled"
            ? "pending_review"
            : existing.review_status,
      },
    }
  }

  return { action: "skip", reason: `review_status_${existing.review_status}` }
}
