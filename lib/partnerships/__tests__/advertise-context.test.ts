import { describe, expect, it } from "vitest"

import {
  ADVERTISE_SUBMISSION_CONTEXT_PREFIX,
  buildAdvertiseSubmissionContext,
  parseSubmissionContextAttribution,
} from "@/lib/partnerships/advertise-context"

describe("buildAdvertiseSubmissionContext", () => {
  it("returns undefined when not from organizer", () => {
    expect(buildAdvertiseSubmissionContext({ from: "public" })).toBeUndefined()
  })

  it("builds org + event referrer line", () => {
    expect(
      buildAdvertiseSubmissionContext({
        from: "organizer",
        orgSlug: "cool-collective",
        eventSlug: "summer-mixer",
      }),
    ).toBe(
      `${ADVERTISE_SUBMISSION_CONTEXT_PREFIX} · org \u201ccool-collective\u201d · event \u201csummer-mixer\u201d`,
    )
  })
})

describe("parseSubmissionContextAttribution", () => {
  it("accepts valid built lines", () => {
    const line = `${ADVERTISE_SUBMISSION_CONTEXT_PREFIX} · org \u201cacme\u201d`
    expect(parseSubmissionContextAttribution(line)).toBe(line)
  })

  it("rejects wrong prefix", () => {
    expect(parseSubmissionContextAttribution("Spam — hi")).toBeUndefined()
  })

  it("rejects newlines", () => {
    expect(
      parseSubmissionContextAttribution(`${ADVERTISE_SUBMISSION_CONTEXT_PREFIX}\nextra`),
    ).toBeUndefined()
  })
})
