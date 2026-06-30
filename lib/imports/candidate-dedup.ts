import type { CandidateReviewRow } from "@/lib/imports/candidate-review"

export type DuplicateMatchSummary = {
  kind: "candidate" | "event"
  candidateId: string
  eventId: string | null
  title: string
  sourceKey: string
  sourceEventId: string
  startsAt: string
  city: string | null
  venueName?: string | null
  status?: "exact" | "likely"
  score?: number
  reason?: string
  signals?: string[]
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
    const kind = row.kind === "event" ? "event" : "candidate"
    const candidateId = typeof row.candidate_id === "string" ? row.candidate_id : null
    const eventId = typeof row.event_id === "string" ? row.event_id : null
    const title = typeof row.title === "string" ? row.title : null
    if (!title || (kind === "candidate" && !candidateId) || (kind === "event" && !eventId)) continue
    results.push({
      kind,
      candidateId: candidateId ?? "",
      eventId,
      title,
      sourceKey: typeof row.source_key === "string" ? row.source_key : "unknown",
      sourceEventId: typeof row.source_event_id === "string" ? row.source_event_id : "",
      startsAt: typeof row.starts_at === "string" ? row.starts_at : "",
      city: typeof row.city === "string" ? row.city : null,
      venueName: typeof row.venue_name === "string" ? row.venue_name : null,
      status: row.status === "exact" || row.status === "likely" ? row.status : undefined,
      score: typeof row.score === "number" ? row.score : undefined,
      reason: typeof row.reason === "string" ? row.reason : undefined,
      signals: Array.isArray(row.signals)
        ? row.signals.filter((signal): signal is string => typeof signal === "string")
        : undefined,
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
