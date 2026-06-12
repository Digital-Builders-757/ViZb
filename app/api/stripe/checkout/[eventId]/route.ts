import { createTicketCheckoutSession } from "@/app/actions/ticket-checkout"
import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/stripe/checkout/[eventId]
 * 
 * Wrapper around the createTicketCheckoutSession server action.
 * Used by mobile clients (Flutter) to initiate Stripe Checkout for ticket purchases.
 * 
 * Request body:
 * {
 *   "ticket_type_id": "uuid"
 * }
 * 
 * Response:
 * {
 *   "url": "https://checkout.stripe.com/...",
 *   "error": "error message"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Verify authentication
    const { user } = await requireAuth()
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { eventId } = await params
    const id = eventId?.trim()
    if (!id) {
      return NextResponse.json(
        { error: "Event ID is required" },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const ticketTypeId = body.ticket_type_id?.trim()

    if (!ticketTypeId) {
      return NextResponse.json(
        { error: "Ticket type ID is required" },
        { status: 400 }
      )
    }

    // Call the server action with the event ID and ticket type ID
    const result = await createTicketCheckoutSession({
      eventId: id,
      ticketTypeId,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[stripe checkout API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
