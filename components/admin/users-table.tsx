"use client"

import { useState } from "react"
import { Users, Search, Shield, Building2 } from "lucide-react"

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
  role_admin: boolean
  created_at: string
  last_sign_in_at: string | null
  org_count: number
}

export function UsersTable({ users }: { users: UserRow[] }) {
  const [search, setSearch] = useState("")

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (u.display_name?.toLowerCase() ?? "").includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.platform_role.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or role..."
          className="w-full bg-input border border-border pl-10 pr-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-brand-cyan transition-colors"
        />
      </div>

      {/* Count */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-4 h-4 text-muted-foreground" />
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          {filtered.length} user{filtered.length !== 1 ? "s" : ""}
          {search && ` matching "${search}"`}
        </span>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block border border-border overflow-hidden card-accent-cyan">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-gradient-to-r from-brand-blue/5 via-brand-cyan/5 to-transparent">
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">User</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Email</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Role</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Orgs</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Joined</th>
              <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 flex items-center justify-center text-xs font-bold text-white uppercase"
                      style={{ backgroundColor: getAvatarColor(user.display_name), opacity: 0.9 }}
                    >
                      {user.display_name?.[0] ?? "?"}
                    </div>
                    <span className="font-medium text-foreground">{user.display_name ?? "Unnamed"}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{user.email}</td>
                <td className="px-4 py-3">
                  <RoleBadge role={user.platform_role} />
                </td>
                <td className="px-4 py-3">
                  {user.org_count > 0 ? (
                    <span className="flex items-center gap-1.5 text-xs text-foreground">
                      <Building2 className="w-3 h-3 text-brand-blue-mid" />
                      {user.org_count}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">--</span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {user.last_sign_in_at ? formatRelative(user.last_sign_in_at) : "Never"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.map((user) => (
          <div key={user.id} className="border border-border p-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 flex items-center justify-center text-sm font-bold text-white uppercase shrink-0"
                style={{ backgroundColor: getAvatarColor(user.display_name), opacity: 0.9 }}
              >
                {user.display_name?.[0] ?? "?"}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground truncate">{user.display_name ?? "Unnamed"}</span>
                  <RoleBadge role={user.platform_role} />
                </div>
                <span className="text-xs text-muted-foreground font-mono block truncate">{user.email}</span>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  {user.org_count} org{user.org_count !== 1 ? "s" : ""}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">
                Joined {formatDate(user.created_at)}
              </span>
              <span className="text-[10px] text-muted-foreground ml-auto">
                {user.last_sign_in_at ? formatRelative(user.last_sign_in_at) : "Never seen"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="border border-border border-dashed p-8 flex flex-col items-center text-center">
          <Users className="w-6 h-6 text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">
            {search ? "No users match your search." : "No users yet."}
          </p>
        </div>
      )}
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === "staff_admin"
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 border ${
        isAdmin
          ? "border-brand-cyan/40 text-brand-cyan bg-brand-cyan/10"
          : "border-border text-muted-foreground"
      }`}
    >
      {isAdmin && <Shield className="w-3 h-3" />}
      {role === "staff_admin" ? "Admin" : "User"}
    </span>
  )
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatRelative(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(dateStr)
}
