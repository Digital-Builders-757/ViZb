/**
 * Lightweight server-side logging. Safe for Vercel log streams — never log secrets.
 * Scope is a dotted identifier (e.g. "events.discovery", "admin.posts.save").
 */
export function logError(scope: string, err: unknown, meta?: Record<string, unknown>) {
  const message = err instanceof Error ? err.message : String(err)
  console.error(`[${scope}]`, message, meta ?? "")
}

export function logWarn(scope: string, msg: string, meta?: Record<string, unknown>) {
  console.warn(`[${scope}]`, msg, meta ?? "")
}
