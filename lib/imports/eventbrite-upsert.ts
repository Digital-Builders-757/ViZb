import type { EventbriteImportCandidate } from "@/lib/imports/eventbrite-normalize"

export type ExistingImportedEventRow = {
  id: string
  status: string
  slug: string
  source_payload_hash: string | null
  title: string
  starts_at: string
  city: string
  venue_name: string
}

export type UpsertMergeResult =
  | { action: "insert"; row: Record<string, unknown> }
  | { action: "update"; id: string; patch: Record<string, unknown> }
  | { action: "skip"; reason: string }

/**
 * Pure merge rules for Eventbrite re-import (no DB).
 */
export function buildEventbriteUpsertPlan(
  candidate: EventbriteImportCandidate,
  existing: ExistingImportedEventRow | null,
  slug: string,
  orgId: string,
): UpsertMergeResult {
  const now = new Date().toISOString()

  const sourceFields = {
    source: candidate.source,
    source_event_id: candidate.source_event_id,
    source_url: candidate.source_url,
    source_payload: candidate.source_payload,
    last_imported_at: now,
    external_rsvp_url: candidate.external_rsvp_url,
    event_kind: candidate.event_kind,
  }

  if (!existing) {
    return {
      action: "insert",
      row: {
        org_id: orgId,
        title: candidate.title,
        slug,
        description: candidate.description,
        starts_at: candidate.starts_at,
        ends_at: candidate.ends_at,
        venue_name: candidate.venue_name,
        address: candidate.address,
        city: candidate.city,
        categories: candidate.categories,
        flyer_url: candidate.flyer_url,
        status: "pending_review",
        import_status: candidate.import_status,
        created_by: null,
        ...sourceFields,
      },
    }
  }

  const basePatch: Record<string, unknown> = {
    ...sourceFields,
  }

  if (existing.status === "published") {
    return { action: "update", id: existing.id, patch: basePatch }
  }

  if (existing.status === "rejected") {
    const prevHash = existing.source_payload_hash?.trim() || ""
    if (prevHash && prevHash === candidate.source_payload_hash) {
      return { action: "skip", reason: "rejected_unchanged" }
    }
    return {
      action: "update",
      id: existing.id,
      patch: {
        ...basePatch,
        title: candidate.title,
        description: candidate.description,
        starts_at: candidate.starts_at,
        ends_at: candidate.ends_at,
        venue_name: candidate.venue_name,
        address: candidate.address,
        city: candidate.city,
        categories: candidate.categories,
        flyer_url: candidate.flyer_url,
        status: "pending_review",
        import_status: "pending_review",
        rejected_at: null,
        rejected_by: null,
        rejection_reason: null,
        reviewed_at: null,
        reviewed_by: null,
        review_notes: null,
      },
    }
  }

  if (existing.status === "pending_review" || existing.status === "draft") {
    return {
      action: "update",
      id: existing.id,
      patch: {
        ...basePatch,
        title: candidate.title,
        description: candidate.description,
        starts_at: candidate.starts_at,
        ends_at: candidate.ends_at,
        venue_name: candidate.venue_name,
        address: candidate.address,
        city: candidate.city,
        categories: candidate.categories,
        flyer_url: candidate.flyer_url,
        status: "pending_review",
        import_status: candidate.import_status,
      },
    }
  }

  return { action: "skip", reason: `status_${existing.status}` }
}
