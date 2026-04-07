export function MarqueeSection() {
  const items = [
    "WORKSHOPS",
    "MEETUPS",
    "PARTIES",
    "CULTURE",
    "COMMUNITY",
    "CREATORS",
    "MUSIC",
    "ART",
    "TECH",
  ]

  return (
    <section className="relative overflow-hidden border-y border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/22 py-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(900px circle at 10% 10%, rgba(0,209,255,0.14), transparent 55%), radial-gradient(900px circle at 90% 60%, rgba(157,77,255,0.12), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative flex animate-marquee whitespace-nowrap">
        {[...items, ...items].map((item, index) => (
          <span
            key={index}
            className="mx-8 flex items-center gap-8 font-mono text-xs uppercase tracking-[0.22em] text-[color:var(--neon-text2)]"
          >
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--neon-a)] shadow-[0_0_12px_rgba(0,209,255,0.35)]" />
          </span>
        ))}
      </div>
    </section>
  )
}
