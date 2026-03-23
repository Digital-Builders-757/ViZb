import { getProfile } from "@/lib/auth-helpers"
import { ProfileForm } from "@/components/dashboard/profile-form"
import { Mail } from "lucide-react"

export default async function ProfilePage() {
  const { user, profile } = await getProfile()

  const initial = (profile?.display_name || user.email || "U")[0].toUpperCase()

  return (
    <div>
      {/* Page header */}
      <span className="text-xs uppercase tracking-widest text-brand-cyan font-mono">Settings</span>
      <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2">Your Profile</h1>
      <p className="text-sm text-muted-foreground mt-2">
        Manage your personal information and account settings.
      </p>

      {/* Identity card + Form */}
      <div className="mt-10 max-w-lg form-glow-bg">
        {/* Identity preview card */}
        <div className="form-card p-5 md:p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand-blue to-brand-cyan flex items-center justify-center ring-2 ring-brand-cyan/20 shrink-0">
              <span className="text-xl font-bold text-white">{initial}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground truncate">
                {profile?.display_name || "Set your display name"}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Mail className="w-3 h-3 text-brand-cyan shrink-0" />
                <p className="text-xs text-muted-foreground truncate font-mono">{user.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <ProfileForm
          initialDisplayName={profile?.display_name || ""}
          initialAvatarUrl={profile?.avatar_url || ""}
          email={user.email || ""}
        />
      </div>
    </div>
  )
}
