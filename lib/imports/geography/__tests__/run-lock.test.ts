import { describe, expect, it, vi } from "vitest"
import { findOverlappingImportRun } from "@/lib/imports/geography/run-lock"
import type { SupabaseClient } from "@supabase/supabase-js"

function createOverlapAdmin(running: boolean): SupabaseClient {
  const from = vi.fn((table: string) => {
    if (table === "event_import_runs") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => ({
                limit: vi.fn(() => ({
                  maybeSingle: vi.fn(async () =>
                    running
                      ? {
                          data: { id: "run-active", started_at: "2026-06-15T10:00:00.000Z" },
                          error: null,
                        }
                      : { data: null, error: null },
                  ),
                })),
              })),
            })),
          })),
        })),
      }
    }
    return {}
  })

  return { from } as unknown as SupabaseClient
}

describe("findOverlappingImportRun", () => {
  it("returns blocked when a running import exists", async () => {
    const result = await findOverlappingImportRun(createOverlapAdmin(true), "ticketmaster")
    expect(result.blocked).toBe(true)
    if (result.blocked) {
      expect(result.runId).toBe("run-active")
    }
  })

  it("returns not blocked when no running import exists", async () => {
    const result = await findOverlappingImportRun(createOverlapAdmin(false), "ticketmaster")
    expect(result.blocked).toBe(false)
  })
})
