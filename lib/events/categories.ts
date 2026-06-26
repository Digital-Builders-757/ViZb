/** Allowed event category values — keep in sync with DB constraint (`events_categories_check`). */

export const EVENT_CATEGORY_VALUES = [
  "party",
  "workshop",
  "networking",
  "social",
  "music",
  "concert",
  "other",
  "open_mic",
] as const

export type EventCategoryValue = (typeof EVENT_CATEGORY_VALUES)[number]

const ALLOWED_SET = new Set<string>(EVENT_CATEGORY_VALUES)

/** Checkbox options for organizer create/edit forms (single source of truth). */
export const EVENT_CATEGORY_OPTIONS: { value: EventCategoryValue; label: string }[] = [
  { value: "party", label: "Party" },
  { value: "music", label: "Music" },
  { value: "concert", label: "Concert" },
  { value: "workshop", label: "Workshop" },
  { value: "networking", label: "Networking" },
  { value: "social", label: "Social" },
  { value: "open_mic", label: "Open mic" },
  { value: "other", label: "Other" },
]

export function isValidEventCategory(v: string): v is EventCategoryValue {
  return ALLOWED_SET.has(v)
}

/**
 * Read repeated `categories` fields from FormData (checkboxes), dedupe, validate.
 * Returns null if none selected or any value is invalid.
 */
export function parseCategoriesFromFormData(formData: FormData): string[] | null {
  const raw = formData.getAll("categories")
  const strings = raw
    .map((v) => String(v).toLowerCase().trim())
    .filter(Boolean)
  const unique = [...new Set(strings)]
  if (unique.length === 0) return null
  for (const c of unique) {
    if (!isValidEventCategory(c)) return null
  }
  return unique
}

/** Normalize API/JSON shapes to valid ViZb category slugs. */
export function normalizeCategories(value: unknown): EventCategoryValue[] {
  if (!Array.isArray(value)) return []

  const normalized = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.toLowerCase().trim())
    .filter((item): item is EventCategoryValue => isValidEventCategory(item))

  return [...new Set(normalized)]
}

/**
 * Database-safe normalization for `events.categories`.
 * The DB requires at least one allowed value, so unknown external values fall back to `other`.
 */
export function normalizeCategoriesForPersistence(value: unknown): EventCategoryValue[] {
  const normalized = normalizeCategories(value)
  return normalized.length > 0 ? normalized : ["other"]
}
