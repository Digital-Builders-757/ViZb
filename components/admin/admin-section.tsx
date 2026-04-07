import { ReactNode } from "react"

export function AdminSection({
  id,
  kicker,
  title,
  description,
  action,
  children,
}: {
  id?: string
  kicker: string
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mt-10 scroll-mt-24" id={id}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{kicker}</span>
          <h2 className="mt-2 font-serif text-xl font-bold text-foreground">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground max-w-2xl">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <div className="mt-6">{children}</div>
    </section>
  )
}
