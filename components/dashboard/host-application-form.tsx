"use client"

import { useState } from "react"
import { submitHostApplication } from "@/app/actions/host-application"
import { Building2, FileText, Globe, CheckCircle2 } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

export function HostApplicationForm() {
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [pending, setPending] = useState(false)

  async function handleSubmit(formData: FormData) {
    setPending(true)
    setResult(null)
    const res = await submitHostApplication(formData)
    setResult(res)
    setPending(false)
  }

  if (result?.success) {
    return (
      <GlassCard emphasis className="card-accent-cyan p-6 md:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-neon-a/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-neon-a" />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-neon-a">Application Submitted</p>
            <p className="text-sm text-foreground mt-1">
              {"Thanks! We'll review your application and get back to you soon."}
            </p>
          </div>
        </div>
      </GlassCard>
    )
  }

  return (
    <form action={handleSubmit}>
      <GlassCard emphasis className="card-accent-cyan p-0 overflow-hidden">

        {/* Section 1: Organization Info */}
        <div className="px-5 md:px-6 pt-5 md:pt-6 pb-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-neon-a/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-neon-a font-mono">1</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-neon-a" />
            <span className="text-xs font-mono uppercase tracking-widest text-neon-a">Organization Info</span>
          </div>
        </div>
        <div className="section-divider" />
        <div className="px-5 md:px-6 py-5 md:py-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="orgName" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Organization Name <span className="text-neon-a">*</span>
            </label>
            <input
              id="orgName"
              name="orgName"
              type="text"
              required
              className="w-full vibe-input-glass vibe-focus-ring px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40"
              placeholder="Your organization or collective name"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="orgType" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Type <span className="text-neon-a">*</span>
            </label>
            <select
              id="orgType"
              name="orgType"
              className="w-full vibe-input-glass vibe-focus-ring px-4 py-3 text-sm text-foreground"
            >
              <option value="collective">Collective</option>
              <option value="brand">Brand</option>
              <option value="nonprofit">Nonprofit</option>
              <option value="independent">Independent</option>
              <option value="venue">Venue</option>
              <option value="promoter">Promoter</option>
            </select>
          </div>
        </div>

        {/* Section 2: About Your Events */}
        <div className="px-5 md:px-6 pt-2 pb-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-neon-b/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-neon-b font-mono">2</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-neon-b" />
            <span className="text-xs font-mono uppercase tracking-widest text-neon-b">About Your Events</span>
          </div>
        </div>
        <div className="section-divider" />
        <div className="px-5 md:px-6 py-5 md:py-6">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="description" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
              Tell us about your events
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              className="w-full vibe-input-glass vibe-focus-ring px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 resize-none"
              placeholder="What kind of events do you organize? How many people attend? What makes your events unique?"
            />
            <p className="text-[11px] text-muted-foreground/60 mt-1">The more detail you share, the faster we can review your application.</p>
          </div>
        </div>

        {/* Section 3: Online Presence */}
        <div className="px-5 md:px-6 pt-2 pb-4 flex items-center gap-3">
          <div className="w-6 h-6 rounded-full bg-neon-b/10 flex items-center justify-center">
            <span className="text-[10px] font-bold text-neon-b font-mono">3</span>
          </div>
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-neon-b" />
            <span className="text-xs font-mono uppercase tracking-widest text-neon-b">Online Presence</span>
          </div>
        </div>
        <div className="section-divider" />
        <div className="px-5 md:px-6 py-5 md:py-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="website" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Website</label>
              <input
                id="website"
                name="website"
                type="url"
                className="w-full vibe-input-glass vibe-focus-ring px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40"
                placeholder="https://your-site.com"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="socialLinks" className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Social Links</label>
              <input
                id="socialLinks"
                name="socialLinks"
                type="text"
                className="w-full vibe-input-glass vibe-focus-ring px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40"
                placeholder="@handle or URL"
              />
            </div>
          </div>
        </div>

        {/* Footer action bar */}
        <div className="section-divider" />
        <div className="px-5 md:px-6 py-4 flex items-center gap-4 bg-[color:var(--neon-surface)]/95 border-t border-[color:var(--neon-hairline)]">
          <button
            type="submit"
            disabled={pending}
            className="vibe-cta-gradient vibe-focus-ring px-8 py-3 text-xs font-mono uppercase tracking-widest font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {pending ? "Submitting..." : "Submit Application"}
          </button>
        </div>

        {/* Error */}
        {result?.error && (
          <div className="mx-5 md:mx-6 mb-5 border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{result.error}</p>
          </div>
        )}
      </GlassCard>
    </form>
  )
}
