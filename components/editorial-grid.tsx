import Image from "next/image"
import Link from "next/link"

export function EditorialGrid() {
  return (
    <section id="about" className="py-16 px-4 sm:px-8 scroll-mt-16">
      <div className="max-w-[1800px] mx-auto">
        {/* Asymmetric Bento Grid - Hypebeast editorial style */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-7 relative group overflow-hidden bg-card aspect-[4/3] md:aspect-auto md:h-[500px]">
            <Image src="/community-real-connections.jpg" alt="Real people connecting in a garden setting" fill sizes="(max-width: 768px) 100vw, 58vw" className="object-cover img-zoom" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <span className="text-xs uppercase tracking-widest text-primary font-mono">Community</span>
              <h3 className="text-2xl sm:text-3xl font-bold text-foreground mt-2 uppercase">
                Real People.
                <br />
                Real Connections.
              </h3>
            </div>
          </div>

          {/* Stack of smaller cards */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <Link href="/host/apply" className="relative group overflow-hidden bg-card flex-1 min-h-[240px] block">
              <Image src="/host-with-vibe-santa-bull.jpg" alt="Host an event with VIZB" fill sizes="(max-width: 768px) 100vw, 42vw" className="object-cover object-[center_35%] img-zoom" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
              <div className="absolute inset-0 border-2 border-transparent group-hover:border-primary transition-colors mx-0" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-xs uppercase tracking-widest text-primary font-mono">Create</span>
                <h3 className="text-xl font-bold text-foreground mt-2 uppercase">Host With VIZB</h3>
                <p className="text-sm mt-2 leading-relaxed text-foreground">
                  Bring your event to the VIZB calendar — we'll help you pack the room.
                </p>
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-mono mt-4 group-hover:gap-3 transition-all">
                  Submit an Event
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>

            <div className="relative group overflow-hidden bg-card flex-1 min-h-[240px]">
              <Image src="/curated-events-crowd.jpg" alt="Curated events crowd" fill sizes="(max-width: 768px) 100vw, 42vw" className="object-cover object-[center_25%] img-zoom" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <span className="text-xs uppercase tracking-widest text-primary font-mono">Experience</span>
                <h3 className="text-xl font-bold text-foreground mt-2 uppercase">Curated Events</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Photo credit */}
        <div className="flex justify-end mt-2">
          <a
            href="https://instagram.com/kdshotthat"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground/60 hover:text-primary transition-colors font-mono tracking-wide"
          >
            Photos by @kdshotthat
          </a>
        </div>

        {/* Stats row - editorial style */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {[
            { value: "500+", label: "Community" },
            { value: "25+", label: "Events" },
            { value: "12", label: "Cities" },
            { value: "∞", label: "Energy" },
          ].map((stat, i) => (
            <div key={i} className="bg-card p-6 border border-border">
              <div className="text-3xl sm:text-4xl font-bold text-primary font-mono">{stat.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
