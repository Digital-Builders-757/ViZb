import { afterEach, describe, expect, it } from "vitest"
import {
  assertEventbriteImportConfigured,
  EventbriteImportConfigError,
  getEventbriteImportLookaheadDays,
  isEventbriteImportEnabled,
} from "@/lib/eventbrite/env"

const env = process.env

afterEach(() => {
  process.env = { ...env }
})

describe("eventbrite env", () => {
  it("parses enabled flag", () => {
    process.env.EVENTBRITE_IMPORT_ENABLED = "true"
    expect(isEventbriteImportEnabled()).toBe(true)
    process.env.EVENTBRITE_IMPORT_ENABLED = "false"
    expect(isEventbriteImportEnabled()).toBe(false)
  })

  it("clamps lookahead days", () => {
    process.env.EVENTBRITE_IMPORT_LOOKAHEAD_DAYS = "999"
    expect(getEventbriteImportLookaheadDays()).toBe(365)
    process.env.EVENTBRITE_IMPORT_LOOKAHEAD_DAYS = "0"
    expect(getEventbriteImportLookaheadDays()).toBe(1)
  })

  it("throws when disabled", () => {
    process.env.EVENTBRITE_IMPORT_ENABLED = "false"
    process.env.EVENTBRITE_PRIVATE_TOKEN = "token"
    process.env.EVENTBRITE_ORGANIZATION_ID = "123"
    expect(() => assertEventbriteImportConfigured()).toThrow(EventbriteImportConfigError)
  })

  it("throws when credentials missing", () => {
    process.env.EVENTBRITE_IMPORT_ENABLED = "true"
    process.env.EVENTBRITE_PRIVATE_TOKEN = ""
    process.env.EVENTBRITE_ORGANIZATION_ID = ""
    expect(() => assertEventbriteImportConfigured()).toThrow(EventbriteImportConfigError)
  })
})
