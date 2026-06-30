import type { CandidateDuplicateStatus, NormalizedEventCandidate } from "@/lib/imports/types"

export type CandidateDuplicateComparable = {
  id: string
  source_key: string
  source_event_id: string
  source_url: string | null
  external_ticket_url: string | null
  title: string
  starts_at: string
  venue_name: string | null
  city: string | null
  organizer_hints: Record<string, unknown>
  canonical_event_id: string | null
}

export type EventDuplicateComparable = {
  id: string
  title: string
  starts_at: string
  venue_name: string | null
  city: string | null
  source: string | null
  source_event_id: string | null
  source_url: string | null
  external_rsvp_url: string | null
}

export type DuplicateMatchKind = "candidate" | "event"

export type DuplicateMatchEvidenceItem = {
  kind: DuplicateMatchKind
  status: Exclude<CandidateDuplicateStatus, "none">
  score: number
  reason: string
  signals: string[]
  title: string
  starts_at: string
  venue_name: string | null
  city: string | null
  source_key?: string
  source_event_id?: string
  candidate_id?: string
  event_id?: string
}

export type CandidateDuplicateDetectionResult = {
  status: CandidateDuplicateStatus
  canonicalEventId: string | null
  evidence: {
    detector: "candidate_duplicate_detection_v1"
    checked_at: string
    matches: DuplicateMatchEvidenceItem[]
  }
}

type ComparableTarget =
  | { kind: "candidate"; row: CandidateDuplicateComparable }
  | { kind: "event"; row: EventDuplicateComparable }

const STOP_WORDS = new Set(["a", "an", "and", "at", "for", "in", "of", "on", "the", "to", "with"])

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

function tokens(value: string | null | undefined): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token && !STOP_WORDS.has(token))
}

function tokenSimilarity(a: string | null | undefined, b: string | null | undefined): number {
  const aTokens = new Set(tokens(a))
  const bTokens = new Set(tokens(b))
  if (aTokens.size === 0 || bTokens.size === 0) return 0

  let intersection = 0
  for (const token of aTokens) {
    if (bTokens.has(token)) intersection += 1
  }

  const union = new Set([...aTokens, ...bTokens]).size
  return union === 0 ? 0 : intersection / union
}

function compactName(value: string | null | undefined): string {
  return tokens(value).join("")
}

function venueSimilarity(a: string | null | undefined, b: string | null | undefined): number {
  const compactA = compactName(a)
  const compactB = compactName(b)
  if (!compactA || !compactB) return 0
  if (compactA === compactB) return 1
  if (compactA.includes(compactB) || compactB.includes(compactA)) return 0.9
  return tokenSimilarity(a, b)
}

function normalizedUrlSet(candidate: NormalizedEventCandidate): Set<string> {
  const urls = [candidate.source_url, candidate.external_ticket_url]
    .map((url) => url?.trim().toLowerCase())
    .filter(Boolean) as string[]
  return new Set(urls)
}

function targetUrls(target: ComparableTarget): string[] {
  if (target.kind === "candidate") {
    return [target.row.source_url, target.row.external_ticket_url]
      .map((url) => url?.trim().toLowerCase())
      .filter(Boolean) as string[]
  }
  return [target.row.source_url, target.row.external_rsvp_url]
    .map((url) => url?.trim().toLowerCase())
    .filter(Boolean) as string[]
}

function minutesApart(a: string, b: string): number | null {
  const aMs = Date.parse(a)
  const bMs = Date.parse(b)
  if (!Number.isFinite(aMs) || !Number.isFinite(bMs)) return null
  return Math.abs(aMs - bMs) / 60_000
}

function sameCity(a: string | null | undefined, b: string | null | undefined): boolean {
  const normalizedA = normalizeText(a)
  const normalizedB = normalizeText(b)
  return Boolean(normalizedA && normalizedB && normalizedA === normalizedB)
}

function organizerName(hints: Record<string, unknown>): string | null {
  const name = hints.name ?? hints.organizer_name ?? hints.organizerName
  return typeof name === "string" && name.trim() ? name : null
}

function buildMatchEvidence(
  target: ComparableTarget,
  status: Exclude<CandidateDuplicateStatus, "none">,
  score: number,
  reason: string,
  signals: string[],
): DuplicateMatchEvidenceItem {
  if (target.kind === "candidate") {
    return {
      kind: "candidate",
      status,
      score,
      reason,
      signals,
      candidate_id: target.row.id,
      source_key: target.row.source_key,
      source_event_id: target.row.source_event_id,
      title: target.row.title,
      starts_at: target.row.starts_at,
      venue_name: target.row.venue_name,
      city: target.row.city,
    }
  }

  return {
    kind: "event",
    status,
    score,
    reason,
    signals,
    event_id: target.row.id,
    source_key: target.row.source ?? undefined,
    source_event_id: target.row.source_event_id ?? undefined,
    title: target.row.title,
    starts_at: target.row.starts_at,
    venue_name: target.row.venue_name,
    city: target.row.city,
  }
}

