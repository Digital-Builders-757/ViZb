/** Normalize Supabase nested `event_registrations` (object or single-element array). */
export function registrationStatusFromJoin(raw: unknown): string | null {
  if (raw == null) return null
  if (Array.isArray(raw)) {
    const first = raw[0]
    if (first && typeof first === "object" && "status" in first) {
      return String((first as { status: string }).status)
    }
    return null
  }
  if (typeof raw === "object" && "status" in raw) {
    return String((raw as { status: string }).status)
  }
  return null
}
