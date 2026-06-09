import { parseUsdStringToCents } from "@/lib/money/usd"

/** Minimum charge for paid tiers (Stripe USD minimum). */
export const MIN_PAID_TICKET_CENTS = 50

export const DEFAULT_PAID_TIER_NAME = "General Admission"

export function validatePaidTierPriceCents(cents: number): { ok: true } | { error: string } {
  if (!Number.isInteger(cents) || cents < 0) {
    return { error: "Price must be a valid non-negative amount." }
  }
  if (cents > 0 && cents < MIN_PAID_TICKET_CENTS) {
    return { error: "Paid ticket price must be at least $0.50." }
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
