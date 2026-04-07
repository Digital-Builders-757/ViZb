import { cn } from "@/lib/utils"

export type OceanDividerVariant = "default" | "hero" | "soft"
export type OceanDividerDensity = "sparse" | "normal" | "rich"

const densityHeight: Record<OceanDividerDensity, string> = {
  sparse: "h-7 sm:h-9",
  normal: "h-11 sm:h-14",
  rich: "h-14 sm:h-[4.25rem]",
}

export type OceanDividerProps = {
  variant?: OceanDividerVariant
  density?: OceanDividerDensity
  withLine?: boolean
  className?: string
}

export function OceanDivider({
  variant = "default",
  density = "normal",
  withLine = true,
  className,
}: OceanDividerProps) {
  return (
    <div
      data-ocean-variant={variant}
      className={cn(
        "ocean-divider relative w-full max-w-[100vw] overflow-x-hidden select-none",
        densityHeight[density],
        className,
      )}
      aria-hidden
    >
      <div className="ocean-divider__band pointer-events-none absolute inset-0" />
      {withLine ? (
        <div
          className="ocean-divider__horizon pointer-events-none absolute left-[6%] right-[6%] top-1/2 h-px max-w-full -translate-y-1/2"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--ocean-divider-horizon) 50%, transparent 100%)",
          }}
        />
      ) : null}
    </div>
  )
}
