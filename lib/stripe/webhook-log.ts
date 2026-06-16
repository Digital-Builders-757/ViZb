/**
 * Safe structured logging for Stripe webhooks — never log secrets or full payloads.
 */

const SECRET_KEY_PATTERN = /(?:secret|password|token|authorization|api[_-]?key)/i

function sanitizeMeta(meta: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(meta)) {
    if (SECRET_KEY_PATTERN.test(key)) continue
    if (typeof value === "string" && value.length > 120) {
      out[key] = `${value.slice(0, 8)}…`
      continue
    }
    out[key] = value
  }
  return out
}

export function logWebhookInfo(message: string, meta?: Record<string, unknown>) {
  if (meta && Object.keys(meta).length > 0) {
    console.info("[stripe webhook]", message, sanitizeMeta(meta))
  } else {
    console.info("[stripe webhook]", message)
  }
}

export function logWebhookError(message: string, meta?: Record<string, unknown>) {
  if (meta && Object.keys(meta).length > 0) {
    console.error("[stripe webhook]", message, sanitizeMeta(meta))
  } else {
    console.error("[stripe webhook]", message)
  }
}
