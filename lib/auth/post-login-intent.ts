/** Allowlisted post-login intents — must not redirect off-site or trigger unsafe actions without auth. */
export const POST_LOGIN_INTENTS = ["save_event", "rsvp_event"] as const

export type PostLoginIntent = (typeof POST_LOGIN_INTENTS)[number]

export function isPostLoginIntent(value: string | null | undefined): value is PostLoginIntent {
  if (!value) return false
  return (POST_LOGIN_INTENTS as readonly string[]).includes(value)
}

export function parsePostLoginIntent(
  params: Pick<URLSearchParams, "get"> | { get: (key: string) => string | null },
): PostLoginIntent | null {
  const raw = params.get("intent")
  return isPostLoginIntent(raw) ? raw : null
}

/** Append a validated intent query param to an in-app path (already safe). */
export function appendIntentToPath(path: string, intent: PostLoginIntent | null): string {
  if (!intent) return path
  const [pathname, query = ""] = path.split("?")
  const next = new URLSearchParams(query)
  next.set("intent", intent)
  const qs = next.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

/** Build login/signup href with safe redirect + optional intent. */
export function buildAuthHref({
  redirectPath,
  intent,
  authPath = "/login",
}: {
  redirectPath: string
  intent?: PostLoginIntent | null
  authPath?: "/login" | "/signup"
}): string {
  const params = new URLSearchParams()
  params.set("redirect", redirectPath)
  if (intent && isPostLoginIntent(intent)) {
    params.set("intent", intent)
  }
  return `${authPath}?${params.toString()}`
}

export function buildEventAuthHref(
  eventSlug: string,
  intent: PostLoginIntent,
  authPath: "/login" | "/signup" = "/login",
): string {
  return buildAuthHref({
    redirectPath: `/events/${eventSlug}`,
    intent,
    authPath,
  })
}

/** Resolve final destination after auth from redirect + intent query params. */
export function resolvePostLoginDestination(
  redirectPath: string,
  intent: PostLoginIntent | null,
): string {
  return appendIntentToPath(redirectPath, intent)
}
