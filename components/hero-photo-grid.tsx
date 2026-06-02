import Image from "next/image"

import { WaterFrame } from "@/components/ui/water-frame"

/** Editorial photo grid moved from homepage hero — used on /about. */
export function HeroPhotoGrid() {
  return (
    <div className="relative mx-auto max-w-[640px]">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <WaterFrame className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
            <Image
              src="/vibe-event-dj.jpg"
              alt="DJ performing at VIZB event"
              fill
              sizes="(max-width: 768px) 50vw, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#0D40FF]/40 via-[#0C74E8]/30 to-transparent mix-blend-multiply" />
          </WaterFrame>
          <div className="group relative overflow-hidden rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/28 p-4 backdrop-blur-sm transition hover:border-[color:var(--neon-a)]/35">
            <div
              className="pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(120deg, rgba(0,209,255,0.12), rgba(157,77,255,0.10))",
              }}
              aria-hidden
            />
            <p className="relative font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)]">
              Hampton Roads
            </p>
          </div>
        </div>
        <div className="space-y-4 pt-12">
          <div className="group relative overflow-hidden rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/28 p-4 backdrop-blur-sm transition hover:border-[color:var(--neon-b)]/35">
            <div
              className="pointer-events-none absolute inset-0 opacity-70 transition-opacity group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(120deg, rgba(157,77,255,0.14), rgba(0,209,255,0.08))",
              }}
              aria-hidden
            />
            <p className="relative font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text0)]">
              DMV
            </p>
          </div>
          <WaterFrame className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
            <Image
              src="/vibe-event-party.jpg"
              alt="VIZB community members at party"
              fill
              sizes="(max-width: 768px) 50vw, 320px"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-tl from-[#00BDFF]/40 via-[#0C74E8]/30 to-transparent mix-blend-multiply" />
          </WaterFrame>
        </div>
      </div>

      <div className="absolute -right-8 -top-8 h-32 w-32 animate-pulse rounded-full bg-[color:var(--neon-b)]/20 blur-3xl" aria-hidden />
      <div className="absolute -bottom-8 -left-8 h-24 w-24 animate-pulse rounded-full bg-[color:var(--neon-a)]/20 blur-3xl delay-1000" aria-hidden />
    </div>
  )
}
