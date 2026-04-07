import { cn } from "@/lib/utils"

export type OceanDividerVariant = "default" | "hero" | "soft"
export type OceanDividerDensity = "sparse" | "normal" | "rich"

const densityHeight: Record<OceanDividerDensity, string> = {
  sparse: "h-16 sm:h-20",
  normal: "h-24 sm:h-32",
  rich: "h-32 sm:h-40",
}

export type OceanDividerProps = {
  variant?: OceanDividerVariant
  density?: OceanDividerDensity
  withLine?: boolean
  className?: string
}

export function OceanDivider({
  variant = "default",
  density = "normal",
  withLine = true,
  className,
}: OceanDividerProps) {
  return (
    <div
      data-ocean-variant={variant}
      className={cn(
        "ocean-divider relative w-full max-w-[100vw] overflow-hidden select-none",
        densityHeight[density],
        className,
      )}
      aria-hidden
    >
      {/* Caustic light band background */}
      <div className="ocean-divider__band pointer-events-none absolute inset-0" />
      
      {/* Animated SVG waves - spread apart for more wave effect */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
        {/* Wave layer 1 - top wave, fastest */}
        <svg 
          className="absolute w-[200%] opacity-50"
          style={{ top: "15%", height: "30%", animation: "oceanWaveFlow 8s linear infinite" }}
          viewBox="0 0 1200 60" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C150,50 300,10 450,30 C600,50 750,10 900,30 C1050,50 1200,30 1200,30"
            fill="none"
            stroke="url(#waveStroke1)"
            strokeWidth="2.5"
            className="opacity-90"
          />
          <defs>
            <linearGradient id="waveStroke1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--neon-a)" stopOpacity="0" />
              <stop offset="20%" stopColor="var(--neon-a)" stopOpacity="0.7" />
              <stop offset="50%" stopColor="var(--neon-b)" stopOpacity="1" />
              <stop offset="80%" stopColor="var(--neon-a)" stopOpacity="0.7" />
              <stop offset="100%" stopColor="var(--neon-a)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Wave layer 2 - middle wave, medium speed */}
        <svg 
          className="absolute w-[200%] opacity-40"
          style={{ top: "40%", height: "30%", animation: "oceanWaveFlow 12s linear infinite", animationDelay: "-3s" }}
          viewBox="0 0 1200 60" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C200,15 350,50 500,30 C650,10 800,55 950,30 C1100,5 1200,30 1200,30"
            fill="none"
            stroke="url(#waveStroke2)"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="waveStroke2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--neon-b)" stopOpacity="0" />
              <stop offset="25%" stopColor="var(--neon-b)" stopOpacity="0.6" />
              <stop offset="50%" stopColor="var(--neon-a)" stopOpacity="0.9" />
              <stop offset="75%" stopColor="var(--neon-b)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--neon-b)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Wave layer 3 - bottom wave, slowest, reverse direction */}
        <svg 
          className="absolute w-[200%] opacity-35"
          style={{ top: "65%", height: "30%", animation: "oceanWaveFlow 16s linear infinite reverse" }}
          viewBox="0 0 1200 60" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C180,45 320,15 480,30 C640,45 780,15 940,30 C1100,45 1200,30 1200,30"
            fill="none"
            stroke="url(#waveStroke3)"
            strokeWidth="1.5"
          />
          <defs>
            <linearGradient id="waveStroke3" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--neon-a)" stopOpacity="0" />
              <stop offset="30%" stopColor="var(--neon-a)" stopOpacity="0.5" />
              <stop offset="50%" stopColor="var(--neon-b)" stopOpacity="0.7" />
              <stop offset="70%" stopColor="var(--neon-a)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--neon-a)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Wave layer 4 - extra subtle background wave */}
        <svg 
          className="absolute w-[200%] opacity-20"
          style={{ top: "25%", height: "50%", animation: "oceanWaveFlow 20s linear infinite", animationDelay: "-7s" }}
          viewBox="0 0 1200 60" 
          preserveAspectRatio="none"
        >
          <path
            d="M0,30 C250,55 400,5 600,30 C800,55 950,5 1200,30"
            fill="none"
            stroke="url(#waveStroke4)"
            strokeWidth="1"
          />
          <defs>
            <linearGradient id="waveStroke4" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--neon-a)" stopOpacity="0" />
              <stop offset="50%" stopColor="var(--neon-b)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--neon-a)" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Glowing horizon line with flowing particles */}
      {withLine ? (
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[3px] overflow-hidden">
          {/* Base glow line */}
          <div 
            className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent 0%, var(--neon-a) 20%, var(--neon-b) 50%, var(--neon-a) 80%, transparent 100%)",
              opacity: 0.4,
            }}
          />
          {/* Animated bright spot flowing across */}
          <div 
            className="absolute top-0 h-full w-32"
            style={{
              background: "linear-gradient(90deg, transparent, var(--neon-a), var(--neon-b), var(--neon-a), transparent)",
              boxShadow: "0 0 20px var(--neon-a), 0 0 40px var(--neon-b)",
              animation: "flowingLight 4s ease-in-out infinite",
            }}
          />
          {/* Secondary flowing light */}
          <div 
            className="absolute top-0 h-full w-24"
            style={{
              background: "linear-gradient(90deg, transparent, var(--neon-b), var(--neon-a), transparent)",
              boxShadow: "0 0 15px var(--neon-b)",
              animation: "flowingLight 6s ease-in-out infinite",
              animationDelay: "-2s",
            }}
          />
        </div>
      ) : null}

      {/* Sparkle particles */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute w-1 h-1 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_6px_var(--neon-a)]" style={{ left: "15%", top: "40%", animation: "sparkle 3s ease-in-out infinite" }} />
        <div className="absolute w-1 h-1 rounded-full bg-[color:var(--neon-b)] shadow-[0_0_6px_var(--neon-b)]" style={{ left: "35%", top: "55%", animation: "sparkle 4s ease-in-out infinite", animationDelay: "1s" }} />
        <div className="absolute w-1 h-1 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_6px_var(--neon-a)]" style={{ left: "55%", top: "35%", animation: "sparkle 3.5s ease-in-out infinite", animationDelay: "0.5s" }} />
        <div className="absolute w-1 h-1 rounded-full bg-[color:var(--neon-b)] shadow-[0_0_6px_var(--neon-b)]" style={{ left: "75%", top: "60%", animation: "sparkle 4.5s ease-in-out infinite", animationDelay: "1.5s" }} />
        <div className="absolute w-1 h-1 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_6px_var(--neon-a)]" style={{ left: "90%", top: "45%", animation: "sparkle 3s ease-in-out infinite", animationDelay: "2s" }} />
      </div>
    </div>
  )
}
