"use client"

import React from "react"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { User, Lock } from "lucide-react"

interface ProfileFormProps {
  initialDisplayName: string
  initialAvatarUrl: string
  email: string
}

export function ProfileForm({ initialDisplayName, initialAvatarUrl, email }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(false)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError("Not authenticated")
      setSaving(false)
      return
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("id", user.id)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    setSuccess(true)
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave}>
      <div className="form-card p-0 overflow-hidden">
        {/* Section header */}
        <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-brand-cyan/10 flex items-center justify-center">
            <User className="w-3 h-3 text-brand-cyan" />
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-brand-cyan">Account Details</span>
        </div>

        <div className="section-divider" />

        {/* Messages */}
        {success && (
          <div className="mx-5 md:mx-6 mt-5 border border-brand-cyan/50 bg-brand-cyan/10 px-4 py-3">
            <p className="text-sm text-brand-cyan">Profile updated. Looking good.</p>
          </div>
        )}
        {error && (
          <div className="mx-5 md:mx-6 mt-5 border border-destructive/50 bg-destructive/10 px-4 py-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Fields */}
        <div className="px-5 md:px-6 py-5 md:py-6 flex flex-col gap-6">
          {/* Email (read-only) */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled
                className="w-full input-premium px-4 py-3 text-muted-foreground cursor-not-allowed pr-10 !bg-[#111111] !border-[#1a1a1a]"
              />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
            </div>
            <p className="text-[11px] text-muted-foreground/60 mt-1.5">Managed by your authentication provider</p>
          </div>

          {/* Display Name */}
          <div>
            <label htmlFor="display-name" className="block text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="What should we call you?"
              className="w-full input-premium px-4 py-3 text-foreground placeholder:text-muted-foreground/40"
            />
          </div>
        </div>

        {/* Footer action bar */}
        <div className="section-divider" />
        <div className="px-5 md:px-6 py-4 flex items-center gap-4 bg-[#0a0a0a]">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-r from-brand-blue to-brand-cyan text-white px-8 py-3 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(0,189,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          {success && (
            <span className="text-xs font-mono uppercase tracking-widest text-brand-cyan">Saved</span>
          )}
        </div>
      </div>
    </form>
  )
}
