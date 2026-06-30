"use server"

import { requireAuth } from "@/lib/auth-helpers"
import {
  isProfileAvatarPathOwnedByUser,
  profileAvatarExtensionFromMimeType,
  profileAvatarPathFromPublicUrl,
  PROFILE_AVATARS_BUCKET,
  validateProfileAvatarFile,
} from "@/lib/profile/avatar-upload-constraints"
import { augmentStorageErrorMessage } from "@/lib/supabase/storage-errors"
import { revalidatePath } from "next/cache"

const DISPLAY_NAME_MAX = 120

export type UpdateProfileState = {
  error: string | null
  success: boolean
}

export async function updateProfileDisplayName(
  _prev: UpdateProfileState,
  formData: FormData,
): Promise<UpdateProfileState> {
  const raw = (formData.get("displayName") as string | null)?.trim() ?? ""

  if (raw.length > DISPLAY_NAME_MAX) {
    return { error: `Display name must be at most ${DISPLAY_NAME_MAX} characters.`, success: false }
  }

  const { supabase, user } = await requireAuth()

  const { error } = await supabase
    .from("profiles")
    .update({ display_name: raw.length > 0 ? raw : null })
    .eq("id", user.id)

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath("/profile")
  revalidatePath("/dashboard")
  return { error: null, success: true }
}

export type ProfileAvatarState = {
  error: string | null
  success: boolean
}

function revalidateProfileSurfaces() {
  revalidatePath("/profile")
  revalidatePath("/dashboard")
}

export async function uploadProfileAvatar(
  _prev: ProfileAvatarState,
  formData: FormData,
): Promise<ProfileAvatarState> {
  const file = formData.get("avatar") as File | null
  if (!file) {
    return { error: "Choose an image to upload.", success: false }
  }

  const validation = validateProfileAvatarFile(file)
  if (!validation.ok) {
    return { error: validation.error, success: false }
  }

  const { supabase, user } = await requireAuth()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    return { error: profileError.message, success: false }
  }

  const ext = profileAvatarExtensionFromMimeType(file.type)
  const stamp = Date.now()
  const rand = Math.random().toString(36).slice(2, 10)
  const storagePath = `${user.id}/${stamp}-${rand}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATARS_BUCKET)
    .upload(storagePath, file, { cacheControl: "3600", upsert: false })

  if (uploadError) {
    return { error: `Upload failed: ${augmentStorageErrorMessage(uploadError.message)}`, success: false }
  }

  const { data: publicUrlData } = supabase.storage.from(PROFILE_AVATARS_BUCKET).getPublicUrl(storagePath)
  const publicUrl = publicUrlData.publicUrl

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id)

  if (updateError) {
    await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([storagePath])
    return { error: updateError.message, success: false }
  }

  const oldPath = profile?.avatar_url ? profileAvatarPathFromPublicUrl(profile.avatar_url) : null
  if (oldPath && oldPath !== storagePath && isProfileAvatarPathOwnedByUser(oldPath, user.id)) {
    await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([oldPath])
  }

  revalidateProfileSurfaces()
  return { error: null, success: true }
}

export async function removeProfileAvatar(
  _prev: ProfileAvatarState,
  _formData: FormData,
): Promise<ProfileAvatarState> {
  const { supabase, user } = await requireAuth()

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  if (profileError) {
    return { error: profileError.message, success: false }
  }

  if (!profile?.avatar_url) {
    return { error: null, success: true }
  }

  const oldPath = profileAvatarPathFromPublicUrl(profile.avatar_url)

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id)

  if (updateError) {
    return { error: updateError.message, success: false }
  }

  if (oldPath && isProfileAvatarPathOwnedByUser(oldPath, user.id)) {
    await supabase.storage.from(PROFILE_AVATARS_BUCKET).remove([oldPath])
  }

  revalidateProfileSurfaces()
  return { error: null, success: true }
}
