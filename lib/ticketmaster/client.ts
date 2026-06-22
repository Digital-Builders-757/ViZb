import {
  getDiscoveryScheduleConfig,
  getEnabledDiscoveryCities,
  isDiscoveryGeographyValid,
} from "@/lib/imports/geography"
import {
  assertPageWithinLimit,
  assertRecordWithinLimit,
  shouldStopPagination,
} from "@/lib/imports/geography/limits"
import {
  getTicketmasterApiKey,
  getTicketmasterImportMaxPages,
  getTicketmasterImportMaxRecords,
  getTicketmasterImportPageSize,
  redactTicketmasterSecrets,
  TICKETMASTER_DISCOVERY_BASE,
} from "@/lib/ticketmaster/env"
import type {
  TicketmasterCitySearchResult,
  TicketmasterEvent,
  TicketmasterEventsPage,
  TicketmasterFetchOptions,
  TicketmasterFetchSummary,
} from "@/lib/ticketmaster/types"

export class TicketmasterApiError extends Error {
  readonly status: number
  readonly body: string

  constructor(status: number, message: string, body: string) {
    super(redactTicketmasterSecrets(message))
    this.name = "TicketmasterApiError"
    this.status = status
    this.body = redactTicketmasterSecrets(body)
  }
}

const REQUEST_TIMEOUT_MS = 20_000
const MIN_REQUEST_INTERVAL_MS = 250

let lastRequestAt = 0

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function paceRequests(): Promise<void> {
  const elapsed = Date.now() - lastRequestAt
  if (elapsed < MIN_REQUEST_INTERVAL_MS) {
    await sleep(MIN_REQUEST_INTERVAL_MS - elapsed)
  }
  lastRequestAt = Date.now()
}

function formatTicketmasterDateTime(iso: string): string {
  return iso.replace(/\.\d{3}Z$/, "Z")
}

async function ticketmasterFetch(url: string, attempt = 0): Promise<Response> {
  await paceRequests()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    })

    if (res.status === 429 && attempt < 3) {
      const retryAfter = Number(res.headers.get("retry-after") || "2")
      await sleep(Math.min(30, Math.max(1, retryAfter)) * 1000)
      return ticketmasterFetch(url, attempt + 1)
    }

    if (res.status >= 500 && attempt < 3) {
      await sleep(500 * (attempt + 1))
      return ticketmasterFetch(url, attempt + 1)
    }

    return res
  } finally {
    clearTimeout(timeout)
  }
}

function buildEventsUrl(opts: {
  cityQuery: string
  stateCode: string
  countryCode: string
  rangeStartIso: string
  rangeEndIso: string
  page: number
  size: number
}): string {
  const apiKey = getTicketmasterApiKey()
  const params = new URLSearchParams({
    apikey: apiKey,
    city: opts.cityQuery,
    stateCode: opts.stateCode,
    countryCode: opts.countryCode,
    startDateTime: formatTicketmasterDateTime(opts.rangeStartIso),
    endDateTime: formatTicketmasterDateTime(opts.rangeEndIso),
    sort: "date,asc",
    size: String(opts.size),
    page: String(opts.page),
  })

  return `${TICKETMASTER_DISCOVERY_BASE}/events.json?${params.toString()}`
}