function scoreTarget(
  candidate: NormalizedEventCandidate,
  target: ComparableTarget,
): DuplicateMatchEvidenceItem | null {
  const candidateUrls = normalizedUrlSet(candidate)
  const targetUrlMatch = targetUrls(target).some((url) => candidateUrls.has(url))
  const targetSourceKey = target.kind === "candidate" ? target.row.source_key : target.row.source
  const targetSourceEventId = target.kind === "candidate" ? target.row.source_event_id : target.row.source_event_id
  const sourceIdentityMatch =
    Boolean(candidate.source_key && candidate.source_event_id) &&
    targetSourceKey === candidate.source_key &&
    targetSourceEventId === candidate.source_event_id

  if (sourceIdentityMatch || targetUrlMatch) {
    return buildMatchEvidence(
      target,
      "exact",
      100,
      sourceIdentityMatch ? "Exact source identity match." : "Exact source URL match.",
      [sourceIdentityMatch ? "source_identity" : "source_url"],
    )
  }

  const titleScore = tokenSimilarity(candidate.title, target.row.title)
  const venueScore = venueSimilarity(candidate.venue_name, target.row.venue_name)
  const cityMatch = sameCity(candidate.city, target.row.city)
  const diffMinutes = minutesApart(candidate.starts_at, target.row.starts_at)
  const organizerMatch =
    target.kind === "candidate" &&
    Boolean(organizerName(candidate.organizer_hints)) &&
    normalizeText(organizerName(candidate.organizer_hints)) === normalizeText(organizerName(target.row.organizer_hints))

  const signals: string[] = []
  let score = 0

  score += titleScore * 40
  if (titleScore >= 0.95) signals.push("same_title")
  else if (titleScore >= 0.78) signals.push("similar_title")

  if (diffMinutes != null) {
    if (diffMinutes <= 30) {
      score += 25
      signals.push("same_start_time")
    } else if (diffMinutes <= 120) {
      score += 18
      signals.push("shifted_start_time")
    }
  }

  if (venueScore >= 0.85) {
    score += 20
    signals.push("same_venue")
  } else if (venueScore >= 0.65) {
    score += 14
    signals.push("similar_venue")
  }

  if (cityMatch) {
    score += 10
    signals.push("same_city")
  }

  if (organizerMatch) {
    score += 5
    signals.push("same_organizer")
  }

  const hasReliablePlaceSignal = cityMatch || venueScore >= 0.65 || organizerMatch
  const closeEnoughTime = diffMinutes != null && diffMinutes <= 120
  const exact =
    score >= 94 &&
    titleScore >= 0.95 &&
    closeEnoughTime &&
    cityMatch &&
    venueScore >= 0.85
  const likely =
    score >= 78 &&
    titleScore >= 0.78 &&
    closeEnoughTime &&
    hasReliablePlaceSignal &&
    (venueScore >= 0.65 || organizerMatch || (cityMatch && titleScore >= 0.95))

  if (!exact && !likely) return null

  return buildMatchEvidence(
    target,
    exact ? "exact" : "likely",
    Math.round(score),
    exact ? "Conservative title, time, venue, and city match." : "Likely title, time, and place match.",
    signals,
  )
}

export function detectCandidateDuplicates(
  candidate: NormalizedEventCandidate,
  inputs: {
    candidates: CandidateDuplicateComparable[]
    events: EventDuplicateComparable[]
  },
  checkedAt = new Date().toISOString(),
): CandidateDuplicateDetectionResult {
  const targets: ComparableTarget[] = [
    ...inputs.events.map((row): ComparableTarget => ({ kind: "event", row })),
    ...inputs.candidates.map((row): ComparableTarget => ({ kind: "candidate", row })),
  ]

  const matches = targets
    .map((target) => scoreTarget(candidate, target))
    .filter((match): match is DuplicateMatchEvidenceItem => Boolean(match))
    .sort((a, b) => {
      if (a.status !== b.status) return a.status === "exact" ? -1 : 1
      return b.score - a.score
    })
    .slice(0, 5)

  const exactEvent = matches.find((match) => match.status === "exact" && match.kind === "event" && match.event_id)

  return {
    status: matches.some((match) => match.status === "exact")
      ? "exact"
      : matches.length > 0
        ? "likely"
        : "none",
    canonicalEventId: exactEvent?.event_id ?? null,
    evidence: {
      detector: "candidate_duplicate_detection_v1",
      checked_at: checkedAt,
      matches,
    },
  }
}
