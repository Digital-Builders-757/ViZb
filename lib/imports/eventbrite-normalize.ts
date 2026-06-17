import { createHash } from "node:crypto"
import type { EventbriteEventRaw } from "@/lib/eventbrite/client"
import type { EventbriteImportStatus } from "@/lib/eventbrite/env"
import { EVENTBRITE_SOURCE } from "@/lib/eventbrite/env"
import { normalizeCategories } from "@/lib/events/categories"
import { EVENT_KIND_COMMUNITY } from "@/lib/events/event-kind"

export type EventbriteImportCandidate = {
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  timezone: string | null
  venue_name: string
  address: string | null
  city: string
  source_url: string
  flyer_url: string | null
  source: typeof EVENTBRITE_SOURCE
  source_event_id: string
  source_payload: Record<string, unknown>
  source_payload_hash: string
  import_status: EventbriteImportStatus
  external_rsvp_url: string
  event_kind: typeof EVENT_KIND_COMMUNITY
  categories: string[]
}

function pickUtcIso(block: { utc?: string; local?: string } | undefined): string | null {
  const utc = block?.utc?.trim()
  if (utc) return utc
  const local = block?.local?.trim()
  return local || null
}

function buildAddress(venue: EventbriteEventRaw["venue"]): string | null {
  if (!venue?.address) return null
  const parts = [
    venue.address.address_1,
    venue.address.address_2,
    venue.address.region,
    venue.address.postal_code,
    venue.address.country,
  ]
    .map((p) => (p ?? "").trim())
    .filter(Boolean)
  if (parts.length > 0) return parts.join(", ")
  const localized = venue.address.localized_address_display?.trim()
  return localized || null
}

function pickCity(venue: EventbriteEventRaw["venue"]): string {
  const city = venue?.address?.city?.trim()
  if (city) return city
  return "Virginia"
}

function pickVenueName(venue: EventbriteEventRaw["venue"]): string {
  const name = venue?.name?.trim()
  if (name) return name
  return "Venue TBD"
}

function pickFlyerUrl(raw: EventbriteEventRaw): string | null {
  const logo = raw.logo
  const url = logo?.original?.url?.trim() || logo?.url?.trim()
  if (!url) return null
  if (url.startsWith("https://") || url.startsWith("http://")) return url
  return null
}

function pickSourceUrl(raw: EventbriteEventRaw): string | null {
  const url = raw.url?.trim()
  if (!url) return null
  if (url.startsWith("https://") || url.startsWith("http://")) return url
  return null
}

/** Stable subset for change detection on re-import. */
export function buildEventbritePayloadHash(raw: EventbriteEventRaw): string {
  const payload = {
    id: raw.id,
    name: raw.name?.text ?? "",
    start: raw.start,
    end: raw.end,
    url: raw.url ?? "",
    venue_id: raw.venue_id ?? "",
    venue_name: raw.venue?.name ?? "",
    city: raw.venue?.address?.city ?? "",
  }
  return hashCanonicalJson(payload)
}

export function hashCanonicalJson(value: unknown): string {
  const canonical = JSON.stringify(value)
  return createHash("sha256").update(canonical, "utf8").digest("hex")
}

export function normalizeEventbriteEvent(
  raw: EventbriteEventRaw,
  defaultImportStatus: EventbriteImportStatus,
): EventbriteImportCandidate | { error: string } {
  const sourceEventId = String(raw.id ?? "").trim()
  if (!sourceEventId) {
    return { error: "Missing Eventbrite event id." }
  }

  const title = raw.name?.text?.trim() || "Untitled Event"
  const startsAt = pickUtcIso(raw.start)
  if (!startsAt) {
    return { error: `Event ${sourceEventId}: missing start time.` }
  }

  const sourceUrl = pickSourceUrl(raw)
  if (!sourceUrl) {
    return { error: `Event ${sourceEventId}: missing public URL.` }
  }

  const endsAt = pickUtcIso(raw.end)
  const description = raw.description?.text?.trim() || null
  const venue = raw.venue

  return {
    title,
    description,
    starts_at: startsAt,
    ends_at: endsAt,
    timezone: raw.start?.timezone?.trim() || null,
    venue_name: pickVenueName(venue),
    address: buildAddress(venue),
    city: pickCity(venue),
    source_url: sourceUrl,
    flyer_url: pickFlyerUrl(raw),
    source: EVENTBRITE_SOURCE,
    source_event_id: sourceEventId,
    source_payload: raw as Record<string, unknown>,
    source_payload_hash: buildEventbritePayloadHash(raw),
    import_status: defaultImportStatus,
    external_rsvp_url: sourceUrl,
    event_kind: EVENT_KIND_COMMUNITY,
    categories: normalizeCategories(["other"]),
  }
}

export function normalizeTitleForDedupe(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
}

export function isLikelyDuplicateEvent(
  candidate: Pick<EventbriteImportCandidate, "title" | "starts_at" | "city" | "venue_name">,
  existing: {
    title: string
    starts_at: string
    city: string
    venue_name: string
  },
): boolean {
  if (candidate.starts_at !== existing.starts_at) return false
  if (normalizeTitleForDedupe(candidate.title) !== normalizeTitleForDedupe(existing.title)) return false
  if (candidate.city.trim().toLowerCase() !== existing.city.trim().toLowerCase()) return false
  const v1 = candidate.venue_name.trim().toLowerCase()
  const v2 = existing.venue_name.trim().toLowerCase()
  return v1 === v2 || v1.includes(v2) || v2.includes(v1)
}
