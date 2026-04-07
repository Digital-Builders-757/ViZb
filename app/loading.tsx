"use client"

import { useEffect, useState } from "react"
import Image from "next/image"

export default function RootLoading() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[color:var(--neon-bg0)]">
      {/* Deep ocean gradient background */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 120% 80% at 50% 120%, color-mix(in srgb, var(--water-a) 25%, transparent) 0%, transparent 50%),
            radial-gradient(ellipse 80% 50% at 20% 80%, color-mix(in srgb, var(--water-b) 15%, transparent) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 80% 90%, color-mix(in srgb, var(--water-a) 18%, transparent) 0%, transparent 55%),
            radial-gradient(ellipse 100% 60% at 50% 0%, color-mix(in srgb, var(--water-b) 8%, transparent) 0%, transparent 40%)
          `,
        }}
        aria-hidden
      />

      {/* Animated wave layers */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* Wave 1 - Bottom */}
        <svg
          className="absolute -bottom-[5%] left-0 w-[200%] animate-wave-slow opacity-30"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ height: "40%" }}
        >
          <defs>
            <linearGradient id="wave1-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--water-a)" stopOpacity="0.4" />
              <stop offset="50%" stopColor="var(--water-b)" stopOpacity="0.3" />
              <stop offset="100%" stopColor="var(--water-a)" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave1-grad)"
            d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,186.7C960,213,1056,235,1152,224C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Wave 2 - Middle */}
        <svg
          className="absolute -bottom-[2%] left-0 w-[200%] animate-wave-medium opacity-20"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ height: "35%", animationDelay: "-2s" }}
        >
          <defs>
            <linearGradient id="wave2-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--water-b)" stopOpacity="0.5" />
              <stop offset="50%" stopColor="var(--water-a)" stopOpacity="0.4" />
              <stop offset="100%" stopColor="var(--water-b)" stopOpacity="0.5" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave2-grad)"
            d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,154.7C672,160,768,192,864,197.3C960,203,1056,181,1152,165.3C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>

        {/* Wave 3 - Front */}
        <svg
          className="absolute bottom-0 left-0 w-[200%] animate-wave-fast opacity-15"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          style={{ height: "25%", animationDelay: "-4s" }}
        >
          <defs>
            <linearGradient id="wave3-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--water-a)" stopOpacity="0.6" />
              <stop offset="50%" stopColor="var(--water-b)" stopOpacity="0.5" />
              <stop offset="100%" stopColor="var(--water-a)" stopOpacity="0.6" />
            </linearGradient>
          </defs>
          <path
            fill="url(#wave3-grad)"
            d="M0,224L48,208C96,192,192,160,288,165.3C384,171,480,213,576,218.7C672,224,768,192,864,181.3C960,171,1056,181,1152,192C1248,203,1344,213,1392,218.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
      </div>

      {/* Floating bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-bubble rounded-full"
            style={{
              width: `${4 + Math.random() * 8}px`,
              height: `${4 + Math.random() * 8}px`,
              left: `${10 + (i * 7)}%`,
              bottom: "-10%",
              background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), var(--water-a) 60%, transparent)`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Caustic light patterns */}
      <div
        className="pointer-events-none absolute inset-0 animate-caustics opacity-[0.08]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 40% 30% at 25% 40%, var(--water-a), transparent),
            radial-gradient(ellipse 35% 25% at 75% 60%, var(--water-b), transparent),
            radial-gradient(ellipse 30% 20% at 50% 30%, var(--water-a), transparent)
          `,
        }}
        aria-hidden
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        {/* Pre-header text */}
        <p
          className={`mb-6 font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--water-a)] transition-all duration-1000 sm:text-xs ${
            mounted ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          Signal Incoming
        </p>

        {/* Logo with water ripple effect */}
        <div
          className={`relative transition-all duration-1000 ${
            mounted ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          {/* Ripple rings */}
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            <div className="absolute h-48 w-48 animate-ripple rounded-full border border-[color:var(--water-a)] opacity-0 sm:h-64 sm:w-64 md:h-80 md:w-80" />
            <div
              className="absolute h-48 w-48 animate-ripple rounded-full border border-[color:var(--water-b)] opacity-0 sm:h-64 sm:w-64 md:h-80 md:w-80"
              style={{ animationDelay: "0.8s" }}
            />
            <div
              className="absolute h-48 w-48 animate-ripple rounded-full border border-[color:var(--water-a)] opacity-0 sm:h-64 sm:w-64 md:h-80 md:w-80"
              style={{ animationDelay: "1.6s" }}
            />
          </div>

          {/* Logo with glow */}
          <div className="relative animate-float">
            <div
              className="absolute inset-0 blur-2xl"
              style={{
                background: `radial-gradient(circle, color-mix(in srgb, var(--water-a) 40%, transparent) 0%, transparent 70%)`,
              }}
              aria-hidden
            />
            <Image
              src="/vibe-logo.png"
              alt="VIZB"
              width={280}
              height={280}
              className="relative h-36 w-36 select-none object-contain drop-shadow-[0_0_40px_rgba(0,209,255,0.4)] sm:h-48 sm:w-48 md:h-64 md:w-64"
              priority
              draggable={false}
            />
          </div>
        </div>

        {/* Main headline */}
        <h1
          className={`mt-8 text-center font-serif text-2xl font-bold tracking-tight text-[color:var(--neon-text0)] transition-all duration-1000 sm:text-3xl md:text-4xl ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <span className="block">Virginia isn&apos;t boring.</span>
        </h1>

        {/* Animated tagline */}
        <p
          className={`mt-4 max-w-md text-center text-sm leading-relaxed text-[color:var(--neon-text2)] transition-all duration-1000 sm:text-base ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "800ms" }}
        >
          Dive into the culture wave
        </p>

        {/* Water loader bar */}
        <div
          className={`mt-10 transition-all duration-1000 ${
            mounted ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
          style={{ transitionDelay: "1000ms" }}
        >
          <div
            role="status"
            aria-live="polite"
            aria-label="Loading"
            className="water-loader relative isolate h-1.5 w-48 overflow-hidden rounded-full bg-[color:color-mix(in_srgb,var(--neon-surface)_65%,transparent)] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:h-2 sm:w-64 md:w-80"
          >
            <div
              className="water-loader-fill pointer-events-none absolute inset-0 rounded-[inherit]"
              aria-hidden
            />
            <div
              className="water-shimmer pointer-events-none absolute inset-0 rounded-[inherit] opacity-90 mix-blend-screen"
              aria-hidden
            />
            <div
              className="water-loader-sheen pointer-events-none absolute inset-0 rounded-[inherit] opacity-50"
              aria-hidden
            />
          </div>
        </div>

        {/* Bottom tagline */}
        <p
          className={`mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--water-a)] transition-all duration-1000 ${
            mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: "1200ms" }}
        >
          Driving culture forward
        </p>
      </div>

      {/* Scan line effect */}
      <div
        className="pointer-events-none absolute inset-0 animate-scan-line"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            transparent 48%,
            color-mix(in srgb, var(--water-a) 8%, transparent) 49%,
            color-mix(in srgb, var(--water-a) 12%, transparent) 50%,
            color-mix(in srgb, var(--water-a) 8%, transparent) 51%,
            transparent 52%,
            transparent 100%
          )`,
        }}
        aria-hidden
      />

      <style jsx>{`
        @keyframes wave-slow {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes wave-medium {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes wave-fast {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes bubble {
          0% {
            transform: translateY(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.6;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100vh) scale(0.5);
            opacity: 0;
          }
        }

        @keyframes ripple {
          0% {
            transform: scale(0.8);
            opacity: 0.6;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes caustics {
          0%,
          100% {
            transform: scale(1) rotate(0deg);
          }
          33% {
            transform: scale(1.1) rotate(2deg);
          }
          66% {
            transform: scale(0.95) rotate(-2deg);
          }
        }

        @keyframes scan-line {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }

        .animate-wave-slow {
          animation: wave-slow 20s linear infinite;
        }

        .animate-wave-medium {
          animation: wave-medium 15s linear infinite;
        }

        .animate-wave-fast {
          animation: wave-fast 10s linear infinite;
        }

        .animate-bubble {
          animation: bubble 6s ease-in-out infinite;
        }

        .animate-ripple {
          animation: ripple 2.4s ease-out infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-caustics {
          animation: caustics 8s ease-in-out infinite;
        }

        .animate-scan-line {
          animation: scan-line 4s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-wave-slow,
          .animate-wave-medium,
          .animate-wave-fast,
          .animate-bubble,
          .animate-ripple,
          .animate-float,
          .animate-caustics,
          .animate-scan-line {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
