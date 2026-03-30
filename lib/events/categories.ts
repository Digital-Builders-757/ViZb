/** Allowed event category values — keep in sync with DB constraint in scripts/020_event_categories_array.sql */

export const EVENT_CATEGORY_VALUES = [
  "party",
  "workshop",
  "networking",
  "social",
  "concert",
  "other",
] as const

export type EventCategoryValue = (typeof EVENT_CATEGORY_VALUES)[number]

const ALLOWED_SET = new Set<string>(EVENT_CATEGORY_VALUES)

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

/** Normalize API/JSON shapes to a clean string array. */
export function normalizeCategories(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((x): x is string => typeof x === "string" && x.length > 0))]
}
