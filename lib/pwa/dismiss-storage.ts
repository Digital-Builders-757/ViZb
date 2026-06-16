import { PWA_DISMISS_COOLDOWN_MS, PWA_DISMISS_STORAGE_KEY } from "./constants"

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function getDismissedAt(): number | null {
  const storage = getStorage()
  if (!storage) return null

  const raw = storage.getItem(PWA_DISMISS_STORAGE_KEY)
  if (!raw) return null

  const parsed = Number.parseInt(raw, 10)
  return Number.isFinite(parsed) ? parsed : null
}

export function setDismissedNow(): void {
  const storage = getStorage()
  if (!storage) return

  try {
    storage.setItem(PWA_DISMISS_STORAGE_KEY, String(Date.now()))
  } catch {
    // Private browsing or quota exceeded — ignore.
  }
}

export function isWithinCooldown(now = Date.now()): boolean {
  const dismissedAt = getDismissedAt()
  if (dismissedAt === null) return false
  return now - dismissedAt < PWA_DISMISS_COOLDOWN_MS
}
