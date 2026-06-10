"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"

import { FullLogoImage } from "@/components/brand/full-logo-image"
import { AuthAlert } from "@/components/auth/auth-alert"
import { mapAuthError, type MappedAuthError } from "@/lib/auth/auth-error-map"
import { createClient } from "@/lib/supabase/client"
import { NeonButton } from "@/components/ui/neon-button"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [issue, setIssue] = useState<MappedAuthError | null>(null)
  const [fieldHint, setFieldHint] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIssue(null)
    setFieldHint(null)

    if (password.length < 6) {
      setFieldHint("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setFieldHint("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.auth.updateUser({
        password: password,
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

      await supabase.auth.signOut()
      router.push("/login?reset=success")
    } catch {
      setIssue({
        code: "unexpected_error",
        title: "Something went wrong",
        message: "An unexpected error occurred. Please try again.",
        severity: "error",
      })
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
            New
            <br />
            <span className="neon-gradient-text">Password</span>
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-[color:var(--neon-text1)]">
            Choose a strong password to secure your account.
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-12 inline-block">
            <FullLogoImage width={240} height={240} className="h-14 w-auto max-w-[min(100%,220px)]" />
          </Link>

          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Account</span>
          <h2 className="mt-2 font-serif text-3xl font-bold text-[color:var(--neon-text0)]">Reset password</h2>
          <p className="mt-2 text-sm text-[color:var(--neon-text2)]">
            Enter your new password below.
          </p>

          <form
            onSubmit={onSubmit}
            className="mt-10 space-y-5 rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/20 p-6 shadow-[var(--vibe-neon-glow-subtle)] backdrop-blur-md"
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
                htmlFor="new-password"
                className="mb-2 block font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]"
              >
                New Password
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Enter new password"
                className="vibe-input-glass vibe-focus-ring text-[color:var(--neon-text0)]"
                aria-invalid={!!fieldHint}
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]"
              >
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Confirm new password"
                className="vibe-input-glass vibe-focus-ring text-[color:var(--neon-text0)]"
                aria-invalid={!!fieldHint}
              />
              {fieldHint ? <p className="mt-2 text-sm text-destructive">{fieldHint}</p> : null}
            </div>

            <NeonButton type="submit" disabled={loading} fullWidth shape="pill" className="min-h-11">
              {loading ? "Updating…" : "Update password"}
            </NeonButton>
          </form>

          <div className="mt-8 border-t border-[color:var(--neon-hairline)] pt-6">
            <Link
              href="/login"
              className="text-xs uppercase tracking-widest text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-text0)]"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
