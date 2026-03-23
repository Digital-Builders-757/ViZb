import React from "react"
import { getProfile, getUserOrganizations } from "@/lib/auth-helpers"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await getProfile()
  const { memberships } = await getUserOrganizations()

  // Transform memberships for sidebar
  const organizations = memberships
    .filter((m: any) => m.organization)
    .map((m: any) => ({
      role: m.role,
      organization: m.organization,
    }))

  return (
    <div className="min-h-[100dvh] bg-background overflow-x-hidden">
      {/* Mobile header with hamburger -- visible below md */}
      <MobileHeader profile={profile} organizations={organizations} />

      {/* Desktop sidebar -- hidden below md */}
      <DashboardSidebar profile={profile} organizations={organizations} />

      {/* Main content -- responsive margin and padding */}
      <main className="md:ml-64 min-h-[100dvh]">
        <div className="max-w-[1400px] mx-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
