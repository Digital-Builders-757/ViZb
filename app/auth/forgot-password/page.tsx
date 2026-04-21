"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

import { FullLogoImage } from "@/components/brand/full-logo-image"
import { AuthAlert } from "@/components/auth/auth-alert"
import { mapAuthError, type MappedAuthError } from "@/lib/auth/auth-error-map"
import { createClient } from "@/lib/supabase/client"
import { NeonLink } from "@/components/ui/neon-link"

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [issue, setIssue] = useState<MappedAuthError | null>(null)
  const [fieldHint, setFieldHint] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIssue(null)
    setFieldHint(null)
    if (!emailOk(email)) {
      setFieldHint("Enter a valid email address.")
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const redirectTo =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      })
      if (error) {
        setIssue(
          mapAuthError(error, "reset", {
            onNetworkRetry: () => setIssue(null),
            onGenericRetry: () => setIssue(null),
          }),
        )
        return
      }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-[color:var(--neon-bg0)]">
      <div className="relative hidden overflow-hidden border-r border-[color:var(--neon-hairline)] lg:flex lg:w-1/2 lg:items-center lg:justify-center">
        <Image
          src="/community-real-connections.jpg"
          alt="VIZB Community"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--neon-bg0)] via-[color:var(--neon-bg0)]/80 to-transparent" />
        <div className="relative z-10 px-16">
          <h1 className="headline-lg uppercase text-[color:var(--neon-text0)]">
            Reset
            <br />
            <span className="neon-gradient-text">Access</span>
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-[color:var(--neon-text1)]">
            We&apos;ll email you a secure link to choose a new password.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-block mb-12">
            <FullLogoImage width={240} height={240} className="h-14 w-auto max-w-[min(100%,220px)]" />
          </Link>

          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Account</span>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[color:var(--neon-text0)]">Forgot password</h2>
          <p className="mt-2 text-sm text-[color:var(--neon-text2)]">
            Remember it?{" "}
            <Link href="/login" className="text-[color:var(--neon-a)] hover:underline">
              Sign in
            </Link>
          </p>

          {done ? (
            <div className="mt-10 space-y-6">
              <AuthAlert
                variant="success"
                title="Check your email"
                message="If an account exists for that address, we sent a reset link. Open it from the same device when you can."
              />
              <NeonLink href="/login" fullWidth shape="xl">
                Back to Sign In
              </NeonLink>
            </div>
          ) : (
            <form
              onSubmit={onSubmit}
              className="mt-10 space-y-6 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] p-6 shadow-[var(--vibe-neon-glow-subtle)] backdrop-blur-md"
            >
              {issue ? (
                <AuthAlert
                  variant={issue.severity === "warning" ? "warning" : "error"}
                  title={issue.title}
                  message={issue.message}
                  hint={issue.hint}
                  mapped={{
                    primaryAction: issue.primaryAction,
                    secondaryAction: issue.secondaryAction,
                  }}
                />
              ) : null}

              <div>
                <label
                  htmlFor="reset-email"
                  className="mb-2 block font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]"
                >
                  Email
                </label>
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="vibe-input-glass vibe-focus-ring text-[color:var(--neon-text0)]"
                  aria-invalid={!!fieldHint}
                />
                {fieldHint ? <p className="mt-2 text-sm text-destructive">{fieldHint}</p> : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="vibe-cta-gradient vibe-focus-ring w-full rounded-lg px-8 py-4 text-xs font-bold uppercase tracking-widest disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <div className="mt-8 border-t border-[color:var(--neon-hairline)] pt-6">
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-text0)]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
