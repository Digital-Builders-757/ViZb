import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export type DepthLayerLevel = "far" | "mid" | "near"

const LEVEL_CLASS: Record<DepthLayerLevel, string> = {
  far: "vizb-depth-layer-far",
  mid: "vizb-depth-layer-mid",
  near: "vizb-depth-layer-near",
}

/** Stacking depth wash for hero/show sections — pairs with CausticBackdrop. */
export function DepthLayer({
  level = "mid",
  className,
  children,
}: {
  level?: DepthLayerLevel
  className?: string
  children?: ReactNode
}) {
  return (
    <div aria-hidden className={cn("vizb-depth-layer", LEVEL_CLASS[level], className)}>
      {children}
    </div>
  )
}
