import { createServiceRoleClient } from "@/lib/supabase/service-role"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"
import { evaluateOrganizerPayoutReleaseEligibility } from "@/lib/payments/release-organizer-payouts"
import type { OrganizerPayoutRow } from "@/lib/payments/organizer-payout-types"
import { ORGANIZER_PAYOUT_SELECT } from "@/lib/payments/organizer-payout-types"

export type AdminPaymentFilters = {
  eventId?: string
  organizerId?: string
  payoutStatus?: string
  paymentStatus?: string
  disputeStatus?: string
}

export type AdminOrderListRow = {
  id: string
  buyerLabel: string
  eventId: string | null
  eventTitle: string
  eventSlug: string | null
  organizerId: string | null
  organizerLabel: string
  tierName: string
  ticketSubtotalCents: number
  vizbServiceFeeCents: number
  processingFeeCents: number
  buyerTotalCents: number
  organizerPayoutCents: number
  paymentStatus: string
  refundStatus: string
  disputeStatus: string
  payoutStatus: string
  orderStatus: string
  payoutBlocked: boolean
  payoutBlockedReason: string | null
  stripeCheckoutSessionId: string | null
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  createdAt: string
}

export type AdminOrderDetail = AdminOrderListRow & {
  payoutReleasedAt: string | null
  currency: string
  payout: AdminPayoutListRow | null
}

export type AdminPayoutListRow = {
  id: string
  orderId: string
  eventId: string
  eventTitle: string
  eventSlug: string | null
  organizerId: string
  organizerLabel: string
  organizerPayoutCents: number
  vizbServiceFeeCents: number
  processingFeeCents: number
  buyerTotalCents: number
  status: string
  availableOn: string
  blockedReason: string | null
  failureReason: string | null
  stripeTransferId: string | null
  stripeConnectedAccountId: string | null
  paymentStatus: string
  refundStatus: string
  disputeStatus: string
  payoutBlocked: boolean
  payoutBlockedReason: string | null
  releaseEligible: boolean
  releaseBlockReason: string | null
  createdAt: string
}

export type AdminPaymentsFilterOptions = {
  events: { id: string; title: string; slug: string }[]
  organizers: { id: string; label: string }[]
}

export type AdminOrdersListData = {
  orders: AdminOrderListRow[]
  filters: AdminPaymentsFilterOptions
  serviceRoleConfigured: boolean
  loadError: string | null
}

export type AdminPayoutsListData = {
  payouts: AdminPayoutListRow[]
  filters: AdminPaymentsFilterOptions
  counts: { pending: number; blocked: number; released: number; failed: number }
  serviceRoleConfigured: boolean
  loadError: string | null
}

export type AdminOrderDetailData = {
  order: AdminOrderDetail | null
  serviceRoleConfigured: boolean
  loadError: string | null
}

type RawOrder = {
  id: string
  user_id: string
  event_id: string | null
  status: string
  ticket_subtotal_cents: number
  vizb_service_fee_cents: number
  processing_fee_cents: number
  buyer_total_cents: number
  organizer_payout_cents: number
  payment_status: string
  refund_status: string
  dispute_status: string
  payout_status: string
  payout_blocked: boolean
  payout_blocked_reason: string | null
  payout_released_at: string | null
  currency: string
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  created_at: string
  events:
    | { id: string; title: string; slug: string; created_by: string | null }
    | { id: string; title: string; slug: string; created_by: string | null }[]
    | null
  order_items: Array<{
    ticket_types: { name: string } | { name: string }[] | null
  }> | null
}

function coalesce<T>(raw: T | T[] | null | undefined): T | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

