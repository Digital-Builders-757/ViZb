"use client"

import type React from "react"
import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { subscribeToWaitlist } from "@/app/actions/subscribe"

export function WaitlistSection() {
  const [email, setEmail] = useState("")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)

    const result = await subscribeToWaitlist(email, phoneNumber)

    setLoading(false)
    setMessage(result.message)

    if (result.success) {
      setSubmitted(true)
    }
  }

  return (
    <section id="waitlist" className="py-24 px-4 sm:px-8 bg-foreground text-background">
      <div className="max-w-[1800px] mx-auto">
        <div className="max-w-2xl mx-auto text-center">
          <span className="text-xs uppercase tracking-widest text-primary font-mono">Stay Connected</span>
          <h2 className="headline-lg text-background uppercase mt-4">
            <span className="neon-gradient-text">Join</span> The
            <br />
            Movement
          </h2>
          <p className="text-lg text-background/70 mt-8">
            New events. Pop-ups. Collaborations. No spam. Just the good stuff.
          </p>

          {submitted ? (
            <div className="mt-12 p-8 bg-background text-foreground">
              <CheckCircle2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-bold uppercase">You're On The List</h3>
              <p className="mt-2 text-muted-foreground">{message}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-12 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row gap-0">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="flex-1 h-14 bg-background text-foreground px-6 border-0 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground disabled:opacity-50"
                />
                <input
                  type="tel"
                  placeholder="Phone number (optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  className="flex-1 h-14 bg-background text-foreground px-6 border-0 focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-muted-foreground disabled:opacity-50 sm:border-l sm:border-muted"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="h-14 px-8 bg-primary text-background text-xs uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining...
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-xs text-background/50 uppercase tracking-widest">No spam, ever.</p>
        </div>
      </div>
    </section>
  )
}
