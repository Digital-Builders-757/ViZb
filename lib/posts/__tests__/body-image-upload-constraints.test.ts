import { describe, it, expect } from "vitest"

import {
  isTrustedBodyImageUrl,
  parseContentImageUrlsJson,
  POST_BODY_IMAGE_MAX_COUNT,
} from "@/lib/posts/body-image-upload-constraints"

describe("parseContentImageUrlsJson", () => {
  it("returns empty array for blank or empty JSON", () => {
    expect(parseContentImageUrlsJson("")).toEqual([])
    expect(parseContentImageUrlsJson("[]")).toEqual([])
    expect(parseContentImageUrlsJson(undefined)).toEqual([])
  })

  it("parses valid HTTPS URLs", () => {
    const urls = ["https://example.supabase.co/storage/v1/object/public/posts/a.jpg"]
    expect(parseContentImageUrlsJson(JSON.stringify(urls))).toEqual(urls)
  })

  it("rejects non-array JSON", () => {
    expect(parseContentImageUrlsJson('{"url":"x"}')).toBeNull()
  })

  it("rejects non-string entries and non-http URLs", () => {
    expect(parseContentImageUrlsJson("[1,2]")).toBeNull()
    expect(parseContentImageUrlsJson('["ftp://x.com/y"]')).toBeNull()
  })

  it(`rejects more than ${POST_BODY_IMAGE_MAX_COUNT} images`, () => {
    const urls = Array.from({ length: POST_BODY_IMAGE_MAX_COUNT + 1 }, (_, i) =>
      `https://x.co/posts/${i}.jpg`,
    )
    expect(parseContentImageUrlsJson(JSON.stringify(urls))).toBeNull()
  })
})

describe("isTrustedBodyImageUrl", () => {
  it("accepts Supabase posts bucket paths", () => {
    expect(
      isTrustedBodyImageUrl(
        "https://proj.supabase.co/storage/v1/object/public/posts/drafts/user/1.jpg",
      ),
    ).toBe(true)
  })

  it("requires /posts/ in the URL path", () => {
    expect(isTrustedBodyImageUrl("https://example.com/image.jpg")).toBe(false)
    expect(isTrustedBodyImageUrl("https://example.com/storage/posts/x.jpg")).toBe(true)
  })
})
