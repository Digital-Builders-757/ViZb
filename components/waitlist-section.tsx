"use client"

import type React from "react"
import { useState } from "react"
import { CheckCircle2, Loader2 } from "lucide-react"
import { subscribeToWaitlist } from "@/app/actions/subscribe"
import { OceanDivider } from "@/components/ui/ocean-divider"

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
    <section id="waitlist" className="relative overflow-hidden px-4 py-20 sm:px-8 md:py-28">
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
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
            Stay connected
          </span>
          <h2 className="mt-4 font-serif text-5xl font-bold leading-[0.92] text-[color:var(--neon-text0)] sm:text-6xl">
            <span className="neon-gradient-text">Join</span> the
            <br />
            movement
          </h2>
          <p className="mt-7 text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
            New events. Pop-ups. Collaborations. No spam. Just the good stuff.
          </p>

          {submitted ? (
            <div className="mt-10 overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 p-8 text-left backdrop-blur">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/35 text-[color:var(--neon-a)] shadow-[0_0_18px_rgba(0,209,255,0.18)]">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-serif text-xl font-bold text-[color:var(--neon-text0)]">You&apos;re on the list</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[color:var(--neon-text1)]">
                    {message}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
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

              <button
                type="submit"
                disabled={loading}
                className="vibe-focus-ring inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--neon-a)] px-8 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-bg0)] shadow-[0_0_30px_rgba(0,209,255,0.26)] transition hover:brightness-110 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Subscribing…
                  </>
                ) : (
                  "Subscribe"
                )}
              </button>
            </form>
          )}

          <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            No spam. Ever.
          </p>
        </div>
      </div>
    </section>
  )
}
