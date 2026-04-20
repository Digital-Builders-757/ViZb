import Image from "next/image"
import Link from "next/link"
import { HEADER_LOGO_SRC, LOGO_ALT_MARK } from "@/lib/brand-assets"
import { TeamHeaderText } from "@/components/brand/team-header-text"

type Variant = "navbar" | "sidebar" | "mobile"

const imageProps: Record<
  Variant,
  { width: number; height: number; className: string; priority?: boolean }
> = {
  navbar: {
    width: 40,
    height: 40,
    className: "h-10 w-auto shrink-0",
    priority: true,
  },
  sidebar: {
    width: 32,
    height: 32,
    className: "h-8 w-auto shrink-0",
  },
  mobile: {
    width: 28,
    height: 28,
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
    <Link href={href} className="flex min-w-0 max-w-[min(100%,18rem)] items-center gap-2 sm:gap-2.5 md:max-w-none">
      <Image
        src={HEADER_LOGO_SRC}
        alt={LOGO_ALT_MARK}
        width={img.width}
        height={img.height}
        className={img.className}
        priority={img.priority}
      />
      <TeamHeaderText variant={variant} />
    </Link>
  )
}
