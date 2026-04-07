"use client"

import { useState, useMemo } from "react"
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

  // Generate bubbles for background animation
  const bubbles = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    x: (i * 6.7 % 1) * 100,
    size: 4 + (i * 3.1 % 1) * 12,
    delay: (i * 2.3 % 1) * 5,
    duration: 8 + (i * 4.7 % 1) * 6,
  })), [])

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
    <div className="min-h-screen bg-[color:var(--neon-bg0)] flex relative overflow-hidden">
      {/* Ocean gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--neon-a)]/10 via-transparent to-[color:var(--neon-b)]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_40%,rgba(0,209,255,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_60%,rgba(157,77,255,0.06),transparent)]" />
      </div>

      {/* Animated bubbles */}
      <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
        {bubbles.map((bubble, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[color:var(--neon-a)]/10 border border-[color:var(--neon-a)]/20"
            style={{
              left: `${bubble.x}%`,
              bottom: "-5%",
              width: bubble.size,
              height: bubble.size,
              animation: `bubbleRise ${bubble.duration}s ease-in-out ${bubble.delay}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Left side -- brand moment with ocean styling */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden">
        <Image
          src="/curated-events-crowd.jpg"
          alt="VIZB Events"
          fill
          className="object-cover opacity-30"
          priority
        />
        {/* Ocean gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--neon-bg0)] via-[color:var(--neon-bg0)]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-a)]/20 via-transparent to-[color:var(--neon-b)]/10" />

        {/* Animated wave lines */}
        <div className="absolute bottom-0 left-0 right-0 h-32 overflow-hidden">
          <svg className="absolute bottom-0 w-full h-24 opacity-30" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path
              d="M0,60 C150,90 350,30 500,60 C650,90 850,30 1000,60 C1150,90 1200,60 1200,60 L1200,120 L0,120 Z"
              fill="url(#waveGradient)"
              className="animate-[wave_8s_ease-in-out_infinite]"
            />
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--neon-a)" />
                <stop offset="50%" stopColor="var(--neon-b)" />
                <stop offset="100%" stopColor="var(--neon-a)" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Neon border accent */}
        <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-[color:var(--neon-a)]/50 to-transparent" />

        <div className="relative z-10 px-16">
          <h1 className="headline-lg text-[color:var(--neon-text0)] uppercase">
            Join
            <br />
            The
            <br />
            <span className="neon-gradient-text">Movement</span>
          </h1>
          <p className="text-[color:var(--neon-text1)] mt-6 max-w-md leading-relaxed">
            Create your account and start discovering events, connecting with creators, and building community.
          </p>

          {/* Decorative neon element */}
          <div className="mt-10 flex items-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] shadow-[0_0_10px_rgba(0,209,255,0.5)]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)]">Virginia&apos;s Culture Hub</span>
          </div>
        </div>
      </div>

      {/* Right side -- form with glass effect */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[color:var(--neon-a)]/5 rounded-full blur-[100px]" />

        <div className="w-full max-w-md relative">
          {/* Logo with glow */}
          <Link href="/" className="inline-block mb-12 group">
            <div className="relative">
              <Image
                src="/vibe-logo.png"
                alt="VIZB"
                width={48}
                height={48}
                className="h-12 w-auto relative z-10"
              />
              <div className="absolute inset-0 bg-[color:var(--neon-a)]/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </Link>

          {/* Header */}
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--neon-a)] font-mono">
            <span className="h-px w-6 bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)]" />
            Create Account
          </span>
          <h2 className="font-serif text-3xl font-bold text-[color:var(--neon-text0)] mt-2">Sign Up</h2>
          <p className="text-sm text-[color:var(--neon-text2)] mt-2">
            Already have an account?{" "}
            <Link href="/login" className="text-[color:var(--neon-a)] hover:text-[color:var(--neon-b)] transition-colors">
              Sign in
            </Link>
          </p>

          {/* Form with glass card */}
          <form onSubmit={handleSignUp} className="mt-10 space-y-6 p-6 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] backdrop-blur-sm">
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
                    <p className="text-center text-sm text-[color:var(--neon-text2)]">
                      <button
                        type="button"
                        className="font-mono text-[color:var(--neon-a)] underline decoration-[color:var(--neon-hairline)] underline-offset-4 hover:decoration-[color:var(--neon-a)]"
                        onClick={clearServerIssue}
                      >
                        Try again
                      </button>
                      <span className="mx-2 text-[color:var(--neon-hairline)]" aria-hidden>
                        ·
                      </span>
                      <a
                        href={supportMailtoHref("VIZB sign-up help")}
                        className="font-mono text-[color:var(--neon-a)] underline decoration-[color:var(--neon-hairline)] underline-offset-4 hover:decoration-[color:var(--neon-a)]"
                      >
                        Contact support
                      </a>
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>

            <div>
              <label htmlFor="display-name" className="block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-2">
                Display Name <span className="text-[color:var(--neon-a)]">*</span>
              </label>
              <input
                id="display-name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                placeholder="What should we call you?"
                aria-invalid={!!fieldErrors.displayName}
                className="vibe-focus-ring w-full bg-[color:var(--neon-bg0)] border border-[color:var(--neon-hairline)] rounded-lg px-4 py-3 text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)]/50 focus-visible:border-[color:var(--neon-a)]/50 transition-all"
              />
              {fieldErrors.displayName ? (
                <p className="mt-2 text-sm text-destructive">{fieldErrors.displayName}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-2">
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
                className="vibe-focus-ring w-full bg-[color:var(--neon-bg0)] border border-[color:var(--neon-hairline)] rounded-lg px-4 py-3 text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)]/50 focus-visible:border-[color:var(--neon-a)]/50 transition-all"
              />
              {fieldErrors.email ? (
                <p className="mt-2 text-sm text-destructive">{fieldErrors.email}</p>
              ) : null}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-2">
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
                className="vibe-focus-ring w-full bg-[color:var(--neon-bg0)] border border-[color:var(--neon-hairline)] rounded-lg px-4 py-3 text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)]/50 focus-visible:border-[color:var(--neon-a)]/50 transition-all"
              />
              {fieldErrors.password ? (
                <p className="mt-2 text-sm text-destructive">{fieldErrors.password}</p>
              ) : (
                <p className="mt-2 text-xs text-[color:var(--neon-text2)] leading-relaxed">
                  Use at least 6 characters. Longer phrases with numbers or symbols are more secure.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="vibe-focus-ring group relative w-full overflow-hidden rounded-lg p-[2px] shadow-[var(--vibe-neon-glow)] hover:shadow-[0_0_32px_rgba(0,209,255,0.45),0_0_64px_rgba(157,77,255,0.3)] transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[color:var(--neon-a)] via-[color:var(--neon-b)] to-[color:var(--neon-a)] bg-[length:200%_100%] animate-[neon-border-flow_3s_linear_infinite]" />
              <span className="relative z-10 flex items-center justify-center w-full bg-[color:var(--neon-bg0)]/80 group-hover:bg-[color:var(--neon-bg0)]/60 px-8 py-4 rounded-lg text-xs uppercase tracking-widest font-bold text-[color:var(--neon-text0)] transition-colors">
                {loading ? "Creating account..." : "Create Account"}
              </span>
            </button>
          </form>

          {/* Back to landing */}
          <div className="mt-8 pt-6 border-t border-[color:var(--neon-hairline)]">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-a)] transition-colors"
            >
              <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* CSS for bubble animation */}
      <style jsx>{`
        @keyframes bubbleRise {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translateY(-100vh) scale(1.2);
            opacity: 0;
          }
        }
        @keyframes wave {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(-25px);
          }
        }
      `}</style>
    </div>
  )
}