async function fetchCityEvents(opts: {
  cityKey: string
  cityQuery: string
  stateCode: string
  countryCode: string
  rangeStartIso: string
  rangeEndIso: string
  maxRecordsRemaining: number
  onProgress?: TicketmasterFetchOptions["onProgress"]
}): Promise<TicketmasterCitySearchResult> {
  const pageSize = getTicketmasterImportPageSize()
  const maxPages = getTicketmasterImportMaxPages()
  const events: TicketmasterEvent[] = []
  const errors: string[] = []
  let page = 0
  let pagesFetched = 0
  let hasMore = true

  while (hasMore) {
    const pageNumber = page + 1
    const pageGuard = assertPageWithinLimit(pageNumber, pageSize)
    if (!pageGuard.allowed) {
      errors.push(pageGuard.reason)
      break
    }

    const recordGuard = assertRecordWithinLimit(events.length, pageSize)
    if (!recordGuard.allowed) {
      errors.push(recordGuard.reason)
      break
    }

    const url = buildEventsUrl({
      cityQuery: opts.cityQuery,
      stateCode: opts.stateCode,
      countryCode: opts.countryCode,
      rangeStartIso: opts.rangeStartIso,
      rangeEndIso: opts.rangeEndIso,
      page,
      size: pageSize,
    })

    let res: Response
    try {
      res = await ticketmasterFetch(url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Ticketmaster request failed."
      errors.push(redactTicketmasterSecrets(`City ${opts.cityKey}: ${msg}`))
      break
    }

    const text = await res.text()
    if (!res.ok) {
      errors.push(
        redactTicketmasterSecrets(
          `City ${opts.cityKey}: Ticketmaster API error (${res.status}) ${text.slice(0, 200)}`,
        ),
      )
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        break
      }
      continue
    }

    let payload: TicketmasterEventsPage
    try {
      payload = JSON.parse(text) as TicketmasterEventsPage
    } catch {
      errors.push(`City ${opts.cityKey}: malformed Ticketmaster response.`)
      break
    }

    const pageEvents = payload._embedded?.events ?? []
    pagesFetched += 1
    opts.onProgress?.({ cityKey: opts.cityKey, pageNumber, eventsInPage: pageEvents.length })

    for (const event of pageEvents) {
      if (events.length >= opts.maxRecordsRemaining) break
      if (event?.id) events.push(event)
    }

    const totalPages = payload.page?.totalPages ?? 0
    hasMore = pageEvents.length > 0 && page + 1 < totalPages
    page += 1

    if (
      shouldStopPagination({
        pageNumber: pagesFetched,
        totalRecords: events.length,
        hasMore,
      }) ||
      pagesFetched >= maxPages
    ) {
      break
    }
  }

  return {
    cityKey: opts.cityKey,
    cityQuery: opts.cityQuery,
    events,
    pagesFetched,
    errors,
  }
}

/**
 * Fetch Ticketmaster Discovery events for all enabled Hampton Roads cities.
 * Sequential city requests with conservative pacing.
 */
export async function fetchTicketmasterDiscoveryEvents(
  options: TicketmasterFetchOptions,
): Promise<TicketmasterFetchSummary> {
  if (!isDiscoveryGeographyValid()) {
    throw new TicketmasterApiError(0, "Discovery geography configuration is invalid.", "")
  }

  const cities = getEnabledDiscoveryCities()
  const maxRecords = getTicketmasterImportMaxRecords()
  const results: TicketmasterCitySearchResult[] = []
  const errors: string[] = []
  let totalEvents = 0

  for (const city of cities) {
    if (totalEvents >= maxRecords) {
      errors.push(`Stopped before ${city.key}: max records per run reached (${maxRecords}).`)
      break
    }

    const cityResult = await fetchCityEvents({
      cityKey: city.key,
      cityQuery: city.cityQuery,
      stateCode: city.stateCode,
      countryCode: city.countryCode,
      rangeStartIso: options.rangeStartIso,
      rangeEndIso: options.rangeEndIso,
      maxRecordsRemaining: maxRecords - totalEvents,
      onProgress: options.onProgress,
    })

    results.push(cityResult)
    totalEvents += cityResult.events.length
    errors.push(...cityResult.errors)
  }

  return { cities: results, totalEvents, errors }
}

/** Reset pacing clock between test runs. */
export function resetTicketmasterClientStateForTests(): void {
  lastRequestAt = 0
}

export function getTicketmasterDiscoveryConfigSummary() {
  const schedule = getDiscoveryScheduleConfig()
  return {
    pageSize: getTicketmasterImportPageSize(),
    maxPagesPerCity: getTicketmasterImportMaxPages(),
    maxRecordsPerRun: getTicketmasterImportMaxRecords(),
    lookaheadDays: schedule.lookaheadDays,
  }
}
