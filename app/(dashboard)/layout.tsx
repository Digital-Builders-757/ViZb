import React from "react"
import { getUserOrganizations } from "@/lib/auth-helpers"
import { AppShell } from "@/components/ui/app-shell"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import {
  fetchNotificationsForUser,
  type DashboardNotificationFeed,
} from "@/lib/notifications/dashboard-queries"
import { isServerSupabaseConfigured } from "@/lib/supabase/server"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile, user, supabase, memberships } = await getUserOrganizations()

  let notifications: DashboardNotificationFeed | undefined

  if (isServerSupabaseConfigured()) {
    try {
      notifications = await fetchNotificationsForUser(supabase, user.id)
    } catch {
      notifications = { unreadCount: 0, items: [] }
    }
  }

  // Transform memberships for sidebar
  const organizations = memberships
    .filter((m: any) => m.organization)
    .map((m: any) => ({
      role: m.role,
      organization: m.organization,
    }))

  return (
    <AppShell
      withNeonBackdrop
      className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <MobileHeader profile={profile} organizations={organizations} notifications={notifications} />
      <DashboardSidebar profile={profile} organizations={organizations} notifications={notifications} />
      <main className="min-h-[100dvh] md:ml-64">
        <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8 md:py-8">{children}</div>
      </main>
    </AppShell>
  )
}
