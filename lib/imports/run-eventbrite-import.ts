import type { SupabaseClient } from "@supabase/supabase-js"
import { fetchOrganizationEvents } from "@/lib/eventbrite/client"
import {
  assertEventbriteImportConfigured,
  EventbriteImportConfigError,
  getEventbriteImportDefaultStatus,
  getEventbriteImportLookaheadDays,
  getEventbriteOrganizationId,
  isEventbriteImportEnabled,
  EVENTBRITE_SOURCE,
} from "@/lib/eventbrite/env"
import {
  isLikelyDuplicateEvent,
  normalizeEventbriteEvent,
} from "@/lib/imports/eventbrite-normalize"
import { buildEventbriteUpsertPlan, type ExistingImportedEventRow } from "@/lib/imports/eventbrite-upsert"
import { logError } from "@/lib/log"
import { fetchPlatformOrganization } from "@/lib/orgs/platform-org"
import { slugify } from "@/lib/utils"

export type EventbriteImportTrigger = "manual" | "cron"

export type EventbriteImportSummary = {
  ok: boolean
  skipped?: boolean
  reason?: string
  runId?: string
  found: number
  created: number
  updated: number
  skippedEvents: number
  errors: string[]
}

type RunOptions = {
  trigger: EventbriteImportTrigger
  triggeredBy?: string | null
}

