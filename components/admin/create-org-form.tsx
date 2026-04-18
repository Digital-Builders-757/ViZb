"use client"

import { useState } from "react"
import { createOrgWithInvite } from "@/app/actions/invite"
import { Building2, UserPlus, Link2, CheckCircle2, Copy } from "lucide-react"

export function CreateOrgForm() {
  const [result, setResult] = useState<{ success?: boolean; error?: string; invite?: { claimUrl: string; token: string }; org?: { name: string; slug: string } } | null>(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setResult(null)
    const res = await createOrgWithInvite(formData)
    setResult(res as typeof result)
    setPending(false)
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <form action={handleSubmit}>
      <div className="form-card p-0 overflow-hidden">

        {/* Section 1: Organization Details */}
        <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-neon-b/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-neon-b font-mono">1</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-neon-b" />
            <span className="text-xs font-mono uppercase tracking-widest text-neon-b">Organization Details</span>
          </div>
        </div>
        <div className="section-divider" />
        <div className="px-5 md:px-6 py-5 md:py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="orgName" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Org Name <span className="text-neon-b">*</span>
            </label>
            <input
              id="orgName"
              name="orgName"
              type="text"
              required
              className="w-full input-premium px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40"
              placeholder="e.g. Underground Collective"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="orgType" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Type</label>
              <select
                id="orgType"
                name="orgType"
                className="w-full input-premium px-4 py-3 text-sm text-foreground"
              >
                <option value="collective">Collective</option>
                <option value="brand">Brand</option>
                <option value="nonprofit">Nonprofit</option>
                <option value="independent">Independent</option>
                <option value="venue">Venue</option>
                <option value="promoter">Promoter</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="description" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Description</label>
              <input
                id="description"
                name="description"
                type="text"
                className="w-full input-premium px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40"
                placeholder="Brief description"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Invite Configuration */}
        <div className="px-5 md:px-6 pt-2 pb-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-neon-a/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-neon-a font-mono">2</span>
          </div>
          <div className="flex items-center gap-2">
            <UserPlus className="w-3.5 h-3.5 text-neon-a" />
            <span className="text-xs font-mono uppercase tracking-widest text-neon-a">Invite Configuration</span>
          </div>
        </div>
        <div className="section-divider" />
        <div className="px-5 md:px-6 py-5 md:py-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inviteRole" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Invite Role</label>
              <select
                id="inviteRole"
                name="inviteRole"
                className="w-full input-premium px-4 py-3 text-sm text-foreground"
              >
                <option value="owner">Owner</option>
                <option value="admin">Admin</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="inviteEmail" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
                Invite Email
              </label>
              <input
                id="inviteEmail"
                name="inviteEmail"
                type="email"
                className="w-full input-premium px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40"
                placeholder="organizer@example.com"
              />
              <p className="text-[11px] text-muted-foreground/60">Optional -- locks invite to this email</p>
            </div>
          </div>
        </div>

        {/* Footer action bar */}
        <div className="section-divider" />
        <div className="px-5 md:px-6 py-4 bg-[#0a0a0a]">
          <button
            type="submit"
            disabled={pending}
            className="bg-gradient-to-r from-neon-b to-neon-a text-white px-8 py-3 text-xs font-mono uppercase tracking-widest font-bold hover:shadow-[0_0_20px_rgba(0,189,255,0.3)] transition-all disabled:opacity-50"
          >
            {pending ? "Creating..." : "Create Org + Generate Invite"}
          </button>
        </div>

        {/* Error */}
        {result?.error && (
          <div className="mx-5 md:mx-6 mb-5 border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{result.error}</p>
          </div>
        )}

        {/* Success: Invite Link */}
        {result?.success && result.invite && (
          <div className="mx-5 md:mx-6 mb-5 mt-1">
            <div className="border border-neon-a/30 bg-neon-a/5 p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-neon-a" />
                <p className="text-xs font-mono uppercase tracking-widest text-neon-a">Org Created + Invite Generated</p>
              </div>
              <p className="text-sm text-foreground">
                <strong>{result.org?.name}</strong>{" "}
                <span className="text-muted-foreground">({result.org?.slug})</span>
              </p>
              <div className="mt-3 bg-[#111111] border border-[#222222] p-3 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-muted-foreground/60 mb-1.5 flex items-center gap-1.5">
                    <Link2 className="w-3 h-3" />
                    Share this invite link
                  </p>
                  <code className="text-sm text-neon-a break-all font-mono leading-relaxed">
                    {typeof window !== "undefined" ? window.location.origin : ""}{result.invite.claimUrl}
                  </code>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`${typeof window !== "undefined" ? window.location.origin : ""}${result.invite?.claimUrl}`)}
                  className="shrink-0 p-2 border border-[#222222] hover:border-neon-a/30 hover:bg-neon-a/5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              {copied && (
                <p className="text-[11px] text-neon-a mt-2 font-mono">Copied to clipboard</p>
              )}
            </div>
          </div>
        )}
      </div>
    </form>
  )
}
