import type { MemberPreferencesSnapshot } from "@/lib/member/preferences"

export type ProfileCompletionProfile = {
  display_name?: string | null
  avatar_url?: string | null
}

export type ProfileCompletionRequirementKey = "displayName" | "avatar" | "homeCities" | "categories"

export type ProfileCompletionRequirement = {
  key: ProfileCompletionRequirementKey
  label: string
  complete: boolean
}

export type ProfileCompletionResult = {
  pct: number
  label: string
  requirements: ProfileCompletionRequirement[]
  missingFields: string[]
}

export function calculateProfileCompletion(
  profile: ProfileCompletionProfile,
  preferences: Pick<MemberPreferencesSnapshot, "homeCities" | "categories">,
): ProfileCompletionResult {
  const requirements: ProfileCompletionRequirement[] = [
    {
      key: "displayName",
      label: "Display name",
      complete: Boolean(profile.display_name?.trim()),
    },
    {
      key: "avatar",
      label: "Profile picture",
      complete: Boolean(profile.avatar_url?.trim()),
    },
    {
      key: "homeCities",
      label: "Home city",
      complete: preferences.homeCities.length > 0,
    },
    {
      key: "categories",
      label: "Event interests",
      complete: preferences.categories.length > 0,
    },
  ]

  const completedCount = requirements.filter((r) => r.complete).length
  const pct = Math.round((completedCount / requirements.length) * 100)
  const missingFields = requirements.filter((r) => !r.complete).map((r) => r.label)

  return {
    pct,
    label: pct >= 100 ? "Profile complete" : completedCount > 0 ? "Almost tuned in" : "Set up your vibe",
    requirements,
    missingFields,
  }
}
