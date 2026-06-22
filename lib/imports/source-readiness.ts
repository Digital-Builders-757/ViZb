import type { SupabaseClient } from "@supabase/supabase-js"
import { listRegisteredAdapters } from "@/lib/imports/adapters/registry"
import type { SourceHealth, SourceReadiness } from "@/lib/imports/types"

export type EventSourceListItem = {
  source_key: string
  display_name: string
  source_type: string
  description: string | null
  enabled_in_db: boolean
  default_cadence_hours: number | null
  attribution_label: string | null
  last_success_at: string | null
  last_failure_at: string | null
  last_error_summary: string | null
  consecutive_failures: number
  env_readiness: SourceReadiness | null
}

export async function listEventSourcesWithReadiness(
  admin: SupabaseClient,
): Promise<EventSourceListItem[]> {
  const { data: rows, error } = await admin
    .from("event_sources")
    .select(
      "source_key, display_name, source_type, description, enabled_in_db, default_cadence_hours, attribution_label, last_success_at, last_failure_at, last_error_summary, consecutive_failures",
    )
    .order("source_key")

  if (error) {
    throw new Error(error.message)
  }

  const adapters = new Map(
    listRegisteredAdapters().map((adapter) => [adapter.sourceKey, adapter]),
  )

  const items: EventSourceListItem[] = []

  for (const row of rows ?? []) {
    const sourceKey = row.source_key as string
    const adapter = adapters.get(sourceKey)
    const envReadiness = adapter ? await adapter.validateConfig() : null

    items.push({
      source_key: sourceKey,
      display_name: row.display_name as string,
      source_type: row.source_type as string,
      description: (row.description as string | null) ?? null,
      enabled_in_db: Boolean(row.enabled_in_db),
      default_cadence_hours: (row.default_cadence_hours as number | null) ?? null,
      attribution_label: (row.attribution_label as string | null) ?? null,
      last_success_at: (row.last_success_at as string | null) ?? null,
      last_failure_at: (row.last_failure_at as string | null) ?? null,
      last_error_summary: (row.last_error_summary as string | null) ?? null,
      consecutive_failures: (row.consecutive_failures as number) ?? 0,
      env_readiness: envReadiness,
    })
  }

  return items
}

export async function getSourceHealth(sourceKey: string): Promise<SourceHealth | null> {
  const adapters = listRegisteredAdapters()
  const adapter = adapters.find((a) => a.sourceKey === sourceKey)
  if (!adapter) return null
  return adapter.health()
}
