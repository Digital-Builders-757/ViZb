"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { AuthAlert } from "@/components/auth/auth-alert"
import { mapAuthError, type MappedAuthError } from "@/lib/auth/auth-error-map"
import { PENDING_VERIFY_EMAIL_KEY } from "@/lib/auth/pending-verify-email"
import { supportMailtoHref } from "@/lib/auth/support-contact"

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [authIssue, setAuthIssue] = useState<MappedAuthError | null>(null)
  const [fieldErrors, setFieldErrors] = useState<{
    displayName?: string
    email?: string
    password?: string
  }>({})
  const [validationBanner, setValidationBanner] = useState<{ title: string; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function clearServerIssue() {
    setAuthIssue(null)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setAuthIssue(null)
    setFieldErrors({})
    setValidationBanner(null)

    const name = displayName.trim()
    const em = email.trim()
    const errs: typeof fieldErrors = {}
    if (!name) errs.displayName = "Add the name you want other members to see."
    if (!emailOk(em)) errs.email = "Enter a valid email address."
    if (password.length < 6) {
      errs.password = "Use at least 6 characters for your password."
    }
    if (Object.keys(errs).length) {
      setFieldErrors(errs)
      setValidationBanner({
        title: "Fix a few things",
        message: "Check the highlighted fields and try again.",
      })
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email: em,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
          `${window.location.origin}/auth/callback`,
        data: {
          display_name: name,
        },
      },
    })

    if (error) {
      setAuthIssue(
        mapAuthError(error, "signup", {
          onNetworkRetry: () => setAuthIssue(null),
          onGenericRetry: () => setAuthIssue(null),
        }),
      )
      setLoading(false)
      return
    }

    try {
      sessionStorage.setItem(PENDING_VERIFY_EMAIL_KEY, em)
    } catch {
      /* ignore */
    }

    router.push("/auth/sign-up-success")
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side -- brand moment */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center border-r border-border overflow-hidden">
        <Image
          src="/curated-events-crowd.jpg"
          alt="VIZB Events"
          fill
          className="object-cover opacity-40"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="relative z-10 px-16">
          <h1 className="headline-lg text-foreground uppercase">
            Join
            <br />
            The
            <br />
            <span className="neon-gradient-text">Movement</span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-md leading-relaxed">
            Create your account and start discovering events, connecting with creators, and building community.
          </p>
        </div>
      </div>

      {/* Right side -- form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="inline-block mb-12">
            <Image
              src="/vibe-logo.png"
              alt="VIZB"
              width={48}
              height={48}
              className="h-12 w-auto"
            />
          </Link>

          {/* Header */}
          <span className="text-xs uppercase tracking-widest text-primary font-mono">Create Account</span>
          <h2 className="font-serif text-3xl font-bold text-foreground mt-2">Sign Up</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>

          {/* Form */}
          <form onSubmit={handleSignUp} className="mt-10 space-y-6">
            <div className="min-h-0 space-y-4">
              {validationBanner ? (
                <AuthAlert variant="warning" title={validationBanner.title} message={validationBanner.message} />
              ) : null}

              {authIssue ? (
                <>
                  <AuthAlert
                    variant={authIssue.severity === "warning" ? "warning" : "error"}
                    title={authIssue.title}
                    message={authIssue.message}
                    hint={authIssue.hint}
                    mapped={{
                      primaryAction: authIssue.primaryAction,
                      secondaryAction: authIssue.secondaryAction,
                    }}
                  />
                  {authIssue.code !== "account_exists" ? (
                    <p className="text-center text-sm text-muted-foreground">
                      <button
                        type="button"
                        className="font-mono text-primary underline decoration-border underline-offset-4 hover:decoration-primary"
                        onClick={clearServerIssue}
                      >
                        Try again
                      </button>
                      <span className="mx-2 text-border" aria-hidden>
                        ·
                      </span>
                      <a
                        href={supportMailtoHref("VIZB sign-up help")}
                        className="font-mono text-primary underline decoration-border underline-offset-4 hover:decoration-primary"
                      >
                        Contact support
                      </a>
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="display-name"
                className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2"
              >
                Display Name <span className="text-primary">*</span>
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="What should we call you?"
                aria-invalid={!!fieldErrors.displayName}
                className="vibe-focus-ring w-full rounded-md bg-input border-0 px-4 py-3 text-foreground placeholder:text-muted-foreground"
              />
              {fieldErrors.displayName ? (
                <p className="mt-2 text-sm text-destructive">{fieldErrors.displayName}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                aria-invalid={!!fieldErrors.email}
                className="vibe-focus-ring w-full rounded-md bg-input border-0 px-4 py-3 text-foreground placeholder:text-muted-foreground"
              />
              {fieldErrors.email ? (
                <p className="mt-2 text-sm text-destructive">{fieldErrors.email}</p>
              ) : null}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="At least 6 characters"
                aria-invalid={!!fieldErrors.password}
                className="vibe-focus-ring w-full rounded-md bg-input border-0 px-4 py-3 text-foreground placeholder:text-muted-foreground"
              />
              {fieldErrors.password ? (
                <p className="mt-2 text-sm text-destructive">{fieldErrors.password}</p>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  Use at least 6 characters. Longer phrases with numbers or symbols are more secure.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="vibe-focus-ring w-full bg-primary text-background px-8 py-4 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(13,64,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Back to landing */}
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
