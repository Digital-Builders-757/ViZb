"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"

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
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center border-r border-border overflow-hidden">
        <Image
          src="/community-real-connections.jpg"
          alt="VIZB Community"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 px-16">
          <h1 className="headline-lg text-foreground uppercase">
            Reset
            <br />
            <span className="neon-gradient-text">Access</span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-md leading-relaxed">
            We&apos;ll email you a secure link to choose a new password.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-block mb-12">
            <Image src="/vibe-logo.png" alt="VIZB" width={48} height={48} className="h-12 w-auto" />
          </Link>

          <span className="text-xs uppercase tracking-widest text-primary font-mono">Account</span>
          <h2 className="font-serif text-3xl font-bold text-foreground mt-2">Forgot password</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Remember it?{" "}
            <Link href="/login" className="text-primary hover:underline">
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
            <form onSubmit={onSubmit} className="mt-10 space-y-6">
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
                  className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2"
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
                  className="vibe-focus-ring w-full rounded-md bg-input border-0 px-4 py-3 text-foreground placeholder:text-muted-foreground"
                  aria-invalid={!!fieldHint}
                />
                {fieldHint ? <p className="mt-2 text-sm text-destructive">{fieldHint}</p> : null}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="vibe-focus-ring w-full bg-primary text-background px-8 py-4 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(13,64,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-border">
            <Link
              href="/"
              className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
