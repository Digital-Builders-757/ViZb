/**
 * User profile avatar uploads (client + server).
 * Bucket: `avatars` - see supabase/migrations/20260630171827_profile_avatars_storage.sql
 */

export const PROFILE_AVATARS_BUCKET = "avatars"

export const PROFILE_AVATAR_MAX_BYTES = 2 * 1024 * 1024

export const PROFILE_AVATAR_ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const

export const PROFILE_AVATAR_INVALID_TYPE_MESSAGE = "Invalid file type. Use JPEG, PNG, or WebP."

export const PROFILE_AVATAR_TOO_LARGE_MESSAGE = "File too large. Maximum size is 2MB."

export const PROFILE_AVATAR_EMPTY_MESSAGE = "Choose an image to upload."

export const PROFILE_AVATAR_ACCEPT_ATTR = PROFILE_AVATAR_ALLOWED_MIME_TYPES.join(",")

export type ProfileAvatarValidationResult = { ok: true } | { ok: false; error: string }

export function validateProfileAvatarFile(file: Pick<File, "size" | "type">): ProfileAvatarValidationResult {
  if (file.size === 0) {
    return { ok: false, error: PROFILE_AVATAR_EMPTY_MESSAGE }
  }
  if (!(PROFILE_AVATAR_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
    return { ok: false, error: PROFILE_AVATAR_INVALID_TYPE_MESSAGE }
  }
  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return { ok: false, error: PROFILE_AVATAR_TOO_LARGE_MESSAGE }
  }
  return { ok: true }
}

export function profileAvatarExtensionFromMimeType(mimeType: string): "jpg" | "png" | "webp" {
  if (mimeType === "image/png") return "png"
  if (mimeType === "image/webp") return "webp"
  return "jpg"
}

/** Extract storage object path from a public URL, or null if not this bucket. */
export function profileAvatarPathFromPublicUrl(url: string): string | null {
  const marker = `/${PROFILE_AVATARS_BUCKET}/`
  const i = url.indexOf(marker)
  if (i === -1) return null
  return url.slice(i + marker.length).split("?")[0] ?? null
}

export function isProfileAvatarPathOwnedByUser(path: string, userId: string): boolean {
  return path.split("/")[0] === userId
}
