"use server"

import { createClient } from "@/lib/supabase/server"

export async function subscribeToWaitlist(email: string, phoneNumber?: string) {
  const supabase = await createClient()

  // Check if email already exists
  const { data: existing } = await supabase
    .from("subscribers")
    .select("email")
    .eq("email", email.toLowerCase())
    .single()

  if (existing) {
    return { success: true, message: "You're already on the list!" }
  }

  const { error } = await supabase.from("subscribers").insert({
    email: email.toLowerCase(),
    phone_number: phoneNumber || null,
    source: "website_waitlist",
  })

  if (error) {
    console.error("Subscription error:", error)
    return { success: false, message: "Something went wrong. Try again." }
  }

  return { success: true, message: "You're on the list!" }
}
