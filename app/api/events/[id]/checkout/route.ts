import { createTicketCheckoutSession } from "@/app/actions/ticket-checkout"
import { requireAuth } from "@/lib/auth-helpers"
import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/events/[id]/checkout
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
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params
    const eventId = id?.trim()
    if (!eventId) {
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
      eventId,
      ticketTypeId,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[checkout API] Error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
