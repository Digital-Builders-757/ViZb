/**
 * Whole-event RSVP cap from organizer forms (`events.rsvp_capacity`).
 * Empty / omitted → null (unlimited). Positive integer → cap.
 */
export function parseRsvpCapacityField(formData: FormData): {
  capacity: number | null
  error?: string
} {
  const raw = formData.get("rsvp_capacity")
  return parseRsvpCapacityValue(raw)
}

export function parseRsvpCapacityValue(raw: FormDataEntryValue | null): {
  capacity: number | null
  error?: string
} {
  if (raw == null || String(raw).trim() === "") return { capacity: null }
  const n = Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(n) || n < 1) {
    return {
      capacity: null,
      error: "RSVP cap must be a positive whole number, or leave blank for no limit.",
    }
  }
  if (n > 1_000_000) {
    return { capacity: null, error: "RSVP cap is too large." }
  }
  return { capacity: n }
}
