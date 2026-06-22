import type { SupabaseClient } from "@supabase/supabase-js"
import type { CandidateReviewRow } from "@/lib/imports/candidate-review"

export type CandidateReviewHistoryRow = {
  id: string
  action: string
  previous_review_status: string | null
  new_review_status: string | null
  notes: string | null
  metadata: Record<string, unknown>
  created_at: string
  actor_id: string | null
}

export type CandidateDetailResult = {
  candidate: CandidateReviewRow | null
  reviews: CandidateReviewHistoryRow[]
  canonicalEvent: { id: string; slug: string; title: string; status: string } | null
  error: string | null
}

const CANDIDATE_SELECT =
  "id, source_key, source_event_id, source_url, source_attribution, source_payload, title, description, starts_at, ends_at, timezone, venue_name, address, city, region, postal_code, image_url, categories, classifications, organizer_hints, external_ticket_url, review_status, duplicate_status, canonical_event_id, duplicate_match_evidence, rejection_reason, suppressed_until, last_import_run_id, last_imported_at"

export async function loadCandidateDetail(
  supabase: SupabaseClient,
  candidateId: string,
): Promise<CandidateDetailResult> {
  const { data: candidate, error: candidateError } = await supabase
    .from("event_candidates")
    .select(CANDIDATE_SELECT)
    .eq("id", candidateId)
    .maybeSingle()

  if (candidateError) {
    return { candidate: null, reviews: [], canonicalEvent: null, error: candidateError.message }
  }
  if (!candidate) {
    return { candidate: null, reviews: [], canonicalEvent: null, error: "Candidate not found." }
  }

  const { data: reviews, error: reviewsError } = await supabase
    .from("event_candidate_reviews")
    .select("id, action, previous_review_status, new_review_status, notes, metadata, created_at, actor_id")
    .eq("candidate_id", candidateId)
    .order("created_at", { ascending: false })
    .limit(100)

  if (reviewsError) {
    return {
      candidate: candidate as CandidateReviewRow,
      reviews: [],
      canonicalEvent: null,
      error: reviewsError.message,
    }
  }

  let canonicalEvent: CandidateDetailResult["canonicalEvent"] = null
  const canonicalId = candidate.canonical_event_id as string | null
  if (canonicalId) {
    const { data: eventRow } = await supabase
      .from("events")
      .select("id, slug, title, status")
      .eq("id", canonicalId)
      .maybeSingle()
    if (eventRow) {
      canonicalEvent = eventRow as CandidateDetailResult["canonicalEvent"]
    }
  }

  return {
    candidate: candidate as CandidateReviewRow,
    reviews: (reviews ?? []) as CandidateReviewHistoryRow[],
    canonicalEvent,
    error: null,
  }
}
