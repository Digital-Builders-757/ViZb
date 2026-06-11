import { track } from "@vercel/analytics"

/** Product funnel events — no PII (no email, user id, or display name). */
export const PRODUCT_EVENT_NAMES = [
  "event_detail_viewed",
  "event_save_clicked",
  "event_save_completed",
  "event_rsvp_started",
  "event_rsvp_completed",
  "event_rsvp_cancelled",
  "paid_checkout_started",
  "paid_checkout_returned",
  "paid_checkout_confirmed",
  "event_share_clicked",
  "calendar_export_clicked",
  "signup_login_redirect",
] as const

export type ProductEventName = (typeof PRODUCT_EVENT_NAMES)[number]

export type ProductEventContext = {
  event_id?: string
  event_slug?: string
  /** Primary category label or short comma list (max 3). */
  category?: string
  city?: string
  event_kind?: "official" | "community"
  staff_pick?: boolean
  signed_in?: boolean
  /** Surface that fired the event, e.g. event_detail, timeline, dashboard. */
  source?: string
  /** Discovery preset/filter when relevant. */
  discover?: string
  /** Share or calendar channel. */
  channel?: string
  /** Checkout outcome for return events. */
  checkout_status?: "confirmed" | "pending" | "error" | "cancelled"
}

const BLOCKED_PROPERTY_KEYS = new Set([
  "email",
  "user_id",
  "userId",
  "display_name",
  "displayName",
  "name",
  "phone",
])

const EMAIL_PATTERN = /@/

/** Build Vercel Analytics custom event payload (string values only). */
export function buildProductEventPayload(
  context: ProductEventContext = {},
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}

  for (const [key, raw] of Object.entries(context)) {
    if (raw === undefined || raw === null) continue
    if (BLOCKED_PROPERTY_KEYS.has(key)) continue
    if (typeof raw === "string" && EMAIL_PATTERN.test(raw)) continue

    if (typeof raw === "boolean" || typeof raw === "number") {
      out[key] = raw
      continue
    }

    const value = String(raw).trim()
    if (!value || EMAIL_PATTERN.test(value)) continue
    out[key] = value.length > 120 ? `${value.slice(0, 117)}…` : value
  }

  return out
}

export function isProductEventName(value: string): value is ProductEventName {
  return (PRODUCT_EVENT_NAMES as readonly string[]).includes(value)
}

/** Fire a product analytics event (client-only; no-op on server). */
export function trackProductEvent(name: ProductEventName, context: ProductEventContext = {}): void {
  if (typeof window === "undefined") return
  if (!isProductEventName(name)) return

  const data = buildProductEventPayload(context)
  try {
    track(name, data)
  } catch {
    /* analytics must never break UX */
  }
}

export function formatCategoriesForAnalytics(categories: string[] | undefined): string | undefined {
  if (!categories?.length) return undefined
  return categories.slice(0, 3).join(", ")
}
