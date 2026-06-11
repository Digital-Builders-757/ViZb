"use server"

import { revalidatePath } from "next/cache"
import { requireAuth } from "@/lib/auth-helpers"
import { isValidEventCategory } from "@/lib/events/categories"

function revalidateFollowSurfaces() {
  revalidatePath("/dashboard")
  revalidatePath("/events")
  revalidatePath("/profile")
}

export async function followOrganizer(orgId: string) {
  const { user, supabase } = await requireAuth()
  const id = orgId?.trim()
  if (!id) return { error: "Missing organizer." }

  const { error } = await supabase.from("organization_follows").insert({
    user_id: user.id,
    org_id: id,
  })

  if (error) {
    if (error.code === "23505") return { success: true as const }
    return { error: error.message }
  }

  revalidateFollowSurfaces()
  return { success: true as const }
}

export async function unfollowOrganizer(orgId: string) {
  const { user, supabase } = await requireAuth()
  const id = orgId?.trim()
  if (!id) return { error: "Missing organizer." }

  const { error } = await supabase
    .from("organization_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("org_id", id)

  if (error) return { error: error.message }

  revalidateFollowSurfaces()
  return { success: true as const }
}

export async function followCategory(category: string) {
  const { user, supabase } = await requireAuth()
  const cat = category?.trim().toLowerCase()
  if (!cat || !isValidEventCategory(cat)) return { error: "Invalid category." }

  const { error } = await supabase.from("member_category_follows").insert({
    user_id: user.id,
    category: cat,
  })

  if (error) {
    if (error.code === "23505") return { success: true as const }
    return { error: error.message }
  }

  revalidateFollowSurfaces()
  return { success: true as const }
}

export async function unfollowCategory(category: string) {
  const { user, supabase } = await requireAuth()
  const cat = category?.trim().toLowerCase()
  if (!cat) return { error: "Missing category." }

  const { error } = await supabase
    .from("member_category_follows")
    .delete()
    .eq("user_id", user.id)
    .eq("category", cat)

  if (error) return { error: error.message }

  revalidateFollowSurfaces()
  return { success: true as const }
}
