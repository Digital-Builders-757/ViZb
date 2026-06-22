import type {
  NormalizedEventCandidate,
  SourceHealth,
  SourcePage,
  SourceReadiness,
  SourceWindow,
} from "@/lib/imports/types"

/**
 * Contract for automated event ingestion sources (#266).
 * Adapters fetch and normalize only — they must not publish, approve, or create tickets.
 */
export interface EventSourceAdapter {
  readonly sourceKey: string
  validateConfig(): Promise<SourceReadiness>
  fetchCandidates(input: SourceWindow): AsyncIterable<SourcePage>
  normalize(record: unknown): NormalizedEventCandidate | { error: string }
  health(): Promise<SourceHealth>
}
