"use client"

import dynamic from "next/dynamic"

import { CausticBackdrop } from "@/components/ui/caustic-backdrop"

const ThreeBackground = dynamic(
  () => import("./three-background").then((mod) => ({ default: mod.ThreeBackground })),
  {
    ssr: false,
    loading: () => <CausticBackdrop variant="hero" fixed={false} className="absolute inset-0" />,
  },
)

export function ThreeBackgroundWrapper() {
  return (
    <div className="absolute inset-0">
      <CausticBackdrop variant="hero" fixed={false} className="absolute inset-0" />
      <ThreeBackground />
    </div>
  )
}
