"use client"

import React from "react"

import { useState, useMemo } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { getSafeRedirectPath } from "@/lib/utils"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = getSafeRedirectPath(searchParams.get("redirect"))

  // Generate bubbles for background animation
  const bubbles = useMemo(() => Array.from({ length: 12 }, (_, i) => ({
    x: (i * 7.3 % 1) * 100,
    size: 6 + (i * 2.9 % 1) * 14,
    delay: (i * 3.1 % 1) * 6,
    duration: 10 + (i * 5.3 % 1) * 5,
  })), [])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[color:var(--neon-bg0)] flex relative overflow-hidden">
      {/* Ocean gradient background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--neon-b)]/10 via-transparent to-[color:var(--neon-a)]/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_80%_30%,rgba(0,209,255,0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_70%,rgba(157,77,255,0.06),transparent)]" />
      </div>

      {/* Animated bubbles */}
      <div className="absolute inset-0 -z-5 overflow-hidden pointer-events-none">
        {bubbles.map((bubble, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[color:var(--neon-b)]/10 border border-[color:var(--neon-b)]/20"
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
          src="/community-real-connections.jpg"
          alt="VIZB Community"
          fill
          className="object-cover opacity-30"
          priority
        />
        {/* Ocean gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[color:var(--neon-bg0)] via-[color:var(--neon-bg0)]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-b)]/20 via-transparent to-[color:var(--neon-a)]/10" />
        
        {/* Animated ripple rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-[200px] h-[200px] -top-[100px] -left-[100px] rounded-full border border-[color:var(--neon-b)]/20 animate-[ping_4s_ease-out_infinite]" style={{ animationDelay: "0s" }} />
          <div className="absolute w-[300px] h-[300px] -top-[150px] -left-[150px] rounded-full border border-[color:var(--neon-a)]/15 animate-[ping_4s_ease-out_infinite]" style={{ animationDelay: "1.3s" }} />
          <div className="absolute w-[400px] h-[400px] -top-[200px] -left-[200px] rounded-full border border-[color:var(--neon-b)]/10 animate-[ping_4s_ease-out_infinite]" style={{ animationDelay: "2.6s" }} />
        </div>

        {/* Neon border accent */}
        <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-[color:var(--neon-b)]/50 to-transparent" />
        
        <div className="relative z-10 px-16">
          <h1 className="headline-lg text-[color:var(--neon-text0)] uppercase">
            Welcome
            <br />
            <span className="neon-gradient-text">Back</span>
          </h1>
          <p className="text-[color:var(--neon-text1)] mt-6 max-w-md leading-relaxed">
            Sign in to manage your events, connect with your community, and never miss a vibe.
          </p>
          
          {/* Decorative neon element */}
          <div className="mt-10 flex items-center gap-3">
            <span className="h-px w-12 bg-gradient-to-r from-[color:var(--neon-b)] to-[color:var(--neon-a)] shadow-[0_0_10px_rgba(157,77,255,0.5)]" />
            <span className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-b)]">The 757 Awaits</span>
          </div>
        </div>
      </div>

      {/* Right side -- form with glass effect */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative">
        {/* Subtle glow behind form */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[color:var(--neon-b)]/5 rounded-full blur-[100px]" />
        
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
              <div className="absolute inset-0 bg-[color:var(--neon-b)]/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
          </Link>

          {/* Header */}
          <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--neon-b)] font-mono">
            <span className="h-px w-6 bg-gradient-to-r from-[color:var(--neon-b)] to-[color:var(--neon-a)]" />
            Account
          </span>
          <h2 className="font-serif text-3xl font-bold text-[color:var(--neon-text0)] mt-2">Sign In</h2>
          <p className="text-sm text-[color:var(--neon-text2)] mt-2">
            {"Don't have an account? "}
            <Link href="/signup" className="text-[color:var(--neon-a)] hover:text-[color:var(--neon-b)] transition-colors">
              Create one
            </Link>
          </p>

          {/* Form with glass card */}
          <form onSubmit={handleLogin} className="mt-10 space-y-6 p-6 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] backdrop-blur-sm">
            {error && (
              <div className="border border-destructive/50 bg-destructive/10 px-4 py-3 rounded-lg">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

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
                className="vibe-focus-ring w-full bg-[color:var(--neon-bg0)] border border-[color:var(--neon-hairline)] rounded-lg px-4 py-3 text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)]/50 focus-visible:border-[color:var(--neon-b)]/50 transition-all"
              />
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
                placeholder="Your password"
                className="vibe-focus-ring w-full bg-[color:var(--neon-bg0)] border border-[color:var(--neon-hairline)] rounded-lg px-4 py-3 text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)]/50 focus-visible:border-[color:var(--neon-b)]/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="vibe-focus-ring group relative w-full overflow-hidden rounded-lg p-[2px] shadow-[var(--vibe-neon-glow)] hover:shadow-[0_0_32px_rgba(157,77,255,0.45),0_0_64px_rgba(0,209,255,0.3)] transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-[color:var(--neon-b)] via-[color:var(--neon-a)] to-[color:var(--neon-b)] bg-[length:200%_100%] animate-[neon-border-flow_3s_linear_infinite]" />
              <span className="relative z-10 flex items-center justify-center w-full bg-[color:var(--neon-bg0)]/80 group-hover:bg-[color:var(--neon-bg0)]/60 px-8 py-4 rounded-lg text-xs uppercase tracking-widest font-bold text-[color:var(--neon-text0)] transition-colors">
                {loading ? "Signing in..." : "Sign In"}
              </span>
            </button>
          </form>

          {/* Back to landing */}
          <div className="mt-8 pt-6 border-t border-[color:var(--neon-hairline)]">
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-b)] transition-colors"
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
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          100% {
            transform: translateY(-100vh) scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
