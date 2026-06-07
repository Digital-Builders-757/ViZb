import {
  adminPostFormErrorMessage,
  isAdminPostFormErrorCode,
  type AdminPostFormErrorCode,
} from "@/lib/posts/admin-post-errors"
import { GlassCard } from "@/components/ui/glass-card"

export function AdminPostErrorBanner({
  error,
  slug,
  dbMessage,
}: {
  error?: string
  slug?: string
  dbMessage?: string
}) {
  if (!error || !isAdminPostFormErrorCode(error)) return null

  const { title, body } = adminPostFormErrorMessage(error as AdminPostFormErrorCode, { slug, dbMessage })

  return (
    <GlassCard className="p-5">
      <p className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">{title}</p>
      <p className="mt-2 text-[15px] leading-relaxed text-[color:var(--neon-text1)]">{body}</p>
    </GlassCard>
  )
}
