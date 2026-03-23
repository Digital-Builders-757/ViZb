"use server"

import { requireAdmin } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"

/**
 * Create an organization (staff admin only).
 * Self-serve org creation is disabled. Use host applications + invite flow instead.
 */
export async function createOrganization(formData: FormData) {
  const { supabase } = await requireAdmin()

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const orgType = (formData.get("orgType") as string) || "collective"

  if (!name?.trim()) {
    return { error: "Organization name is required" }
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single()

  if (existing) {
    return { error: `Slug "${slug}" is already taken. Try a different name.` }
  }

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: name.trim(),
      slug,
      description: description?.trim() || null,
      type: orgType,
      status: "active",
    })
    .select("id, slug")
    .single()

  if (orgError) {
    return { error: orgError.message }
  }

  revalidatePath("/admin")
  return { success: true, org }
}
