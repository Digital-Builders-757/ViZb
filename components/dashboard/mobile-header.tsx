"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Menu, Home, User, Calendar, Shield, Building2, PlusCircle, LogOut, Compass } from "lucide-react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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
}

const attendeeLinks = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/events", label: "Explore Events", icon: Compass },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/dashboard/tickets", label: "My Tickets", icon: Calendar },
]

export function MobileHeader({ profile, organizations = [] }: MobileHeaderProps) {
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
    <header className="md:hidden sticky top-0 z-50 bg-card border-b border-border bg-gradient-to-r from-card via-card to-brand-cyan/5">
      <div className="flex items-center justify-between h-14 px-4" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/vibe-logo.png"
            alt="ViZb"
            width={28}
            height={28}
            className="h-7 w-auto"
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-brand-cyan">Dashboard</span>
        </Link>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className="flex items-center justify-center w-11 h-11 text-foreground"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0 bg-card border-border">
            <SheetHeader className="border-b border-border px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center ring-2 ring-brand-cyan/30">
                  <span className="text-xs font-bold text-white">
                    {(profile?.display_name || "U")[0].toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <SheetTitle className="text-sm font-medium text-foreground truncate">
                    {profile?.display_name || "User"}
                  </SheetTitle>
                </div>
              </div>
            </SheetHeader>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              <span className="block text-[10px] font-mono uppercase tracking-widest text-brand-cyan px-3 mb-3">
                Personal
              </span>
              {attendeeLinks.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm transition-colors min-h-[44px] ${
                      isActive
                        ? "text-brand-cyan border-l-2 active-gradient-border bg-brand-cyan/5"
                        : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                    }`}
                  >
                    <link.icon className={`w-4 h-4 ${isActive ? "text-brand-cyan" : ""}`} />
                    <span>{link.label}</span>
                  </Link>
                )
              })}

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
                        onClick={() => setOpen(false)}
                        className={`flex items-center gap-3 px-3 py-3 text-sm transition-colors min-h-[44px] ${
                          isActive
                            ? "text-brand-blue-mid border-l-2 border-brand-blue-mid bg-brand-blue-mid/5"
                            : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
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

              {organizations.length === 0 && profile?.platform_role !== "staff_admin" && (
                <div className="pt-4">
                  <Link
                    href="/host/apply"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm transition-colors min-h-[44px] ${
                      pathname === "/host/apply"
                        ? "text-brand-cyan-bright border-l-2 border-brand-cyan-bright bg-brand-cyan-bright/5"
                        : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                    }`}
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Request to Host</span>
                  </Link>
                </div>
              )}

              {profile?.platform_role === "staff_admin" && (
                <>
                  <div className="pt-6 pb-2">
                    <span className="block text-[10px] font-mono uppercase tracking-widest text-brand-blue px-3">
                      Admin
                    </span>
                  </div>
                  <Link
                    href="/admin"
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 text-sm transition-colors min-h-[44px] ${
                      pathname.startsWith("/admin")
                        ? "text-brand-blue border-l-2 border-brand-blue bg-brand-blue/5"
                        : "text-muted-foreground hover:text-foreground border-l-2 border-transparent"
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Admin Panel</span>
                  </Link>
                </>
              )}
            </nav>

            <div className="border-t border-border p-4" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 w-full px-3 py-3 text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors min-h-[44px]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
