import { describe, expect, it } from "vitest"
import { buildTicketBarcodeMessage } from "@/lib/tickets/barcode-token"

describe("buildTicketBarcodeMessage", () => {
  it("encodes ids without email or name", () => {
    const msg = buildTicketBarcodeMessage("550e8400-e29b-41d4-a716-446655440000", "660e8400-e29b-41d4-a716-446655440001", "test-secret")
    expect(msg).toMatch(/^vizb\.t\.1\./)
    expect(msg).not.toMatch(/@/)
    expect(msg.split(".").length).toBeGreaterThanOrEqual(4)
  })
})
