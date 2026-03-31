"use client"

import { updateProfileDisplayName, type UpdateProfileState } from "@/app/actions/profile"
import { GlassCard } from "@/components/ui/glass-card"
import { Lock, User } from "lucide-react"
import { useActionState } from "react"

const initialActionState: UpdateProfileState = { error: null, success: false }

interface ProfileFormProps {
  initialDisplayName: string
  email: string
}

const inputClass =
  "w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[color:color-mix(in_srgb,var(--neon-surface)_88%,transparent)] px-4 py-3 text-[15px] text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)] transition-[border-color,box-shadow] focus:border-[color:color-mix(in_srgb,var(--neon-a)_55%,var(--neon-hairline))] focus:outline-none focus:shadow-[0_0_0_2px_color-mix(in_srgb,var(--neon-a)_22%,transparent),var(--vibe-neon-glow-subtle)]"

export function ProfileForm({ initialDisplayName, email }: ProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfileDisplayName, initialActionState)

  return (
    <form action={formAction}>
      <GlassCard className="overflow-hidden shadow-[var(--vibe-neon-glow-subtle)]">
        <div className="flex items-center gap-3 px-5 pb-4 pt-5 md:px-6 md:pt-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--neon-a)_14%,transparent)]">
            <User className="h-4 w-4 text-[color:var(--neon-a)]" aria-hidden />
          </div>
          <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
            Account details
          </span>
        </div>

        <div className="border-t border-[color:var(--neon-hairline)]" />

        {state.success ? (
          <div className="mx-5 mt-5 border border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] bg-[color:color-mix(in_srgb,var(--neon-a)_10%,transparent)] px-4 py-3 md:mx-6">
            <p className="text-sm text-[color:var(--neon-a)]">Profile updated.</p>
          </div>
        ) : null}
        {state.error ? (
          <div className="mx-5 mt-5 border border-destructive/50 bg-destructive/10 px-4 py-3 md:mx-6">
            <p className="text-sm text-destructive">{state.error}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-6 px-5 py-5 md:px-6 md:py-6">
          <div>
            <label className="mb-2 block font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
              Email
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                disabled
                readOnly
                className={`${inputClass} cursor-not-allowed pr-10 opacity-80`}
              />
              <Lock
                className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--neon-text2)]"
                aria-hidden
              />
            </div>
            <p className="mt-1.5 text-[11px] text-[color:var(--neon-text2)]">
              Managed by your sign-in provider
            </p>
          </div>

          <div>
            <label
              htmlFor="display-name"
              className="mb-2 block font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]"
            >
              Display name
            </label>
            <input
              id="display-name"
              name="displayName"
              type="text"
              key={initialDisplayName}
              defaultValue={initialDisplayName}
              placeholder="What should we call you?"
              className={inputClass}
              disabled={isPending}
            />
          </div>
        </div>

        <div className="border-t border-[color:var(--neon-hairline)]" />
        <div className="flex items-center gap-4 bg-[color:color-mix(in_srgb,var(--neon-bg1)_55%,transparent)] px-5 py-4 md:px-6">
          <button
            type="submit"
            disabled={isPending}
            className="group relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] px-8 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-[color:var(--neon-bg0)] shadow-[var(--vibe-neon-glow-subtle)] transition-[transform,opacity,box-shadow] hover:shadow-[var(--vibe-neon-glow)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Saving…" : "Save changes"}
          </button>
          {state.success ? (
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Saved</span>
          ) : null}
        </div>
      </GlassCard>
    </form>
  )
}
