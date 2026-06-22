import { afterEach, describe, expect, it } from "vitest"
import {
  getTicketmasterApiKey,
  isTicketmasterImportConfigured,
  isTicketmasterImportEnabled,
  redactTicketmasterSecrets,
} from "@/lib/ticketmaster/env"

const originalEnv = { ...process.env }

afterEach(() => {
  process.env = { ...originalEnv }
})

describe("ticketmaster env", () => {
  it("reports disabled when env flag is false", () => {
    process.env.TICKETMASTER_IMPORT_ENABLED = "false"
    expect(isTicketmasterImportEnabled()).toBe(false)
  })

  it("reports missing credentials when key absent", () => {
    delete process.env.TICKETMASTER_API_KEY
    expect(isTicketmasterImportConfigured()).toBe(false)
  })

  it("reads configured API key without exposing it in helpers", () => {
    process.env.TICKETMASTER_API_KEY = "secret-consumer-key"
    expect(getTicketmasterApiKey()).toBe("secret-consumer-key")
  })

  it("redacts api key from error strings", () => {
    process.env.TICKETMASTER_API_KEY = "secret-consumer-key"
    const redacted = redactTicketmasterSecrets(
      "Request failed: https://app.ticketmaster.com/discovery/v2/events.json?apikey=secret-consumer-key&city=Norfolk",
    )
    expect(redacted).not.toContain("secret-consumer-key")
    expect(redacted).toContain("apikey=REDACTED")
  })
})
