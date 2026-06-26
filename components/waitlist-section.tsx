"use client"

import type React from "react"
import { useState } from "react"
import { Loader2 } from "lucide-react"
import { subscribeToWaitlist } from "@/app/actions/subscribe"
import { OceanDivider } from "@/components/ui/ocean-divider"
import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonButton } from "@/components/ui/neon-button"

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
    <section id="waitlist" className="relative overflow-hidden px-5 py-16 sm:px-8 md:py-24">
      <OceanDivider variant="soft" density="sparse" withLine className="relative z-[2]" />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(1400px circle at 20% 20%, rgba(0,209,255,0.20), transparent 55%), radial-gradient(1200px circle at 80% 70%, rgba(157,77,255,0.18), transparent 60%), linear-gradient(to bottom, rgba(7,10,18,0.92), rgba(7,10,18,0.78))",
        }}
        aria-hidden
      />

      <div className="relative mx-auto max-w-[1200px]">
        <div className="mx-auto max-w-2xl text-center">
          <span className="font-mono text-xs uppercase tracking-normal text-[color:var(--neon-a)]">
            Stay connected
          </span>
          <h2 className="mt-4 text-balance font-serif text-4xl font-bold leading-[0.95] text-[color:var(--neon-text0)] sm:text-5xl md:text-6xl">
            Get the <span className="neon-gradient-text">drop</span>
          </h2>
          <p className="mx-auto mt-7 max-w-prose text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
            New events, pop-ups, collaborations, and culture notes from the local current.
          </p>

          {submitted ? (
            <EmptyStateCard
              className="mt-10 text-left"
              kicker="Confirmed"
              title="You're on the list"
              description={message}
            />
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="vibe-focus-ring h-12 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 px-4 text-sm text-[color:var(--neon-text0)] backdrop-blur placeholder:text-[color:var(--neon-text2)] focus-visible:border-[color:var(--neon-a)]/55 disabled:opacity-50"
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={loading}
                  className="vibe-focus-ring h-12 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 px-4 text-sm text-[color:var(--neon-text0)] backdrop-blur placeholder:text-[color:var(--neon-text2)] focus-visible:border-[color:var(--neon-a)]/55 disabled:opacity-50"
                />
              </div>

              <NeonButton type="submit" disabled={loading} fullWidth shape="pill" className="min-h-11">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subscribing...
                  </>
                ) : (
                  "Subscribe"
                )}
              </NeonButton>
            </form>
          )}

          <p className="mt-6 font-mono text-[10px] uppercase tracking-normal text-[color:var(--neon-text2)]">
            No spam. Ever.
          </p>
        </div>
      </div>
    </section>
  )
}
