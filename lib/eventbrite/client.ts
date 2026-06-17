/**
 * Eventbrite API v3 client (server-only).
 */

import { getEventbriteOrganizationId, getEventbritePrivateToken } from "@/lib/eventbrite/env"

const EVENTBRITE_API_BASE = "https://www.eventbriteapi.com/v3"

export type EventbriteVenue = {
  id?: string
  name?: string
  address?: {
    address_1?: string
    address_2?: string
    city?: string
    region?: string
    postal_code?: string
    country?: string
    localized_address_display?: string
  }
}

export type EventbriteEventRaw = {
  id: string
  name?: { text?: string }
  description?: { text?: string }
  url?: string
  start?: { timezone?: string; local?: string; utc?: string }
  end?: { timezone?: string; local?: string; utc?: string }
  logo?: { original?: { url?: string }; url?: string }
  venue_id?: string
  venue?: EventbriteVenue
}

export class EventbriteApiError extends Error {
  readonly status: number
  readonly body: string

  constructor(status: number, message: string, body: string) {
    super(message)
    this.name = "EventbriteApiError"
    this.status = status
    this.body = body
  }
}

type Pagination = {
  page_number?: number
  page_count?: number
  page_size?: number
  has_more_items?: boolean
}

type EventsListResponse = {
  events?: EventbriteEventRaw[]
  pagination?: Pagination
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function eventbriteFetch(path: string, attempt = 0): Promise<Response> {
  const token = getEventbritePrivateToken()
  if (!token) {
    throw new EventbriteApiError(0, "Eventbrite token is not configured.", "")
  }

  const url = `${EVENTBRITE_API_BASE}${path}`
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  })

  if (res.status === 429 && attempt < 3) {
    const retryAfter = Number(res.headers.get("retry-after") || "2")
    await sleep(Math.min(30, Math.max(1, retryAfter)) * 1000)
    return eventbriteFetch(path, attempt + 1)
  }

  return res
}

export type FetchOrganizationEventsOptions = {
  organizationId?: string
  rangeStartIso: string
  rangeEndIso: string
  pageSize?: number
}

/**
 * Fetch all organization events in the date window (paginated).
 */
export async function fetchOrganizationEvents(
  options: FetchOrganizationEventsOptions,
): Promise<EventbriteEventRaw[]> {
  const orgId = options.organizationId?.trim() || getEventbriteOrganizationId()
  if (!orgId) {
    throw new EventbriteApiError(0, "Eventbrite organization id is not configured.", "")
  }

  const pageSize = options.pageSize ?? 50
  const params = new URLSearchParams({
    "start_date.range_start": options.rangeStartIso,
    "start_date.range_end": options.rangeEndIso,
    expand: "venue",
    page_size: String(pageSize),
  })

  const all: EventbriteEventRaw[] = []
  let page = 1
  let hasMore = true

  while (hasMore) {
    params.set("page", String(page))
    const path = `/organizations/${encodeURIComponent(orgId)}/events/?${params.toString()}`
    const res = await eventbriteFetch(path)
    const text = await res.text()

    if (!res.ok) {
      throw new EventbriteApiError(
        res.status,
        `Eventbrite API error (${res.status})`,
        text.slice(0, 500),
      )
    }

    let json: EventsListResponse
    try {
      json = JSON.parse(text) as EventsListResponse
    } catch {
      throw new EventbriteApiError(res.status, "Eventbrite API returned invalid JSON.", text.slice(0, 200))
    }

    const batch = json.events ?? []
    all.push(...batch)

    const pagination = json.pagination
    if (pagination?.has_more_items && page < (pagination.page_count ?? page)) {
      page += 1
    } else if (pagination?.has_more_items && batch.length >= pageSize) {
      page += 1
    } else {
      hasMore = false
    }

    if (batch.length === 0) {
      hasMore = false
    }
  }

  return all
}
