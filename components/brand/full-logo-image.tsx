import type { CSSProperties } from "react"
import Image from "next/image"
import { FULL_LOGO_SRC, LOGO_ALT_FULL } from "@/lib/brand-assets"
import { cn } from "@/lib/utils"

type Props = {
  className?: string
  style?: CSSProperties
  priority?: boolean
  draggable?: boolean
  /** When true, image fills parent (parent must be relative + sized) */
  fill?: boolean
  /** Intrinsic size hint for `next/image` (required when `fill` is false) */
  width?: number
  height?: number
}

export function FullLogoImage({
  width = 400,
  height = 400,
  className,
  style,
  priority,
  fill,
  draggable,
}: Props) {
  if (fill) {
    return (
      <Image
        src={FULL_LOGO_SRC}
        alt={LOGO_ALT_FULL}
        fill
        className={cn("object-contain", className)}
        style={style}
        priority={priority}
        sizes="(max-width: 640px) 200px, 280px"
        draggable={draggable}
      />
    )
  }
  return (
    <Image
      src={FULL_LOGO_SRC}
      alt={LOGO_ALT_FULL}
      width={width}
      height={height}
      className={cn("h-auto w-auto object-contain", className)}
      style={style}
      priority={priority}
      draggable={draggable}
    />
  )
}
