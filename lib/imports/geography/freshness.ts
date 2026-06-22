import { getDiscoveryScheduleConfig } from "@/lib/imports/geography/schedule-config"

export function getStaleThresholdDays(): number {
  return getDiscoveryScheduleConfig().staleThresholdDays
}

export function getStaleThresholdMs(now: Date = new Date()): number {
  const days = getStaleThresholdDays()
  return now.getTime() - days * 24 * 60 * 60 * 1000
}

/** True when lastSeenAt is older than the configured stale threshold. */
export function isCandidateStale(lastSeenAt: string | Date, now: Date = new Date()): boolean {
  const seen = typeof lastSeenAt === "string" ? new Date(lastSeenAt) : lastSeenAt
  if (Number.isNaN(seen.getTime())) return false
  return seen.getTime() < getStaleThresholdMs(now)
}
