export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function deriveExcerptFromMarkdown(md: string, maxLen = 180): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/[#>*_\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLen)
}
