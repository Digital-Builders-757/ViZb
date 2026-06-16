export const ORGANIZER_PAYOUT_STATUS = {
  pending: "pending",
  blocked: "blocked",
  releasing: "releasing",
  released: "released",
  failed: "failed",
} as const

export type OrganizerPayoutStatus = (typeof ORGANIZER_PAYOUT_STATUS)[keyof typeof ORGANIZER_PAYOUT_STATUS]

export const ORGANIZER_PAYOUT_BLOCKED_REASON = {
  refund: "refund",
  dispute: "dispute",
  canceled: "canceled",
  manual: "manual",
  organizerNotReady: "organizer_not_ready",
} as const

export type OrganizerPayoutBlockedReason =
  (typeof ORGANIZER_PAYOUT_BLOCKED_REASON)[keyof typeof ORGANIZER_PAYOUT_BLOCKED_REASON]

export type OrganizerPayoutRow = {
  id: string
  order_id: string
  event_id: string
  organizer_id: string
  stripe_connected_account_id: string | null
  organizer_payout_cents: number
  vizb_service_fee_cents: number
  processing_fee_cents: number
  buyer_total_cents: number
  status: OrganizerPayoutStatus
  available_on: string
  stripe_transfer_id: string | null
  blocked_reason: string | null
  failure_reason: string | null
  created_at: string
  updated_at: string
}

export const ORGANIZER_PAYOUT_SELECT =
  "id, order_id, event_id, organizer_id, stripe_connected_account_id, organizer_payout_cents, vizb_service_fee_cents, processing_fee_cents, buyer_total_cents, status, available_on, stripe_transfer_id, blocked_reason, failure_reason, created_at, updated_at"
