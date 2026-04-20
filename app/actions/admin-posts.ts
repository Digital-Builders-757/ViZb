"use server"

import { requireAdmin } from "@/lib/auth-helpers"
import { isServerSupabaseConfigured, createClient } from "@/lib/supabase/server"
import {
  POST_COVER_ALLOWED_MIME_TYPES,
  POST_COVER_INVALID_TYPE_MESSAGE,
  POST_COVER_MAX_BYTES,
  POST_COVER_TOO_LARGE_MESSAGE,
  POST_COVERS_BUCKET,
  postCoverPathFromPublicUrl,
} from "@/lib/posts/cover-upload-constraints"

export type UploadAdminPostCoverResult =
  | { success: true; publicUrl: string }
  | { error: string }

/**
 * Upload a cover image for a new or existing admin post. Does not update `posts` —
 * the editor keeps the returned URL in `cover_image_url` until save.
 *
 * FormData: `cover` (File), optional `post_id` (string), optional `replace_url` (current cover to delete from bucket).
 */
export async function uploadAdminPostCover(formData: FormData): Promise<UploadAdminPostCoverResult> {
  try {
    if (!isServerSupabaseConfigured()) {
      return { error: "Supabase is not configured." }
    }

    const { user, supabase } = await requireAdmin()

    const file = formData.get("cover") as File | null
    if (!file || file.size === 0) {
      return { error: "No file provided." }
    }

    if (!(POST_COVER_ALLOWED_MIME_TYPES as readonly string[]).includes(file.type)) {
      return { error: POST_COVER_INVALID_TYPE_MESSAGE }
    }

    if (file.size > POST_COVER_MAX_BYTES) {
      return { error: POST_COVER_TOO_LARGE_MESSAGE }
    }

    const postIdRaw = String(formData.get("post_id") ?? "").trim()
    const replaceUrl = String(formData.get("replace_url") ?? "").trim()

    if (replaceUrl) {
      const oldPath = postCoverPathFromPublicUrl(replaceUrl)
      if (oldPath) {
        await supabase.storage.from(POST_COVERS_BUCKET).remove([oldPath])
      }
    }

    const ext = file.name.split(".").pop()?.toLowerCase()
    const safeExt =
      ext && ["jpg", "jpeg", "png", "webp"].includes(ext) ? (ext === "jpeg" ? "jpg" : ext) : "jpg"
    const stamp = Date.now()
    const rand = Math.random().toString(36).slice(2, 10)

    const storagePath = postIdRaw
      ? `${postIdRaw}/${stamp}-${rand}.${safeExt}`
      : `drafts/${user.id}/${stamp}-${rand}.${safeExt}`

    const { error: uploadError } = await supabase.storage
      .from(POST_COVERS_BUCKET)
      .upload(storagePath, file, { cacheControl: "3600", upsert: false })

    if (uploadError) {
      return { error: `Upload failed: ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage.from(POST_COVERS_BUCKET).getPublicUrl(storagePath)

    return { success: true, publicUrl: publicUrlData.publicUrl }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err
    }
    return { error: "An unexpected error occurred during upload." }
  }
}

export type RemoveAdminPostCoverFileResult = { success: true } | { error: string }

/** Remove an object from post-covers if the URL belongs to that bucket (e.g. user cleared cover in editor). */
export async function removeAdminPostCoverFromStorage(coverImageUrl: string): Promise<RemoveAdminPostCoverFileResult> {
  try {
    if (!isServerSupabaseConfigured()) {
      return { error: "Supabase is not configured." }
    }

    const { supabase } = await requireAdmin()
    const path = postCoverPathFromPublicUrl(coverImageUrl.trim())
    if (!path) {
      return { success: true }
    }

    const { error } = await supabase.storage.from(POST_COVERS_BUCKET).remove([path])
    if (error) {
      return { error: `Remove failed: ${error.message}` }
    }
    return { success: true }
  } catch (err) {
    if (err && typeof err === "object" && "digest" in err) {
      throw err
    }
    return { error: "An unexpected error occurred." }
  }
}
