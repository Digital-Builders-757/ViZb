import type { SupabaseClient } from "@supabase/supabase-js"

/** Default slug for the ViZb platform organization (staff-created events). Override with `PLATFORM_ORG_SLUG`. */
export const DEFAULT_PLATFORM_ORG_SLUG = "vizb"

export function getPlatformOrgSlug(): string {
  const fromEnv = process.env.PLATFORM_ORG_SLUG?.trim() || process.env.NEXT_PUBLIC_PLATFORM_ORG_SLUG?.trim()
  return fromEnv || DEFAULT_PLATFORM_ORG_SLUG
}

export type PlatformOrganization = {
  id: string
  name: string
  slug: string
}

/**
 * Resolve the platform org row (for admin “new event”). Returns null if no org matches the configured slug.
 */
export async function fetchPlatformOrganization(
  supabase: SupabaseClient,
): Promise<{ data: PlatformOrganization | null; error: string | null }> {
  const slug = getPlatformOrgSlug()
  const { data, error } = await supabase.from("organizations").select("id, name, slug").eq("slug", slug).maybeSingle()

  if (error) {
    return { data: null, error: error.message }
  }
  if (!data) {
    return { data: null, error: null }
  }
  return { data: data as PlatformOrganization, error: null }
}
