const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

/** Normalizes Supabase RPC / row ids that may arrive as strings or `{ id }` objects. */
export function coerceUuid(data: unknown): string | null {
  if (typeof data === "string" && UUID_RE.test(data.trim())) return data.trim()
  if (data && typeof data === "object" && "id" in data) {
    const id = (data as { id: unknown }).id
    if (typeof id === "string" && UUID_RE.test(id.trim())) return id.trim()
  }
  return null
}
