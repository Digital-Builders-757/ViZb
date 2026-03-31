import { getProfile } from "@/lib/auth-helpers"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { GlassCard } from "@/components/ui/glass-card"
import { Mail } from "lucide-react"

export default async function ProfilePage() {
  const { user, profile } = await getProfile()

  const initial = (profile?.display_name || user.email || "U")[0].toUpperCase()

  return (
    <div className="space-y-8 md:space-y-10">
      <header>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          Settings
        </span>
        <h1 className="mt-2 text-balance font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          Your profile
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          Manage your personal information and how you appear in ViZb.
        </p>
      </header>

      <div className="max-w-lg space-y-5">
        <GlassCard className="p-5 md:p-6 shadow-[var(--vibe-neon-glow-subtle)]">
          <div className="flex items-center gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[color:var(--neon-a)] to-[color:var(--neon-b)] text-lg font-bold text-[color:var(--neon-bg0)] ring-2 ring-[color:color-mix(in_srgb,var(--neon-a)_35%,transparent)]"
              aria-hidden
            >
              {initial}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[color:var(--neon-text0)]">
                {profile?.display_name || "Set your display name"}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0 text-[color:var(--neon-a)]" aria-hidden />
                <p className="truncate font-mono text-xs text-[color:var(--neon-text2)]">{user.email}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        <ProfileForm initialDisplayName={profile?.display_name ?? ""} email={user.email ?? ""} />
      </div>
    </div>
  )
}
