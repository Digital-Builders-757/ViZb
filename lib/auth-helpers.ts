import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

/**
 * Get the current authenticated user or redirect to login.
 * Use in Server Components and Server Actions.
 */
export async function requireAuth() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return { supabase, user }
}

/**
 * Get the current user's profile from the profiles table.
 * Single fetch -- returns supabase, user, and profile in one call.
 */
export async function getProfile() {
  const { supabase, user } = await requireAuth()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, platform_role, role_admin")
    .eq("id", user.id)
    .single()

  return { supabase, user, profile }
}

/**
 * Check if current user is a staff admin using platform_role enum.
 * Non-redirecting -- returns boolean.
 */
export async function isStaffAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from("profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single()

  return profile?.platform_role === "staff_admin"
}

/**
 * Require the user to be a staff admin (platform_role = 'staff_admin').
 * Redirects to /dashboard if not admin.
 */
export async function requireAdmin() {
  const { supabase, user, profile } = await getProfile()

  if (profile?.platform_role !== "staff_admin") {
    redirect("/dashboard")
  }

  return { supabase, user, profile }
}

/**
 * Require the user to be a member of a specific organization.
 * Staff admins can access any org. Redirects to /dashboard if not authorized.
 */
export async function requireOrgMember(orgSlug: string) {
  const { supabase, user, profile } = await getProfile()

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, slug, status, type, description, logo_url")
    .eq("slug", orgSlug)
    .single()

  if (!org) {
    redirect("/dashboard")
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("*")
    .eq("org_id", org.id)
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    // Staff admins can access any org
    if (profile?.platform_role === "staff_admin") {
      return { supabase, user, profile, org, membership: { role: "admin" as const, org_id: org.id, user_id: user.id } }
    }
    redirect("/dashboard")
  }

  return { supabase, user, profile, org, membership }
}

/**
 * Get the user's organizations (all orgs they are a member of).
 * Reuses getProfile() to avoid a redundant auth.getUser() call.
 */
export async function getUserOrganizations() {
  const { supabase, user, profile } = await getProfile()

  const { data: memberships } = await supabase
    .from("organization_members")
    .select(`
      role,
      organization:organizations!org_id (
        id, name, slug, status, logo_url
      )
    `)
    .eq("user_id", user.id)

  return { supabase, user, profile, memberships: memberships ?? [] }
}
