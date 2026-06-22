import type { SupabaseClient } from "@supabase/supabase-js"

export type OverlapCheckResult =
  | { blocked: false }
  | { blocked: true; runId: string; startedAt: string }

/**
 * Prevent overlapping import runs for the same source (#268).
 * Queries event_import_runs for status = running.
 */
export async function findOverlappingImportRun(
  admin: SupabaseClient,
  sourceKey: string,
): Promise<OverlapCheckResult> {
  const { data, error } = await admin
    .from("event_import_runs")
    .select("id, started_at")
    .eq("source", sourceKey)
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return { blocked: false }
  }

  return {
    blocked: true,
    runId: data.id as string,
    startedAt: data.started_at as string,
  }
}
