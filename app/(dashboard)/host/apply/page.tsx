import { requireAuth, getProfile } from "@/lib/auth-helpers"
import { createClient } from "@/lib/supabase/server"
import { HostApplicationForm } from "@/components/dashboard/host-application-form"
import { Building2, CheckCircle2, Shield } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function HostApplyPage() {
  const { user } = await requireAuth()
  const supabase = await createClient()

  // Staff admins should not use the host application flow -- redirect to admin
  const { profile } = await getProfile()
  if (profile?.platform_role === "staff_admin") {
    redirect("/admin")
  }

  // Check if user already has a pending or approved application
  const { data: existingApp } = await supabase
    .from("host_applications")
    .select("id, status, org_name, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Check if user already has an org membership
  const { data: membership } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .limit(1)
    .single()

  return (
    <div>
      <div className="flex items-center gap-3">
        <Building2 className="w-5 h-5 text-brand-cyan-bright" />
        <span className="text-xs uppercase tracking-widest text-brand-cyan-bright font-mono">Become a Host</span>
      </div>
      <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2">Request to Host Events</h1>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-lg">
        Want to organize events on ViZb? Tell us about your organization and our team will review your application.
      </p>

      {membership && (
        <div className="mt-8 border border-brand-cyan/30 bg-brand-cyan/5 p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
            <p className="text-xs font-mono uppercase tracking-widest text-brand-cyan">Already a Host</p>
          </div>
          <p className="text-sm text-foreground mt-2">
            {"You're already a member of an organization."}
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block text-xs font-mono uppercase tracking-widest text-brand-cyan hover:underline"
          >
            Go to Dashboard
          </Link>
        </div>
      )}

      {!membership && existingApp && (existingApp.status === "new" || existingApp.status === "reviewing") && (
        <div className="mt-8 border border-brand-blue-mid/30 bg-brand-blue-mid/5 p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-brand-blue-mid">Application Pending</p>
          <p className="text-sm text-foreground mt-2">
            Your application for <strong>{existingApp.org_name}</strong> is being reviewed.
            {"We'll"} notify you once a decision is made.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Submitted {new Date(existingApp.created_at).toLocaleDateString()}
          </p>
        </div>
      )}

      {!membership && existingApp?.status === "rejected" && (
        <div className="mt-8">
          <div className="border border-destructive/20 bg-destructive/5 p-6 mb-6">
            <p className="text-xs font-mono uppercase tracking-widest text-destructive">Previous Application Declined</p>
            <p className="text-sm text-foreground mt-2">
              Your previous application for <strong>{existingApp.org_name}</strong> was not approved.
              You may submit a new application below.
            </p>
          </div>
          <HostApplicationForm />
        </div>
      )}

      {!membership && !existingApp && (
        <div className="mt-8">
          <HostApplicationForm />
        </div>
      )}
    </div>
  )
}
