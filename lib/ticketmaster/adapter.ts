import { getDiscoveryScheduleConfig, isDiscoveryGeographyValid } from "@/lib/imports/geography"
import type { EventSourceAdapter } from "@/lib/imports/adapters/event-source-adapter"
import type { SourceHealth, SourcePage, SourceReadiness, SourceWindow } from "@/lib/imports/types"
import {
  fetchTicketmasterDiscoveryEvents,
  getTicketmasterDiscoveryConfigSummary,
} from "@/lib/ticketmaster/client"
import {
  getTicketmasterImportLookaheadDays,
  isTicketmasterImportConfigured,
  isTicketmasterImportEnabled,
  TICKETMASTER_SOURCE,
} from "@/lib/ticketmaster/env"
import { normalizeTicketmasterEvent } from "@/lib/ticketmaster/normalize"

export const ticketmasterSourceAdapter: EventSourceAdapter = {
  sourceKey: TICKETMASTER_SOURCE,

  async validateConfig(): Promise<SourceReadiness> {
    if (!isTicketmasterImportEnabled()) {
      return {
        ready: false,
        enabled: false,
        configured: isTicketmasterImportConfigured(),
        code: "disabled",
        message: "Ticketmaster import is disabled.",
      }
    }

    if (!isTicketmasterImportConfigured()) {
      return {
        ready: false,
        enabled: true,
        configured: false,
        code: "missing_credentials",
        message: "Ticketmaster import requires TICKETMASTER_API_KEY.",
      }
    }

    const schedule = getDiscoveryScheduleConfig()
    if (!schedule.discoveryEnabled || !isDiscoveryGeographyValid()) {
      return {
        ready: false,
        enabled: true,
        configured: true,
        code: "invalid_geography",
        message: "Discovery geography is disabled or invalid for this environment.",
      }
    }

    return { ready: true, enabled: true, configured: true }
  },

  async *fetchCandidates(input: SourceWindow): AsyncIterable<SourcePage> {
    const summary = await fetchTicketmasterDiscoveryEvents({
      rangeStartIso: input.rangeStartIso,
      rangeEndIso: input.rangeEndIso,
    })

    for (const cityResult of summary.cities) {
      if (cityResult.events.length === 0) continue

      yield {
        records: cityResult.events,
        pageNumber: cityResult.pagesFetched || 1,
        hasMore: false,
        metadata: {
          cityKey: cityResult.cityKey,
          cityQuery: cityResult.cityQuery,
          pagesFetched: cityResult.pagesFetched,
          errors: cityResult.errors,
        },
      }
    }

    if (summary.errors.length > 0) {
      yield {
        records: [],
        pageNumber: 0,
        hasMore: false,
        metadata: {
          partialErrors: summary.errors,
        },
      }
    }
  },

  normalize(record: unknown) {
    return normalizeTicketmasterEvent(record as Parameters<typeof normalizeTicketmasterEvent>[0])
  },

  async health(): Promise<SourceHealth> {
    const ready = await this.validateConfig()
    return {
      sourceKey: TICKETMASTER_SOURCE,
      ready,
      lastCheckedAt: new Date().toISOString(),
      details: {
        ...getTicketmasterDiscoveryConfigSummary(),
        lookaheadDays: getTicketmasterImportLookaheadDays(),
        apiKeyConfigured: isTicketmasterImportConfigured(),
      },
    }
  },
}
