import Image from "next/image"

import { WaterLoader } from "@/components/ui/water-loader"

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[color:var(--neon-bg0)]">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, color-mix(in srgb, var(--water-a) 14%, transparent) 0%, transparent 72%)",
        }}
        aria-hidden
      />

      <div className="relative animate-logo-enter opacity-0 motion-reduce:animate-none motion-reduce:opacity-100 motion-reduce:scale-100">
        <Image
          src="/vibe-logo.png"
          alt="VIZB"
          width={280}
          height={280}
          className="h-40 w-40 select-none object-contain sm:h-56 sm:w-56 md:h-72 md:w-72"
          priority
          draggable={false}
        />
      </div>

      <p className="relative mt-10 max-w-sm px-6 text-center font-serif text-base font-semibold tracking-tight text-[color:var(--neon-text0)] sm:text-lg">
        Virginia isn&apos;t boring.
      </p>

      <p className="relative mt-2 max-w-md px-6 text-center text-sm leading-relaxed text-[color:var(--neon-text2)]">
        Hold tight — the timeline is rippling in.
      </p>

      <div className="relative mt-8">
        <WaterLoader size="lg" />
      </div>

      <p className="relative mt-8 px-6 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-text2)] motion-reduce:animate-none motion-reduce:opacity-100 animate-pulse">
        Driving culture forward
      </p>
    </div>
  )
}
