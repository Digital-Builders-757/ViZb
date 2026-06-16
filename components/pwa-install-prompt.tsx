"use client"

import { X } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"

import { NeonButton } from "@/components/ui/neon-button"
import { usePwaInstallPrompt } from "@/hooks/use-pwa-install-prompt"

export function PwaInstallPrompt() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { variant, isVisible, promptInstall, dismiss } = usePwaInstallPrompt({
    pathname,
    searchParams,
  })

  if (!isVisible || variant === "none") return null

  const isIos = variant === "ios"

  return (
    <div
      role="region"
      aria-label={isIos ? "Add ViZb to your iPhone" : "Add ViZb to your phone"}
      className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
    >
      <div className="pointer-events-auto mx-auto max-w-lg rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/95 p-4 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">
              {isIos ? "Save ViZb to your iPhone" : "Save ViZb to your phone"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-[color:var(--neon-text1)]">
              {isIos
                ? "Tap Share, choose “Add to Home Screen,” then tap Add."
                : "Get back to events faster — add ViZb to your home screen."}
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full p-1 text-[color:var(--neon-text2)] transition-colors hover:text-[color:var(--neon-text0)]"
            aria-label="Dismiss install prompt"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className={`mt-4 flex gap-2 ${isIos ? "flex-col" : "flex-col sm:flex-row"}`}>
          {isIos ? (
            <NeonButton type="button" fullWidth shape="xl" onClick={dismiss}>
              Got it
            </NeonButton>
          ) : (
            <>
              <NeonButton type="button" fullWidth shape="xl" onClick={() => void promptInstall()}>
                Add ViZb
              </NeonButton>
              <NeonButton type="button" fullWidth variant="ghost" shape="xl" onClick={dismiss}>
                Maybe later
              </NeonButton>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
