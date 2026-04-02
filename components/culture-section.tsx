import Image from "next/image"

export function CultureSection() {
  return (
    <section id="culture" className="py-24 px-4 sm:px-8 bg-card border-y border-border">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Text content */}
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-mono">The Movement</span>
            <h2 className="headline-lg text-foreground uppercase mt-4">
              Virginia
              <br />
              <span className="text-primary">Isn't</span>
              <br />
              Boring.
            </h2>
            <p className="text-lg text-muted-foreground mt-8 max-w-md leading-relaxed">
              Everyone says you have to leave Virginia to find real culture. We don't believe that.
            </p>
            <p className="text-lg text-muted-foreground mt-4 max-w-md leading-relaxed">
              VIZB is turning Virginia into a place where creators actually want to show up — not just for work, but for
              community, collaboration, and fun.
            </p>

            {/* Pull quote - editorial style */}
            <blockquote className="mt-12 border-l-2 border-primary pl-6">
              <p className="text-xl font-serif italic text-foreground">
                "Not hype. Not chaos. Just good energy, done right."
              </p>
            </blockquote>
          </div>

          {/* Image collage */}
          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src="/young-creative-professional-portrait-streetwear-st.jpg" alt="VIZB member" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                </div>
                <div className="bg-primary p-4">
                  <p className="text-xs uppercase tracking-widest text-background font-mono">Hampton Roads</p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="bg-secondary p-4">
                  <p className="text-xs uppercase tracking-widest text-foreground font-mono">DMV</p>
                </div>
                <div className="relative aspect-[3/4] overflow-hidden">
                  <Image src="/group-of-young-people-laughing-at-creative-event.jpg" alt="VIZB community" fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
