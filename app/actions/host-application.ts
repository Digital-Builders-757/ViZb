"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin, requireAuth } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"

/**
 * Submit a host application (any authenticated user).
 */
export async function submitHostApplication(formData: FormData) {
  const { user } = await requireAuth()
  const supabase = await createClient()

  const orgName = formData.get("orgName") as string
  const orgType = (formData.get("orgType") as string) || "collective"
  const description = formData.get("description") as string
  const website = formData.get("website") as string
  const socialLinks = formData.get("socialLinks") as string

  if (!orgName?.trim()) {
    return { error: "Organization name is required" }
  }

  // Check if user already has a pending application
  const { data: existing } = await supabase
    .from("host_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .in("status", ["new", "reviewing"])
    .limit(1)
    .single()

  if (existing) {
    return { error: "You already have a pending application. Please wait for it to be reviewed." }
  }

  const { data: app, error } = await supabase
    .from("host_applications")
    .insert({
      user_id: user.id,
      org_name: orgName.trim(),
      org_type: orgType,
      description: description?.trim() || null,
      website: website?.trim() || null,
      social_links: socialLinks?.trim() || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/dashboard")

  return { success: true, applicationId: app.id }
}

/**
 * Review a host application (staff admin only).
 * Can approve or reject. On approve, creates the org + invite.
 */
export async function reviewHostApplication(formData: FormData) {
  const { supabase, user } = await requireAdmin()

  const applicationId = formData.get("applicationId") as string
  const action = formData.get("action") as "approve" | "reject"
  const staffNotes = formData.get("staffNotes") as string

  if (!applicationId || !action) {
    return { error: "Application ID and action are required" }
  }

  // Fetch the application
  const { data: application, error: fetchError } = await supabase
    .from("host_applications")
    .select("*")
    .eq("id", applicationId)
    .single()

  if (fetchError || !application) {
    return { error: "Application not found" }
  }

  if (application.status !== "new" && application.status !== "reviewing") {
    return { error: "This application has already been reviewed" }
  }

  if (action === "reject") {
    const { error } = await supabase
      .from("host_applications")
      .update({
        status: "rejected",
        staff_notes: staffNotes?.trim() || null,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId)

    if (error) return { error: error.message }

    revalidatePath("/admin")
    return { success: true, action: "rejected" }
  }

  // Approve: create org + invite
  const slug = application.org_name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Check slug uniqueness
  const { data: existingOrg } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single()

  const finalSlug = existingOrg ? `${slug}-${Date.now().toString(36)}` : slug

  // Create org
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: application.org_name,
      slug: finalSlug,
      description: application.description,
      type: application.org_type,
      status: "active",
    })
    .select("id, slug, name")
    .single()

  if (orgError) {
    return { error: `Failed to create org: ${orgError.message}` }
  }

  // Auto-add the applicant as org owner (no invite claim needed -- we know who they are)
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      org_id: org.id,
      user_id: application.user_id,
      role: "owner",
    })

  if (memberError) {
    return { error: `Org created but failed to add owner: ${memberError.message}` }
  }

  // Update application status
  const { error: updateError } = await supabase
    .from("host_applications")
    .update({
      status: "approved",
      staff_notes: staffNotes?.trim() || `Approved. Org created: ${org.slug}`,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)

  if (updateError) {
    return { error: `Org created but status update failed: ${updateError.message}` }
  }

  revalidatePath("/admin")
  revalidatePath("/dashboard")

  return {
    success: true,
    action: "approved",
    org,
  }
}
