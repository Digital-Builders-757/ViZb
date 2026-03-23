import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Validates that a redirect path is safe (same-origin, relative path only).
 * Prevents open redirect attacks via query parameters.
 */
export function getSafeRedirectPath(redirect: string | null): string {
  const fallback = "/dashboard"
  if (!redirect) return fallback
  if (!redirect.startsWith("/")) return fallback
  if (redirect.startsWith("//")) return fallback
  if (/[\\%]/.test(redirect.split("?")[0] ?? "")) return fallback

  const allowedPrefixes = ["/dashboard", "/organizer", "/admin", "/profile", "/tickets", "/host", "/invite"]
  const pathWithoutQuery = redirect.split("?")[0] ?? ""
  if (!allowedPrefixes.some((prefix) => pathWithoutQuery.startsWith(prefix))) {
    return fallback
  }
  return redirect
}

/**
 * Converts a string to a URL-safe slug.
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
}
