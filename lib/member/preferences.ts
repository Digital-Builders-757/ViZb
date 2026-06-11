import { isValidEventCategory, normalizeCategories } from "@/lib/events/categories"
import { isValidMemberHomeCity, type MemberHomeCityValue } from "@/lib/member/home-cities"

export type MemberPreferencesRow = {
  user_id: string
  home_cities: string[]
  categories: string[]
  reminder_opt_in: boolean
  email_reminders: boolean
  in_app_reminders: boolean
  onboarding_completed_at: string | null
  vibe_tags: string[]
}

export type MemberPreferencesSnapshot = {
  homeCities: MemberHomeCityValue[]
  categories: string[]
  reminderOptIn: boolean
  emailReminders: boolean
  inAppReminders: boolean
  onboardingCompletedAt: string | null
  vibeTags: string[]
}

export const EMPTY_MEMBER_PREFERENCES: MemberPreferencesSnapshot = {
  homeCities: [],
  categories: [],
  reminderOptIn: true,
  emailReminders: true,
  inAppReminders: true,
  onboardingCompletedAt: null,
  vibeTags: [],
}

export function mapMemberPreferencesRow(row: MemberPreferencesRow | null): MemberPreferencesSnapshot {
  if (!row) return { ...EMPTY_MEMBER_PREFERENCES }
  const homeCities = (row.home_cities ?? []).filter(isValidMemberHomeCity)
  return {
    homeCities,
    categories: normalizeCategories(row.categories),
    reminderOptIn: row.reminder_opt_in ?? true,
    emailReminders: row.email_reminders ?? true,
    inAppReminders: row.in_app_reminders ?? true,
    onboardingCompletedAt: row.onboarding_completed_at,
    vibeTags: normalizeCategories(row.vibe_tags),
  }
}

/** Meaningful onboarding = at least one home city and one category. */
export function hasMeaningfulMemberPreferences(prefs: MemberPreferencesSnapshot): boolean {
  return prefs.homeCities.length > 0 && prefs.categories.length > 0
}

export function needsMemberPreferenceOnboarding(prefs: MemberPreferencesSnapshot): boolean {
  return !prefs.onboardingCompletedAt || !hasMeaningfulMemberPreferences(prefs)
}

export function parseMemberHomeCitiesFromForm(formData: FormData): MemberHomeCityValue[] | null {
  const raw = formData
    .getAll("homeCities")
    .map((v) => String(v).trim())
    .filter(Boolean)
  const unique = [...new Set(raw)]
  if (unique.length === 0) return null
  for (const c of unique) {
    if (!isValidMemberHomeCity(c)) return null
  }
  return unique as MemberHomeCityValue[]
}

export function parseMemberCategoriesFromForm(formData: FormData): string[] | null {
  const raw = formData
    .getAll("categories")
    .map((v) => String(v).toLowerCase().trim())
    .filter(Boolean)
  const unique = [...new Set(raw)]
  if (unique.length === 0) return null
  for (const c of unique) {
    if (!isValidEventCategory(c)) return null
  }
  return unique
}

export function parseReminderOptIn(formData: FormData): boolean {
  return formData.get("reminderOptIn") === "on" || formData.get("reminderOptIn") === "true"
}

export function parseEmailReminders(formData: FormData): boolean {
  return formData.get("emailReminders") === "on" || formData.get("emailReminders") === "true"
}

export function parseInAppReminders(formData: FormData): boolean {
  return formData.get("inAppReminders") === "on" || formData.get("inAppReminders") === "true"
}
