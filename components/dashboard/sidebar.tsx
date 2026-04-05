"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Home, User, Calendar, Settings, LogOut, Shield, Building2, PlusCircle, Compass, Newspaper } from "lucide-react"

import { NotificationsMenu } from "@/components/dashboard/notifications-menu"
import type { DashboardNotificationFeed } from "@/lib/notifications/dashboard-queries"

interface SidebarProps {
  profile: {
    display_name: string | null
    avatar_url: string | null
    role_admin: boolean
    platform_role: "user" | "staff_admin" | "staff_support"
  } | null
  organizations?: Array<{
    role: string
    organization: {
      id: string
      name: string
      slug: string
      status: string
      logo_url: string | null
    }
  }>
  notifications?: DashboardNotificationFeed
}

const attendeeLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/events", label: "Explore Events", icon: Compass },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/dashboard/tickets", label: "My Tickets", icon: Calendar },
]

export function DashboardSidebar({ profile, organizations = [], notifications }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 hidden w-64 flex-col border-r border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/85 backdrop-blur-xl md:flex">
      {/* Logo */}
      <div className="flex h-14 items-center justify-between gap-2 border-b border-[color:var(--neon-hairline)] px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image src="/vibe-logo.png" alt="VIZB" width={32} height={32} className="h-8 w-auto" />
          <span className="truncate font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
            VIZB
          </span>
        </Link>
        {notifications ? (
          <NotificationsMenu
            initialUnreadCount={notifications.unreadCount}
            initialItems={notifications.items}
          />
        ) : null}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-6">
        {/* Attendee section */}
        <span className="mb-3 block px-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
          Personal
        </span>
        {attendeeLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "border-[color:var(--neon-a)] bg-[color:var(--neon-a)]/8 text-[color:var(--neon-text0)]"
                  : "border-transparent text-[color:var(--neon-text2)] hover:border-[color:var(--neon-hairline)] hover:text-[color:var(--neon-text0)]"
              }`}
            >
              <link.icon
                className={`h-4 w-4 ${isActive ? "text-[color:var(--neon-a)]" : ""}`}
              />
              <span>{link.label}</span>
            </Link>
          )
        })}

        {/* Organizer section */}
        {organizations.length > 0 && (
          <>
            <div className="pb-2 pt-6">
              <span className="block px-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-b)]">
                Organizations
              </span>
            </div>
            {organizations.map((mem) => {
              const org = mem.organization
              const orgHref = `/organizer/${org.slug}`
              const isActive = pathname.startsWith(orgHref)
              return (
                <Link
                  key={org.id}
                  href={orgHref}
                  className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "border-[color:var(--neon-b)] bg-[color:var(--neon-b)]/8 text-[color:var(--neon-text0)]"
                      : "border-transparent text-[color:var(--neon-text2)] hover:border-[color:var(--neon-hairline)] hover:text-[color:var(--neon-text0)]"
                  }`}
                >
                  <Building2 className="h-4 w-4" />
                  <span className="truncate">{org.name}</span>
                  {org.status === "pending_review" && (
                    <span className="ml-auto border border-[color:var(--neon-hairline)] px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                      Pending
                    </span>
                  )}
                </Link>
              )
            })}
          </>
        )}

        {/* Request to Host -- show if user has no orgs and is NOT a staff admin */}
        {organizations.length === 0 && profile?.platform_role !== "staff_admin" && (
          <div className="pt-4">
            <Link
              href="/host/apply"
              className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                pathname === "/host/apply"
                  ? "border-[color:var(--neon-c)] bg-[color:var(--neon-c)]/8 text-[color:var(--neon-text0)]"
                  : "border-transparent text-[color:var(--neon-text2)] hover:border-[color:var(--neon-hairline)] hover:text-[color:var(--neon-text0)]"
              }`}
            >
              <PlusCircle className="h-4 w-4" />
              <span>Request to Host</span>
            </Link>
          </div>
        )}

        {/* Admin section */}
        {profile?.platform_role === "staff_admin" && (
          <>
            <div className="pb-2 pt-6">
              <span className="block px-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                Admin
              </span>
            </div>
            <Link
              href="/admin"
              className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                pathname === "/admin"
                  ? "border-[color:var(--neon-a)] bg-[color:var(--neon-a)]/8 text-[color:var(--neon-text0)]"
                  : "border-transparent text-[color:var(--neon-text2)] hover:border-[color:var(--neon-hairline)] hover:text-[color:var(--neon-text0)]"
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Admin Overview</span>
            </Link>

            <Link
              href="/admin/posts"
              className={`flex items-center gap-3 border-l-2 px-3 py-2.5 text-sm transition-colors ${
                pathname.startsWith("/admin/posts")
                  ? "border-[color:var(--neon-a)] bg-[color:var(--neon-a)]/8 text-[color:var(--neon-text0)]"
                  : "border-transparent text-[color:var(--neon-text2)] hover:border-[color:var(--neon-hairline)] hover:text-[color:var(--neon-text0)]"
              }`}
            >
              <Newspaper className="h-4 w-4" />
              <span>Posts</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom -- user info + sign out */}
      <div className="border-t border-[color:var(--neon-hairline)] p-4">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--neon-a)]/40 to-[color:var(--neon-b)]/40 ring-2 ring-[color:var(--neon-a)]/35">
            <span className="text-xs font-bold text-[color:var(--neon-text0)]">
              {(profile?.display_name || "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-[color:var(--neon-text0)]">
              {profile?.display_name || "User"}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs uppercase tracking-widest text-[color:var(--neon-text2)] transition-colors hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
