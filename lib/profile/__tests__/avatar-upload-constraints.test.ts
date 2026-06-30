import { describe, expect, it } from "vitest"

import {
  isProfileAvatarPathOwnedByUser,
  profileAvatarExtensionFromMimeType,
  profileAvatarPathFromPublicUrl,
  PROFILE_AVATAR_EMPTY_MESSAGE,
  PROFILE_AVATAR_INVALID_TYPE_MESSAGE,
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_AVATAR_TOO_LARGE_MESSAGE,
  validateProfileAvatarFile,
} from "@/lib/profile/avatar-upload-constraints"

describe("profile avatar upload constraints", () => {
  it("accepts supported image types within the size limit", () => {
    expect(validateProfileAvatarFile({ size: 1000, type: "image/jpeg" })).toEqual({ ok: true })
    expect(validateProfileAvatarFile({ size: 1000, type: "image/png" })).toEqual({ ok: true })
    expect(validateProfileAvatarFile({ size: 1000, type: "image/webp" })).toEqual({ ok: true })
  })

  it("rejects empty, unsupported, and oversized files", () => {
    expect(validateProfileAvatarFile({ size: 0, type: "image/jpeg" })).toEqual({
      ok: false,
      error: PROFILE_AVATAR_EMPTY_MESSAGE,
    })
    expect(validateProfileAvatarFile({ size: 1000, type: "image/gif" })).toEqual({
      ok: false,
      error: PROFILE_AVATAR_INVALID_TYPE_MESSAGE,
    })
    expect(validateProfileAvatarFile({ size: PROFILE_AVATAR_MAX_BYTES + 1, type: "image/png" })).toEqual({
      ok: false,
      error: PROFILE_AVATAR_TOO_LARGE_MESSAGE,
    })
  })

  it("maps mime types to safe extensions", () => {
    expect(profileAvatarExtensionFromMimeType("image/png")).toBe("png")
    expect(profileAvatarExtensionFromMimeType("image/webp")).toBe("webp")
    expect(profileAvatarExtensionFromMimeType("image/jpeg")).toBe("jpg")
  })

  it("extracts only avatars bucket paths and checks user ownership", () => {
    const path = "user-1/123-avatar.jpg"
    expect(profileAvatarPathFromPublicUrl(`https://x.supabase.co/storage/v1/object/public/avatars/${path}`)).toBe(path)
    expect(profileAvatarPathFromPublicUrl("https://x.supabase.co/storage/v1/object/public/posts/a.jpg")).toBeNull()
    expect(isProfileAvatarPathOwnedByUser(path, "user-1")).toBe(true)
    expect(isProfileAvatarPathOwnedByUser(path, "user-2")).toBe(false)
  })
})
