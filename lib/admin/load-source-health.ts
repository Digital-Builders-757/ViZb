import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"
import { listEventSourcesWithReadiness, type EventSourceListItem } from "@/lib/imports/source-readiness"

export type SourceHealthPanelResult = {
  sources: EventSourceListItem[]
  serviceRoleConfigured: boolean
  error: string | null
}

export async function loadSourceHealthPanel(): Promise<SourceHealthPanelResult> {
  if (!isServiceRoleConfigured()) {
    return { sources: [], serviceRoleConfigured: false, error: null }
  }

  try {
    const admin = createServiceRoleClient()
    const sources = await listEventSourcesWithReadiness(admin)
    const registered = sources.filter((source) =>
      ["ticketmaster", "eventbrite"].includes(source.source_key),
    )
    return { sources: registered, serviceRoleConfigured: true, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load source health."
    return { sources: [], serviceRoleConfigured: true, error: message }
  }
}
