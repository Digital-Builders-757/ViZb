/**
 * Parse a USD amount from a form string into integer cents (no floats).
 * Accepts "12", "12.5", "12.50". Rejects negative or malformed input.
 */
export function parseUsdStringToCents(raw: string): { cents: number } | { error: string } {
  const t = raw.trim()
  if (t === "") return { cents: 0 }
  if (!/^\d+(\.\d{0,2})?$/.test(t)) {
    return { error: "Enter a valid price (e.g. 25 or 19.99)." }
  }
  const [whole, frac = ""] = t.split(".")
  const centsPart = (frac + "00").slice(0, 2)
  const w = Number.parseInt(whole, 10)
  const c = Number.parseInt(centsPart, 10)
  if (!Number.isFinite(w) || !Number.isFinite(c)) {
    return { error: "Invalid price." }
  }
  const cents = w * 100 + c
  if (cents > 10_000_000) {
    return { error: "Price is too large." }
  }
  return { cents }
}

export function formatUsdFromCents(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100)
}
