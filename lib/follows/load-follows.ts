import type { SupabaseClient } from "@supabase/supabase-js"
import { logError } from "@/lib/log"
import { normalizeCategories } from "@/lib/events/categories"

export type MemberFollowSnapshot = {
  followedOrgIds: string[]
  followedCategories: string[]
}

export async function fetchMemberFollows(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberFollowSnapshot> {
  const [orgsRes, catsRes] = await Promise.all([
    supabase.from("organization_follows").select("org_id").eq("user_id", userId),
    supabase.from("member_category_follows").select("category").eq("user_id", userId),
  ])

  if (orgsRes.error) logError("follows.load", orgsRes.error, { op: "orgs" })
  if (catsRes.error) logError("follows.load", catsRes.error, { op: "cats" })

  return {
    followedOrgIds: (orgsRes.data ?? []).map((r) => r.org_id as string),
    followedCategories: normalizeCategories(
      (catsRes.data ?? []).map((r) => r.category as string),
    ),
  }
}

export async function isFollowingOrganizer(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("organization_follows")
    .select("org_id")
    .eq("user_id", userId)
    .eq("org_id", orgId)
    .maybeSingle()

  if (error) {
    logError("follows.check", error, { orgId })
    return false
  }
  return Boolean(data)
}
