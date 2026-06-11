"use client"

import { useEffect, useState } from "react"

import { getPrefersReducedMotion } from "@/lib/motion/reduced-motion"

/** Subscribe to `prefers-reduced-motion` for client components. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const sync = () => setReduced(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return reduced
}

/** Returns safe motion class suffix — empty when reduced motion is on. */
export function useMotionClass(activeClass: string): string {
  const reduced = useReducedMotion()
  return reduced ? "" : activeClass
}

export { getPrefersReducedMotion }
