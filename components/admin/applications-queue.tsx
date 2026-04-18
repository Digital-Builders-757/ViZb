"use client"

import { useState } from "react"
import { reviewHostApplication } from "@/app/actions/host-application"
import { Globe, Share2, Clock, CheckCircle2, XCircle, Building2 } from "lucide-react"

const ORG_TYPE_COLORS: Record<string, string> = {
  "music-collective": "text-neon-a border-neon-a/30 bg-neon-a/5",
  "event-company": "text-neon-b border-neon-b/30 bg-neon-b/5",
  "nightclub-venue": "text-neon-c border-neon-c/30 bg-neon-c/5",
  "festival-org": "text-neon-b border-neon-b/30 bg-neon-b/5",
  "community-group": "text-neon-a border-neon-a/30 bg-neon-a/5",
}

function getOrgTypeStyle(orgType: string) {
  return ORG_TYPE_COLORS[orgType] ?? "text-muted-foreground border-border"
}

function formatOrgType(orgType: string) {
  return orgType.replace(/-/g, " ")
}

type Application = {
  id: string
  org_name: string
  org_type: string
  description: string | null
  website: string | null
  social_links: string | null
  status: string
  created_at: string
  user_id: string
}

export function ApplicationsQueue({ applications }: { applications: Application[] }) {
  const [results, setResults] = useState<Record<string, { success?: boolean; error?: string; action?: string; org?: { name: string; slug: string } }>>({})
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set())

  async function handleReview(applicationId: string, action: "approve" | "reject") {
    setPendingIds((prev) => new Set(prev).add(applicationId))
    const formData = new FormData()
    formData.set("applicationId", applicationId)
    formData.set("action", action)
    const res = await reviewHostApplication(formData)
    setResults((prev) => ({ ...prev, [applicationId]: res as (typeof results)[string] }))
    setPendingIds((prev) => {
      const next = new Set(prev)
      next.delete(applicationId)
      return next
    })
  }

  if (applications.length === 0) {
    return (
      <div className="border border-dashed p-12 flex flex-col items-center text-center gradient-border">
        <div className="w-12 h-12 rounded-full bg-neon-a/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-6 h-6 text-neon-a" />
        </div>
        <span className="text-xs uppercase tracking-widest text-neon-a font-mono">All Clear</span>
        <h3 className="text-lg font-bold text-foreground uppercase mt-2">No Pending Applications</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          New host applications will appear here for review.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {applications.map((app, index) => {
        const result = results[app.id]
        const isPending = pendingIds.has(app.id)
        const isHandled = result?.success
        const isApproved = result?.action === "approved"
        const isRejected = result?.action === "rejected"

        // Cycle through accent colors for left border
        const accentColors = ["border-l-neon-a", "border-l-neon-b", "border-l-neon-b", "border-l-neon-c"]
        const accent = accentColors[index % accentColors.length]

        return (
          <div
            key={app.id}
            className={`
              border-l-2 border border-border bg-[#111111] transition-all
              ${isApproved ? "border-l-neon-a bg-neon-a/5 border-neon-a/20" : ""}
              ${isRejected ? "border-l-muted-foreground opacity-60" : ""}
              ${!isHandled ? `${accent} hover:bg-[#161616]` : ""}
            `}
          >
            {/* Card header */}
            <div className="p-5 pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-gradient-to-br from-neon-b/20 to-neon-a/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Building2 className="w-4 h-4 text-neon-a" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{app.org_name}</h4>
                    <span className={`inline-flex items-center text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border mt-1 ${getOrgTypeStyle(app.org_type)}`}>
                      {formatOrgType(app.org_type)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                  <Clock className="w-3 h-3" />
                  <span className="font-mono">{new Date(app.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Card body */}
            <div className="px-5 py-4">
              {app.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">{app.description}</p>
              )}

              {(app.website || app.social_links) && (
                <div className="flex flex-wrap gap-4 mt-3">
                  {app.website && (
                    <a
                      href={app.website.startsWith("http") ? app.website : `https://${app.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-neon-a font-mono hover:underline transition-colors"
                    >
                      <Globe className="w-3 h-3" />
                      {app.website}
                    </a>
                  )}
                  {app.social_links && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-neon-b font-mono">
                      <Share2 className="w-3 h-3" />
                      {app.social_links}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Card footer / actions */}
            {!isHandled && (
              <div className="px-5 pb-5">
                <div className="section-divider pt-4 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => handleReview(app.id, "approve")}
                    disabled={isPending}
                    className="bg-gradient-to-r from-neon-b to-neon-a text-white px-5 py-2.5 text-xs font-mono uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,189,255,0.3)] transition-all disabled:opacity-50"
                  >
                    {isPending ? "Processing..." : "Approve + Create Org"}
                  </button>
                  <button
                    onClick={() => handleReview(app.id, "reject")}
                    disabled={isPending}
                    className="border border-border px-5 py-2.5 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:border-destructive hover:text-destructive transition-colors disabled:opacity-50 bg-transparent"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Result states */}
            {result?.error && (
              <div className="mx-5 mb-5 border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">{result.error}</p>
              </div>
            )}

            {isApproved && (
              <div className="mx-5 mb-5 border border-neon-a/30 bg-neon-a/5 p-3 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-neon-a shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-mono uppercase tracking-widest text-neon-a">Approved -- Org Created</p>
                  {result.org && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {result.org.name} is live. The applicant has been added as owner.
                    </p>
                  )}
                </div>
              </div>
            )}

            {isRejected && (
              <div className="mx-5 mb-5 border border-muted-foreground/20 bg-muted/5 p-3 flex items-start gap-2">
                <XCircle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Application Rejected</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
