import { CreateEventForm } from "@/components/organizer/create-event-form"
import { requireAdmin } from "@/lib/auth-helpers"
import { fetchPlatformOrganization, getPlatformOrgSlug } from "@/lib/orgs/platform-org"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

export default async function AdminNewEventPage() {
  await requireAdmin()

  if (!isServerSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[color:var(--neon-text0)]">New platform event</h1>
        <GlassCard className="p-6">
          <p className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Supabase is not configured. Connect the server environment to create events.
          </p>
        </GlassCard>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: platformOrg, error } = await fetchPlatformOrganization(supabase)
  const slugHint = getPlatformOrgSlug()

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[color:var(--neon-text0)]">New platform event</h1>
        <GlassCard className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-destructive">Could not load organization</p>
          <p className="mt-2 text-[15px] text-[color:var(--neon-text1)]">{error}</p>
          <NeonLink href="/admin" variant="secondary" shape="xl" className="mt-4 inline-flex">
            Back to Admin
          </NeonLink>
        </GlassCard>
      </div>
    )
  }

  if (!platformOrg) {
    return (
      <div className="space-y-6">
        <h1 className="font-serif text-2xl font-bold text-[color:var(--neon-text0)]">New platform event</h1>
        <GlassCard className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">No platform organization yet</p>
          <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Staff creates events under a normal organization record (e.g. ViZb). There is no organization with slug{" "}
            <span className="font-mono text-[color:var(--neon-text0)]">{slugHint}</span> in this project.
          </p>
          <ul className="mt-4 list-inside list-disc space-y-2 text-sm text-[color:var(--neon-text1)]">
            <li>
              Use <strong className="text-[color:var(--neon-text0)]">Admin → Create Organization</strong> on the main admin page and create an org whose slug matches{" "}
              <span className="font-mono">{slugHint}</span> (recommended), or
            </li>
            <li>
              Set <span className="font-mono">PLATFORM_ORG_SLUG</span> in your environment to an existing org’s slug (see{" "}
              <span className="font-mono">.env.example</span>).
            </li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-3">
            <NeonLink href="/admin#create-org" shape="xl">
              Jump to Create Organization
            </NeonLink>
            <NeonLink href="/admin" variant="secondary" shape="xl">
              Back to Admin
            </NeonLink>
          </div>
        </GlassCard>
      </div>
    )
  }

  return (
    <div>
      <CreateEventForm
        orgId={platformOrg.id}
        orgSlug={platformOrg.slug}
        orgName={platformOrg.name}
        flow="admin"
      />
    </div>
  )
}
