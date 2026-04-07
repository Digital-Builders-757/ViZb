"use client"

import { useEffect, useState } from "react"

import { AuthAlert } from "@/components/auth/auth-alert"
import { mapAuthError } from "@/lib/auth/auth-error-map"
import { PENDING_VERIFY_EMAIL_KEY } from "@/lib/auth/pending-verify-email"
import { createClient } from "@/lib/supabase/client"
import { NeonButton } from "@/components/ui/neon-button"

export function SignUpSuccessPanel() {
  const [email, setEmail] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sentOk, setSentOk] = useState(false)
  const [mapped, setMapped] = useState<ReturnType<typeof mapAuthError> | null>(null)

  useEffect(() => {
    try {
      const v = sessionStorage.getItem(PENDING_VERIFY_EMAIL_KEY)
      if (v) setEmail(v)
    } catch {
      /* sessionStorage unavailable */
    }
  }, [])

  async function resend() {
    if (!email) return
    setSending(true)
    setMapped(null)
    setSentOk(false)
    try {
      const supabase = createClient()
      const redirectTo =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${window.location.origin}/auth/callback`
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (error) {
        setMapped(mapAuthError(error, "verify"))
        return
      }
      setSentOk(true)
    } finally {
      setSending(false)
    }
  }

  if (!email) {
    return (
      <AuthAlert
        variant="info"
        title="Need another email?"
        message="Use the same address you signed up with on the sign-up page — we’ll open the resend option after you submit the form."
        className="mt-8"
      />
    )
  }

  return (
    <div className="mt-8 space-y-4">
      {sentOk ? (
        <AuthAlert
          variant="success"
          title="Email sent"
          message="Check your inbox (and spam) for a fresh confirmation link. It may take a minute to arrive."
        />
      ) : null}

      {mapped ? (
        <AuthAlert
          variant={mapped.severity === "warning" ? "warning" : "error"}
          title={mapped.title}
          message={mapped.message}
          hint={mapped.hint}
          mapped={{
            primaryAction: mapped.primaryAction,
            secondaryAction: mapped.secondaryAction,
          }}
        />
      ) : null}

      <NeonButton
        type="button"
        variant="secondary"
        shape="xl"
        fullWidth
        className="w-full font-mono text-xs uppercase tracking-widest"
        disabled={sending}
        onClick={resend}
      >
        {sending ? "Sending…" : "Resend confirmation email"}
      </NeonButton>
    </div>
  )
}
