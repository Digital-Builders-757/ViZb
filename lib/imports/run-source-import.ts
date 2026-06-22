import type { SupabaseClient } from "@supabase/supabase-js"
import { getRegisteredAdapter } from "@/lib/imports/adapters/registry"
import { upsertCandidate } from "@/lib/imports/candidate-repository"
import { buildDiscoveryDateWindow } from "@/lib/imports/geography/date-window"
import { findOverlappingImportRun } from "@/lib/imports/geography/run-lock"
import { getIngestionEnvironment } from "@/lib/imports/source-env"
import type { ImportRunSummary, RunSourceImportOptions, SourceWindow } from "@/lib/imports/types"
import { logError, logWarn } from "@/lib/log"

async function isSourceEnabledInDb(
  admin: SupabaseClient,
  sourceKey: string,
): Promise<boolean> {
  const { data, error } = await admin
    .from("event_sources")
    .select("enabled_in_db")
    .eq("source_key", sourceKey)
    .maybeSingle()

  if (error || !data) return false
  return Boolean(data.enabled_in_db)
}

async function updateSourceHealth(
  admin: SupabaseClient,
  sourceKey: string,
  success: boolean,
  errorSummary: string | null,
): Promise<string | null> {
  const now = new Date().toISOString()

  if (success) {
    const { error } = await admin
      .from("event_sources")
      .update({
        last_success_at: now,
        last_error_summary: null,
        consecutive_failures: 0,
        updated_at: now,
      })
      .eq("source_key", sourceKey)
    return error?.message ?? null
  }

  const { data: current } = await admin
    .from("event_sources")
    .select("consecutive_failures")
    .eq("source_key", sourceKey)
    .maybeSingle()

  const failures = ((current?.consecutive_failures as number | undefined) ?? 0) + 1

  const { error } = await admin
    .from("event_sources")
    .update({
      last_failure_at: now,
      last_error_summary: errorSummary?.slice(0, 500) ?? "Import failed.",
      consecutive_failures: failures,
      updated_at: now,
    })
    .eq("source_key", sourceKey)

  return error?.message ?? null
}

function defaultWindow(lookaheadDays: number): SourceWindow {
  const window = buildDiscoveryDateWindow({ lookaheadDays })
  return {
    rangeStartIso: window.rangeStartIso,
    rangeEndIso: window.rangeEndIso,
    metadata: {
      timezone: window.timezone,
      pastEventGraceDays: window.pastEventGraceDays,
    },
  }
}

