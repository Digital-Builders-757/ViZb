"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Home, User, Calendar, Settings, LogOut, Shield, Building2, PlusCircle, Compass } from "lucide-react"

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
}

const attendeeLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/events", label: "Explore Events", icon: Compass },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/dashboard/tickets", label: "My Tickets", icon: Calendar },
]

export function DashboardSidebar({ profile, organizations = [] }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/")
    router.refresh()
  }

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-card border-r border-border flex-col z-40">
      {/* Logo */}
      <div className="h-14 flex items-center px-6 border-b border-border bg-gradient-to-r from-brand-blue/5 to-brand-cyan/5">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/vibe-logo.png"
            alt="ViZb"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span className="text-xs font-mono uppercase tracking-widest text-brand-cyan">Dashboard</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {/* Attendee section */}
        <span className="block text-[10px] font-mono uppercase tracking-widest text-brand-cyan px-3 mb-3">
          Personal
        </span>
        {attendeeLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "text-brand-cyan border-l-2 active-gradient-border bg-brand-cyan/5"
                  : "text-muted-foreground hover:text-foreground border-l-2 border-transparent hover:border-l-2 hover:border-brand-cyan/30"
              }`}
            >
              <link.icon className={`w-4 h-4 ${isActive ? "text-brand-cyan" : ""}`} />
              <span>{link.label}</span>
            </Link>
          )
        })}

        {/* Organizer section */}
        {organizations.length > 0 && (
          <>
            <div className="pt-6 pb-2">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-brand-blue-mid px-3">
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
                  className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                    isActive
                      ? "text-brand-blue-mid border-l-2 border-brand-blue-mid bg-brand-blue-mid/5"
                      : "text-muted-foreground hover:text-foreground border-l-2 border-transparent hover:border-l-2 hover:border-brand-blue-mid/30"
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="truncate">{org.name}</span>
                  {org.status === "pending_review" && (
                    <span className="ml-auto text-[10px] font-mono uppercase tracking-widest text-muted-foreground border border-border px-1.5 py-0.5">
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
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                pathname === "/host/apply"
                  ? "text-brand-cyan-bright border-l-2 border-brand-cyan-bright bg-brand-cyan-bright/5"
                  : "text-muted-foreground hover:text-foreground border-l-2 border-transparent hover:border-l-2 hover:border-brand-cyan-bright/30"
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Request to Host</span>
            </Link>
          </div>
        )}

        {/* Admin section */}
        {profile?.platform_role === "staff_admin" && (
          <>
            <div className="pt-6 pb-2">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-brand-blue px-3">
                Admin
              </span>
            </div>
            <Link
              href="/admin"
              className={`flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${
                pathname.startsWith("/admin")
                  ? "text-brand-blue border-l-2 border-brand-blue bg-brand-blue/5"
                  : "text-muted-foreground hover:text-foreground border-l-2 border-transparent hover:border-l-2 hover:border-brand-blue/30"
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </Link>
          </>
        )}
      </nav>

      {/* Bottom -- user info + sign out */}
      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center ring-2 ring-brand-cyan/30">
            <span className="text-xs font-bold text-white">
              {(profile?.display_name || "U")[0].toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {profile?.display_name || "User"}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 w-full px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
