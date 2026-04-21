/**
 * Admin post cover uploads (client + server).
 * Bucket: post-covers — see supabase/migrations/20260420180000_post_covers_storage.sql
 * and supabase/migrations/20260420224705_storage_buckets_event_flyers_and_posts.sql (ensure bucket on hosted DBs).
 */

export const POST_COVER_MAX_BYTES = 3 * 1024 * 1024

export const POST_COVER_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export type PostCoverMimeType = (typeof POST_COVER_ALLOWED_MIME_TYPES)[number]

export const POST_COVER_INVALID_TYPE_MESSAGE =
  "Invalid file type. Use JPEG, PNG, or WebP."

export const POST_COVER_TOO_LARGE_MESSAGE = "File too large. Maximum size is 3MB."

export const POST_COVER_ACCEPT_ATTR = POST_COVER_ALLOWED_MIME_TYPES.join(",")

export const POST_COVERS_BUCKET = "post-covers"

/** Extract storage object path from a public URL, or null if not this bucket. */
export function postCoverPathFromPublicUrl(url: string): string | null {
  const marker = `/${POST_COVERS_BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return url.slice(i + marker.length).split("?")[0] ?? null
}
