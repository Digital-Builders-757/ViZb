import type { SupabaseClient } from "@supabase/supabase-js"
import { EVENTBRITE_SOURCE } from "@/lib/eventbrite/env"
import { getEventbriteImportLookaheadDays } from "@/lib/eventbrite/env"
import { runSourceImport } from "@/lib/imports/run-source-import"
import type { ImportRunSummary, ImportTrigger } from "@/lib/imports/types"

export type EventbriteImportTrigger = ImportTrigger

/** @deprecated Use ImportRunSummary from lib/imports/types */
export type EventbriteImportSummary = ImportRunSummary & {
  skippedEvents?: number
}

type RunOptions = {
  trigger: EventbriteImportTrigger
  triggeredBy?: string | null
}

/**
 * Eventbrite import entry point — delegates to shared candidate ingestion (#266).
 * Writes to event_candidates, not events. Kept for existing API/cron routes.
 */
export async function runEventbriteImport(
  admin: SupabaseClient,
  options: RunOptions,
): Promise<EventbriteImportSummary> {
  const summary = await runSourceImport(admin, {
    sourceKey: EVENTBRITE_SOURCE,
    trigger: options.trigger,
    triggeredBy: options.triggeredBy,
    defaultLookaheadDays: getEventbriteImportLookaheadDays(),
  })

  return {
    ...summary,
    skippedEvents: summary.skippedRecords,
  }
}
