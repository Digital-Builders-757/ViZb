import { describe, it, expect } from "vitest"

import { deriveExcerptFromMarkdown, slugify } from "@/lib/posts/utils"

describe("slugify (posts)", () => {
  it("lowercases and hyphenates words", () => {
    expect(slugify("Hello World")).toBe("hello-world")
  })

  it("strips punctuation and collapses dashes", () => {
    expect(slugify("My Post! @ ViZb")).toBe("my-post-vizb")
  })

  it("returns empty string when title has no alphanumeric chars", () => {
    expect(slugify("!!!")).toBe("")
    expect(slugify("   ")).toBe("")
  })
})

describe("deriveExcerptFromMarkdown", () => {
  it("strips markdown noise and truncates", () => {
    const md = "# Title\n\nHello **world** with [link](https://x.com) and `code`."
    const excerpt = deriveExcerptFromMarkdown(md, 40)
    expect(excerpt.length).toBeLessThanOrEqual(40)
    expect(excerpt).toContain("Hello")
    expect(excerpt).not.toContain("#")
  })
})
