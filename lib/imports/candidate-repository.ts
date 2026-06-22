import type { SupabaseClient } from "@supabase/supabase-js"
import { buildCandidateUpsertPlan } from "@/lib/imports/candidate-upsert"
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

  return { action: "updated", candidateId: plan.id }
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
