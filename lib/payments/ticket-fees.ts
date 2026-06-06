export const VIZB_PLATFORM_FEE_BPS = 500

export type TicketCheckoutAmounts = {
  subtotalCents: number
  platformFeeCents: number
  totalCents: number
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

export function calculateTicketCheckoutAmounts(subtotalCents: number, feeBps = VIZB_PLATFORM_FEE_BPS): TicketCheckoutAmounts {
  const platformFeeCents = calculatePlatformFeeCents(subtotalCents, feeBps)
  return {
    subtotalCents,
    platformFeeCents,
    totalCents: subtotalCents + platformFeeCents,
  }
}