export async function runSourceImport(
  admin: SupabaseClient,
  options: RunSourceImportOptions & { defaultLookaheadDays?: number },
): Promise<ImportRunSummary> {
  const { sourceKey, trigger, triggeredBy } = options
  const errors: string[] = []
  let found = 0
  let created = 0
  let updated = 0
  let skippedRecords = 0

  const adapter = getRegisteredAdapter(sourceKey)
  if (!adapter) {
    return {
      ok: false,
      reason: "not_registered",
      sourceKey,
      found: 0,
      created: 0,
      updated: 0,
      skippedRecords: 0,
      errors: [`Unknown ingestion source: ${sourceKey}`],
    }
  }

  const readiness = await adapter.validateConfig()
  if (!readiness.ready) {
    return {
      ok: readiness.enabled === false,
      skipped: readiness.enabled === false,
      reason: readiness.code,
      sourceKey,
      found: 0,
      created: 0,
      updated: 0,
      skippedRecords: 0,
      errors: readiness.message ? [readiness.message] : [],
    }
  }

  const enabledInDb = await isSourceEnabledInDb(admin, sourceKey)
  if (!enabledInDb) {
    logWarn(`imports.run.${sourceKey}`, "Source not enabled in event_sources registry.", {
      sourceKey,
    })
    return {
      ok: false,
      skipped: true,
      reason: "registry_disabled",
      sourceKey,
      found: 0,
      created: 0,
      updated: 0,
      skippedRecords: 0,
      errors: [`Source ${sourceKey} is not enabled in the event_sources registry.`],
    }
  }

  const overlap = await findOverlappingImportRun(admin, sourceKey)
  if (overlap.blocked) {
    logWarn(`imports.run.${sourceKey}`, "Import skipped — overlapping run in progress.", {
      sourceKey,
      runId: overlap.runId,
    })
    return {
      ok: false,
      skipped: true,
      reason: "overlap_in_progress",
      sourceKey,
      found: 0,
      created: 0,
      updated: 0,
      skippedRecords: 0,
      errors: [`Import already running for ${sourceKey} (run ${overlap.runId}).`],
    }
  }

  const window =
    options.window ??
    defaultWindow(options.defaultLookaheadDays ?? 90)

  const environment = getIngestionEnvironment()

  const { data: runRow, error: runInsertError } = await admin
    .from("event_import_runs")
    .insert({
      source: sourceKey,
      status: "running",
      environment,
      trigger_type: trigger,
      window_start: window.rangeStartIso,
      window_end: window.rangeEndIso,
      metadata: { trigger, triggered_by: triggeredBy ?? null },
    })
    .select("id")
    .single()

  if (runInsertError || !runRow) {
    return {
      ok: false,
      sourceKey,
      found: 0,
      created: 0,
      updated: 0,
      skippedRecords: 0,
      errors: [runInsertError?.message ?? "Failed to create import run."],
    }
  }

  const runId = runRow.id as string

  const finalizeImportRun = async (
    status: "completed" | "failed",
    errorMessage: string | null,
  ): Promise<{ ok: true } | { ok: false; message: string }> => {
    const { error: runUpdateError } = await admin
      .from("event_import_runs")
      .update({
        status,
        finished_at: new Date().toISOString(),
        events_found: found,
        events_created: created,
        events_updated: updated,
        events_skipped: skippedRecords,
        candidates_found: found,
        candidates_created: created,
        candidates_updated: updated,
        candidates_skipped: skippedRecords,
        error_message: errorMessage,
        metadata: {
          trigger,
          triggered_by: triggeredBy ?? null,
          errors: errors.slice(0, 50),
        },
      })
      .eq("id", runId)

    if (runUpdateError) {
      return { ok: false, message: runUpdateError.message }
    }

    const healthError = await updateSourceHealth(
      admin,
      sourceKey,
      status === "completed" && errors.length === 0,
      errorMessage,
    )

    if (healthError) {
      return { ok: false, message: `Source health update failed: ${healthError}` }
    }

    return { ok: true }
  }

  try {
    for await (const page of adapter.fetchCandidates(window)) {
      for (const record of page.records) {
        found += 1
        const normalized = adapter.normalize(record)
        if ("error" in normalized) {
          errors.push(normalized.error)
          skippedRecords += 1
          continue
        }

        try {
          const outcome = await upsertCandidate(admin, normalized, runId)
          if (outcome.action === "created") created += 1
          else if (outcome.action === "updated") updated += 1
          else {
            skippedRecords += 1
            if (outcome.reason) {
              logWarn(`imports.candidate.upsert`, outcome.reason, {
                sourceKey,
                sourceEventId: normalized.source_event_id,
              })
            }
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Candidate upsert failed."
          errors.push(msg)
          skippedRecords += 1
          logError(`imports.candidate.upsert`, err, { sourceKey })
        }
      }
    }

    const finalize = await finalizeImportRun(
      "completed",
      errors.length > 0 ? errors.slice(0, 3).join("; ") : null,
    )

    if (!finalize.ok) {
      logError(`imports.run.${sourceKey}`, new Error(finalize.message), { runId, sourceKey })
      errors.push(`Import run finalize failed: ${finalize.message}`)
      return {
        ok: false,
        reason: "run_finalize_failed",
        runId,
        sourceKey,
        found,
        created,
        updated,
        skippedRecords,
        errors,
      }
    }

    return {
      ok: true,
      runId,
      sourceKey,
      found,
      created,
      updated,
      skippedRecords,
      errors,
    }
  } catch (err) {
    logError(`imports.run.${sourceKey}`, err)
    const msg = err instanceof Error ? err.message : "Import failed."
    errors.push(msg)
    const finalize = await finalizeImportRun("failed", msg)
    if (!finalize.ok) {
      logError(`imports.run.${sourceKey}`, new Error(finalize.message), { runId, sourceKey })
      errors.push(`Import run finalize failed: ${finalize.message}`)
    }
    return {
      ok: false,
      runId,
      sourceKey,
      found,
      created,
      updated,
      skippedRecords,
      errors,
    }
  }
}
