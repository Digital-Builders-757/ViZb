import { fetchOrganizationEvents } from "@/lib/eventbrite/client"
import {
  getEventbriteImportDefaultStatus,
  getEventbriteImportLookaheadDays,
  getEventbriteOrganizationId,
  isEventbriteImportConfigured,
  isEventbriteImportEnabled,
  EVENTBRITE_SOURCE,
} from "@/lib/eventbrite/env"
import {
  normalizeEventbriteEvent,
  toNormalizedEventCandidate,
} from "@/lib/imports/eventbrite-normalize"
import type { EventSourceAdapter } from "@/lib/imports/adapters/event-source-adapter"
import type { SourceHealth, SourcePage, SourceReadiness, SourceWindow } from "@/lib/imports/types"

export const eventbriteSourceAdapter: EventSourceAdapter = {
  sourceKey: EVENTBRITE_SOURCE,

  async validateConfig(): Promise<SourceReadiness> {
    if (!isEventbriteImportEnabled()) {
      return {
        ready: false,
        enabled: false,
        configured: isEventbriteImportConfigured(),
        code: "disabled",
        message: "Eventbrite import is disabled.",
      }
    }
    if (!isEventbriteImportConfigured()) {
      return {
        ready: false,
        enabled: true,
        configured: false,
        code: "missing_credentials",
        message:
          "Eventbrite import requires EVENTBRITE_PRIVATE_TOKEN and EVENTBRITE_ORGANIZATION_ID.",
      }
    }
    return { ready: true, enabled: true, configured: true }
  },

  async *fetchCandidates(input: SourceWindow): AsyncIterable<SourcePage> {
    const rawEvents = await fetchOrganizationEvents({
      organizationId: getEventbriteOrganizationId(),
      rangeStartIso: input.rangeStartIso,
      rangeEndIso: input.rangeEndIso,
    })

    yield {
      records: rawEvents,
      pageNumber: 1,
      hasMore: false,
    }
  },

  normalize(record: unknown) {
    const defaultStatus = getEventbriteImportDefaultStatus()
    const normalized = normalizeEventbriteEvent(
      record as Parameters<typeof normalizeEventbriteEvent>[0],
      defaultStatus,
    )
    if ("error" in normalized) return normalized
    return toNormalizedEventCandidate(normalized)
  },

  async health(): Promise<SourceHealth> {
    const ready = await this.validateConfig()
    return {
      sourceKey: EVENTBRITE_SOURCE,
      ready,
      lastCheckedAt: new Date().toISOString(),
      details: {
        lookaheadDays: getEventbriteImportLookaheadDays(),
        organizationIdConfigured: Boolean(getEventbriteOrganizationId()),
      },
    }
  },
}
