/**
 * Canonical ViZb wordmark (`/public/vizb-logo.png`) — header, footer, auth, loading.
 * Keep as **PNG with alpha (RGBA)**. RGB-only exports bake in a black (or solid) box on dark pages.
 */
export const HEADER_LOGO_SRC = "/vizb-logo.png" as const
export const FULL_LOGO_SRC = "/vizb-logo.png" as const

/** PWA / favicon assets — regenerate via `npm run icons:generate`. */
export const PWA_ICON_192_SRC = "/pwa/icon-192.png" as const
export const PWA_ICON_512_SRC = "/pwa/icon-512.png" as const
export const PWA_ICON_MASKABLE_SRC = "/pwa/icon-512-maskable.png" as const
export const APPLE_ICON_SRC = "/apple-icon.png" as const
export const FAVICON_ICO_SRC = "/favicon.ico" as const
export const FAVICON_32_SRC = "/favicon-32x32.png" as const

export const TEAM_PRIMARY = "ViZb"
export const TEAM_SECONDARY = "Events & community"

export const LOGO_ALT_FULL = `${TEAM_PRIMARY}, ${TEAM_SECONDARY}`
/** Short alt for the wordmark image (header). */
export const LOGO_ALT_MARK = TEAM_PRIMARY
