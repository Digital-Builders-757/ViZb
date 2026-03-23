import { getProfile, getUserOrganizations } from "@/lib/auth-helpers"
import Link from "next/link"
import { Calendar, Building2, Ticket, Shield } from "lucide-react"

export default async function DashboardPage() {
  const { profile } = await getProfile()
  const { memberships } = await getUserOrganizations()

  const displayName = profile?.display_name || "there"
  const isFirstRun = !profile?.display_name

  return (
    <div>
      {/* Page header */}
      <span className="text-xs uppercase tracking-widest text-brand-cyan font-mono">Overview</span>
      <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2 text-balance">
        {isFirstRun ? "Welcome to ViZb" : `Hey, ${displayName}`}
      </h1>
      {isFirstRun && (
        <p className="text-muted-foreground mt-2 max-w-lg">
          {"You're in. Set up your profile to get the most out of ViZb."}
        </p>
      )}

      {/* First-run prompt */}
      {isFirstRun && (
        <Link
          href="/profile"
          className="mt-6 inline-flex items-center gap-3 bg-brand-cyan/10 border border-brand-cyan/20 px-4 py-3 md:px-6 md:py-4 hover:bg-brand-cyan/20 transition-colors group w-full sm:w-auto"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center">
            <span className="text-white font-bold">1</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Complete your profile</p>
            <p className="text-xs text-muted-foreground">Add your name to get started</p>
          </div>
          <span className="ml-auto text-brand-cyan group-hover:translate-x-1 transition-transform">
            &rarr;
          </span>
        </Link>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mt-8 md:mt-10">
        <div className="border border-border p-4 md:p-6 card-accent-cyan">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <Ticket className="w-4 h-4 md:w-5 md:h-5 text-brand-cyan" />
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground">Tickets</span>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-brand-cyan font-mono">0</span>
          <span className="block text-xs text-muted-foreground mt-1">Upcoming events</span>
        </div>

        <div className="border border-border p-4 md:p-6 card-accent-blue-mid">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <Building2 className="w-4 h-4 md:w-5 md:h-5 text-brand-blue-mid" />
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground">Organizations</span>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-brand-blue-mid font-mono">{memberships.length}</span>
          <span className="block text-xs text-muted-foreground mt-1">
            {memberships.length === 0 ? "Not part of any org yet" : "Active memberships"}
          </span>
        </div>

        <div className="border border-border p-4 md:p-6 card-accent-cyan-bright">
          <div className="flex items-center gap-3 mb-3 md:mb-4">
            <Calendar className="w-4 h-4 md:w-5 md:h-5 text-brand-cyan-bright" />
            <span className="text-[10px] md:text-xs font-mono uppercase tracking-widest text-muted-foreground">Events</span>
          </div>
          <span className="text-2xl md:text-3xl font-bold text-brand-cyan-bright font-mono">0</span>
          <span className="block text-xs text-muted-foreground mt-1">Events attended</span>
        </div>
      </div>

      {/* Request to Host CTA -- only for non-admin users with no orgs */}
      {memberships.length === 0 && profile?.platform_role !== "staff_admin" && (
        <div className="mt-10">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Organize</span>
          <h2 className="font-serif text-xl font-bold text-foreground mt-2">Want to Host Events?</h2>
          <Link
            href="/host/apply"
            className="mt-4 flex items-center gap-3 border border-border px-4 py-3 md:px-6 md:py-4 hover:border-brand-cyan/30 hover:bg-brand-cyan/5 transition-colors group"
          >
            <Building2 className="w-5 h-5 text-brand-cyan" />
            <div>
              <p className="text-sm font-semibold text-foreground">Request to Host</p>
              <p className="text-xs text-muted-foreground">Apply to become an event organizer on ViZb</p>
            </div>
            <span className="ml-auto text-brand-cyan group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>
      )}

      {/* Admin quick link -- only for admins with no orgs */}
      {memberships.length === 0 && profile?.platform_role === "staff_admin" && (
        <div className="mt-10">
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Organize</span>
          <h2 className="font-serif text-xl font-bold text-foreground mt-2">Create an Organization</h2>
          <Link
            href="/admin"
            className="mt-4 flex items-center gap-3 border border-border px-4 py-3 md:px-6 md:py-4 hover:border-brand-blue/30 hover:bg-brand-blue/5 transition-colors group"
          >
            <Shield className="w-5 h-5 text-brand-blue" />
            <div>
              <p className="text-sm font-semibold text-foreground">Go to Admin Panel</p>
              <p className="text-xs text-muted-foreground">Create organizations directly from the admin dashboard</p>
            </div>
            <span className="ml-auto text-brand-blue group-hover:translate-x-1 transition-transform">&rarr;</span>
          </Link>
        </div>
      )}

      {/* Tickets empty state */}
      <div className="mt-10">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Upcoming</span>
        <h2 className="font-serif text-xl font-bold text-foreground mt-2">Your Tickets</h2>

        <div className="mt-6 border border-dashed p-6 md:p-12 flex flex-col items-center text-center gradient-border">
          <span className="text-xs uppercase tracking-widest text-brand-cyan font-mono">No Tickets Yet</span>
          <h3 className="text-lg font-bold text-foreground uppercase mt-2">Find Your Next Vibe</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Browse upcoming events and grab your tickets. Your confirmed events will show up here.
          </p>
          <Link
            href="/events"
            className="mt-6 bg-gradient-to-r from-brand-blue to-brand-cyan text-white px-8 py-4 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(0,189,255,0.4)] transition-all"
          >
            Browse Events
          </Link>
        </div>
      </div>
    </div>
  )
}
