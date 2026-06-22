import { createHash } from "node:crypto"
import { hashCanonicalJson } from "@/lib/imports/eventbrite-normalize"
import type { NormalizedEventCandidate } from "@/lib/imports/types"
import { TICKETMASTER_SOURCE } from "@/lib/ticketmaster/env"
import type { TicketmasterEvent, TicketmasterImage } from "@/lib/ticketmaster/types"

function pickText(value: string | undefined): string | null {
  const trimmed = value?.trim()
  return trimmed || null
}

function pickHttpsUrl(value: string | undefined): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("https://") || trimmed.startsWith("http://")) return trimmed
  return null
}

function pickTimestamp(block: { dateTime?: string } | undefined): string | null {
  const value = block?.dateTime?.trim()
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

function pickVenue(event: TicketmasterEvent) {
  return event._embedded?.venues?.[0]
}

function buildAddress(venue: NonNullable<ReturnType<typeof pickVenue>>): string | null {
  const parts = [venue.address?.line1, venue.address?.line2]
    .map((part) => part?.trim())
    .filter(Boolean)
  return parts.length > 0 ? parts.join(", ") : null
}

function parseCoordinate(value: string | undefined): number | null {
  if (!value?.trim()) return null
  const n = Number.parseFloat(value)
  return Number.isFinite(n) ? n : null
}

/** Deterministic image selection: prefer 16_9 with largest width, else widest image. */
export function pickTicketmasterImageUrl(images: TicketmasterImage[] | undefined): string | null {
  const valid = (images ?? [])
    .map((image) => ({
      url: pickHttpsUrl(image.url),
      ratio: image.ratio?.trim() || "",
      width: image.width ?? 0,
    }))
    .filter((image) => Boolean(image.url)) as Array<{ url: string; ratio: string; width: number }>

  if (valid.length === 0) return null

  const preferred = valid
    .filter((image) => image.ratio === "16_9")
    .sort((a, b) => b.width - a.width)[0]
  if (preferred) return preferred.url

  return valid.sort((a, b) => b.width - a.width)[0]?.url ?? null
}

function buildCategories(event: TicketmasterEvent): string[] {
  const categories = new Set<string>()
  for (const classification of event.classifications ?? []) {
    for (const value of [
      classification.segment?.name,
      classification.genre?.name,
      classification.subGenre?.name,
    ]) {
      const trimmed = value?.trim()
      if (trimmed) categories.add(trimmed)
    }
  }
  return categories.size > 0 ? [...categories] : ["other"]
}

function buildClassifications(event: TicketmasterEvent): Record<string, unknown> {
  const primary = event.classifications?.find((item) => item.primary) ?? event.classifications?.[0]
  return {
    segment: primary?.segment?.name ?? null,
    genre: primary?.genre?.name ?? null,
    subGenre: primary?.subGenre?.name ?? null,
    type: primary?.type?.name ?? null,
    subType: primary?.subType?.name ?? null,
    sales: event.sales ?? null,
    localStartDate: event.dates?.start?.localDate ?? null,
    localStartTime: event.dates?.start?.localTime ?? null,
    localEndDate: event.dates?.end?.localDate ?? null,
    localEndTime: event.dates?.end?.localTime ?? null,
    accessibility: event.accessibility ?? null,
    ageRestrictions: event.ageRestrictions ?? null,
  }
}

function buildOrganizerHints(event: TicketmasterEvent): Record<string, unknown> {
  const attractions = (event._embedded?.attractions ?? []).map((item) => ({
    id: item.id ?? null,
    name: item.name ?? null,
    type: item.type ?? null,
  }))

  return {
    promoter: event.promoter
      ? {
          id: event.promoter.id ?? null,
          name: event.promoter.name ?? null,
          description: event.promoter.description ?? null,
        }
      : null,
    attractions,
  }
}

function buildDescription(event: TicketmasterEvent): string | null {
  const parts = [event.info, event.pleaseNote]
    .map((part) => part?.trim())
    .filter(Boolean)
  if (parts.length === 0) return null
  return parts.join("\n\n")
}

export function buildTicketmasterPayloadHash(event: TicketmasterEvent): string {
  const venue = pickVenue(event)
  const payload = {
    id: event.id,
    name: event.name ?? "",
    url: event.url ?? "",
    start: event.dates?.start,
    end: event.dates?.end,
    status: event.dates?.status?.code ?? "",
    venue_name: venue?.name ?? "",
    city: venue?.city?.name ?? "",
  }
  return hashCanonicalJson(payload)
}

export function normalizeTicketmasterEvent(
  event: TicketmasterEvent,
): NormalizedEventCandidate | { error: string } {
  const id = event.id?.trim()
  const title = event.name?.trim()
  const startsAt = pickTimestamp(event.dates?.start)

  if (!id) return { error: "Ticketmaster event missing id." }
  if (!title) return { error: `Ticketmaster event ${id} missing title.` }
  if (!startsAt) return { error: `Ticketmaster event ${id} missing start dateTime.` }

  const venue = pickVenue(event)
  const sourceUrl = pickHttpsUrl(event.url)

  return {
    source_key: TICKETMASTER_SOURCE,
    source_event_id: id,
    source_url: sourceUrl,
    source_attribution: "Ticketmaster",
    source_payload: event as unknown as Record<string, unknown>,
    source_payload_hash: buildTicketmasterPayloadHash(event),
    source_status: event.dates?.status?.code ?? null,
    title,
    description: buildDescription(event),
    starts_at: startsAt,
    ends_at: pickTimestamp(event.dates?.end),
    timezone: event.dates?.timezone ?? null,
    venue_name: pickText(venue?.name),
    address: venue ? buildAddress(venue) : null,
    city: pickText(venue?.city?.name),
    region: pickText(venue?.state?.stateCode ?? venue?.state?.name),
    postal_code: pickText(venue?.postalCode),
    latitude: parseCoordinate(venue?.location?.latitude),
    longitude: parseCoordinate(venue?.location?.longitude),
    image_url: pickTicketmasterImageUrl(event.images),
    categories: buildCategories(event),
    classifications: buildClassifications(event),
    organizer_hints: buildOrganizerHints(event),
    external_ticket_url: sourceUrl,
  }
}

export function hashTicketmasterPayload(value: unknown): string {
  const canonical = JSON.stringify(value)
  return createHash("sha256").update(canonical, "utf8").digest("hex")
}
