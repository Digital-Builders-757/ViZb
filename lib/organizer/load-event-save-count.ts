import type { SupabaseClient } from "@supabase/supabase-js"
import { logError } from "@/lib/log"

export async function loadEventSaveCount(
  supabase: SupabaseClient,
  eventId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("event_saves")
    .select("event_id", { count: "exact", head: true })
    .eq("event_id", eventId)

  if (error) {
    logError("organizer.insights", error, { op: "save_count", eventId })
    return 0
  }

  return count ?? 0
}
