import {
  EVENT_CATEGORY_VALUES,
  type EventCategoryValue,
} from "@/lib/events/categories"
import type { TicketmasterEvent } from "@/lib/ticketmaster/types"

const MUSIC_TAXONOMY_TERMS = [
  "music",
  "rock",
  "pop",
  "jazz",
  "blues",
  "country",
  "hip-hop",
  "hip hop",
  "rap",
  "r&b",
  "rnb",
  "soul",
  "reggae",
  "latin",
  "electronic",
  "metal",
  "folk",
  "classical",
  "gospel",
  "alternative",
  "indie",
  "punk",
]

const MUSIC_TITLE_TERMS = [
  "concert",
  "live music",
  "music festival",
  "album release",
  "record release",
  "dj set",
  "in concert",
]

const PARTY_TERMS = [
  "party",
  "afterparty",
  "after party",
  "day party",
  "club night",
  "nightclub",
]

const WORKSHOP_TERMS = [
  "workshop",
  "masterclass",
  "master class",
  "bootcamp",
  "boot camp",
  "training",
  "seminar",
]

const NETWORKING_TERMS = [
  "networking",
  "business mixer",
  "network mixer",
  "career fair",
  "job fair",
  "professional mixer",
  "business conference",
  "business summit",
]

const SOCIAL_TERMS = [
  "meetup",
  "meet up",
  "community gathering",
  "social gathering",
  "festival",
  "family event",
]

function normalizeText(value: string | undefined | null): string {
  return value?.toLowerCase().trim() ?? ""
}

function includesAny(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => text.includes(term))
}

function classificationText(event: TicketmasterEvent): {
  segments: string[]
  taxonomy: string
} {
  const segments: string[] = []
  const values: string[] = []

  for (const classification of event.classifications ?? []) {
    const segment = normalizeText(classification.segment?.name)
    const genre = normalizeText(classification.genre?.name)
    const subGenre = normalizeText(classification.subGenre?.name)

    if (segment) segments.push(segment)
    if (segment) values.push(segment)
    if (genre) values.push(genre)
    if (subGenre) values.push(subGenre)
  }

  return {
    segments,
    taxonomy: values.join(" "),
  }
}

/**
 * Convert Ticketmaster's broad segment/genre taxonomy into ViZb's editorial tags.
 * Raw Ticketmaster classification data is still retained separately on the candidate.
 */
export function mapTicketmasterCategories(event: TicketmasterEvent): EventCategoryValue[] {
  const title = normalizeText(event.name)
  const classification = classificationText(event)
  const tags = new Set<EventCategoryValue>()

  const isOpenMic = title.includes("open mic") || title.includes("open-mic")
  const isWorkshop = includesAny(title, WORKSHOP_TERMS)
  const isNetworking = includesAny(title, NETWORKING_TERMS)
  const isParty = includesAny(title, PARTY_TERMS)
  const isSocial = includesAny(title, SOCIAL_TERMS)

  const isMusic =
    classification.segments.includes("music") ||
    includesAny(classification.taxonomy, MUSIC_TAXONOMY_TERMS) ||
    includesAny(title, MUSIC_TITLE_TERMS)

  const isExplicitConcert = title.includes("concert") || title.includes("live music")

  if (isParty) tags.add("party")
  if (isWorkshop) tags.add("workshop")
  if (isNetworking) tags.add("networking")
  if (isSocial) tags.add("social")
  if (isMusic) tags.add("music")
  if (isOpenMic) tags.add("open_mic")

  // Ticketmaster's Music segment overwhelmingly represents live performances.
  // Keep special formats (party, workshop, networking, open mic) from being mislabeled
  // as concerts unless the title explicitly says concert/live music.
  if (
    isExplicitConcert ||
    (isMusic && !isParty && !isWorkshop && !isNetworking && !isOpenMic)
  ) {
    tags.add("concert")
  }

  // Family is a Ticketmaster segment and maps best to ViZb's broad social category.
  if (classification.segments.includes("family")) tags.add("social")

  if (tags.size === 0) tags.add("other")

  return EVENT_CATEGORY_VALUES.filter((category) => tags.has(category))
}
