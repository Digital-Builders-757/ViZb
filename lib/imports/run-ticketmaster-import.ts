import type { SupabaseClient } from "@supabase/supabase-js"
import { runSourceImport } from "@/lib/imports/run-source-import"
import type { ImportRunSummary, ImportTrigger } from "@/lib/imports/types"
import {
  getTicketmasterImportLookaheadDays,
  TICKETMASTER_SOURCE,
} from "@/lib/ticketmaster/env"

export type TicketmasterImportTrigger = ImportTrigger

export type TicketmasterImportSummary = ImportRunSummary

type RunOptions = {
  trigger: TicketmasterImportTrigger
  triggeredBy?: string | null
}

/** Ticketmaster import entry point — delegates to shared candidate ingestion (#267). */
export async function runTicketmasterImport(
  admin: SupabaseClient,
  options: RunOptions,
): Promise<TicketmasterImportSummary> {
  return runSourceImport(admin, {
    sourceKey: TICKETMASTER_SOURCE,
    trigger: options.trigger,
    triggeredBy: options.triggeredBy,
    defaultLookaheadDays: getTicketmasterImportLookaheadDays(),
  })
}
