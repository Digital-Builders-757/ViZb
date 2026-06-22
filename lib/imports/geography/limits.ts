import { DISCOVERY_MAX_API_OFFSET, getDiscoveryScheduleConfig } from "@/lib/imports/geography/schedule-config"
import type { PaginationGuardResult } from "@/lib/imports/geography/types"

export function getDiscoveryLimits() {
  const config = getDiscoveryScheduleConfig()
  return {
    pageSize: config.pageSize,
    maxPagesPerCity: config.maxPagesPerCity,
    maxRecordsPerRun: config.maxRecordsPerRun,
    maxApiOffset: DISCOVERY_MAX_API_OFFSET,
  }
}

export function assertPageWithinLimit(pageNumber: number, pageSize?: number): PaginationGuardResult {
  const config = getDiscoveryScheduleConfig()
  const size = pageSize ?? config.pageSize

  if (pageNumber < 1) {
    return { allowed: false, reason: "Page number must be at least 1." }
  }
  if (pageNumber > config.maxPagesPerCity) {
    return {
      allowed: false,
      reason: `Page ${pageNumber} exceeds max pages per city (${config.maxPagesPerCity}).`,
    }
  }
  if (size * pageNumber >= DISCOVERY_MAX_API_OFFSET) {
    return {
      allowed: false,
      reason: `Page ${pageNumber} with size ${size} exceeds Ticketmaster offset limit (${DISCOVERY_MAX_API_OFFSET}).`,
    }
  }
  return { allowed: true }
}

export function assertRecordWithinLimit(
  totalRecords: number,
  additionalRecords = 0,
): PaginationGuardResult {
  const config = getDiscoveryScheduleConfig()
  const nextTotal = totalRecords + additionalRecords
  if (nextTotal > config.maxRecordsPerRun) {
    return {
      allowed: false,
      reason: `Record count ${nextTotal} exceeds max records per run (${config.maxRecordsPerRun}).`,
    }
  }
  return { allowed: true }
}

export function shouldStopPagination(opts: {
  pageNumber: number
  totalRecords: number
  hasMore: boolean
}): boolean {
  const config = getDiscoveryScheduleConfig()
  if (!opts.hasMore) return true
  if (opts.pageNumber >= config.maxPagesPerCity) return true
  if (opts.totalRecords >= config.maxRecordsPerRun) return true
  const pageGuard = assertPageWithinLimit(opts.pageNumber + 1)
  return !pageGuard.allowed
}
