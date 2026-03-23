import Image from "next/image"
import Link from "next/link"

export function EventsSection() {
  const events = [
    {
      title: "Hampton Roads Tech Mixer",
      date: "Feb 15",
      location: "Norfolk, VA",
      category: "Networking",
      image: "/rooftop-networking-event-sunset-diverse-young-prof.jpg",
    },
    {
      title: "Creative Workshop Series",
      date: "Mar 1",
      location: "Richmond, VA",
      category: "Workshop",
      image: "/vibe-creative-workshop-real.jpg",
    },
    {
      title: "DMV Launch Party",
      date: "Mar 22",
      location: "Washington, DC",
      category: "Party",
      image: "/vibe-dj-mixing.jpg",
    },
  ]

  return (
    <section id="events" className="py-24 px-4 sm:px-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Section header - editorial style */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12 border-b border-border pb-6">
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-mono">Upcoming</span>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground uppercase mt-2">Events</h2>
          </div>
          <Link
            href="/events"
            className="text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
          >
            View All →
          </Link>
        </div>

        {/* Events grid - magazine layout */}
        <div className="grid md:grid-cols-3 gap-6">
          {events.map((event, index) => (
            <article key={index} className="group cursor-pointer">
              <div className="relative aspect-[4/3] overflow-hidden mb-4">
                <Image
                  src={event.image || "/placeholder.svg"}
                  alt={event.title}
                  fill
                  className="object-cover img-zoom grayscale group-hover:grayscale-0 transition-all duration-500"
                />
                {/* Category badge */}
                <div className="absolute top-4 left-4">
                  <span className="bg-primary text-background text-xs uppercase tracking-widest font-mono px-3 py-1">
                    {event.category}
                  </span>
                </div>
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground uppercase group-hover:text-primary transition-colors">
                    {event.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-primary font-mono">{event.date.split(" ")[0]}</span>
                  <p className="text-xs text-muted-foreground uppercase">{event.date.split(" ")[1]}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
