/** Status values that may appear on public discovery surfaces (home timeline, `/events`). */
export const PUBLIC_EVENT_LISTING_STATUS = "published" as const

/** Published-only — excludes draft, archived, cancelled, rejected, pending_review, etc. */
export function isPublicListingEventStatus(status: string | null | undefined): boolean {
  return status === PUBLIC_EVENT_LISTING_STATUS
}
