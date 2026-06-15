import { createTicketCheckoutSession } from "@/app/actions/ticket-checkout"
import { requireAuthApiFromHeader } from "@/lib/auth-helpers"
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
 * Request headers:
 * {
 *   "Authorization": "Bearer <supabase_access_token>"
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
    // Verify authentication from Authorization header
    const authHeader = request.headers.get("Authorization")
    const { user, error: authError } = await requireAuthApiFromHeader(authHeader)
    
    if (!user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
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

    // DEBUG logging
    console.log('[stripe checkout] API Request Debug:')
    console.log('  User ID:', user.id)
    console.log('  User Email:', user.email)
    console.log('  Event ID:', id)
    console.log('  Ticket Type ID:', ticketTypeId)
    console.log('  Request Body:', JSON.stringify(body))

    // Call the server action with the event ID and ticket type ID
    console.log('[stripe checkout] Calling createTicketCheckoutSession...')
    const result = await createTicketCheckoutSession(
      {
        eventId: id,
        ticketTypeId,
      },
      { id: user.id, email: user.email }
    )
    
    console.log('[stripe checkout] Server action returned:', result)

    return NextResponse.json(result)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("[stripe checkout API] Error:", errorMessage)
    console.error("[stripe checkout API] Full error:", error)
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}