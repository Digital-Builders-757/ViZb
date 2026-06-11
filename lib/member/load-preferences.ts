import type { SupabaseClient } from "@supabase/supabase-js"
import { logError } from "@/lib/log"
import {
  mapMemberPreferencesRow,
  type MemberPreferencesRow,
  type MemberPreferencesSnapshot,
} from "@/lib/member/preferences"

const SELECT =
  "user_id, home_cities, categories, reminder_opt_in, email_reminders, in_app_reminders, onboarding_completed_at, vibe_tags"

export async function fetchMemberPreferences(
  supabase: SupabaseClient,
  userId: string,
): Promise<MemberPreferencesSnapshot> {
  const { data, error } = await supabase
    .from("member_preferences")
    .select(SELECT)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    logError("member.preferences", error, { op: "fetch" })
    return mapMemberPreferencesRow(null)
  }

  return mapMemberPreferencesRow((data as MemberPreferencesRow | null) ?? null)
}
