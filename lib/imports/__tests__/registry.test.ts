import { describe, expect, it } from "vitest"
import { listRegisteredSourceKeys } from "@/lib/imports/adapters/registry"

describe("import adapter registry", () => {
  it("registers eventbrite source key", () => {
    expect(listRegisteredSourceKeys()).toContain("eventbrite")
  })

  it("registers ticketmaster source key", () => {
    expect(listRegisteredSourceKeys()).toContain("ticketmaster")
  })
})
