import { afterEach, describe, expect, it, vi } from "vitest"
import type { EventSourceAdapter } from "@/lib/imports/adapters/event-source-adapter"
import { runSourceImport } from "@/lib/imports/run-source-import"
import type { SupabaseClient } from "@supabase/supabase-js"

vi.mock("@/lib/imports/adapters/registry", () => ({
  getRegisteredAdapter: vi.fn(),
}))

vi.mock("@/lib/imports/candidate-repository", () => ({
  upsertCandidate: vi.fn(),
}))

import { getRegisteredAdapter } from "@/lib/imports/adapters/registry"
import { upsertCandidate } from "@/lib/imports/candidate-repository"

const mockGetRegisteredAdapter = vi.mocked(getRegisteredAdapter)
const mockUpsertCandidate = vi.mocked(upsertCandidate)

function createMockAdmin(overrides: {
  enabledInDb?: boolean
  runId?: string
  overlappingRun?: boolean
} = {}): SupabaseClient {
  const runId = overrides.runId ?? "run-1"
  const enabledInDb = overrides.enabledInDb ?? true
  const overlappingRun = overrides.overlappingRun ?? false

  const from = vi.fn((table: string) => {
    if (table === "event_sources") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({
              data: { enabled_in_db: enabledInDb, consecutive_failures: 0 },
              error: null,
            })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
      }
    }
    if (table === "event_import_runs") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () =>
                    overlappingRun
                      ? {
                          data: { id: "run-overlap", started_at: "2026-06-15T10:00:00.000Z" },
                          error: null,
                        }
                      : { data: null, error: null },
                  ),
                })),
              })),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { id: runId }, error: null })),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(async () => ({ error: null })),
        })),
      }
    }
    return {}
  })

  return { from } as unknown as SupabaseClient
}

function mockAdapter(overrides: Partial<EventSourceAdapter> = {}): EventSourceAdapter {
  return {
    sourceKey: "test_source",
    validateConfig: vi.fn(async () => ({
      ready: true,
      enabled: true,
      configured: true,
    })),
    fetchCandidates: vi.fn(async function* () {
      yield {
        records: [{ id: "1" }],
        pageNumber: 1,
        hasMore: false,
      }
    }),
    normalize: vi.fn(() => ({
      source_key: "test_source",
      source_event_id: "1",
      source_url: "https://example.com/1",
      source_attribution: "Test",
      source_payload: { id: "1" },
      source_payload_hash: "hash-1",
      source_status: null,
      title: "Test Event",
      description: null,
      starts_at: "2026-07-01T22:00:00Z",
      ends_at: null,
      timezone: null,
      venue_name: "Venue",
      address: null,
      city: "Norfolk",
      region: null,
      postal_code: null,
      latitude: null,
      longitude: null,
      image_url: null,
      categories: ["other"],
      classifications: {},
      organizer_hints: {},
      external_ticket_url: null,
    })),
    health: vi.fn(async () => ({
      sourceKey: "test_source",
      ready: { ready: true, enabled: true, configured: true },
      lastCheckedAt: new Date().toISOString(),
    })),
    ...overrides,
  }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe("runSourceImport", () => {
  it("returns not_registered for unknown source", async () => {
    mockGetRegisteredAdapter.mockReturnValue(null)
    const summary = await runSourceImport(createMockAdmin(), {
      sourceKey: "unknown",
      trigger: "manual",
    })
    expect(summary.ok).toBe(false)
    expect(summary.reason).toBe("not_registered")
    expect(summary.errors[0]).toContain("Unknown ingestion source")
  })

  it("skips fail-closed when source env is disabled", async () => {
    mockGetRegisteredAdapter.mockReturnValue(
      mockAdapter({
        validateConfig: vi.fn(async () => ({
          ready: false,
          enabled: false,
          configured: false,
          code: "disabled" as const,
          message: "Disabled.",
        })),
      }),
    )

    const summary = await runSourceImport(createMockAdmin(), {
      sourceKey: "test_source",
      trigger: "manual",
    })

    expect(summary.ok).toBe(true)
    expect(summary.skipped).toBe(true)
    expect(summary.reason).toBe("disabled")
  })

  it("returns missing credentials safely", async () => {
    mockGetRegisteredAdapter.mockReturnValue(
      mockAdapter({
        validateConfig: vi.fn(async () => ({
          ready: false,
          enabled: true,
          configured: false,
          code: "missing_credentials" as const,
          message: "Missing token.",
        })),
      }),
    )

    const summary = await runSourceImport(createMockAdmin(), {
      sourceKey: "test_source",
      trigger: "manual",
    })

    expect(summary.ok).toBe(false)
    expect(summary.reason).toBe("missing_credentials")
    expect(summary.errors).toContain("Missing token.")
  })

  it("skips when registry disabled in database", async () => {
    mockGetRegisteredAdapter.mockReturnValue(mockAdapter())
    const summary = await runSourceImport(createMockAdmin({ enabledInDb: false }), {
      sourceKey: "test_source",
      trigger: "manual",
    })
    expect(summary.skipped).toBe(true)
    expect(summary.reason).toBe("registry_disabled")
  })

  it("creates candidates when ready", async () => {
    mockGetRegisteredAdapter.mockReturnValue(mockAdapter())
    mockUpsertCandidate.mockResolvedValue({ action: "created", candidateId: "c-1" })

    const summary = await runSourceImport(createMockAdmin(), {
      sourceKey: "test_source",
      trigger: "manual",
    })

    expect(summary.ok).toBe(true)
    expect(summary.found).toBe(1)
    expect(summary.created).toBe(1)
    expect(mockUpsertCandidate).toHaveBeenCalledOnce()
  })

  it("skips when an overlapping import run is in progress", async () => {
    mockGetRegisteredAdapter.mockReturnValue(mockAdapter())
    const summary = await runSourceImport(createMockAdmin({ overlappingRun: true }), {
      sourceKey: "test_source",
      trigger: "manual",
    })

    expect(summary.skipped).toBe(true)
    expect(summary.reason).toBe("overlap_in_progress")
    expect(mockUpsertCandidate).not.toHaveBeenCalled()
  })
})
