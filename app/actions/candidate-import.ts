"use server"

import { revalidatePath } from "next/cache"
import { requireAdmin } from "@/lib/auth-helpers"
import { loadCandidateDetail } from "@/lib/admin/load-candidate-detail"
import {
  buildCandidateReviewPlan,
  type CandidateReviewAction,
  type CandidateReviewRow,
} from "@/lib/imports/candidate-review"
import { recordCandidateReview } from "@/lib/imports/candidate-repository"
import { publishCandidateToEvent } from "@/lib/imports/publish-candidate"
import { revalidatePublicEventDiscoveryPaths } from "@/lib/events/revalidate-public-discovery"
import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"

export type CandidateActionResult = { success: true } | { error: string }

async function loadCandidateForAction(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  candidateId: string,
): Promise<{ candidate: CandidateReviewRow } | { error: string }> {
  const detail = await loadCandidateDetail(supabase, candidateId)
  if (detail.error || !detail.candidate) {
    return { error: detail.error ?? "Candidate not found." }
  }
  return { candidate: detail.candidate }
}

function revalidateCandidatePaths(candidateId: string, eventSlug?: string) {
  revalidatePath("/admin/events/imports")
  revalidatePath(`/admin/events/imports/candidates/${candidateId}`)
  revalidatePath("/admin")
  if (eventSlug) {
    revalidatePublicEventDiscoveryPaths(eventSlug)
  }
}

export async function reviewCandidateAction(input: {
  candidateId: string
  action: CandidateReviewAction
  notes?: string | null
  canonicalEventId?: string | null
  suppressedUntil?: string | null
}): Promise<CandidateActionResult> {
  const { user, supabase } = await requireAdmin()

  if (!isServiceRoleConfigured()) {
    return { error: "Service role not configured." }
  }

  const loaded = await loadCandidateForAction(supabase, input.candidateId)
  if ("error" in loaded) return loaded

  const plan = buildCandidateReviewPlan(loaded.candidate, {
    action: input.action,
    notes: input.notes,
    canonicalEventId: input.canonicalEventId,
    suppressedUntil: input.suppressedUntil,
  })

  if (!plan.ok) {
    return { error: plan.error }
  }

  if ((input.action === "link" || input.action === "merge") && input.canonicalEventId) {
    const { data: eventRow } = await supabase
      .from("events")
      .select("id")
      .eq("id", input.canonicalEventId.trim())
      .maybeSingle()
    if (!eventRow) {
      return { error: "Canonical event not found." }
    }
  }

  if (input.action === "publish") {
    const admin = createServiceRoleClient()
    const publishResult = await publishCandidateToEvent(admin, loaded.candidate, user.id)
    if (!publishResult.ok) {
      return { error: publishResult.error }
    }

    const { error: candidateUpdateError } = await admin
      .from("event_candidates")
      .update({
        review_status: "approved_listing",
        canonical_event_id: publishResult.eventId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.candidateId)

    if (candidateUpdateError) {
      return { error: candidateUpdateError.message }
    }

    await recordCandidateReview(admin, {
      candidateId: input.candidateId,
      action: "approve",
      previousReviewStatus: loaded.candidate.review_status,
      newReviewStatus: "approved_listing",
      actorId: user.id,
      notes: input.notes ?? null,
      metadata: { event_id: publishResult.eventId, slug: publishResult.slug },
    })

    revalidateCandidatePaths(input.candidateId, publishResult.slug)
    return { success: true }
  }

  const admin = createServiceRoleClient()
  const { error: updateError } = await admin
    .from("event_candidates")
    .update(plan.patch)
    .eq("id", input.candidateId)

  if (updateError) {
    return { error: updateError.message }
  }

  await recordCandidateReview(admin, {
    candidateId: input.candidateId,
    action: plan.auditAction,
    previousReviewStatus: loaded.candidate.review_status,
    newReviewStatus: plan.newReviewStatus,
    actorId: user.id,
    notes: input.notes ?? null,
    metadata: {
      previous_duplicate_status: loaded.candidate.duplicate_status,
      new_duplicate_status: plan.newDuplicateStatus ?? loaded.candidate.duplicate_status,
      canonical_event_id: input.canonicalEventId ?? null,
    },
  })

  revalidateCandidatePaths(input.candidateId)
  return { success: true }
}

export async function linkCandidateToEvent(input: {
  candidateId: string
  canonicalEventId: string
  notes?: string | null
}): Promise<CandidateActionResult> {
  return reviewCandidateAction({
    candidateId: input.candidateId,
    action: "link",
    canonicalEventId: input.canonicalEventId,
    notes: input.notes,
  })
}
