import type { SupabaseClient } from "@supabase/supabase-js"
import { buildCandidateUpsertPlan } from "@/lib/imports/candidate-upsert"
import {
  detectCandidateDuplicates,
  type CandidateDuplicateComparable,
  type EventDuplicateComparable,
} from "@/lib/imports/candidate-duplicate-detection"
import type { ExistingCandidateRow, NormalizedEventCandidate } from "@/lib/imports/types"

export type CandidateUpsertOutcome =
  | { action: "created"; candidateId: string }
  | { action: "updated"; candidateId: string }
  | { action: "skipped"; reason: string }

export async function loadExistingCandidate(
  admin: SupabaseClient,
  sourceKey: string,
  sourceEventId: string,
): Promise<ExistingCandidateRow | null> {
  const { data, error } = await admin
    .from("event_candidates")
    .select(
      "id, review_status, source_payload_hash, duplicate_status, canonical_event_id, suppressed_until",
    )
    .eq("source_key", sourceKey)
    .eq("source_event_id", sourceEventId)
    .maybeSingle()

  if (error || !data) return null

  return {
    id: data.id as string,
    review_status: data.review_status as ExistingCandidateRow["review_status"],
    source_payload_hash: (data.source_payload_hash as string | null) ?? null,
    duplicate_status: data.duplicate_status as ExistingCandidateRow["duplicate_status"],
    canonical_event_id: (data.canonical_event_id as string | null) ?? null,
    suppressed_until: (data.suppressed_until as string | null) ?? null,
  }
}

export async function upsertCandidate(
  admin: SupabaseClient,
  candidate: NormalizedEventCandidate,
  importRunId: string | null,
): Promise<CandidateUpsertOutcome> {
  const existing = await loadExistingCandidate(
    admin,
    candidate.source_key,
    candidate.source_event_id,
  )
  const plan = buildCandidateUpsertPlan(candidate, existing, importRunId)

  if (plan.action === "skip") {
    return { action: "skipped", reason: plan.reason }
  }

  if (plan.action === "insert") {
    const { data, error } = await admin
      .from("event_candidates")
      .insert(plan.row)
      .select("id")
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? "Failed to insert event candidate.")
    }

    await recordCandidateReview(admin, {
      candidateId: data.id as string,
      action: "system_import",
      previousReviewStatus: null,
      newReviewStatus: "pending_review",
      metadata: { import_run_id: importRunId, outcome: "created" },
    })

    await applyCandidateDuplicateDetection(admin, data.id as string, candidate, importRunId, null)

    return { action: "created", candidateId: data.id as string }
  }

  const { error: updateError } = await admin
    .from("event_candidates")
    .update(plan.patch)
    .eq("id", plan.id)

  if (updateError) {
    throw new Error(updateError.message)
  }

  await recordCandidateReview(admin, {
    candidateId: plan.id,
    action: "system_import",
    previousReviewStatus: existing?.review_status ?? null,
    newReviewStatus:
      (plan.patch.review_status as string | undefined) ?? existing?.review_status ?? null,
    metadata: { import_run_id: importRunId, outcome: "updated" },
  })

  await applyCandidateDuplicateDetection(admin, plan.id, candidate, importRunId, existing)

  return { action: "updated", candidateId: plan.id }
}

function duplicateSearchWindow(startsAt: string): { start: string; end: string } | null {
  const parsed = Date.parse(startsAt)
  if (!Number.isFinite(parsed)) return null
  const radiusMs = 36 * 60 * 60 * 1000
  return {
    start: new Date(parsed - radiusMs).toISOString(),
    end: new Date(parsed + radiusMs).toISOString(),
  }
}

