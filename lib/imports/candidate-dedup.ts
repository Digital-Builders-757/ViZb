import type { CandidateReviewRow } from "@/lib/imports/candidate-review"

export type DuplicateMatchSummary = {
  candidateId: string
  title: string
  sourceKey: string
  sourceEventId: string
  startsAt: string
  city: string | null
  score?: number
  reason?: string
}

export function parseDuplicateMatchEvidence(
  evidence: Record<string, unknown> | null | undefined,
): DuplicateMatchSummary[] {
  if (!evidence) return []

  const matches = evidence.matches
  if (!Array.isArray(matches)) return []

  const results: DuplicateMatchSummary[] = []

  for (const item of matches) {
    if (!item || typeof item !== "object") continue
    const row = item as Record<string, unknown>
    const candidateId = typeof row.candidate_id === "string" ? row.candidate_id : null
    const title = typeof row.title === "string" ? row.title : null
    if (!candidateId || !title) continue
    results.push({
      candidateId,
      title,
      sourceKey: typeof row.source_key === "string" ? row.source_key : "unknown",
      sourceEventId: typeof row.source_event_id === "string" ? row.source_event_id : "",
      startsAt: typeof row.starts_at === "string" ? row.starts_at : "",
      city: typeof row.city === "string" ? row.city : null,
      score: typeof row.score === "number" ? row.score : undefined,
      reason: typeof row.reason === "string" ? row.reason : undefined,
    })
  }

  return results
}

export function hasDuplicateFlag(candidate: Pick<CandidateReviewRow, "duplicate_status">): boolean {
  return candidate.duplicate_status !== "none"
}

export function buildManualDuplicateEvidence(notes: string | null): Record<string, unknown> {
  return {
    marked_by_staff: true,
    marked_at: new Date().toISOString(),
    notes,
    source: "staff_manual",
  }
}
