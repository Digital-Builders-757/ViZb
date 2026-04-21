"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = React.useState(false)

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    setReduced(mq.matches)
    const onChange = () => setReduced(mq.matches)
    mq.addEventListener("change", onChange)
    return () => mq.removeEventListener("change", onChange)
  }, [])

  return reduced
}

export interface GlassCardInteractiveProps extends React.HTMLAttributes<HTMLDivElement> {
  emphasis?: boolean
}

export function GlassCardInteractive({
  className,
  emphasis,
  children,
  ...props
}: GlassCardInteractiveProps) {
  const rootRef = React.useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()
  const [tilt, setTilt] = React.useState({ rx: 0, ry: 0 })
  const [glare, setGlare] = React.useState({ x: 50, y: 50 })

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion) return
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1)
    const py = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1)
    const max = 2.5
    setTilt({
      ry: (px - 0.5) * 2 * max,
      rx: (0.5 - py) * 2 * max,
    })
    setGlare({ x: px * 100, y: py * 100 })
  }

  const resetPointer = () => {
    setTilt({ rx: 0, ry: 0 })
    setGlare({ x: 50, y: 50 })
  }

  const transform =
    reducedMotion || (tilt.rx === 0 && tilt.ry === 0)
      ? undefined
      : `perspective(920px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`

  return (
    <div
      ref={rootRef}
      onPointerMove={onPointerMove}
      onPointerLeave={resetPointer}
      style={transform ? { transform } : undefined}
      className={cn(
        "group/glass relative isolate overflow-hidden rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] text-[color:var(--neon-text0)] backdrop-blur-md shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]",
        "transition-[border-color,box-shadow,transform] duration-200 ease-out hover:will-change-transform",
        "hover:border-[color:color-mix(in_srgb,var(--neon-a)_42%,var(--neon-hairline))]",
        "hover:shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_26%,transparent),var(--vibe-neon-glow-subtle)]",
        "focus-within:border-[color:color-mix(in_srgb,var(--neon-a)_42%,var(--neon-hairline))]",
        "focus-within:shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_26%,transparent),var(--vibe-neon-glow-subtle)]",
        emphasis &&
          "shadow-[var(--vibe-neon-glow-subtle),0_0_0_1px_color-mix(in_srgb,var(--neon-a)_18%,transparent)]",
        "motion-reduce:transition-[border-color,box-shadow]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[2] opacity-0 transition-opacity duration-300 motion-reduce:hidden",
          "group-hover/glass:opacity-100 group-focus-within/glass:opacity-95",
        )}
        aria-hidden
        style={{
          background: `radial-gradient(400px circle at ${glare.x}% ${glare.y}%, color-mix(in srgb, white 17%, transparent), transparent 58%)`,
        }}
      />
      {children}
    </div>
  )
}
