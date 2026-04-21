"use client"

import { useState, useEffect, useLayoutEffect } from "react"
import { useSearchParams } from "next/navigation"
import { claimInvite } from "@/app/actions/invite"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Suspense } from "react"

import { FullLogoImage } from "@/components/brand/full-logo-image"

function ClaimInviteContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const tokenFromUrl = searchParams.get("token")

  const [inviteToken, setInviteToken] = useState<string | null>(null)
  const [inviteParamsReady, setInviteParamsReady] = useState(false)

  const [status, setStatus] = useState<"idle" | "claiming" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [orgId, setOrgId] = useState<string | null>(null)

  useLayoutEffect(() => {
    setInviteToken(tokenFromUrl)
    setInviteParamsReady(true)
  }, [tokenFromUrl])

  useEffect(() => {
    if (!inviteParamsReady) return
    if (!inviteToken) {
      setStatus("error")
      setMessage("No invite token provided. Please check your invite link.")
      return
    }
    router.replace("/invite/claim")
  }, [router, inviteToken, inviteParamsReady])

  async function handleClaim() {
    if (!inviteToken) return
    setStatus("claiming")

    const result = await claimInvite(inviteToken)

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
        {/* Logo (full lockup; same as marketing pages) */}
        <Link href="/" className="mb-12 block outline-offset-4">
          <span className="relative block h-16 w-full max-w-[min(100%,260px)]">
            <FullLogoImage fill className="object-contain object-left" priority />
          </span>
        </Link>

        <span className="text-xs font-mono uppercase tracking-widest text-primary">Organization Invite</span>
        <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground">
          {"You've Been Invited"}
        </h1>

        {status === "idle" && inviteToken && (
          <>
            <p className="mt-4 text-sm leading-relaxed text-foreground/90">
              Someone has invited you to join an organization on VIZB. Click below to accept.
            </p>
            <button
              onClick={handleClaim}
              className="mt-8 w-full bg-foreground text-background py-4 text-xs font-mono uppercase tracking-widest hover:bg-primary transition-colors"
            >
              Accept Invite
            </button>
            <p className="mt-4 text-center text-xs text-foreground/75">
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
            <p className="text-sm text-foreground/80">Claiming your invite...</p>
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
