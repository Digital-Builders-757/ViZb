"use client"

import {
  removeProfileAvatar,
  uploadProfileAvatar,
  type ProfileAvatarState,
} from "@/app/actions/profile"
import { UserAvatar } from "@/components/dashboard/user-avatar"
import { GlassCard } from "@/components/ui/glass-card"
import {
  PROFILE_AVATAR_ACCEPT_ATTR,
  validateProfileAvatarFile,
} from "@/lib/profile/avatar-upload-constraints"
import { ImageUp, Trash2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useRef, useState } from "react"

const initialState: ProfileAvatarState = { error: null, success: false }

export function ProfileAvatarForm({
  avatarUrl,
  displayName,
  email,
}: {
  avatarUrl?: string | null
  displayName?: string | null
  email?: string | null
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploadState, uploadAction, uploadPending] = useActionState(uploadProfileAvatar, initialState)
  const [removeState, removeAction, removePending] = useActionState(removeProfileAvatar, initialState)
  const [clientError, setClientError] = useState<string | null>(null)
  const [selectedName, setSelectedName] = useState<string | null>(null)

  useEffect(() => {
    if (!uploadState.success && !removeState.success) return
    inputRef.current?.form?.reset()
    router.refresh()
  }, [removeState.success, router, uploadState.success])

  const isPending = uploadPending || removePending
  const displayError = clientError ?? uploadState.error ?? removeState.error
  const successMessage = uploadState.success
    ? "Profile picture updated."
    : removeState.success
      ? "Profile picture removed."
      : null

  return (
    <GlassCard className="overflow-hidden shadow-[var(--vibe-neon-glow-subtle)]">
      <div className="flex items-center gap-3 px-5 pb-4 pt-5 md:px-6 md:pt-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--neon-a)_14%,transparent)]">
          <ImageUp className="h-4 w-4 text-[color:var(--neon-a)]" aria-hidden />
        </div>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          Profile picture
        </span>
      </div>

      <div className="border-t border-[color:var(--neon-hairline)]" />

      {successMessage ? (
        <div className="mx-5 mt-5 border border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] bg-[color:color-mix(in_srgb,var(--neon-a)_10%,transparent)] px-4 py-3 md:mx-6">
          <p className="text-sm text-[color:var(--neon-a)]">{successMessage}</p>
        </div>
      ) : null}
      {displayError ? (
        <div className="mx-5 mt-5 border border-destructive/50 bg-destructive/10 px-4 py-3 md:mx-6">
          <p className="text-sm text-destructive">{displayError}</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-5 px-5 py-5 md:px-6 md:py-6">
        <div className="flex items-center gap-4">
          <UserAvatar
            avatarUrl={avatarUrl}
            displayName={displayName}
            fallbackText={email}
            className="h-16 w-16"
            fallbackClassName="text-lg"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[color:var(--neon-text0)]">
              {displayName || "Set your display name"}
            </p>
            <p className="mt-1 text-xs text-[color:var(--neon-text2)]">
              JPEG, PNG, or WebP. Maximum 2MB.
            </p>
          </div>
        </div>

        <form
          action={uploadAction}
          onSubmit={(event) => {
            const file = inputRef.current?.files?.[0]
            if (!file) {
              event.preventDefault()
              setClientError("Choose an image to upload.")
              return
            }

            const validation = validateProfileAvatarFile(file)
            if (!validation.ok) {
              event.preventDefault()
              setClientError(validation.error)
            }
          }}
          className="flex flex-col gap-3"
        >
          <label
            htmlFor="avatar"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]"
          >
            Image file
          </label>
          <input
            ref={inputRef}
            id="avatar"
            name="avatar"
            type="file"
            accept={PROFILE_AVATAR_ACCEPT_ATTR}
            disabled={isPending}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              setClientError(null)
              setSelectedName(file?.name ?? null)
              if (!file) return
              const validation = validateProfileAvatarFile(file)
              if (!validation.ok) setClientError(validation.error)
            }}
            className="w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[color:color-mix(in_srgb,var(--neon-surface)_88%,transparent)] px-4 py-3 text-sm text-[color:var(--neon-text1)] file:mr-4 file:rounded-md file:border-0 file:bg-[color:var(--neon-a)] file:px-3 file:py-2 file:font-mono file:text-xs file:uppercase file:tracking-widest file:text-[color:var(--neon-bg0)] disabled:opacity-50"
          />
          {selectedName ? (
            <p className="truncate text-xs text-[color:var(--neon-text2)]">{selectedName}</p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={isPending || Boolean(clientError)}
              className="group relative inline-flex min-h-11 items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] px-6 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-[color:var(--neon-bg0)] shadow-[var(--vibe-neon-glow-subtle)] transition-[transform,opacity,box-shadow] hover:shadow-[var(--vibe-neon-glow)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
            >
              <ImageUp className="h-4 w-4" aria-hidden />
              {uploadPending ? "Uploading..." : avatarUrl ? "Replace" : "Upload"}
            </button>
          </div>
        </form>

        {avatarUrl ? (
          <form action={removeAction}>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-10 items-center justify-center gap-2 border border-[color:var(--neon-hairline)] px-4 py-2 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)] transition-colors hover:border-destructive/60 hover:text-destructive disabled:pointer-events-none disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              {removePending ? "Removing..." : "Remove picture"}
            </button>
          </form>
        ) : null}
      </div>
    </GlassCard>
  )
}
