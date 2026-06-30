import { getProfile } from "@/lib/auth-helpers"
import { MemberPreferencesForm } from "@/components/dashboard/member-preferences-form"
import { ProfileAvatarForm } from "@/components/dashboard/profile-avatar-form"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { UserAvatar } from "@/components/dashboard/user-avatar"
import { fetchMemberPreferences } from "@/lib/member/load-preferences"
import { calculateProfileCompletion } from "@/lib/profile/profile-completion"
import { createClient } from "@/lib/supabase/server"
import { GlassCard } from "@/components/ui/glass-card"
import { Mail } from "lucide-react"

export default async function ProfilePage() {
  const { user, profile } = await getProfile()
  const supabase = await createClient()
  const memberPreferences = await fetchMemberPreferences(supabase, user.id)
  const profileCompletion = calculateProfileCompletion(
    { display_name: profile?.display_name, avatar_url: profile?.avatar_url },
    memberPreferences,
  )

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
          Manage your personal information and how you appear in VIZB.
        </p>
      </header>

      <div className="max-w-lg space-y-5">
        <GlassCard className="p-5 md:p-6 shadow-[var(--vibe-neon-glow-subtle)]">
          <div className="flex items-start gap-4">
            <UserAvatar
              avatarUrl={profile?.avatar_url}
              displayName={profile?.display_name}
              fallbackText={user.email}
              className="h-14 w-14"
              fallbackClassName="text-lg"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[color:var(--neon-text0)]">
                {profile?.display_name || "Set your display name"}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <Mail className="h-3 w-3 shrink-0 text-[color:var(--neon-a)]" aria-hidden />
                <p className="truncate font-mono text-xs text-[color:var(--neon-text2)]">{user.email}</p>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                    Profile completion
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
                    {profileCompletion.pct}%
                  </p>
                </div>
                <div className="mt-2 h-1.5 w-full bg-[color:var(--neon-bg1)]">
                  <div
                    className="h-full bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)]"
                    style={{ width: `${profileCompletion.pct}%` }}
                  />
                </div>
                {profileCompletion.missingFields.length > 0 ? (
                  <p className="mt-2 text-xs text-[color:var(--neon-text2)]">
                    Finish: {profileCompletion.missingFields.join(", ")}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-[color:var(--neon-a)]">Profile complete.</p>
                )}
              </div>
            </div>
          </div>
        </GlassCard>

        <ProfileAvatarForm
          avatarUrl={profile?.avatar_url}
          displayName={profile?.display_name}
          email={user.email}
        />
        <ProfileForm initialDisplayName={profile?.display_name ?? ""} email={user.email ?? ""} />
        <div id="culture-preferences">
          <MemberPreferencesForm initial={memberPreferences} variant="profile" />
        </div>
      </div>
    </div>
  )
}
