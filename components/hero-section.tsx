import Image from "next/image"
import Link from "next/link"
import { ThreeBackgroundWrapper } from "./three-background-wrapper"

export function HeroSection() {
  return (
    <section className="relative min-h-screen pt-20 overflow-hidden">
      {/* Three.js Background */}
      <ThreeBackgroundWrapper />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-background/60 z-[1]" />

      {/* Content */}
      <div className="relative z-10 max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-16 py-12 lg:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh]">
          {/* Text content */}
          <div>
            <span className="text-xs uppercase tracking-widest text-primary font-mono inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              The Movement
            </span>

            {/* Main headline with neon gradient */}
            <h1 className="mt-6">
              <span className="block headline-xl text-foreground uppercase">Virginia</span>
              <span className="block headline-xl uppercase neon-gradient-text">Isn't</span>
              <span className="block headline-xl text-foreground uppercase">Boring.</span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mt-8 max-w-lg leading-relaxed">
              Everyone says you have to leave Virginia to find things to do. We don't believe that.
            </p>
            <p className="text-lg text-muted-foreground mt-4 max-w-lg leading-relaxed">
              VIZB is turning Virginia into a place where people actually know where to go — for the culture, the
              connections, and the good times.
            </p>

            {/* Pull quote - editorial style */}
            <blockquote className="mt-10 border-l-2 border-primary pl-6 relative">
              <div className="absolute -left-1 top-0 w-2 h-full bg-primary/20 blur-sm" />
              <p className="text-xl font-serif italic text-foreground">
                "Easily join our community and stay tapped in."
              </p>
            </blockquote>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4 mt-10">
              <Link
                href="/events"
                className="group relative text-xs uppercase tracking-widest bg-primary text-background px-8 py-4 overflow-hidden transition-all hover:shadow-[0_0_30px_rgba(13,64,255,0.5)]"
              >
                <span className="relative z-10">Find Events</span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#0D40FF] via-[#00BDFF] to-[#0D40FF] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/signup"
                className="group relative text-xs uppercase tracking-widest bg-secondary text-foreground px-8 py-4 overflow-hidden transition-all hover:bg-secondary/80"
              >
                <span className="relative z-10">Join the Community</span>
              </Link>
              <Link
                href="/host/apply"
                className="text-xs uppercase tracking-widest border border-foreground/30 text-foreground px-8 py-4 hover:border-primary hover:text-primary transition-colors backdrop-blur-sm"
              >
                Host With VIZB
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="relative aspect-[3/4] overflow-hidden group">
                  <Image
                    src="/vibe-event-dj.jpg"
                    alt="DJ performing at VIZB event"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    priority
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Blue brand overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0D40FF]/40 via-[#0C74E8]/30 to-transparent mix-blend-multiply" />
                  {/* Neon border glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-primary shadow-[inset_0_0_20px_rgba(13,64,255,0.3)]" />
                </div>
                <div className="bg-primary p-4 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0D40FF] to-[#00BDFF] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <p className="relative text-xs uppercase tracking-widest text-background font-mono">Hampton Roads</p>
                </div>
              </div>
              <div className="space-y-4 pt-12">
                <div className="bg-secondary p-4 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-secondary to-muted opacity-50" />
                  <p className="relative text-xs uppercase tracking-widest text-foreground font-mono">DMV</p>
                </div>
                <div className="relative aspect-[3/4] overflow-hidden group">
                  <Image
                    src="/vibe-event-party.jpg"
                    alt="VIZB community members at party"
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Blue brand overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tl from-[#00BDFF]/40 via-[#0C74E8]/30 to-transparent mix-blend-multiply" />
                  {/* Neon border glow on hover */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none border-2 border-[#00BDFF] shadow-[inset_0_0_20px_rgba(0,189,255,0.3)]" />
                </div>
              </div>
            </div>

            {/* Floating neon accent */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-[#00BDFF]/20 rounded-full blur-3xl animate-pulse delay-1000" />
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[2]" />
    </section>
  )
}
