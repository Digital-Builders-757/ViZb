import Image from "next/image"

export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center">
      {/* Subtle radial ambient glow behind logo */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0, 189, 255, 0.04) 0%, transparent 70%)",
        }}
      />

      {/* Logo with fade-in + soft pulse */}
      <div className="relative animate-logo-enter opacity-0">
        <Image
          src="/vibe-logo.png"
          alt="VIZB"
          width={280}
          height={280}
          className="w-40 h-40 sm:w-56 sm:h-56 md:w-72 md:h-72 object-contain select-none"
          priority
          draggable={false}
        />
      </div>

      {/* Animated shimmer line */}
      <div className="mt-10 w-32 sm:w-40 h-px relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-cyan/60 to-transparent animate-shimmer-line" />
      </div>

      {/* Brand tagline */}
      <p className="mt-6 text-[10px] sm:text-xs font-mono uppercase tracking-[0.3em] text-muted-foreground animate-pulse">
        Driving Culture Forward
      </p>
    </div>
  )
}
