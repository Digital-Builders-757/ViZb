"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service-role"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function adminDeleteUser(targetUserId: string) {
  const { user } = await requireAdmin()

  if (!targetUserId || !UUID_RE.test(targetUserId)) {
    return { error: "Invalid user id." }
  }

  if (targetUserId === user.id) {
    return { error: "You cannot delete your own account." }
  }

  const supabase = await createClient()
  const { data: target, error: profileError } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", targetUserId)
    .maybeSingle()

  if (profileError) {
    return { error: profileError.message }
  }

  if (!target) {
    return { error: "User not found." }
  }

  if (target.platform_role === "staff_admin") {
    return { error: "Staff admin accounts cannot be deleted from this panel." }
  }

  let service
  try {
    service = createServiceRoleClient()
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Missing service role configuration."
    return { error: msg }
  }

  const { error: deleteError } = await service.auth.admin.deleteUser(targetUserId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  revalidatePath("/admin")
  return { success: true as const }
}
