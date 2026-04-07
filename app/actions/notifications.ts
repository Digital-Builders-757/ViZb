"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin, requireAuth } from "@/lib/auth-helpers"

function revalidateDashboardSurfaces() {
  revalidatePath("/dashboard")
  revalidatePath("/profile")
  revalidatePath("/admin")
  revalidatePath("/organizer")
}

/** Idempotent: rows already read stay unchanged; only NULL read_at rows update. */
export async function markAllNotificationsRead() {
  const { user, supabase } = await requireAuth()

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("user_id", user.id)
    .is("read_at", null)

  if (error) return { error: error.message }

  revalidateDashboardSurfaces()
  return { success: true as const }
}

/** Idempotent: setting read_at when already set is a no-op at the UI level. */
export async function markNotificationRead(notificationId: string) {
  const { user, supabase } = await requireAuth()

  const id = notificationId?.trim()
  if (!id) return { error: "Missing notification." }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from("user_notifications")
    .update({ read_at: now })
    .eq("id", id)
    .eq("user_id", user.id)

  if (error) return { error: error.message }

  revalidateDashboardSurfaces()
  return { success: true as const }
}

/** Staff-only: insert one unread notification for the current admin (QA / demos). */
export async function seedStaffTestNotification() {
  const { user, supabase } = await requireAdmin()

  const { data, error } = await supabase
    .from("user_notifications")
    .insert({
      user_id: user.id,
      title: "[QA] Test notification",
      body: "Seed from Admin — use the bell to verify unread count, single-row read, and mark all read.",
      href: "/dashboard",
    })
    .select("id")
    .single()

  if (error) return { error: error.message }

  revalidateDashboardSurfaces()
  return { success: true as const, id: data.id as string }
}
