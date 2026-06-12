import type { SupabaseClient } from "@supabase/supabase-js"

export type PublicFreeTier = { id: string; name: string }
export type PublicPaidTier = { id: string; name: string; price_cents: number }

type TicketTypeRow = {
  id: string
  name: string
  price_cents: number | null
  is_active?: boolean | null
  sales_starts_at?: string | null
  sales_ends_at?: string | null
  sales_start_at?: string | null
  sales_end_at?: string | null
}

const FULL_SELECT =
  "id, name, price_cents, sort_order, is_active, sales_starts_at, sales_ends_at, sales_start_at, sales_end_at"
const LEGACY_SELECT = "id, name, price_cents, sort_order, is_active, sales_starts_at, sales_ends_at"

function isMissingColumnError(message: string): boolean {
  return /column|42703|schema cache|does not exist/i.test(message)
}

export function partitionPublicTicketTiers(
  rows: TicketTypeRow[],
  now = new Date(),
): { freeTicketTiers: PublicFreeTier[]; paidTicketTiers: PublicPaidTier[] } {
  const freeTicketTiers: PublicFreeTier[] = []
  const paidTicketTiers: PublicPaidTier[] = []

  for (const row of rows) {
    if (row.is_active === false) continue
    const saleStartsAt = row.sales_start_at ?? row.sales_starts_at
    const saleEndsAt = row.sales_end_at ?? row.sales_ends_at
    if (saleStartsAt && new Date(saleStartsAt) > now) continue
    if (saleEndsAt && new Date(saleEndsAt) < now) continue
    const pc = typeof row.price_cents === "number" ? row.price_cents : Number(row.price_cents)
    if (!Number.isFinite(pc)) continue
    if (pc === 0) {
      freeTicketTiers.push({ id: row.id, name: row.name })
    } else if (pc > 0) {
      paidTicketTiers.push({ id: row.id, name: row.name, price_cents: pc })
    }
  }

  return { freeTicketTiers, paidTicketTiers }
}

/** Public event detail: load on-sale free/paid tiers with legacy column fallback. */
export async function loadPublicTicketTiersForEvent(
  supabase: SupabaseClient,
  eventId: string,
  now = new Date(),
): Promise<{ freeTicketTiers: PublicFreeTier[]; paidTicketTiers: PublicPaidTier[] }> {
  const fullResult = await supabase
    .from("ticket_types")
    .select(FULL_SELECT)
    .eq("event_id", eventId)
    .order("sort_order", { ascending: true })

  let rows: TicketTypeRow[] | null = (fullResult.data ?? null) as TicketTypeRow[] | null
  let error = fullResult.error

  if (error && isMissingColumnError(error.message)) {
    const legacyResult = await supabase
      .from("ticket_types")
      .select(LEGACY_SELECT)
      .eq("event_id", eventId)
      .order("sort_order", { ascending: true })
    rows = (legacyResult.data ?? null) as TicketTypeRow[] | null
    error = legacyResult.error
  }

  if (error) {
    console.error("[loadPublicTicketTiersForEvent] ticket_types query failed:", error.message)
    return { freeTicketTiers: [], paidTicketTiers: [] }
  }

  return partitionPublicTicketTiers((rows ?? []) as TicketTypeRow[], now)
}
