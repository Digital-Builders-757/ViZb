"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { FullLogoImage } from "@/components/brand/full-logo-image"

// Ocean-themed loading screen with water animations

// Animated text component with wave effect
function AnimatedText({ 
  children, 
  className, 
  delay = 0,
  waveIntensity = "normal"
}: { 
  children: string
  className?: string
  delay?: number
  waveIntensity?: "subtle" | "normal" | "intense"
}) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  const intensity = {
    subtle: { y: 4, rotate: 1.5, duration: 2.5 },
    normal: { y: 8, rotate: 3, duration: 1.8 },
    intense: { y: 14, rotate: 6, duration: 1.2 }
  }[waveIntensity]
  
  return (
    <span className={`inline-flex overflow-hidden ${className}`}>
      {children.split("").map((char, i) => (
        <span
          key={i}
          className="inline-block"
          style={{
            animationName: mounted ? "textWave" : "none",
            animationDuration: `${intensity.duration}s`,
            animationTimingFunction: "ease-in-out",
            animationIterationCount: "infinite",
            animationDelay: `${i * 0.06}s`,
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateY(0)" : "translateY(30px)",
            transition: `opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.04}s`,
            ["--wave-y" as string]: `${intensity.y}px`,
            ["--wave-rotate" as string]: `${intensity.rotate}deg`,
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  )
}

// Glitch text effect for "isn't"
function GlitchText({ children, className, delay = 0 }: { children: string; className?: string; delay?: number }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])
  
  return (
    <span 
      className={`glitch-text relative inline-block ${className}`} 
      data-text={children}
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0) scale(1)" : "translateY(20px) scale(0.9)",
        transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      {children}
    </span>
  )
}

// Water splash particle
function WaterParticle({ delay, x, size, duration }: { delay: number; x: number; size: number; duration: number }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${50 + x}%`,
        bottom: "10%",
        background: `radial-gradient(circle at 30% 30%, rgba(0, 209, 255, 0.9), rgba(168, 85, 247, 0.6))`,
        boxShadow: `0 0 ${size * 2}px rgba(0, 209, 255, 0.5), inset 0 0 ${size / 2}px rgba(255, 255, 255, 0.3)`,
        animation: `splashParticle ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) ${delay}s infinite`,
      }}
    />
  )
}

// Water droplet that falls
function WaterDroplet({ delay, x, size, duration }: { delay: number; x: number; size: number; duration: number }) {
  return (
    <div
      className="absolute"
      style={{
        width: size,
        height: size * 1.4,
        left: `${x}%`,
        top: "-5%",
        background: `radial-gradient(ellipse at 30% 30%, rgba(0, 209, 255, 0.8), rgba(0, 180, 220, 0.4))`,
        borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%",
        boxShadow: `0 0 ${size}px rgba(0, 209, 255, 0.4)`,
        animation: `dropletFall ${duration}s ease-in ${delay}s infinite`,
      }}
    />
  )
}

// Floating bubble
function FloatingBubble({ delay, x, size, duration }: { delay: number; x: number; size: number; duration: number }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${x}%`,
        bottom: "5%",
        background: `radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2), transparent)`,
        border: "1px solid rgba(0, 209, 255, 0.3)",
        boxShadow: `inset 0 0 ${size / 3}px rgba(0, 209, 255, 0.2)`,
        animation: `bubbleRise ${duration}s ease-out ${delay}s infinite`,
      }}
    />
  )
}

