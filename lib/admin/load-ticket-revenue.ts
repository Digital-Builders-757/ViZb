import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"

export type TicketRevenueOrderRow = {
  id: string
  userId: string
  buyerLabel: string
  eventId: string | null
  eventTitle: string
  eventSlug: string | null
  tierName: string
  status: string
  subtotalCents: number
  platformFeeCents: number
  totalCents: number
  currency: string
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  createdAt: string
}

export type TicketRevenueTotals = {
  completedCount: number
  pendingCount: number
  failedCount: number
  grossSubtotalCents: number
  grossPlatformFeeCents: number
  grossTotalCents: number
}

export type TicketRevenueData = {
  orders: TicketRevenueOrderRow[]
  totals: TicketRevenueTotals
  events: { id: string; title: string; slug: string }[]
  serviceRoleConfigured: boolean
  loadError: string | null
}

type RawOrder = {
  id: string
  user_id: string
  event_id: string | null
  status: string
  subtotal_cents: number
  platform_fee_cents: number
  total_cents: number
  currency: string
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  created_at: string
  events: { title: string; slug: string } | { title: string; slug: string }[] | null
  order_items: Array<{
    ticket_types: { name: string } | { name: string }[] | null
  }> | null
}

function coalesce<T>(raw: T | T[] | null | undefined): T | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

function formatBuyerLabel(
  userId: string,
  displayName: string | null | undefined,
  email: string | null | undefined,
): string {
  const name = displayName?.trim()
  const mail = email?.trim()
  if (name && mail) return `${name} (${mail})`
  if (mail) return mail
  if (name) return name
  return `User ${userId.slice(0, 8)}…`
}

async function loadBuyerLabels(
  admin: ReturnType<typeof createServiceRoleClient>,
  userIds: string[],
): Promise<Map<string, string>> {
  const labels = new Map<string, string>()
  if (userIds.length === 0) return labels

  const { data: profileRows } = await admin.from("profiles").select("id, display_name").in("id", userIds)
  const profileById = new Map(
    (profileRows ?? []).map((p) => [p.id as string, (p.display_name as string | null) ?? null]),
  )

  const emailById = new Map<string, string>()
  const emailFetchLimit = 100
  for (const uid of userIds.slice(0, emailFetchLimit)) {
    try {
      const { data: authData, error } = await admin.auth.admin.getUserById(uid)
      if (!error && authData?.user?.email) {
        emailById.set(uid, authData.user.email)
      }
    } catch {
      // Best-effort — display name still shown when email lookup fails.
    }
  }

  for (const uid of userIds) {
    labels.set(uid, formatBuyerLabel(uid, profileById.get(uid), emailById.get(uid)))
  }

  return labels
}

export async function loadTicketRevenueData(eventIdFilter?: string | null): Promise<TicketRevenueData> {
  if (!isServiceRoleConfigured()) {
    return {
      orders: [],
      totals: {
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        grossSubtotalCents: 0,
        grossPlatformFeeCents: 0,
        grossTotalCents: 0,
      },
      events: [],
      serviceRoleConfigured: false,
      loadError: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server.",
    }
  }

  const admin = createServiceRoleClient()

  let query = admin
    .from("orders")
    .select(
      `id, user_id, event_id, status, subtotal_cents, platform_fee_cents, total_cents, currency,
      stripe_checkout_session_id, stripe_payment_intent_id, created_at,
      events ( title, slug ),
      order_items ( ticket_types ( name ) )`,
    )
    .gt("subtotal_cents", 0)
    .order("created_at", { ascending: false })
    .limit(500)

  if (eventIdFilter) {
    query = query.eq("event_id", eventIdFilter)
  }

  const { data, error } = await query

  if (error) {
    return {
      orders: [],
      totals: {
        completedCount: 0,
        pendingCount: 0,
        failedCount: 0,
        grossSubtotalCents: 0,
        grossPlatformFeeCents: 0,
        grossTotalCents: 0,
      },
      events: [],
      serviceRoleConfigured: true,
      loadError: error.message,
    }
  }

  const rawOrders = data as RawOrder[]
  const uniqueUserIds = [...new Set(rawOrders.map((row) => row.user_id))]
  const buyerLabels = await loadBuyerLabels(admin, uniqueUserIds)

  const orders: TicketRevenueOrderRow[] = rawOrders.map((row) => {
    const event = coalesce(row.events)
    const firstItem = row.order_items?.[0]
    const tier = firstItem ? coalesce(firstItem.ticket_types) : null

    return {
      id: row.id,
      userId: row.user_id,
      buyerLabel: buyerLabels.get(row.user_id) ?? formatBuyerLabel(row.user_id, null, null),
      eventId: row.event_id,
      eventTitle: event?.title ?? "Unknown event",
      eventSlug: event?.slug ?? null,
      tierName: tier?.name ?? "—",
      status: row.status,
      subtotalCents: row.subtotal_cents,
      platformFeeCents: row.platform_fee_cents,
      totalCents: row.total_cents,
      currency: row.currency,
      stripeCheckoutSessionId: row.stripe_checkout_session_id,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      createdAt: row.created_at,
    }
  })

  const totals: TicketRevenueTotals = {
    completedCount: 0,
    pendingCount: 0,
    failedCount: 0,
    grossSubtotalCents: 0,
    grossPlatformFeeCents: 0,
    grossTotalCents: 0,
  }

  for (const o of orders) {
    if (o.status === "completed") {
      totals.completedCount += 1
      totals.grossSubtotalCents += o.subtotalCents
      totals.grossPlatformFeeCents += o.platformFeeCents
      totals.grossTotalCents += o.totalCents
    } else if (o.status === "pending_payment") {
      totals.pendingCount += 1
    } else if (o.status === "failed" || o.status === "expired" || o.status === "cancelled") {
      totals.failedCount += 1
    }
  }

  const eventMap = new Map<string, { id: string; title: string; slug: string }>()
  for (const o of orders) {
    if (o.eventId && o.eventSlug) {
      eventMap.set(o.eventId, { id: o.eventId, title: o.eventTitle, slug: o.eventSlug })
    }
  }

  return {
    orders,
    totals,
    events: Array.from(eventMap.values()).sort((a, b) => a.title.localeCompare(b.title)),
    serviceRoleConfigured: true,
    loadError: null,
  }
}
