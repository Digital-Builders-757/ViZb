import { ReactNode } from "react"

export function AdminSection({
  id,
  kicker,
  title,
  description,
  action,
  stickyHeader,
  children,
}: {
  id?: string
  kicker: string
  title: string
  description?: string
  action?: ReactNode
  /** Sticks title row while scrolling (large modules: Users, All Events). */
  stickyHeader?: boolean
  children: ReactNode
}) {
  const headerInner = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{kicker}</span>
        <h2 className="mt-2 font-serif text-xl font-bold text-foreground">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )

  return (
    <section
      className={
        stickyHeader
          ? "mt-12 scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:scroll-mt-24"
          : "mt-10 scroll-mt-[calc(3.5rem+env(safe-area-inset-top,0px))] md:scroll-mt-24"
      }
      id={id}
    >
      {stickyHeader ? (
        <div className="sticky z-30 -mx-4 border-b border-border bg-[color:var(--neon-bg0)]/92 px-4 py-3 backdrop-blur-md md:-mx-8 md:px-8 top-[calc(3.5rem+env(safe-area-inset-top,0px))] md:top-0">
          {headerInner}
        </div>
      ) : (
        headerInner
      )}

      <div className="mt-6">{children}</div>
    </section>
  )
}
