"use server"

import { requireAuth } from "@/lib/auth-helpers"
import { getStripe } from "@/lib/stripe/server"
import { isStripeCheckoutConfigured } from "@/lib/stripe/env"
import { registrationStatusFromJoin } from "@/lib/tickets/registration-status-from-row"

function siteOriginFromEnv(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000"
  return raw.replace(/\/$/, "")
}

export async function createTicketCheckoutSession(params: {
  eventId: string
  ticketTypeId: string
}): Promise<{ url?: string; error?: string }> {
  if (!isStripeCheckoutConfigured()) {
    return { error: "Online checkout is not configured yet." }
  }

  const eventId = String(params.eventId ?? "").trim()
  const ticketTypeId = String(params.ticketTypeId ?? "").trim()
  if (!eventId || !ticketTypeId) return { error: "Missing event or ticket type." }

  const { user, supabase } = await requireAuth()

  const { data: tt, error: ttErr } = await supabase
    .from("ticket_types")
    .select("id, event_id, name, price_cents, currency, capacity, sales_starts_at, sales_ends_at")
    .eq("id", ticketTypeId)
    .eq("event_id", eventId)
    .maybeSingle()

  if (ttErr || !tt) {
    return { error: ttErr ? ttErr.message : "Ticket type not found." }
  }

  const price = typeof tt.price_cents === "number" ? tt.price_cents : Number(tt.price_cents)
  if (!Number.isFinite(price) || price < 1) {
    return { error: "This tier is free — use RSVP instead." }
  }

  const now = new Date()
  if (tt.sales_starts_at && new Date(tt.sales_starts_at) > now) {
    return { error: "This tier is not on sale yet." }
  }
  if (tt.sales_ends_at && new Date(tt.sales_ends_at) < now) {
    return { error: "Sales have ended for this tier." }
  }

  const { data: eventRow, error: evErr } = await supabase
    .from("events")
    .select("id, status, slug, title, rsvp_capacity")
    .eq("id", eventId)
    .maybeSingle()

  if (evErr || !eventRow || eventRow.status !== "published") {
    return { error: "This event is not available for purchase." }
  }

  if (eventRow.rsvp_capacity != null) {
    const { data: occRaw, error: occErr } = await supabase.rpc("published_event_rsvp_occupied_count", {
      p_event_id: eventId,
    })
    if (occErr) return { error: `Could not verify capacity: ${occErr.message}` }
    const occupied = typeof occRaw === "number" ? occRaw : Number(occRaw)
    if (Number.isFinite(occupied) && occupied >= eventRow.rsvp_capacity) {
      return { error: "This event is at capacity." }
    }
  }

  if (tt.capacity != null) {
    const cap = tt.capacity
    const { data: soldRows, error: cntErr } = await supabase
      .from("tickets")
      .select("event_registrations!inner ( status )")
      .eq("ticket_type_id", ticketTypeId)

    if (cntErr) return { error: `Could not verify tier capacity: ${cntErr.message}` }

    const sold = (soldRows ?? []).filter((row) => {
      const st = registrationStatusFromJoin(row.event_registrations)
      return st === "confirmed" || st === "checked_in"
    }).length

    if (sold >= cap) {
      return { error: "This tier is sold out." }
    }
  }

  const { data: reg, error: regErr } = await supabase
    .from("event_registrations")
    .select("id, status")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (regErr) return { error: regErr.message }

  if (reg?.status === "checked_in") {
    return { error: "You are already checked in for this event." }
  }

  if (reg?.status === "confirmed" || reg?.status === "checked_in") {
    const { count: tCount, error: tErr } = await supabase
      .from("tickets")
      .select("id", { count: "exact", head: true })
      .eq("event_registration_id", reg.id)

    if (tErr) return { error: tErr.message }
    if ((tCount ?? 0) > 0) {
      return { error: "You already have a ticket for this event." }
    }
  }

  const currency = (typeof tt.currency === "string" && tt.currency ? tt.currency : "usd").toLowerCase()
  if (currency !== "usd") {
    return { error: "Only USD checkout is supported right now." }
  }

  const origin = siteOriginFromEnv()
  const slug = String(eventRow.slug)
  const productName = `${String(eventRow.title)} — ${String(tt.name)}`

  const stripe = getStripe()
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email ?? undefined,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      event_id: eventId,
      ticket_type_id: ticketTypeId,
    },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: price,
          product_data: {
            name: productName,
          },
        },
      },
    ],
    success_url: `${origin}/events/${slug}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/events/${slug}?checkout=cancelled`,
  })

  if (!session.url) {
    return { error: "Could not start checkout session." }
  }

  return { url: session.url }
}

