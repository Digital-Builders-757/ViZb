import { describe, it, expect } from "vitest"

import {
  EVENT_FLYER_MAX_BYTES,
  EVENT_FLYER_INVALID_TYPE_MESSAGE,
  EVENT_FLYER_TOO_LARGE_MESSAGE,
  EVENT_FLYER_EMPTY_MESSAGE,
  validateEventFlyerFile,
} from "@/lib/events/flyer-upload-constraints"

describe("validateEventFlyerFile", () => {
  it("accepts a valid JPEG", () => {
    const file = new File(["img"], "flyer.jpg", { type: "image/jpeg" })
    expect(validateEventFlyerFile(file)).toEqual({ ok: true })
  })

  it("accepts a valid PNG", () => {
    const file = new File(["img"], "flyer.png", { type: "image/png" })
    expect(validateEventFlyerFile(file)).toEqual({ ok: true })
  })

  it("rejects empty files", () => {
    const file = new File([], "empty.jpg", { type: "image/jpeg" })
    expect(validateEventFlyerFile(file)).toEqual({
      ok: false,
      error: EVENT_FLYER_EMPTY_MESSAGE,
    })
  })

  it("rejects invalid file types", () => {
    const file = new File(["data"], "doc.pdf", { type: "application/pdf" })
    expect(validateEventFlyerFile(file)).toEqual({
      ok: false,
      error: EVENT_FLYER_INVALID_TYPE_MESSAGE,
    })
  })

  it("rejects files larger than 5MB", () => {
    const bigBuffer = new ArrayBuffer(EVENT_FLYER_MAX_BYTES + 1)
    const file = new File([bigBuffer], "huge.jpg", { type: "image/jpeg" })
    expect(validateEventFlyerFile(file)).toEqual({
      ok: false,
      error: EVENT_FLYER_TOO_LARGE_MESSAGE,
    })
  })
})
