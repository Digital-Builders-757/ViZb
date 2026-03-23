"use server"

import { createClient } from "@/lib/supabase/server"
import { requireAdmin } from "@/lib/auth-helpers"
import { revalidatePath } from "next/cache"

/**
 * Create an org invite (staff admin only).
 * Creates the org if it doesn't exist, then generates an invite token.
 */
export async function createOrgWithInvite(formData: FormData) {
  const { supabase } = await requireAdmin()

  const orgName = formData.get("orgName") as string
  const orgType = (formData.get("orgType") as string) || "collective"
  const description = formData.get("description") as string
  const inviteEmail = formData.get("inviteEmail") as string
  const inviteRole = (formData.get("inviteRole") as string) || "owner"

  if (!orgName?.trim()) {
    return { error: "Organization name is required" }
  }

  // Generate slug
  const slug = orgName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  // Check slug uniqueness
  const { data: existing } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", slug)
    .single()

  if (existing) {
    return { error: `An organization with slug "${slug}" already exists` }
  }

  // Create the org (staff admin, so RLS allows insert)
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName.trim(),
      slug,
      description: description?.trim() || null,
      type: orgType,
      status: "active",
    })
    .select("id, slug, name")
    .single()

  if (orgError) {
    return { error: orgError.message }
  }

  // Create the invite token
  const { data: invite, error: inviteError } = await supabase
    .from("org_invites")
    .insert({
      org_id: org.id,
      email: inviteEmail?.trim() || null,
      role: inviteRole,
      created_by: (await supabase.auth.getUser()).data.user!.id,
    })
    .select("id, token")
    .single()

  if (inviteError) {
    return { error: inviteError.message }
  }

  revalidatePath("/admin")

  return {
    success: true,
    org,
    invite: {
      id: invite.id,
      token: invite.token,
      claimUrl: `/invite/claim?token=${invite.token}`,
    },
  }
}

/**
 * Create an invite for an existing org (staff admin only).
 */
export async function createInviteForOrg(formData: FormData) {
  const { supabase } = await requireAdmin()

  const orgId = formData.get("orgId") as string
  const email = formData.get("email") as string
  const role = (formData.get("role") as string) || "editor"

  if (!orgId) {
    return { error: "Organization ID is required" }
  }

  const { data: invite, error } = await supabase
    .from("org_invites")
    .insert({
      org_id: orgId,
      email: email?.trim() || null,
      role,
      created_by: (await supabase.auth.getUser()).data.user!.id,
    })
    .select("id, token")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")

  return {
    success: true,
    invite: {
      id: invite.id,
      token: invite.token,
      claimUrl: `/invite/claim?token=${invite.token}`,
    },
  }
}

/**
 * Claim an invite token (any authenticated user).
 * Calls the claim_invite RPC which runs as SECURITY DEFINER.
 */
export async function claimInvite(token: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be signed in to claim an invite" }
  }

  const { data, error } = await supabase.rpc("claim_invite", {
    invite_token: token,
  })

  if (error) {
    return { error: error.message }
  }

  // The RPC returns jsonb with either { error: "..." } or { success: true, org_id: "...", role: "..." }
  const result = data as { error?: string; success?: boolean; org_id?: string; role?: string }

  if (result.error) {
    return { error: result.error }
  }

  revalidatePath("/dashboard")

  return { success: true, orgId: result.org_id, role: result.role }
}

/**
 * Revoke (delete) an unclaimed invite (staff admin only).
 */
export async function revokeInvite(inviteId: string) {
  const { supabase } = await requireAdmin()

  const { error } = await supabase
    .from("org_invites")
    .delete()
    .eq("id", inviteId)
    .is("claimed_by", null)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  return { success: true }
}