async function loadDuplicateDetectionInputs(
  admin: SupabaseClient,
  candidateId: string,
  candidate: NormalizedEventCandidate,
): Promise<{ candidates: CandidateDuplicateComparable[]; events: EventDuplicateComparable[] }> {
  const window = duplicateSearchWindow(candidate.starts_at)
  if (!window) return { candidates: [], events: [] }

  const { data: candidateRows } = await admin
    .from("event_candidates")
    .select(
      "id, source_key, source_event_id, source_url, external_ticket_url, title, starts_at, venue_name, city, organizer_hints, canonical_event_id",
    )
    .neq("id", candidateId)
    .gte("starts_at", window.start)
    .lte("starts_at", window.end)
    .limit(50)

  const { data: eventRows } = await admin
    .from("events")
    .select("id, title, starts_at, venue_name, city, source, source_event_id, source_url, external_rsvp_url")
    .gte("starts_at", window.start)
    .lte("starts_at", window.end)
    .limit(50)

  return {
    candidates: ((candidateRows ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      source_key: String(row.source_key),
      source_event_id: String(row.source_event_id),
      source_url: (row.source_url as string | null) ?? null,
      external_ticket_url: (row.external_ticket_url as string | null) ?? null,
      title: String(row.title),
      starts_at: String(row.starts_at),
      venue_name: (row.venue_name as string | null) ?? null,
      city: (row.city as string | null) ?? null,
      organizer_hints: (row.organizer_hints as Record<string, unknown> | null) ?? {},
      canonical_event_id: (row.canonical_event_id as string | null) ?? null,
    })),
    events: ((eventRows ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      starts_at: String(row.starts_at),
      venue_name: (row.venue_name as string | null) ?? null,
      city: (row.city as string | null) ?? null,
      source: (row.source as string | null) ?? null,
      source_event_id: (row.source_event_id as string | null) ?? null,
      source_url: (row.source_url as string | null) ?? null,
      external_rsvp_url: (row.external_rsvp_url as string | null) ?? null,
    })),
  }
}

async function applyCandidateDuplicateDetection(
  admin: SupabaseClient,
  candidateId: string,
  candidate: NormalizedEventCandidate,
  importRunId: string | null,
  existing: ExistingCandidateRow | null,
): Promise<void> {
  const inputs = await loadDuplicateDetectionInputs(admin, candidateId, candidate)
  const detection = detectCandidateDuplicates(candidate, inputs)

  if (detection.status === "none") return

  const patch: Record<string, unknown> = {
    duplicate_status: detection.status,
    duplicate_match_evidence: detection.evidence,
    updated_at: new Date().toISOString(),
  }

  if (detection.status === "exact" && detection.canonicalEventId) {
    patch.canonical_event_id = detection.canonicalEventId
  }

  const { error } = await admin.from("event_candidates").update(patch).eq("id", candidateId)
  if (error) {
    throw new Error(error.message)
  }

  await recordCandidateReview(admin, {
    candidateId,
    action: "system_import",
    previousReviewStatus: existing?.review_status ?? "pending_review",
    newReviewStatus: existing?.review_status ?? "pending_review",
    metadata: {
      import_run_id: importRunId,
      outcome: "duplicate_detected",
      previous_duplicate_status: existing?.duplicate_status ?? "none",
      new_duplicate_status: detection.status,
      canonical_event_id: detection.canonicalEventId,
      evidence: detection.evidence,
    },
  })
}

export async function recordCandidateReview(
  admin: SupabaseClient,
  input: {
    candidateId: string
    action: string
    previousReviewStatus: string | null
    newReviewStatus: string | null
    actorId?: string | null
    notes?: string | null
    metadata?: Record<string, unknown>
  },
): Promise<void> {
  const { error } = await admin.from("event_candidate_reviews").insert({
    candidate_id: input.candidateId,
    actor_id: input.actorId ?? null,
    action: input.action,
    previous_review_status: input.previousReviewStatus,
    new_review_status: input.newReviewStatus,
    notes: input.notes ?? null,
    metadata: input.metadata ?? {},
  })

  if (error) {
    throw new Error(error.message)
  }
}
