import Link from "next/link"
import { ArrowLeft, Shield } from "lucide-react"

import { requireAdmin } from "@/lib/auth-helpers"
import { logError } from "@/lib/log"
import { createClient, isServerSupabaseConfigured } from "@/lib/supabase/server"
import { isServiceRoleConfigured } from "@/lib/supabase/project-env"
import { UsersTable } from "@/components/admin/users-table"
import { GlassCard } from "@/components/ui/glass-card"

export default async function AdminUsersPage() {
  const { user: adminUser } = await requireAdmin()

  if (!isServerSupabaseConfigured()) {
    return (
      <div className="space-y-6">
        <AdminUsersHeader />
        <GlassCard className="p-6">
          <p className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
            Supabase server environment is not configured. Connect Supabase to view users.
          </p>
        </GlassCard>
      </div>
    )
  }

  const supabase = await createClient()
  const { data: allUsers, error } = await supabase.rpc("admin_list_users")

  if (error) {
    logError("admin.users", error, { query: "admin_list_users" })
  }

  return (
    <div>
      <AdminUsersHeader />
      {error ? (
        <GlassCard className="mt-6 border border-amber-500/35 p-4 md:p-5">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-200">Could not load users</p>
          <p className="mt-2 text-sm text-[color:var(--neon-text1)]">
            Check server logs for <span className="font-mono">[admin.users]</span> entries.
          </p>
        </GlassCard>
      ) : (
        <div className="mt-8">
          <UsersTable
            users={allUsers ?? []}
            currentUserId={adminUser.id}
            userDeletionEnabled={isServiceRoleConfigured()}
          />
        </div>
      )}
    </div>
  )
}

function AdminUsersHeader() {
  return (
    <>
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to admin overview
      </Link>
      <div className="mt-4 flex items-center gap-3">
        <Shield className="h-5 w-5 text-neon-b" />
        <span className="font-mono text-xs uppercase tracking-widest text-neon-b">Staff Admin</span>
      </div>
      <h1 className="mt-2 font-serif text-xl font-bold text-foreground md:text-3xl">All users</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Search, review roles, and manage platform accounts.
      </p>
    </>
  )
}
