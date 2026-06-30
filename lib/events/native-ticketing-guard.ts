import { isCommunityEvent } from "@/lib/events/event-kind"

export type NativeTicketingBoundaryEvent = {
  event_kind?: string | null
  source?: string | null
  import_status?: string | null
  external_rsvp_url?: string | null
}

export type NativeTicketingBoundaryResult = { ok: true } | { ok: false; error: string }

export const NATIVE_TICKETING_CLAIM_REQUIRED_MESSAGE =
  "This listing uses external RSVP until an organizer claim is approved and the event is converted to ViZb-native management."

export function assertNativeTicketingAllowed(event: NativeTicketingBoundaryEvent): NativeTicketingBoundaryResult {
  if (isCommunityEvent(event.event_kind)) {
    return { ok: false, error: NATIVE_TICKETING_CLAIM_REQUIRED_MESSAGE }
  }

  if (event.source || event.import_status) {
    return { ok: false, error: NATIVE_TICKETING_CLAIM_REQUIRED_MESSAGE }
  }

  return { ok: true }
}
