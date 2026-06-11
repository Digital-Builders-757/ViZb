import Link from "next/link"

import { FullLogoImage } from "@/components/brand/full-logo-image"

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--neon-hairline)] px-4 py-16 sm:px-8">
      <div className="mx-auto max-w-[1800px]">
        <div className="grid gap-12 md:grid-cols-3">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              <FullLogoImage width={200} height={200} className="h-14 w-auto max-w-[min(100%,220px)]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[color:var(--neon-text1)]">
              Virginia events, real people, real nights out. Workshops. Meetups. Parties.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Navigate</h4>
              <div className="space-y-2">
                <Link href="/" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  Home
                </Link>
                <Link href="/about" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  About
                </Link>
                <Link href="/events" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  Events
                </Link>
                <Link href="/about#waitlist" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  Join the list
                </Link>
                <Link href="/host/apply" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  Host with VIZB
                </Link>
                <Link href="/advertise" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  Advertise with us
                </Link>
                <Link href="/p" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  From VIZB
                </Link>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Social</h4>
              <p className="max-w-[12rem] text-sm leading-relaxed text-[color:var(--neon-text2)]">
                Official social links are on the way. For now, catch us on the timeline or reach out through{" "}
                <Link href="/advertise" className="text-[color:var(--neon-a)] underline decoration-[color:var(--neon-hairline)] underline-offset-4 hover:decoration-[color:var(--neon-a)]">
                  partnerships
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Location badges */}
          <div>
            <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Regions</h4>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-3 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
                Hampton Roads
              </span>
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-3 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] backdrop-blur">
                DMV
              </span>
              <span className="rounded-full border border-[color:var(--neon-a)]/35 bg-[color:var(--neon-a)]/15 px-3 py-2.5 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-a)] backdrop-blur">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-[color:var(--neon-hairline)] pt-8 sm:flex-row">
          <p className="text-xs text-[color:var(--neon-text2)]">© {new Date().getFullYear()} VIZB. All rights reserved.</p>
          <p className="font-mono text-xs text-[color:var(--neon-text2)]">Virginia Isn&apos;t Boring.</p>
        </div>
      </div>
    </footer>
  )
}