async function uniqueSlugForOrg(
  admin: SupabaseClient,
  orgId: string,
  title: string,
): Promise<string> {
  let slug = slugify(title)
  if (!slug) slug = `event-${Date.now()}`

  const { data: existing } = await admin
    .from("events")
    .select("slug")
    .eq("org_id", orgId)
    .eq("slug", slug)
    .maybeSingle()

  if (existing) {
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`
  }
  return slug
}

export async function runEventbriteImport(
  admin: SupabaseClient,
  options: RunOptions,
): Promise<EventbriteImportSummary> {
  const errors: string[] = []
  let found = 0
  let created = 0
  let updated = 0
  let skippedEvents = 0

  if (!isEventbriteImportEnabled()) {
    return {
      ok: true,
      skipped: true,
      reason: "disabled",
      found: 0,
      created: 0,
      updated: 0,
      skippedEvents: 0,
      errors: [],
    }
  }

  try {
    assertEventbriteImportConfigured()
  } catch (err) {
    if (err instanceof EventbriteImportConfigError) {
      return {
        ok: false,
        reason: err.code,
        found: 0,
        created: 0,
        updated: 0,
        skippedEvents: 0,
        errors: [err.message],
      }
    }
    throw err
  }

  const defaultStatus = getEventbriteImportDefaultStatus()
  const lookaheadDays = getEventbriteImportLookaheadDays()
  const now = new Date()
  const rangeEnd = new Date(now)
  rangeEnd.setUTCDate(rangeEnd.getUTCDate() + lookaheadDays)

  const { data: runRow, error: runInsertError } = await admin
    .from("event_import_runs")
    .insert({
      source: EVENTBRITE_SOURCE,
      status: "running",
      metadata: { trigger: options.trigger, triggered_by: options.triggeredBy ?? null },
    })
    .select("id")
    .single()

  if (runInsertError || !runRow) {
    return {
      ok: false,
      found: 0,
      created: 0,
      updated: 0,
      skippedEvents: 0,
      errors: [runInsertError?.message ?? "Failed to create import run."],
    }
  }

  const runId = runRow.id as string

  const finishRun = async (status: "completed" | "failed", errorMessage: string | null) => {
    await admin
      .from("event_import_runs")
      .update({
        status,
        finished_at: new Date().toISOString(),
        events_found: found,
        events_created: created,
        events_updated: updated,
        events_skipped: skippedEvents,
        error_message: errorMessage,
        metadata: {
          trigger: options.trigger,
          triggered_by: options.triggeredBy ?? null,
          errors: errors.slice(0, 50),
        },
      })
      .eq("id", runId)
  }

  try {
    const { data: platformOrg, error: platformOrgError } = await fetchPlatformOrganization(admin)
    if (platformOrgError || !platformOrg) {
      const msg = platformOrgError ?? "Platform organization not found."
      errors.push(msg)
      await finishRun("failed", msg)
      return {
        ok: false,
        runId,
        found,
        created,
        updated,
        skippedEvents,
        errors,
      }
    }

    const rawEvents = await fetchOrganizationEvents({
      organizationId: getEventbriteOrganizationId(),
      rangeStartIso: now.toISOString(),
      rangeEndIso: rangeEnd.toISOString(),
    })
    found = rawEvents.length

    const { data: existingImported } = await admin
      .from("events")
      .select(
        "id, source_event_id, status, slug, title, starts_at, city, venue_name, source_payload",
      )
      .eq("source", EVENTBRITE_SOURCE)

    const bySourceId = new Map<string, ExistingImportedEventRow>()
    for (const row of existingImported ?? []) {
      const sid = String(row.source_event_id ?? "").trim()
      if (!sid) continue
      const payload = row.source_payload as Record<string, unknown> | null
      const hash =
        payload && typeof payload.source_payload_hash === "string"
          ? payload.source_payload_hash
          : null
      bySourceId.set(sid, {
        id: row.id as string,
        status: row.status as string,
        slug: row.slug as string,
        source_payload_hash: hash,
        title: row.title as string,
        starts_at: row.starts_at as string,
        city: row.city as string,
        venue_name: row.venue_name as string,
      })
    }

    for (const raw of rawEvents) {
      const normalized = normalizeEventbriteEvent(raw, defaultStatus)
      if ("error" in normalized) {
        errors.push(normalized.error)
        skippedEvents += 1
        continue
      }

      const candidate = normalized
      const existing = bySourceId.get(candidate.source_event_id) ?? null

      if (!existing) {
        const { data: dupCandidates } = await admin
          .from("events")
          .select("id, title, starts_at, city, venue_name, status, slug, source_payload")
          .eq("org_id", platformOrg.id)
          .eq("starts_at", candidate.starts_at)
          .is("source", null)

        const duplicate = (dupCandidates ?? []).find((row) =>
          isLikelyDuplicateEvent(candidate, {
            title: row.title as string,
            starts_at: row.starts_at as string,
            city: row.city as string,
            venue_name: row.venue_name as string,
          }),
        )

        if (duplicate) {
          skippedEvents += 1
          errors.push(`Skipped duplicate of existing event "${duplicate.title}".`)
          continue
        }
      }

      const slug = existing?.slug ?? await uniqueSlugForOrg(admin, platformOrg.id, candidate.title)
      const payloadWithHash = {
        ...candidate.source_payload,
        source_payload_hash: candidate.source_payload_hash,
      }

      const plan = buildEventbriteUpsertPlan(
        { ...candidate, source_payload: payloadWithHash },
        existing
          ? {
              ...existing,
              source_payload_hash: candidate.source_payload_hash,
            }
          : null,
        slug,
        platformOrg.id,
      )

      if (plan.action === "skip") {
        skippedEvents += 1
        continue
      }

      if (plan.action === "insert") {
        const { error: insertError } = await admin.from("events").insert({
          ...plan.row,
          source_payload: payloadWithHash,
          updated_at: new Date().toISOString(),
        })
        if (insertError) {
          errors.push(insertError.message)
          skippedEvents += 1
        } else {
          created += 1
        }
        continue
      }

      const { error: updateError } = await admin
        .from("events")
        .update({
          ...plan.patch,
          source_payload: payloadWithHash,
          updated_at: new Date().toISOString(),
        })
        .eq("id", plan.id)

      if (updateError) {
        errors.push(updateError.message)
        skippedEvents += 1
      } else {
        updated += 1
      }
    }

    await finishRun("completed", errors.length > 0 ? errors.slice(0, 3).join("; ") : null)

    return {
      ok: true,
      runId,
      found,
      created,
      updated,
      skippedEvents,
      errors,
    }
  } catch (err) {
    logError("eventbrite.import", err)
    const msg = err instanceof Error ? err.message : "Import failed."
    errors.push(msg)
    await finishRun("failed", msg)
    return {
      ok: false,
      runId,
      found,
      created,
      updated,
      skippedEvents,
      errors,
    }
  }
}
