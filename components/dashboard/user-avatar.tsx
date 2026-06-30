"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"

export function UserAvatar({
  avatarUrl,
  displayName,
  fallbackText,
  className,
  fallbackClassName,
}: {
  avatarUrl?: string | null
  displayName?: string | null
  fallbackText?: string | null
  className?: string
  fallbackClassName?: string
}) {
  const seed = (displayName || fallbackText || "U").trim()
  const initial = seed[0]?.toUpperCase() ?? "U"

  return (
    <Avatar className={cn("ring-2 ring-[color:var(--neon-a)]/35", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt="" className="object-cover" /> : null}
      <AvatarFallback
        delayMs={0}
        className={cn(
          "bg-gradient-to-br from-[color:var(--neon-a)]/40 to-[color:var(--neon-b)]/40 text-xs font-bold text-[color:var(--neon-text0)]",
          fallbackClassName,
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  )
}
