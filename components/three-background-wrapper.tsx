"use client"

import dynamic from "next/dynamic"

// Dynamic import Three.js to reduce initial bundle (~150KB savings)
const ThreeBackground = dynamic(
  () => import("./three-background").then((mod) => ({ default: mod.ThreeBackground })),
  {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-background" />,
  }
)

export function ThreeBackgroundWrapper() {
  return <ThreeBackground />
}
