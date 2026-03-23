export function MarqueeSection() {
  const items = ["WORKSHOPS", "MEETUPS", "PARTIES", "CULTURE", "COMMUNITY", "CREATORS", "MUSIC", "ART", "TECH"]

  return (
    <section className="py-6 border-y border-border overflow-hidden bg-card">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...items, ...items].map((item, index) => (
          <span
            key={index}
            className="mx-8 text-sm uppercase tracking-widest text-muted-foreground font-mono flex items-center gap-8"
          >
            {item}
            <span className="w-2 h-2 bg-primary" />
          </span>
        ))}
      </div>
    </section>
  )
}
