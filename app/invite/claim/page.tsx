"use client"

import { useState, useEffect, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { claimInvite } from "@/app/actions/invite"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

function ClaimInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get("token") // Declare the token variable

  // Stash token on first render, then strip it from URL to prevent leaking via referrer/logs
  const tokenRef = useRef<string | null>(token)

  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    if (!tokenRef.current) {
      setStatus("error")
      setMessage("No invite token provided. Please check your invite link.")
      return
    }
    // Strip token from URL to prevent leaking via referrer headers / analytics / server logs
    router.replace("/invite/claim")
  }, [router])

  async function handleClaim() {
    if (!tokenRef.current) return
    setStatus("claiming")

    const result = await claimInvite(tokenRef.current)

    if (result.error) {
      setStatus("error")
      setMessage(result.error)
    } else {
      setStatus("success")
      setOrgId(result.orgId ?? null)
      setMessage("You have been added to the organization.")
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="block mb-12">
          <span className="text-xl font-bold tracking-tighter text-foreground font-serif">
            Vi<span className="text-primary">BE</span>
          </span>
        </Link>

        <span className="text-xs font-mono uppercase tracking-widest text-primary">Organization Invite</span>
        <h1 className="font-serif text-3xl font-bold text-foreground mt-2">
          {"You've Been Invited"}
        </h1>

        {status === "idle" && tokenRef.current && (
          <>
            <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
              Someone has invited you to join an organization on ViZb. Click below to accept.
            </p>
            <button
              onClick={handleClaim}
              className="mt-8 w-full bg-foreground text-background py-4 text-xs font-mono uppercase tracking-widest hover:bg-primary transition-colors"
            >
              Accept Invite
            </button>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              You must be signed in to claim this invite.{" "}
              <Link href="/login?redirect=/invite/claim" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </>
        )}

        {status === "claiming" && (
          <div className="mt-8 flex flex-col items-center gap-4">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Claiming your invite...</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-8">
            <div className="border border-primary/30 bg-primary/5 p-6">
              <p className="text-xs font-mono uppercase tracking-widest text-primary">Welcome Aboard</p>
              <p className="text-sm text-foreground mt-2">{message}</p>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-6 w-full bg-foreground text-background py-4 text-xs font-mono uppercase tracking-widest hover:bg-primary transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="mt-8">
            <div className="border border-destructive/30 bg-destructive/10 p-6">
              <p className="text-xs font-mono uppercase tracking-widest text-destructive">Invite Error</p>
              <p className="text-sm text-foreground mt-2">{message}</p>
            </div>
            <Link
              href="/dashboard"
              className="mt-6 block w-full text-center border border-border py-4 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ClaimInvitePage() {
  return (
    <Suspense fallback={null}>
      <ClaimInviteContent />
    </Suspense>
  )
}
