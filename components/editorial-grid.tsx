import Image from "next/image"
import Link from "next/link"

import { WaterFrame } from "@/components/ui/water-frame"

export function EditorialGrid() {
  return (
    <section id="about" className="px-4 py-16 sm:px-8 md:py-20 scroll-mt-16">
      <div className="mx-auto max-w-[1200px]">
        {/* Asymmetric Bento Grid - Hypebeast editorial style */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
          <WaterFrame className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[color:var(--neon-surface)]/18 md:col-span-7 md:aspect-auto md:h-[520px]">
            <Image
              src="/community-real-connections.jpg"
              alt="Real people connecting in a garden setting"
              fill
              sizes="(max-width: 768px) 100vw, 58vw"
              className="object-cover transition-transform duration-700 hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/92 via-[color:var(--neon-bg0)]/25 to-transparent" />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(1100px circle at 15% 0%, rgba(0,209,255,0.16), transparent 55%), radial-gradient(900px circle at 85% 100%, rgba(157,77,255,0.12), transparent 55%)",
              }}
              aria-hidden
            />
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
              <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
                Community
              </span>
              <h3 className="mt-3 text-balance font-serif text-2xl font-bold text-[color:var(--neon-text0)] sm:text-3xl">
                Real people.
                <br />
                Real connections.
              </h3>
              <p className="mt-3 max-w-md text-sm leading-relaxed text-[color:var(--neon-text1)]">
                A timeline that makes it easy to pull up — and a community that makes it worth it.
              </p>
            </div>
          </WaterFrame>

          {/* Stack of smaller cards */}
          <div className="flex flex-col gap-4 md:col-span-5">
            <WaterFrame className="relative min-h-[240px] flex-1 rounded-2xl">
              <Link
                href="/host/apply"
                className="group relative block h-full min-h-[240px] overflow-hidden rounded-2xl bg-[color:var(--neon-surface)]/18 backdrop-blur transition hover:shadow-[0_0_26px_rgba(0,209,255,0.10)]"
              >
              <Image
                src="/host-with-vibe-santa-bull.jpg"
                alt="Host an event with VIZB"
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover object-[center_35%] transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/92 via-[color:var(--neon-bg0)]/25 to-transparent" />
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(900px circle at 20% 10%, rgba(0,209,255,0.16), transparent 55%)",
                }}
                aria-hidden
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
                  Create
                </span>
                <h3 className="mt-3 font-serif text-xl font-bold text-[color:var(--neon-text0)]">
                  Host with VIZB
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-[color:var(--neon-text1)]">
                  Bring your event to the VIZB timeline — we&apos;ll help you pack the room.
                </p>
                <span className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-[color:var(--neon-a)] transition-all group-hover:gap-3">
                  Submit an event
                  <span aria-hidden>→</span>
                </span>
              </div>
            </Link>
            </WaterFrame>

            <WaterFrame className="relative min-h-[240px] flex-1 rounded-2xl">
              <div className="group relative h-full min-h-[240px] overflow-hidden rounded-2xl bg-[color:var(--neon-surface)]/18">
              <Image
                src="/curated-events-crowd.jpg"
                alt="Curated events crowd"
                fill
                sizes="(max-width: 768px) 100vw, 42vw"
                className="object-cover object-[center_25%] transition-transform duration-700 group-hover:scale-[1.03]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-bg0)]/92 via-[color:var(--neon-bg0)]/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
                  Experience
                </span>
                <h3 className="mt-3 font-serif text-xl font-bold text-[color:var(--neon-text0)]">
                  Curated events
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--neon-text2)]">
                  Less searching. More pulling up.
                </p>
              </div>
            </div>
            </WaterFrame>
          </div>
        </div>

        {/* Photo credit */}
        <div className="mt-3 flex justify-end">
          <a
            href="https://instagram.com/kdshotthat"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs tracking-wide text-[color:var(--neon-text2)]/70 transition-colors hover:text-[color:var(--neon-a)]"
          >
            Photos by @kdshotthat
          </a>
        </div>

        {/* Stats row */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { value: "500+", label: "Community" },
            { value: "25+", label: "Events" },
            { value: "12", label: "Cities" },
            { value: "∞", label: "Energy" },
          ].map((stat, i) => (
            <div
              key={i}
              className="relative overflow-hidden rounded-2xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 p-6 shadow-[0_0_0_1px_color-mix(in_srgb,var(--neon-a)_8%,transparent)]"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-70"
                style={{
                  background:
                    "radial-gradient(700px circle at 10% 0%, rgba(0,209,255,0.10), transparent 55%), radial-gradient(650px circle at 90% 100%, rgba(157,77,255,0.08), transparent 55%)",
                }}
                aria-hidden
              />
              <div className="relative">
                <div className="font-mono text-3xl font-bold text-[color:var(--neon-a)] sm:text-4xl">
                  {stat.value}
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