function formatPersonLabel(
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

async function loadPersonLabels(
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
  for (const uid of userIds.slice(0, 100)) {
    try {
      const { data: authData, error } = await admin.auth.admin.getUserById(uid)
      if (!error && authData?.user?.email) {
        emailById.set(uid, authData.user.email)
      }
    } catch {
      // Best-effort email lookup.
    }
  }

  for (const uid of userIds) {
    labels.set(uid, formatPersonLabel(uid, profileById.get(uid), emailById.get(uid)))
  }

  return labels
}

function mapOrderRow(row: RawOrder, buyerLabels: Map<string, string>, organizerLabels: Map<string, string>): AdminOrderListRow {
  const event = coalesce(row.events)
  const firstItem = row.order_items?.[0]
  const tier = firstItem ? coalesce(firstItem.ticket_types) : null
  const organizerId = event?.created_by ?? null

  return {
    id: row.id,
    buyerLabel: buyerLabels.get(row.user_id) ?? formatPersonLabel(row.user_id, null, null),
    eventId: row.event_id,
    eventTitle: event?.title ?? "Unknown event",
    eventSlug: event?.slug ?? null,
    organizerId,
    organizerLabel: organizerId ? organizerLabels.get(organizerId) ?? formatPersonLabel(organizerId, null, null) : "—",
    tierName: tier?.name ?? "—",
    ticketSubtotalCents: row.ticket_subtotal_cents,
    vizbServiceFeeCents: row.vizb_service_fee_cents,
    processingFeeCents: row.processing_fee_cents,
    buyerTotalCents: row.buyer_total_cents,
    organizerPayoutCents: row.organizer_payout_cents,
    paymentStatus: row.payment_status,
    refundStatus: row.refund_status,
    disputeStatus: row.dispute_status,
    payoutStatus: row.payout_status,
    orderStatus: row.status,
    payoutBlocked: row.payout_blocked,
    payoutBlockedReason: row.payout_blocked_reason,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeChargeId: row.stripe_charge_id,
    createdAt: row.created_at,
  }
}

const ORDER_SELECT = `
  id, user_id, event_id, status,
  ticket_subtotal_cents, vizb_service_fee_cents, processing_fee_cents, buyer_total_cents, organizer_payout_cents,
  payment_status, refund_status, dispute_status, payout_status,
  payout_blocked, payout_blocked_reason, payout_released_at, currency,
  stripe_checkout_session_id, stripe_payment_intent_id, stripe_charge_id, created_at,
  events ( id, title, slug, created_by ),
  order_items ( ticket_types ( name ) )
`

function emptyFilterOptions(): AdminPaymentsFilterOptions {
  return { events: [], organizers: [] }
}

function buildFilterOptionsFromOrders(orders: AdminOrderListRow[]): AdminPaymentsFilterOptions {
  const events = new Map<string, { id: string; title: string; slug: string }>()
  const organizers = new Map<string, { id: string; label: string }>()

  for (const order of orders) {
    if (order.eventId && order.eventSlug) {
      events.set(order.eventId, { id: order.eventId, title: order.eventTitle, slug: order.eventSlug })
    }
    if (order.organizerId) {
      organizers.set(order.organizerId, { id: order.organizerId, label: order.organizerLabel })
    }
  }

  return {
    events: Array.from(events.values()).sort((a, b) => a.title.localeCompare(b.title)),
    organizers: Array.from(organizers.values()).sort((a, b) => a.label.localeCompare(b.label)),
  }
}

export async function loadAdminOrdersList(filters: AdminPaymentFilters = {}): Promise<AdminOrdersListData> {
  if (!isServiceRoleConfigured()) {
    return {
      orders: [],
      filters: emptyFilterOptions(),
      serviceRoleConfigured: false,
      loadError: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server.",
    }
  }

  const admin = createServiceRoleClient()

  let query = admin
    .from("orders")
    .select(ORDER_SELECT)
    .gt("ticket_subtotal_cents", 0)
    .order("created_at", { ascending: false })
    .limit(500)

  if (filters.eventId) query = query.eq("event_id", filters.eventId)
  if (filters.paymentStatus) query = query.eq("payment_status", filters.paymentStatus)
  if (filters.disputeStatus) query = query.eq("dispute_status", filters.disputeStatus)
  if (filters.payoutStatus) query = query.eq("payout_status", filters.payoutStatus)

  const { data, error } = await query

  if (error) {
    return {
      orders: [],
      filters: emptyFilterOptions(),
      serviceRoleConfigured: true,
      loadError: error.message,
    }
  }

  const rawOrders = data as RawOrder[]
  const buyerIds = [...new Set(rawOrders.map((row) => row.user_id))]
  const organizerIds = [
    ...new Set(
      rawOrders
        .map((row) => coalesce(row.events)?.created_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  const [buyerLabels, organizerLabels] = await Promise.all([
    loadPersonLabels(admin, buyerIds),
    loadPersonLabels(admin, organizerIds),
  ])

  let orders = rawOrders.map((row) => mapOrderRow(row, buyerLabels, organizerLabels))

  if (filters.organizerId) {
    orders = orders.filter((order) => order.organizerId === filters.organizerId)
  }

  return {
    orders,
    filters: buildFilterOptionsFromOrders(orders),
    serviceRoleConfigured: true,
    loadError: null,
  }
}

export async function loadAdminOrderDetail(orderId: string): Promise<AdminOrderDetailData> {
  if (!isServiceRoleConfigured()) {
    return { order: null, serviceRoleConfigured: false, loadError: "SUPABASE_SERVICE_ROLE_KEY is not configured." }
  }

  const admin = createServiceRoleClient()

  const { data, error } = await admin.from("orders").select(ORDER_SELECT).eq("id", orderId).maybeSingle()

  if (error) {
    return { order: null, serviceRoleConfigured: true, loadError: error.message }
  }

  if (!data) {
    return { order: null, serviceRoleConfigured: true, loadError: null }
  }

  const row = data as RawOrder
  const organizerId = coalesce(row.events)?.created_by ?? null
  const [buyerLabels, organizerLabels] = await Promise.all([
    loadPersonLabels(admin, [row.user_id]),
    loadPersonLabels(admin, organizerId ? [organizerId] : []),
  ])

  const base = mapOrderRow(row, buyerLabels, organizerLabels)

  const { data: payoutRow } = await admin
    .from("organizer_payouts")
    .select(ORGANIZER_PAYOUT_SELECT)
    .eq("order_id", orderId)
    .maybeSingle()

  let payout: AdminPayoutListRow | null = null
  if (payoutRow) {
    const payoutsData = await loadAdminPayoutsList({}, orderId)
    payout = payoutsData.payouts[0] ?? null
  }

  return {
    order: {
      ...base,
      payoutReleasedAt: row.payout_released_at,
      currency: row.currency,
      payout,
    },
    serviceRoleConfigured: true,
    loadError: null,
  }
}

export async function loadAdminPayoutsList(
  filters: AdminPaymentFilters = {},
  orderIdFilter?: string,
): Promise<AdminPayoutsListData> {
  if (!isServiceRoleConfigured()) {
    return {
      payouts: [],
      filters: emptyFilterOptions(),
      counts: { pending: 0, blocked: 0, released: 0, failed: 0 },
      serviceRoleConfigured: false,
      loadError: "SUPABASE_SERVICE_ROLE_KEY is not configured on the server.",
    }
  }

  const admin = createServiceRoleClient()

  let query = admin
    .from("organizer_payouts")
    .select(`${ORGANIZER_PAYOUT_SELECT}, events ( title, slug ), orders ( payment_status, refund_status, dispute_status, payout_blocked, payout_blocked_reason, payout_released_at, stripe_charge_id, stripe_payment_intent_id, status )`)
    .order("created_at", { ascending: false })
    .limit(500)

  if (filters.eventId) query = query.eq("event_id", filters.eventId)
  if (filters.organizerId) query = query.eq("organizer_id", filters.organizerId)
  if (filters.payoutStatus) query = query.eq("status", filters.payoutStatus)
  if (orderIdFilter) query = query.eq("order_id", orderIdFilter)

  const { data, error } = await query

  if (error) {
    return {
      payouts: [],
      filters: emptyFilterOptions(),
      counts: { pending: 0, blocked: 0, released: 0, failed: 0 },
      serviceRoleConfigured: true,
      loadError: error.message,
    }
  }

  type RawPayout = OrganizerPayoutRow & {
    events: { title: string; slug: string } | { title: string; slug: string }[] | null
    orders:
      | {
          payment_status: string
          refund_status: string
          dispute_status: string
          payout_blocked: boolean
          payout_blocked_reason: string | null
          payout_released_at: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          status: string
        }
      | Array<{
          payment_status: string
          refund_status: string
          dispute_status: string
          payout_blocked: boolean
          payout_blocked_reason: string | null
          payout_released_at: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          status: string
        }>
      | null
  }

  const rawPayouts = (data ?? []) as RawPayout[]
  const organizerIds = [...new Set(rawPayouts.map((row) => row.organizer_id))]
  const organizerLabels = await loadPersonLabels(admin, organizerIds)

  const counts = { pending: 0, blocked: 0, released: 0, failed: 0 }

  let payouts: AdminPayoutListRow[] = rawPayouts.map((row) => {
    const event = coalesce(row.events)
    const order = coalesce(row.orders)
    counts[row.status as keyof typeof counts] = (counts[row.status as keyof typeof counts] ?? 0) + 1

    const eligibility =
      order != null
        ? evaluateOrganizerPayoutReleaseEligibility(row, {
            id: row.order_id,
            status: order.status,
            payment_status: order.payment_status,
            refund_status: order.refund_status,
            dispute_status: order.dispute_status,
            payout_blocked: order.payout_blocked,
            payout_blocked_reason: order.payout_blocked_reason,
            payout_released_at: order.payout_released_at,
            stripe_charge_id: order.stripe_charge_id,
            stripe_payment_intent_id: order.stripe_payment_intent_id,
          })
        : { eligible: false, blockReason: "order_missing" }

    return {
      id: row.id,
      orderId: row.order_id,
      eventId: row.event_id,
      eventTitle: event?.title ?? "Unknown event",
      eventSlug: event?.slug ?? null,
      organizerId: row.organizer_id,
      organizerLabel: organizerLabels.get(row.organizer_id) ?? formatPersonLabel(row.organizer_id, null, null),
      organizerPayoutCents: row.organizer_payout_cents,
      vizbServiceFeeCents: row.vizb_service_fee_cents,
      processingFeeCents: row.processing_fee_cents,
      buyerTotalCents: row.buyer_total_cents,
      status: row.status,
      availableOn: row.available_on,
      blockedReason: row.blocked_reason,
      failureReason: row.failure_reason,
      stripeTransferId: row.stripe_transfer_id,
      stripeConnectedAccountId: row.stripe_connected_account_id,
      paymentStatus: order?.payment_status ?? "—",
      refundStatus: order?.refund_status ?? "—",
      disputeStatus: order?.dispute_status ?? "—",
      payoutBlocked: order?.payout_blocked ?? false,
      payoutBlockedReason: order?.payout_blocked_reason ?? null,
      releaseEligible: eligibility.eligible,
      releaseBlockReason: eligibility.blockReason,
      createdAt: row.created_at,
    }
  })

  if (filters.paymentStatus) {
    payouts = payouts.filter((p) => p.paymentStatus === filters.paymentStatus)
  }
  if (filters.disputeStatus) {
    payouts = payouts.filter((p) => p.disputeStatus === filters.disputeStatus)
  }

  const filterOptions: AdminPaymentsFilterOptions = {
    events: [],
    organizers: [],
  }
  const eventMap = new Map<string, { id: string; title: string; slug: string }>()
  const organizerMap = new Map<string, { id: string; label: string }>()
  for (const payout of payouts) {
    if (payout.eventSlug) {
      eventMap.set(payout.eventId, { id: payout.eventId, title: payout.eventTitle, slug: payout.eventSlug })
    }
    organizerMap.set(payout.organizerId, { id: payout.organizerId, label: payout.organizerLabel })
  }
  filterOptions.events = Array.from(eventMap.values()).sort((a, b) => a.title.localeCompare(b.title))
  filterOptions.organizers = Array.from(organizerMap.values()).sort((a, b) => a.label.localeCompare(b.label))

  return {
    payouts,
    filters: filterOptions,
    counts,
    serviceRoleConfigured: true,
    loadError: null,
  }
}
