/**
 * Admin post body / gallery images (client + server).
 * Bucket: `posts` — see supabase/migrations/20260420224705_storage_buckets_event_flyers_and_posts.sql
 */

export const POST_BODY_IMAGE_MAX_COUNT = 6

export const POST_BODY_IMAGE_MAX_BYTES = 5 * 1024 * 1024

export const POST_BODY_IMAGE_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export const POST_BODY_IMAGE_INVALID_TYPE_MESSAGE =
  "Invalid file type. Use JPEG, PNG, or WebP."

export const POST_BODY_IMAGE_TOO_LARGE_MESSAGE = "File too large. Maximum size is 5MB."

export const POST_BODY_IMAGE_ACCEPT_ATTR = POST_BODY_IMAGE_ALLOWED_MIME_TYPES.join(",")

export const POSTS_MEDIA_BUCKET = "posts"

/** Extract storage object path from a public URL, or null if not this bucket. */
export function postBodyImagePathFromPublicUrl(url: string): string | null {
  const marker = `/${POSTS_MEDIA_BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return url.slice(i + marker.length).split("?")[0] ?? null
}

/** Parse hidden JSON from the admin form; invalid input returns null. */
export function parseContentImageUrlsJson(raw: string | null | undefined): string[] | null {
  const s = raw == null ? "" : String(raw).trim()
  if (s === "" || s === "[]") return []
  try {
    const parsed = JSON.parse(s)
    if (!Array.isArray(parsed)) return null
    const out: string[] = []
    for (const x of parsed) {
      if (typeof x !== "string") return null
      const u = x.trim()
      if (!u) continue
      if (!u.startsWith("http://") && !u.startsWith("https://")) return null
      out.push(u)
    }
    if (out.length > POST_BODY_IMAGE_MAX_COUNT) return null
    return out
  } catch {
    return null
  }
}

/** Reject saves that inject arbitrary hosts; gallery URLs must point at our Storage `posts` bucket path. */
export function isTrustedBodyImageUrl(url: string): boolean {
  return url.includes(`/${POSTS_MEDIA_BUCKET}/`)
}
