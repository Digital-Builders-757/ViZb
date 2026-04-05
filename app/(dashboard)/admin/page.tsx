import Link from "next/link"

import { requireAdmin } from "@/lib/auth-helpers"
import { normalizeCategories } from "@/lib/events/categories"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { Shield, Users, Building2, FileText, Link2, CalendarCheck, Newspaper } from "lucide-react"
import { CreateOrgForm } from "@/components/admin/create-org-form"
import { ApplicationsQueue } from "@/components/admin/applications-queue"
import { EventReviewQueue } from "@/components/admin/event-review-queue"
import { AdminEventManager } from "@/components/admin/admin-event-manager"
import { UsersTable } from "@/components/admin/users-table"
import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"
import { AdminSection } from "@/components/admin/admin-section"

/** Supabase may return a joined `organizations` row as object or single-element array. */
type OrgSnippet = { name: string; slug: string }

function normalizeOrganization(
  raw: OrgSnippet | OrgSnippet[] | null | undefined,
): OrgSnippet | null {
  if (raw == null) return null
  if (Array.isArray(raw)) return raw[0] ?? null
  return raw
}

export default async function AdminPage() {
  await requireAdmin()

  // If Supabase env isn't configured (e.g. some preview envs), still render the page shell.
  if (!isServerSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-brand-blue" />
          <span className="text-xs uppercase tracking-widest text-brand-blue font-mono">Staff Admin</span>
        </div>
        <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2">Platform Overview</h1>
        <GlassCard className="p-6">
          <p className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Supabase server environment is not configured. Connect Supabase to view counts and manage content.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <NeonLink href="/admin/posts" shape="xl" className="sm:w-auto">
              Posts
            </NeonLink>
            <NeonLink href="/admin/posts/new" variant="secondary" shape="xl" className="sm:w-auto">
              New post
            </NeonLink>
          </div>
        </GlassCard>
      </div>
    )
  }

  const supabase = await createClient()

  // Fetch counts + data in parallel
  const [profilesResult, orgsResult, pendingAppsResult, activeInvitesResult, pendingEventsResult, draftPostsResult, publishedPostsResult, applicationsData, pendingEventsData, usersData, allEventsData] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase
      .from("host_applications")
      .select("id", { count: "exact", head: true })
      .in("status", ["new", "reviewing"]),
    supabase
      .from("org_invites")
      .select("id", { count: "exact", head: true })
      .is("claimed_by", null),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending_review"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    supabase
      .from("host_applications")
      .select("*")
      .in("status", ["new", "reviewing"])
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, slug, description, status, starts_at, ends_at, venue_name, city, categories, flyer_url, created_at, reviewed_at, review_notes, organizations!inner(name, slug)")
      .in("status", ["pending_review", "published", "rejected"])
      .order("created_at", { ascending: false }),
    supabase.rpc("admin_list_users"),
    supabase
      .from("events")
      .select("id, title, slug, status, starts_at, venue_name, city, categories, created_at, organizations(name, slug)")
      .order("created_at", { ascending: false }),
  ])

  const totalUsers = profilesResult.count ?? 0
  const totalOrgs = orgsResult.count ?? 0
  const pendingApps = pendingAppsResult.count ?? 0
  const activeInvites = activeInvitesResult.count ?? 0
  const pendingEvents = pendingEventsResult.count ?? 0
  const draftPosts = draftPostsResult.count ?? 0
  const publishedPosts = publishedPostsResult.count ?? 0
  const applications = applicationsData.data ?? []
  const reviewEventsList = (pendingEventsData.data ?? []).map((e) => ({
    ...e,
    categories: normalizeCategories((e as { categories?: unknown }).categories),
    organizations: normalizeOrganization(
      e.organizations as OrgSnippet | OrgSnippet[] | null | undefined,
    ),
  }))
  const allUsers = usersData.data ?? []
  const allEvents = (allEventsData.data ?? []).map((e) => ({
    ...e,
    categories: normalizeCategories((e as { categories?: unknown }).categories),
    organizations: normalizeOrganization(
      e.organizations as OrgSnippet | OrgSnippet[] | null | undefined,
    ),
  }))

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Shield className="w-5 h-5 text-brand-blue" />
        <span className="text-xs uppercase tracking-widest text-brand-blue font-mono">Staff Admin</span>
      </div>
      <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2">Platform Overview</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Manage organizations, review host applications, and generate invite links.
      </p>

      {/* Posts — homepage + /p feed */}
      <div className="mt-8 md:mt-9" id="content-posts">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Content</span>
        </div>
        <h2 className="mt-2 font-serif text-xl font-bold text-foreground">Posts</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Publish Markdown for the homepage &quot;From VIZB&quot; module and the public{" "}
          <code className="text-xs">/p</code> feed.
        </p>

        <GlassCard className="mt-4 p-4 md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[color:var(--neon-text0)]">Manage posts</p>
              <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                Create, edit, publish, and archive posts.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
                  Draft {draftPosts}
                </span>
                <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
                  Published {publishedPosts}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:shrink-0">
              <NeonLink href="/admin/posts/new" shape="xl" className="sm:w-auto">
                New post
              </NeonLink>
              <NeonLink href="/admin/posts" variant="secondary" shape="xl" className="sm:w-auto">
                View all
              </NeonLink>
            </div>
          </div>
          <ul className="mt-5 pt-5 border-t border-[color:var(--neon-hairline)] flex flex-col gap-2.5 text-sm text-[color:var(--neon-text1)]">
            <li>
              <Link
                href="/admin/posts/new"
                className="font-medium text-[color:var(--neon-text0)] underline-offset-4 hover:text-brand-cyan hover:underline"
              >
                Create a new post
              </Link>
            </li>
            <li>
              <Link
                href="/p"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-4 hover:text-brand-cyan hover:underline"
              >
                Open public feed (/p)
              </Link>
            </li>
          </ul>
        </GlassCard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 md:gap-4 mt-8 md:mt-9">
        {/* Make these actionable: jump to module */}

        <Link href="#users" className="block">
          <div className="border border-border p-4 md:p-6 card-accent-blue hover:border-brand-blue/40 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-4 h-4 text-brand-blue" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Users</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-brand-blue font-mono">{totalUsers}</span>
          </div>
        </Link>

        <div className="border border-border p-4 md:p-6 card-accent-blue-mid">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Building2 className="w-4 h-4 text-brand-blue-mid shrink-0" />
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground truncate">Orgs</span>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-brand-blue-mid font-mono">{totalOrgs}</span>
        </div>

        <Link href="#host-applications" className="block">
          <div className="border border-border p-4 md:p-6 card-accent-cyan hover:border-brand-cyan/40 transition-colors">
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <FileText className="w-4 h-4 text-brand-cyan shrink-0" />
              <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground truncate">Applications</span>
            </div>
            <span className="text-2xl md:text-3xl font-bold text-brand-cyan font-mono">{pendingApps}</span>
          </div>
        </Link>

        <div className="border border-border p-4 md:p-6 card-accent-cyan-bright">
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
            <Link2 className="w-4 h-4 text-brand-cyan-bright shrink-0" />
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground truncate">Invites</span>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-brand-cyan-bright font-mono">{activeInvites}</span>
        </div>

        <Link href="#event-submissions" className="block">
          <div className={`border p-4 md:p-6 transition-colors hover:border-brand-cyan/40 ${pendingEvents > 0 ? "border-amber-500/40 card-accent-cyan bg-amber-500/5" : "border-border card-accent-cyan"}`}>
            <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
              <CalendarCheck className={`w-4 h-4 shrink-0 ${pendingEvents > 0 ? "text-amber-500" : "text-brand-cyan"}`} />
              <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground truncate">Pending</span>
            </div>
            <span className={`text-2xl md:text-3xl font-bold font-mono ${pendingEvents > 0 ? "text-amber-500" : "text-brand-cyan"}`}>{pendingEvents}</span>
          </div>
        </Link>
      </div>

      <nav
        className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-2 rounded-md border border-border/70 bg-black/15 px-3 py-2.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground"
        aria-label="Jump to admin section"
      >
        <span className="mr-1 text-foreground/50">Jump</span>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link href="#content-posts" className="px-1.5 py-0.5 hover:text-brand-cyan">
          Posts
        </Link>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link href="#users" className="px-1.5 py-0.5 hover:text-brand-cyan">
          Users
        </Link>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link href="#host-applications" className="px-1.5 py-0.5 hover:text-brand-cyan">
          Applications
        </Link>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link href="#event-submissions" className="px-1.5 py-0.5 hover:text-brand-cyan">
          Submissions
        </Link>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link href="#events" className="px-1.5 py-0.5 hover:text-brand-cyan">
          All events
        </Link>
        <span className="text-border" aria-hidden>
          ·
        </span>
        <Link href="#create-org" className="px-1.5 py-0.5 hover:text-brand-cyan">
          Create org
        </Link>
      </nav>

      <AdminSection
        id="users"
        kicker="Directory"
        title="All Users"
        description="Everyone who has signed up on the platform."
        stickyHeader
      >
        <UsersTable users={allUsers} />
      </AdminSection>

      <AdminSection
        id="host-applications"
        kicker="Review Queue"
        title="Host Applications"
        description="Review requests from users who want to host events. Approving creates the org and generates an invite link."
      >
        <ApplicationsQueue applications={applications} />
      </AdminSection>

      <AdminSection
        id="event-submissions"
        kicker="Review Queue"
        title="Event Submissions"
        description="Review, approve, or reject events submitted by organizers. Approved events go live on the public events page. Rejected events are sent back with your feedback so organizers can revise and resubmit."
      >
        <EventReviewQueue events={reviewEventsList} />
      </AdminSection>

      <AdminSection
        id="events"
        kicker="Management"
        title="All Events"
        description="Search, filter, and manage all events on the platform. Archive events that violate guidelines or are no longer needed."
        stickyHeader
      >
        <AdminEventManager events={allEvents} />
      </AdminSection>

      <AdminSection
        id="create-org"
        kicker="Manual"
        title="Create Organization"
        description="Manually create an org and generate an invite link. Use this for direct onboarding."
      >
        <CreateOrgForm />
      </AdminSection>
    </div>
  )
}
