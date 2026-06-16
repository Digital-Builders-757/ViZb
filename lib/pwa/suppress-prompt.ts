const SUPPRESSED_PATH_PREFIXES = [
  "/login",
  "/signup",
  "/auth",
  "/invite/claim",
  "/advertise",
  "/host/apply",
] as const

const EVENT_TRANSACTION_QUERY_KEYS = ["session_id", "checkout", "intent"] as const

export function shouldSuppressInstallPrompt(
  pathname: string,
  searchParams?: URLSearchParams | null,
): boolean {
  if (SUPPRESSED_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true
  }

  if (pathname.startsWith("/events/") && searchParams) {
    for (const key of EVENT_TRANSACTION_QUERY_KEYS) {
      if (searchParams.has(key)) return true
    }
  }

  return false
}
