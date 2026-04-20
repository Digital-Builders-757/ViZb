import Link from "next/link"

import { requireAdmin } from "@/lib/auth-helpers"
import { normalizeCategories } from "@/lib/events/categories"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"
import { Shield, Users, Building2, FileText, Link2, CalendarCheck, Settings2, Newspaper } from "lucide-react"
import { NotificationSeedCard } from "@/components/admin/notification-seed-card"
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
  const { user: adminUser } = await requireAdmin()

  // If Supabase env isn't configured (e.g. some preview envs), still render the page shell.
  if (!isServerSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-neon-b" />
          <span className="text-xs uppercase tracking-widest text-neon-b font-mono">Staff Admin</span>
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
      .select(
        "id, org_name, org_type, description, website, social_links, status, created_at, user_id",
      )
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
        <Shield className="w-5 h-5 text-neon-b" />
        <span className="text-xs uppercase tracking-widest text-neon-b font-mono">Staff Admin</span>
      </div>
      <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2">Platform Overview</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Manage organizations, review host applications, and generate invite links.
      </p>

      {/* Content */}
      <div className="mt-8 md:mt-10">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Content</span>
        </div>
        <h2 className="mt-2 font-serif text-xl font-bold text-foreground">Posts</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Publish updates that appear on the public homepage ("From VIZB") and /p.
        </p>

        <GlassCard className="mt-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex flex-col gap-3 sm:flex-row">
              <NeonLink href="/admin/posts/new" shape="xl" className="sm:w-auto">
                New post
              </NeonLink>
              <NeonLink href="/admin/posts" variant="secondary" shape="xl" className="sm:w-auto">
                View all
              </NeonLink>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="mt-4 p-4 md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[color:var(--neon-text0)]">Platform events (ViZb)</p>
              <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                Create drafts under the platform organization—same workflow as organizers, with review and publish from Admin.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <NeonLink href="/admin/events/new" shape="xl" className="sm:w-auto">
                New platform event
              </NeonLink>
              <NeonLink href="#events" variant="secondary" shape="xl" className="sm:w-auto">
                All events
              </NeonLink>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-5 md:mt-10 md:gap-4">
        {/* Make these actionable: jump to module */}

        <Link href="#users" className="block">
          <GlassCard className="card-accent-blue p-4 transition-[box-shadow,border-color] hover:border-neon-b/40 hover:shadow-[var(--vibe-neon-glow-subtle)] md:p-6">
            <div className="mb-4 flex items-center gap-3">
              <Users className="h-4 w-4 text-neon-b" />
              <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Users</span>
            </div>
            <span className="font-mono text-2xl font-bold text-neon-b md:text-3xl">{totalUsers}</span>
          </GlassCard>
        </Link>

        <GlassCard className="card-accent-blue-mid p-4 md:p-6">
          <div className="mb-3 flex items-center gap-2 md:mb-4 md:gap-3">
            <Building2 className="h-4 w-4 shrink-0 text-neon-b" />
            <span className="truncate text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:text-xs">
              Orgs
            </span>
          </div>
          <span className="font-mono text-2xl font-bold text-neon-b md:text-3xl">{totalOrgs}</span>
        </GlassCard>

        <Link href="#host-applications" className="block">
          <GlassCard className="card-accent-cyan p-4 transition-[box-shadow,border-color] hover:border-neon-a/40 hover:shadow-[var(--vibe-neon-glow-subtle)] md:p-6">
            <div className="mb-3 flex items-center gap-2 md:mb-4 md:gap-3">
              <FileText className="h-4 w-4 shrink-0 text-neon-a" />
              <span className="truncate text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:text-xs">
                Applications
              </span>
            </div>
            <span className="font-mono text-2xl font-bold text-neon-a md:text-3xl">{pendingApps}</span>
          </GlassCard>
        </Link>

        <GlassCard className="card-accent-cyan-bright p-4 md:p-6">
          <div className="mb-3 flex items-center gap-2 md:mb-4 md:gap-3">
            <Link2 className="h-4 w-4 shrink-0 text-neon-c" />
            <span className="truncate text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:text-xs">
              Invites
            </span>
          </div>
          <span className="font-mono text-2xl font-bold text-neon-c md:text-3xl">{activeInvites}</span>
        </GlassCard>

        <Link href="#event-submissions" className="block">
          <GlassCard
            className={`p-4 transition-[box-shadow,border-color] hover:border-neon-a/40 hover:shadow-[var(--vibe-neon-glow-subtle)] md:p-6 ${
              pendingEvents > 0
                ? "card-accent-cyan border-amber-500/40 bg-amber-500/5"
                : "card-accent-cyan"
            }`}
          >
            <div className="mb-3 flex items-center gap-2 md:mb-4 md:gap-3">
              <CalendarCheck
                className={`h-4 w-4 shrink-0 ${pendingEvents > 0 ? "text-amber-500" : "text-neon-a"}`}
              />
              <span className="truncate text-[10px] font-mono uppercase tracking-widest text-muted-foreground md:text-xs">
                Events
              </span>
            </div>
            <span
              className={`font-mono text-2xl font-bold md:text-3xl ${pendingEvents > 0 ? "text-amber-500" : "text-neon-a"}`}
            >
              {pendingEvents}
            </span>
          </GlassCard>
        </Link>
      </div>

      {/* Public content — posts */}
      <div className="mt-10">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Content</span>
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground mt-2">Posts</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Publish content for the homepage From ViZb module and the public <code className="text-xs">/p</code> feed.
        </p>
        <GlassCard className="card-accent-cyan mt-6 p-5 md:p-6">
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <Link
                href="/admin/posts/new"
                className="font-medium text-foreground underline-offset-4 hover:text-neon-a hover:underline"
              >
                Create a new post
              </Link>
            </li>
            <li>
              <Link
                href="/admin/posts"
                className="font-medium text-foreground underline-offset-4 hover:text-neon-a hover:underline"
              >
                Manage posts
              </Link>
            </li>
            <li>
              <Link
                href="/p"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                View public feed
              </Link>
            </li>
          </ul>
        </GlassCard>
        <GlassCard className="card-accent-cyan mt-4 p-5 md:p-6">
          <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-3">Platform organization</p>
          <ul className="flex flex-col gap-3 text-sm">
            <li>
              <Link
                href="/admin/events/new"
                className="font-medium text-foreground underline-offset-4 hover:text-neon-a hover:underline"
              >
                Create a platform event (ViZb org)
              </Link>
            </li>
            <li>
              <Link
                href="#events"
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Jump to all events
              </Link>
            </li>
          </ul>
        </GlassCard>
      </div>

      <AdminSection
        id="users"
        kicker="Directory"
        title="All Users"
        description="Everyone who has signed up on the platform."
      >
        <UsersTable
          users={allUsers}
          currentUserId={adminUser.id}
          userDeletionEnabled={isServiceRoleConfigured()}
        />
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
      >
        <AdminEventManager events={allEvents} />
      </AdminSection>

      <AdminSection
        id="notifications-qa"
        kicker="QA"
        title="Notifications"
        description="Seed an unread in-app notification for your staff account (requires user_notifications migration)."
      >
        <NotificationSeedCard />
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
