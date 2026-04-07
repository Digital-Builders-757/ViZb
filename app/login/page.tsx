"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"

import { AuthAlert } from "@/components/auth/auth-alert"
import { mapAuthError, type MappedAuthError } from "@/lib/auth/auth-error-map"
import { supportMailtoHref } from "@/lib/auth/support-contact"
import { getSafeRedirectPath } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authIssue, setAuthIssue] = useState<MappedAuthError | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect"))

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setAuthIssue(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setAuthIssue(
        mapAuthError(error, "login", {
          onNetworkRetry: () => setAuthIssue(null),
          onGenericRetry: () => setAuthIssue(null),
        }),
      )
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side -- brand moment */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center border-r border-border overflow-hidden">
        {/* Background image with overlay */}
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
            Welcome
            <br />
            <span className="neon-gradient-text">Back</span>
          </h1>
          <p className="text-muted-foreground mt-6 max-w-md leading-relaxed">
            Sign in to manage your events, connect with your community, and never miss a vibe.
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
          <span className="text-xs uppercase tracking-widest text-primary font-mono">Account</span>
          <h2 className="font-serif text-3xl font-bold text-foreground mt-2">Sign In</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {"Don't have an account? "}
            <Link href="/signup" className="text-primary hover:underline">
              Create one
            </Link>
          </p>

          {/* Form */}
          <form onSubmit={handleLogin} className="mt-10 space-y-6">
            <div className="space-y-4">
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
                  <p className="text-center text-sm text-muted-foreground">
                    <button
                      type="button"
                      className="font-mono text-primary underline decoration-border underline-offset-4 hover:decoration-primary"
                      onClick={() => setAuthIssue(null)}
                    >
                      Try again
                    </button>
                    <span className="mx-2 text-border" aria-hidden>
                      ·
                    </span>
                    <a
                      href={supportMailtoHref("VIZB sign-in help")}
                      className="font-mono text-primary underline decoration-border underline-offset-4 hover:decoration-primary"
                    >
                      Contact support
                    </a>
                  </p>
                </>
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
                className="vibe-focus-ring w-full rounded-md bg-input border-0 px-4 py-3 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <label
                  htmlFor="password"
                  className="block text-xs font-mono uppercase tracking-widest text-muted-foreground"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-mono uppercase tracking-widest text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
                className="vibe-focus-ring w-full rounded-md bg-input border-0 px-4 py-3 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="vibe-focus-ring w-full bg-primary text-background px-8 py-4 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(13,64,255,0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
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
