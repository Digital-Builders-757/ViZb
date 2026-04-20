import Image from "next/image"
import Link from "next/link"
import { HEADER_LOGO_SRC, LOGO_ALT_MARK } from "@/lib/brand-assets"

type Variant = "navbar" | "sidebar" | "mobile"

/** Intrinsic dimensions for Next/Image; className sets display height; wide wordmark aspect. */
const imageProps: Record<
  Variant,
  { width: number; height: number; className: string; priority?: boolean }
> = {
  navbar: {
    width: 220,
    height: 72,
    className: "h-9 w-auto max-h-10 shrink-0 sm:h-10",
    priority: true,
  },
  sidebar: {
    width: 200,
    height: 64,
    className: "h-8 w-auto shrink-0",
  },
  mobile: {
    width: 180,
    height: 58,
    className: "h-7 w-auto shrink-0",
  },
}

export function HeaderBrandMarkLink({
  href = "/",
  variant,
}: {
  href?: string
  variant: Variant
}) {
  const img = imageProps[variant]
  return (
    <Link href={href} className="flex min-w-0 max-w-[min(100%,14rem)] items-center sm:max-w-[min(100%,16rem)] md:max-w-none">
      <Image
        src={HEADER_LOGO_SRC}
        alt={LOGO_ALT_MARK}
        width={img.width}
        height={img.height}
        className={img.className}
        priority={img.priority}
      />
    </Link>
  )
}
