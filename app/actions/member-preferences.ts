"use server"

import { requireAuth } from "@/lib/auth-helpers"
import {
  parseEmailReminders,
  parseInAppReminders,
  parseMemberCategoriesFromForm,
  parseMemberHomeCitiesFromForm,
  parseReminderOptIn,
} from "@/lib/member/preferences"
import { revalidatePath } from "next/cache"

export type MemberPreferencesState = {
  error: string | null
  success: boolean
}

export async function saveMemberPreferences(
  _prev: MemberPreferencesState,
  formData: FormData,
): Promise<MemberPreferencesState> {
  const homeCities = parseMemberHomeCitiesFromForm(formData)
  const categories = parseMemberCategoriesFromForm(formData)

  if (!homeCities) {
    return { error: "Pick at least one home city or region.", success: false }
  }
  if (!categories) {
    return { error: "Pick at least one event category you care about.", success: false }
  }

  const reminderOptIn = parseReminderOptIn(formData)
  const emailReminders = reminderOptIn && parseEmailReminders(formData)
  const inAppReminders = reminderOptIn && parseInAppReminders(formData)

  const { supabase, user } = await requireAuth()

  const payload = {
    user_id: user.id,
    home_cities: homeCities,
    categories,
    reminder_opt_in: reminderOptIn,
    email_reminders: emailReminders,
    in_app_reminders: inAppReminders,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from("member_preferences").upsert(payload, { onConflict: "user_id" })

  if (error) {
    return { error: error.message, success: false }
  }

  revalidatePath("/dashboard")
  revalidatePath("/profile")
  return { error: null, success: true }
}
