"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Menu, Home, User, Calendar, Shield, Building2, PlusCircle, LogOut, Compass, Newspaper } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { NotificationsMenu } from "@/components/dashboard/notifications-menu"
import type { DashboardNotificationFeed } from "@/lib/notifications/dashboard-queries"

interface MobileHeaderProps {
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
  { href: "/tickets", label: "My Tickets", icon: Calendar },
]

export function MobileHeader({ profile, organizations = [], notifications }: MobileHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    setOpen(false)
    router.push("/")
    router.refresh()
  }

  return (
    <header
      className="sticky top-0 z-50 border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/75 backdrop-blur-xl md:hidden"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Image src="/vibe-logo.png" alt="VIZB" width={28} height={28} className="h-7 w-auto" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--neon-a)]">
            VIZB
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1">
          {notifications ? (
            <NotificationsMenu
              initialUnreadCount={notifications.unreadCount}
              initialItems={notifications.items}
            />
          ) : null}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className="flex h-11 w-11 items-center justify-center text-[color:var(--neon-text0)]"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-[280px] border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/95 p-0 backdrop-blur-xl"
            >
            <SheetHeader className="border-b border-[color:var(--neon-hairline)] px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center bg-gradient-to-br from-[color:var(--neon-a)]/30 to-[color:var(--neon-b)]/30 ring-2 ring-[color:var(--neon-a)]/35">
                  <span className="text-xs font-bold text-[color:var(--neon-text0)]">
                    {(profile?.display_name || "U")[0].toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="truncate text-sm font-medium text-[color:var(--neon-text0)]">
                    {profile?.display_name || "User"}
                  </SheetTitle>
                </div>
              </div>
            </SheetHeader>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
              <span className="mb-3 block px-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                Personal
              </span>
              {attendeeLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 border-l-2 px-3 py-3 text-sm transition-colors ${
                      isActive
                        ? "border-[color:var(--neon-a)] bg-[color:var(--neon-a)]/8 text-[color:var(--neon-text0)]"
                        : "border-transparent text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
                    }`}
                  >
                    <link.icon
                      className={`h-4 w-4 ${isActive ? "text-[color:var(--neon-a)]" : ""}`}
                    />
                    <span>{link.label}</span>
                  </Link>
                )
              })}

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
                        onClick={() => setOpen(false)}
                        className={`flex min-h-[44px] items-center gap-3 border-l-2 px-3 py-3 text-sm transition-colors ${
                          isActive
                            ? "border-[color:var(--neon-b)] bg-[color:var(--neon-b)]/8 text-[color:var(--neon-text0)]"
                            : "border-transparent text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
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

              {organizations.length === 0 && profile?.platform_role !== "staff_admin" && (
                <div className="pt-4">
                  <Link
                    href="/host/apply"
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 border-l-2 px-3 py-3 text-sm transition-colors ${
                      pathname === "/host/apply"
                        ? "border-[color:var(--neon-c)] bg-[color:var(--neon-c)]/8 text-[color:var(--neon-text0)]"
                        : "border-transparent text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
                    }`}
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Request to Host</span>
                  </Link>
                </div>
              )}

              {profile?.platform_role === "staff_admin" && (
                <>
                  <div className="pb-2 pt-6">
                    <span className="block px-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                      Admin
                    </span>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 border-l-2 px-3 py-3 text-sm transition-colors ${
                      pathname === "/admin"
                        ? "border-[color:var(--neon-a)] bg-[color:var(--neon-a)]/8 text-[color:var(--neon-text0)]"
                        : "border-transparent text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
                    }`}
                  >
                    <Shield className="h-4 w-4" />
                    <span>Admin Overview</span>
                  </Link>

                  <Link
                    href="/admin/posts"
                    onClick={() => setOpen(false)}
                    className={`flex min-h-[44px] items-center gap-3 border-l-2 px-3 py-3 text-sm transition-colors ${
                      pathname.startsWith("/admin/posts")
                        ? "border-[color:var(--neon-a)] bg-[color:var(--neon-a)]/8 text-[color:var(--neon-text0)]"
                        : "border-transparent text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)]"
                    }`}
                  >
                    <Newspaper className="h-4 w-4" />
                    <span>Posts</span>
                  </Link>
                </>
              )}
            </nav>

            <div
              className="border-t border-[color:var(--neon-hairline)] p-4"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
            >
              <button
                onClick={handleSignOut}
                className="flex min-h-[44px] w-full items-center gap-2 px-3 py-3 text-xs uppercase tracking-widest text-[color:var(--neon-text2)] transition-colors hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
