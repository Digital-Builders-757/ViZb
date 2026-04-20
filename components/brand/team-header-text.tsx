import { cn } from "@/lib/utils"
import { TEAM_PRIMARY, TEAM_SECONDARY } from "@/lib/brand-assets"

type Variant = "navbar" | "sidebar" | "mobile"

const variantClass: Record<Variant, string> = {
  navbar:
    "min-w-0 max-w-[min(42vw,11rem)] sm:max-w-[14rem] md:max-w-[16rem] lg:max-w-none",
  sidebar: "min-w-0 max-w-[9rem]",
  mobile: "min-w-0 max-w-[min(38vw,9.5rem)]",
}

export function TeamHeaderText({
  variant,
  className,
}: {
  variant: Variant
  className?: string
}) {
  return (
    <div className={cn("flex flex-col justify-center leading-tight", variantClass[variant], className)}>
      <span
        className={cn(
          "truncate font-sans font-bold uppercase tracking-wide text-[color:var(--neon-text0)]",
          "text-[9px] sm:text-[10px]",
          "drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]",
        )}
      >
        {TEAM_PRIMARY}
      </span>
      <span
        className={cn(
          "hidden sm:block truncate font-sans text-[9px] font-medium tracking-wide text-[color:var(--neon-text1)]",
          "drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]",
        )}
      >
        {TEAM_SECONDARY}
      </span>
    </div>
  )
}
