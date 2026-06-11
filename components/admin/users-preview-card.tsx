import Link from "next/link"
import { ArrowRight, Building2, Shield, Users } from "lucide-react"

import { GlassCard } from "@/components/ui/glass-card"
import { NeonLink } from "@/components/ui/neon-link"

const BRAND_COLORS = ["#0D40FF", "#0C74E8", "#00BDFF", "#00E5FF"]

function getAvatarColor(name: string | null) {
  const char = (name || "?").charCodeAt(0)
  return BRAND_COLORS[char % BRAND_COLORS.length]
}

type UserRow = {
  id: string
  email: string
  display_name: string | null
  platform_role: string
  org_count: number
  created_at: string
}

export function UsersPreviewCard({
  users,
  totalCount,
}: {
  users: UserRow[]
  totalCount: number
}) {
  const preview = users.slice(0, 5)

  return (
    <GlassCard className="card-accent-blue p-4 md:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-semibold text-[color:var(--neon-text0)]">User directory</p>
          <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
            {totalCount} signed-up member{totalCount !== 1 ? "s" : ""}. Search, review roles, and manage accounts on the full users page.
          </p>
        </div>
        <NeonLink href="/admin/users" shape="xl" variant="secondary" className="sm:w-auto shrink-0">
          Manage all users
        </NeonLink>
      </div>

      {preview.length > 0 ? (
        <ul className="mt-4 divide-y divide-[color:var(--neon-hairline)] border border-[color:var(--neon-hairline)]">
          {preview.map((user) => (
            <li key={user.id} className="flex items-center gap-3 px-3 py-2.5">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center text-xs font-bold uppercase text-white"
                style={{ backgroundColor: getAvatarColor(user.display_name), opacity: 0.9 }}
              >
                {user.display_name?.[0] ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-foreground">
                    {user.display_name ?? "Unnamed"}
                  </span>
                  {user.platform_role === "staff_admin" ? (
                    <span className="inline-flex items-center gap-0.5 border border-neon-a/40 bg-neon-a/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest text-neon-a">
                      <Shield className="h-2.5 w-2.5" />
                      Admin
                    </span>
                  ) : null}
                </div>
                <span className="block truncate font-mono text-xs text-muted-foreground">{user.email}</span>
              </div>
              {user.org_count > 0 ? (
                <span className="flex shrink-0 items-center gap-1 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <Building2 className="h-3 w-3" />
                  {user.org_count}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex flex-col items-center border border-dashed border-[color:var(--neon-hairline)] p-6 text-center">
          <Users className="mb-2 h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No users yet.</p>
        </div>
      )}

      {totalCount > preview.length ? (
        <Link
          href="/admin/users"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-neon-a underline-offset-4 hover:underline"
        >
          View all {totalCount} users
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : null}
    </GlassCard>
  )
}
