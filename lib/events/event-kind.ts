/** Shared events model discriminator (see migrations: events.event_kind). */

export const EVENT_KIND_OFFICIAL = "official" as const
export const EVENT_KIND_COMMUNITY = "community" as const

export type EventKind = typeof EVENT_KIND_OFFICIAL | typeof EVENT_KIND_COMMUNITY

export function isValidEventKind(v: unknown): v is EventKind {
  return v === EVENT_KIND_OFFICIAL || v === EVENT_KIND_COMMUNITY
}

export function normalizeEventKindFromForm(v: unknown): EventKind {
  return isValidEventKind(v) ? v : EVENT_KIND_OFFICIAL
}

export function isCommunityEvent(kind: unknown): boolean {
  return kind === EVENT_KIND_COMMUNITY
}

/** Short badge on cards / timelines. */
export function eventKindBadgeShort(kind: unknown): string {
  return kind === EVENT_KIND_COMMUNITY ? "Local Event" : "ViZb Event"
}

/** Fuller label on detail surfaces. */
export function eventKindBadgeLong(kind: unknown): string {
  return kind === EVENT_KIND_COMMUNITY ? "Local Event" : "ViZb Event"
}

export type ExternalRsvpParseResult =
  | { ok: true; url: string }
  | { ok: false; error: string }

/**
 * Validates RSVP URLs stored on events.external_rsvp_url.
 * Accepts http(s) only; normalizes trimming; rejects javascript:, empty, etc.
 */
export function parseExternalRsvpUrl(raw: unknown): ExternalRsvpParseResult {
  if (raw == null) {
    return { ok: false, error: "RSVP URL is required for community events before submitting for review." }
  }
  const s = typeof raw === "string" ? raw.trim() : ""
  if (!s) {
    return { ok: false, error: "RSVP URL is required for community events before submitting for review." }
  }
  let parsed: URL
  try {
    parsed = new URL(s)
  } catch {
    return { ok: false, error: "Enter a valid RSVP link (starting with https://)." }
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "RSVP link must use http:// or https://." }
  }
  return { ok: true, url: parsed.toString() }
}

/** Nullable field from forms: empty string becomes null (clear). */
export function parseExternalRsvpUrlOptional(raw: unknown): ExternalRsvpParseResult | { ok: true; url: null } {
  if (raw == null) return { ok: true, url: null }
  const s = typeof raw === "string" ? raw.trim() : ""
  if (!s) return { ok: true, url: null }
  const r = parseExternalRsvpUrl(s)
  if (!r.ok) return r
  return { ok: true, url: r.url }
}

export const EVENT_KIND_BADGE_CLASS =
  "rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/55 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur"

/** ViZb editorial trust signal — keep sparse; only when `events.is_staff_pick` is true. */
export const STAFF_PICK_BADGE_LABEL = "Staff pick"

export const STAFF_PICK_BADGE_CLASS =
  "rounded-full border border-amber-500/35 bg-amber-500/10 px-2.5 py-0.5 text-[9px] sm:text-[10px] font-mono uppercase tracking-widest text-amber-100/95"
