export const VIZB_PLATFORM_FEE_BPS = 500
export const DEFAULT_PLATFORM_FEE_PERCENT = VIZB_PLATFORM_FEE_BPS / 100

export type TicketCheckoutAmounts = {
  subtotalCents: number
  platformFeeCents: number
  totalCents: number
}

export type EnvFeeParseResult =
  | { ok: true; value: number; usingDefault: boolean }
  | { ok: false; error: string }

/** Optional env override: percent fee (e.g. `5` = 5%). Falls back to 5% when unset. */
export function getPlatformFeePercentFromEnv(): EnvFeeParseResult {
  const raw = process.env.TICKET_PLATFORM_FEE_PERCENT?.trim()
  if (!raw) {
    return { ok: true, value: DEFAULT_PLATFORM_FEE_PERCENT, usingDefault: true }
  }
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: `Invalid TICKET_PLATFORM_FEE_PERCENT: "${raw}"` }
  }
  return { ok: true, value: n, usingDefault: false }
}

/** Optional env override: fixed fee in cents per order. Falls back to 0 when unset. */
export function getPlatformFeeFixedCentsFromEnv(): EnvFeeParseResult {
  const raw = process.env.TICKET_PLATFORM_FEE_FIXED_CENTS?.trim()
  if (!raw) {
    return { ok: true, value: 0, usingDefault: true }
  }
  const n = Number(raw)
  if (!Number.isInteger(n) || n < 0) {
    return { ok: false, error: `Invalid TICKET_PLATFORM_FEE_FIXED_CENTS: "${raw}"` }
  }
  return { ok: true, value: n, usingDefault: false }
}

function resolveFeeBpsFromEnv(): number {
  const percent = getPlatformFeePercentFromEnv()
  if (!percent.ok) return VIZB_PLATFORM_FEE_BPS
  return Math.round(percent.value * 100)
}

function resolveFixedFeeCentsFromEnv(): number {
  const fixed = getPlatformFeeFixedCentsFromEnv()
  if (!fixed.ok) return 0
  return fixed.value
}

function assertWholeNonNegativeCents(value: number, field: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${field} must be a non-negative integer number of cents.`)
  }
}

export function calculatePlatformFeeCents(subtotalCents: number, feeBps = VIZB_PLATFORM_FEE_BPS): number {
  assertWholeNonNegativeCents(subtotalCents, "subtotalCents")
  if (!Number.isInteger(feeBps) || feeBps < 0) {
    throw new Error("feeBps must be a non-negative integer.")
  }

  return Math.round((subtotalCents * feeBps) / 10_000)
}

export function calculateTicketCheckoutAmounts(
  subtotalCents: number,
  feeBps = resolveFeeBpsFromEnv(),
  fixedFeeCents = resolveFixedFeeCentsFromEnv(),
): TicketCheckoutAmounts {
  const percentFeeCents = calculatePlatformFeeCents(subtotalCents, feeBps)
  const platformFeeCents = percentFeeCents + fixedFeeCents
  return {
    subtotalCents,
    platformFeeCents,
    totalCents: subtotalCents + platformFeeCents,
  }
}
