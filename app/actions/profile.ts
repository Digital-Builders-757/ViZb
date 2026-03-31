"use server"

import { requireAuth } from "@/lib/auth-helpers"
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
