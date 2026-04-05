import type { SupabaseClient } from "@supabase/supabase-js"

export interface DashboardNotificationItem {
  id: string
  title: string
  body: string | null
  href: string | null
  read_at: string | null
  created_at: string
}

export interface DashboardNotificationFeed {
  unreadCount: number
  items: DashboardNotificationItem[]
}

/**
 * Unread total + recent items for the dashboard shell (explicit selects).
 */
export async function fetchNotificationsForUser(
  supabase: SupabaseClient,
  userId: string,
): Promise<DashboardNotificationFeed> {
  const [countResult, listResult] = await Promise.all([
    supabase
      .from("user_notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null),
    supabase
      .from("user_notifications")
      .select("id, title, body, href, read_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20),
  ])

  if (countResult.error) throw new Error(countResult.error.message)
  if (listResult.error) throw new Error(listResult.error.message)

  return {
    unreadCount: countResult.count ?? 0,
    items: (listResult.data ?? []) as DashboardNotificationItem[],
  }
}
