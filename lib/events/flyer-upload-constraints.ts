/**
 * Single source of truth for organizer event flyer uploads (client + server).
 * Next.js Server Action bodySizeLimit in next.config.mjs must stay ≥ max file size + multipart overhead.
 */

export const EVENT_FLYER_MAX_BYTES = 5 * 1024 * 1024

export const EVENT_FLYER_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const

export type EventFlyerMimeType = (typeof EVENT_FLYER_ALLOWED_MIME_TYPES)[number]

export const EVENT_FLYER_INVALID_TYPE_MESSAGE =
  "Invalid file type. Use JPEG, PNG, WebP, or GIF."

export const EVENT_FLYER_TOO_LARGE_MESSAGE = "File too large. Maximum size is 5MB."

/** For <input accept="..."> */
export const EVENT_FLYER_ACCEPT_ATTR = EVENT_FLYER_ALLOWED_MIME_TYPES.join(",")
