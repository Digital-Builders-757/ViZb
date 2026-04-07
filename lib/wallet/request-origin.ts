import type { NextRequest } from "next/server"

export function resolveSiteOriginFromRequest(req: NextRequest): string {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")
  if (envBase) return envBase

  const forwardedProto = req.headers.get("x-forwarded-proto")
  const forwardedHost = req.headers.get("x-forwarded-host")
  const host = forwardedHost ?? req.headers.get("host") ?? ""
  if (!host) return ""

  const proto = forwardedProto ?? (host.includes("localhost") ? "http" : "https")
  return `${proto}://${host}`
}
