import { parseUsdStringToCents } from "@/lib/money/usd"
import { MIN_PAID_TICKET_CENTS } from "@/lib/payments/vizb-pricing-config"

export { MIN_PAID_TICKET_CENTS }

export const DEFAULT_PAID_TIER_NAME = "General Admission"

const MIN_PAID_TICKET_MESSAGE = `Paid ticket price must be at least $${(MIN_PAID_TICKET_CENTS / 100).toFixed(2)}.`

export function validatePaidTierPriceCents(cents: number): { ok: true } | { error: string } {
  if (!Number.isInteger(cents) || cents < 0) {
    return { error: "Price must be a valid non-negative amount." }
  }
  if (cents > 0 && cents < MIN_PAID_TICKET_CENTS) {
    return { error: MIN_PAID_TICKET_MESSAGE }
  }
  return { ok: true }
}

export function parsePaidTierPriceUsd(raw: string): { cents: number } | { error: string } {
  const parsed = parseUsdStringToCents(raw.trim() === "" ? "0" : raw.trim())
  if ("error" in parsed) return parsed
  const validated = validatePaidTierPriceCents(parsed.cents)
  if ("error" in validated) return validated
  return { cents: parsed.cents }
}