export default function RootLoading() {
  const [mounted, setMounted] = useState(false)
  const [splashTriggered, setSplashTriggered] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Animated water surface effect
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    let animationId: number
    let time = 0

    const animate = () => {
      time += 0.015
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw animated water waves at the bottom
      const waveCount = 5
      for (let w = 0; w < waveCount; w++) {
        const baseY = canvas.height - 80 + w * 15
        const amplitude = 20 - w * 3
        const frequency = 0.008 + w * 0.002
        const speed = 1.5 - w * 0.2
        const alpha = 0.15 - w * 0.025

        ctx.beginPath()
        ctx.moveTo(0, canvas.height)

        for (let x = 0; x <= canvas.width; x += 5) {
          const y = baseY + Math.sin(x * frequency + time * speed) * amplitude + 
                    Math.sin(x * frequency * 1.5 + time * speed * 0.7) * (amplitude * 0.5)
          ctx.lineTo(x, y)
        }

        ctx.lineTo(canvas.width, canvas.height)
        ctx.closePath()

        const gradient = ctx.createLinearGradient(0, baseY - amplitude, 0, canvas.height)
        gradient.addColorStop(0, `rgba(0, 209, 255, ${alpha})`)
        gradient.addColorStop(0.5, `rgba(100, 180, 255, ${alpha * 0.7})`)
        gradient.addColorStop(1, `rgba(168, 85, 247, ${alpha * 0.5})`)
        ctx.fillStyle = gradient
        ctx.fill()
      }

      // Draw caustic light patterns
      const causticCount = 12
      for (let i = 0; i < causticCount; i++) {
        const x = (canvas.width / causticCount) * i + Math.sin(time + i) * 30
        const y = canvas.height - 150 + Math.cos(time * 0.8 + i * 0.5) * 40
        const radius = 60 + Math.sin(time * 1.2 + i) * 20

        const causticGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        causticGradient.addColorStop(0, "rgba(0, 209, 255, 0.08)")
        causticGradient.addColorStop(0.5, "rgba(0, 209, 255, 0.03)")
        causticGradient.addColorStop(1, "transparent")
        ctx.fillStyle = causticGradient
        ctx.beginPath()
        ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", resize)
      cancelAnimationFrame(animationId)
    }
  }, [])

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 0)
    const splashTimer = setTimeout(() => setSplashTriggered(true), 200)
    const contentTimer = setTimeout(() => setShowContent(true), 600)

    return () => {
      clearTimeout(mountTimer)
      clearTimeout(splashTimer)
      clearTimeout(contentTimer)
    }
  }, [])

  // Generate splash particles - use seeded values based on index for deterministic results
  const splashParticles = useMemo(() => Array.from({ length: 25 }, (_, i) => ({
    delay: 0.2 + i * 0.03,
    x: ((i * 7.3 % 1) - 0.5) * 30, // deterministic pseudo-random based on index
    size: 4 + (i * 3.7 % 1) * 12,
    duration: 1.5 + (i * 2.1 % 1) * 0.5,
  })), [])

  // Generate droplets - use seeded values based on index for deterministic results
  const droplets = useMemo(() => Array.from({ length: 15 }, (_, i) => ({
    delay: (i * 5.3 % 1) * 3,
    x: 10 + (i * 4.7 % 1) * 80,
    size: 3 + (i * 2.9 % 1) * 6,
    duration: 2 + (i * 3.1 % 1), // add duration for WaterDroplet
  })), [])

  // Generate bubbles - use seeded values based on index for deterministic results
  const bubbles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    delay: (i * 3.7 % 1) * 2,
    x: 5 + (i * 6.1 % 1) * 90,
    size: 6 + (i * 4.3 % 1) * 18,
    duration: 4 + (i * 2.3 % 1) * 3,
  })), [])

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-[color:var(--neon-bg0)]">
      {/* Animated Canvas Background */}
      <canvas 
        ref={canvasRef} 
        className="absolute inset-0"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 1s ease" }}
      />

      {/* Water splash particles */}
      {splashTriggered && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          {splashParticles.map((particle, i) => (
            <WaterParticle key={`splash-${i}`} {...particle} />
          ))}
        </div>
      )}

      {/* Falling water droplets */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {droplets.map((droplet, i) => (
          <WaterDroplet key={`droplet-${i}`} {...droplet} />
        ))}
      </div>

      {/* Rising bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {bubbles.map((bubble, i) => (
          <FloatingBubble key={`bubble-${i}`} {...bubble} />
        ))}
      </div>

      {/* Deep ocean gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 150% 100% at 50% 130%, rgba(0, 209, 255, 0.2) 0%, transparent 50%),
            radial-gradient(ellipse 100% 60% at 20% 90%, rgba(168, 85, 247, 0.15) 0%, transparent 60%),
            radial-gradient(ellipse 80% 50% at 80% 100%, rgba(0, 209, 255, 0.18) 0%, transparent 55%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(0, 20, 40, 0.5) 0%, transparent 100%)
          `,
        }}
        aria-hidden
      />

      {/* Animated water surface at top */}
      <div 
        className="absolute left-0 right-0 top-0 h-32 overflow-hidden"
        style={{ opacity: mounted ? 0.3 : 0, transition: "opacity 2s ease" }}
        aria-hidden
      >
        <div className="water-surface-top" />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6">
        {/* Pre-header text */}
        <div
          className={`mb-6 overflow-hidden transition-all duration-700 ${
            showContent ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-[color:var(--neon-a)] sm:text-xs">
            <AnimatedText delay={600} waveIntensity="subtle">
              Signal Incoming
            </AnimatedText>
          </p>
        </div>

        {/* Logo with water ripple effect */}
        <div
          className={`relative transition-all duration-1000 ${
            showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          style={{ transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Water ripple rings */}
          <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <div 
                key={i}
                className="absolute h-48 w-48 rounded-full sm:h-64 sm:w-64 md:h-80 md:w-80"
                style={{
                  border: `2px solid ${i % 2 === 0 ? "rgba(0, 209, 255, 0.5)" : "rgba(168, 85, 247, 0.4)"}`,
                  animation: showContent ? `rippleExpand 3s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite ${i * 0.6}s` : "none",
                  boxShadow: `0 0 20px ${i % 2 === 0 ? "rgba(0, 209, 255, 0.3)" : "rgba(168, 85, 247, 0.2)"}`,
                }}
              />
            ))}
          </div>

          {/* Splash burst effect on load */}
          {splashTriggered && (
            <div className="absolute inset-0 flex items-center justify-center" aria-hidden>
              <div className="splash-burst" />
            </div>
          )}

          {/* Logo with enhanced glow */}
          <div 
            className="relative"
            style={{
              animation: showContent ? "logoFloat 4s ease-in-out infinite" : "none",
            }}
          >
            <div
              className="absolute -inset-8 blur-3xl"
              style={{
                background: `radial-gradient(circle, rgba(0, 209, 255, 0.5) 0%, rgba(168, 85, 247, 0.2) 50%, transparent 70%)`,
                animation: showContent ? "glowPulse 3s ease-in-out infinite" : "none",
              }}
              aria-hidden
            />
            <FullLogoImage
              width={400}
              height={400}
              className="relative h-36 w-36 select-none sm:h-48 sm:w-48 md:h-64 md:w-64"
              style={{
                filter: "drop-shadow(0 0 50px rgba(0, 209, 255, 0.6)) drop-shadow(0 0 100px rgba(168, 85, 247, 0.3))",
              }}
              priority
              draggable={false}
            />
          </div>
        </div>

        {/* Main headline with animated words */}
        <h1
          className={`mt-8 text-center font-serif text-2xl font-bold tracking-tight transition-all duration-1000 sm:text-3xl md:text-5xl ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: "300ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <span className="block text-[color:var(--neon-text1)]">
            <AnimatedText delay={900} waveIntensity="normal">Virginia</AnimatedText>
            {" "}
            <GlitchText className="text-[color:var(--neon-a)]" delay={1100}>isn&apos;t</GlitchText>
            {" "}
            <AnimatedText delay={1300} waveIntensity="intense">boring.</AnimatedText>
          </span>
        </h1>

        {/* Animated tagline */}
        <p
          className={`mt-4 max-w-md text-center text-sm leading-relaxed text-[color:var(--neon-text1)]/85 transition-all duration-1000 sm:text-base md:text-lg ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: "500ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <AnimatedText delay={1500} waveIntensity="subtle">
            Dive into the culture wave
          </AnimatedText>
        </p>

        {/* Water loader bar */}
        <div
          className={`mt-10 transition-all duration-1000 ${
            showContent ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
          style={{ transitionDelay: "700ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <div
            role="status"
            aria-live="polite"
            aria-label="Loading"
            className="water-loader relative isolate h-2 w-48 overflow-hidden rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.06)] sm:h-2.5 sm:w-64 md:w-80"
            style={{ background: "rgba(30, 30, 40, 0.65)" }}
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
          className={`mt-10 font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--neon-a)] transition-all duration-1000 ${
            showContent ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
          style={{ transitionDelay: "900ms", transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          <AnimatedText delay={1800} waveIntensity="subtle">
            Driving culture forward
          </AnimatedText>
        </p>
      </div>

      {/* Scan line effect */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `linear-gradient(
            180deg,
            transparent 0%,
            transparent 48%,
            rgba(0, 209, 255, 0.08) 49%,
            rgba(0, 209, 255, 0.15) 50%,
            rgba(0, 209, 255, 0.08) 51%,
            transparent 52%,
            transparent 100%
          )`,
          animation: mounted ? "scanLine 5s linear infinite" : "none",
        }}
        aria-hidden
      />

      {/* Horizontal water shimmer lines */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 h-px"
            style={{
              top: `${20 + i * 15}%`,
              background: `linear-gradient(90deg, transparent 0%, rgba(0, 209, 255, 0.3) 50%, transparent 100%)`,
              animation: `shimmerLine ${3 + i * 0.5}s ease-in-out infinite ${i * 0.3}s`,
              opacity: 0.5,
            }}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes textWave {
          0%, 100% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          25% {
            transform: translateY(calc(var(--wave-y) * -1)) rotate(var(--wave-rotate)) scale(1.02);
          }
          50% {
            transform: translateY(0) rotate(0deg) scale(1);
          }
          75% {
            transform: translateY(var(--wave-y)) rotate(calc(var(--wave-rotate) * -1)) scale(0.98);
          }
        }

        @keyframes rippleExpand {
          0% {
            transform: scale(0.6);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        @keyframes logoFloat {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-15px) scale(1.03);
          }
        }

        @keyframes glowPulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }

        @keyframes scanLine {
          0% {
            transform: translateY(-100%);
          }
          100% {
            transform: translateY(100vh);
          }
        }

        @keyframes splashParticle {
          0% {
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            transform: translateY(-20px) translateX(var(--splash-x, 0)) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateY(-180px) translateX(calc(var(--splash-x, 0) * 2)) scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: translateY(-50px) translateX(calc(var(--splash-x, 0) * 3)) scale(0.2);
            opacity: 0;
          }
        }

        @keyframes dropletFall {
          0% {
            transform: translateY(0) scaleY(1);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          70% {
            transform: translateY(100vh) scaleY(1.3);
            opacity: 0.6;
          }
          100% {
            transform: translateY(100vh) scaleY(0.5);
            opacity: 0;
          }
        }

        @keyframes bubbleRise {
          0% {
            transform: translateY(0) translateX(0) scale(0);
            opacity: 0;
          }
          10% {
            transform: translateY(-20px) scale(1);
            opacity: 0.6;
          }
          90% {
            opacity: 0.4;
          }
          100% {
            transform: translateY(-100vh) translateX(30px) scale(1.2);
            opacity: 0;
          }
        }

        @keyframes shimmerLine {
          0%, 100% {
            transform: translateX(-100%);
            opacity: 0;
          }
          50% {
            transform: translateX(100%);
            opacity: 0.6;
          }
        }

        .glitch-text {
          animation: glitchText 4s ease-in-out infinite;
          text-shadow: 0 0 10px rgba(0, 209, 255, 0.5);
        }

        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .glitch-text::before {
          animation: glitchBefore 4s ease-in-out infinite;
          clip-path: polygon(0 0, 100% 0, 100% 35%, 0 35%);
          color: #ff00ff;
          text-shadow: -3px 0 #ff00ff;
        }

        .glitch-text::after {
          animation: glitchAfter 4s ease-in-out infinite;
          clip-path: polygon(0 65%, 100% 65%, 100% 100%, 0 100%);
          color: #00ffff;
          text-shadow: 3px 0 #00ffff;
        }

        @keyframes glitchText {
          0%, 85%, 100% {
            transform: translateX(0) skewX(0deg);
          }
          87% {
            transform: translateX(-5px) skewX(-3deg);
          }
          89% {
            transform: translateX(5px) skewX(3deg);
          }
          91% {
            transform: translateX(-3px) skewX(-2deg);
          }
          93% {
            transform: translateX(3px) skewX(2deg);
          }
          95% {
            transform: translateX(-2px) skewX(-1deg);
          }
        }

        @keyframes glitchBefore {
          0%, 85%, 100% {
            transform: translateX(0);
            opacity: 0;
          }
          87%, 89%, 91%, 93%, 95% {
            transform: translateX(-4px);
            opacity: 0.9;
          }
          88%, 90%, 92%, 94% {
            transform: translateX(4px);
            opacity: 0.9;
          }
        }

        @keyframes glitchAfter {
          0%, 85%, 100% {
            transform: translateX(0);
            opacity: 0;
          }
          87%, 89%, 91%, 93%, 95% {
            transform: translateX(4px);
            opacity: 0.9;
          }
          88%, 90%, 92%, 94% {
            transform: translateX(-4px);
            opacity: 0.9;
          }
        }

        .splash-burst {
          width: 300px;
          height: 300px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 209, 255, 0.4) 0%, transparent 70%);
          animation: splashBurst 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }

        @keyframes splashBurst {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }

        .water-surface-top {
          position: absolute;
          left: -10%;
          right: -10%;
          bottom: 0;
          height: 100%;
          background: linear-gradient(180deg, rgba(0, 209, 255, 0.1) 0%, transparent 100%);
          animation: waterSurfaceTop 3s ease-in-out infinite;
        }

        @keyframes waterSurfaceTop {
          0%, 100% {
            transform: translateY(0) scaleY(1);
          }
          50% {
            transform: translateY(10px) scaleY(0.9);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .glitch-text,
          .glitch-text::before,
          .glitch-text::after {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
