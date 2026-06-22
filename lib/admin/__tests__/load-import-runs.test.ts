import { describe, expect, it } from "vitest"
import {
  formatImportRunTriggerLabel,
  parseImportRunParams,
  summarizeImportRun,
} from "@/lib/admin/load-import-runs"

describe("parseImportRunParams", () => {
  it("parses source and pagination", () => {
    const params = parseImportRunParams({ source: "ticketmaster", page: "2", pageSize: "10" })
    expect(params.sourceKey).toBe("ticketmaster")
    expect(params.page).toBe(2)
    expect(params.pageSize).toBe(10)
  })
})

describe("formatImportRunTriggerLabel", () => {
  it("labels manual and cron triggers", () => {
    expect(formatImportRunTriggerLabel("manual")).toBe("Manual")
    expect(formatImportRunTriggerLabel("cron")).toBe("Cron")
  })
})

describe("summarizeImportRun", () => {
  it("describes completed runs with skips separately from failures", () => {
    const summary = summarizeImportRun({
      status: "completed",
      error_message: "Normalization warnings",
      candidates_skipped: 12,
      events_skipped: 0,
    })
    expect(summary).toContain("12")
    expect(summary).toContain("skipped")
  })

  it("returns error message for failed runs", () => {
    const summary = summarizeImportRun({
      status: "failed",
      error_message: "Adapter timeout",
      candidates_skipped: 0,
      events_skipped: 0,
    })
    expect(summary).toBe("Adapter timeout")
  })
})
