import Link from "next/link"

import { FullLogoImage } from "@/components/brand/full-logo-image"

export function Footer() {
  return (
    <footer className="py-16 px-4 sm:px-8 border-t border-[color:var(--neon-hairline)]">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              <FullLogoImage width={200} height={200} className="h-14 w-auto max-w-[min(100%,220px)]" />
            </Link>
            <p className="text-sm text-[color:var(--neon-text1)] mt-4 max-w-xs">
              Driving culture forward in Virginia. Workshops. Meetups. Parties.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-4">Navigate</h4>
              <div className="space-y-2">
                <Link href="/events" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  Events
                </Link>
                <Link href="/#waitlist" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  Join the list
                </Link>
                <Link href="/host/apply" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  Host with VIZB
                </Link>
                <Link href="/advertise" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  Advertise with us
                </Link>
                <Link href="/p" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  From VIZB
                </Link>
              </div>
            </div>
            <div>
              <h4 className="mb-4 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">Social</h4>
              <p className="max-w-[12rem] text-sm leading-relaxed text-[color:var(--neon-text2)]">
                Official social links are on the way. In the meantime, tap in on the timeline or say hi through{" "}
                <Link href="/advertise" className="text-[color:var(--neon-a)] underline decoration-[color:var(--neon-hairline)] underline-offset-4 hover:decoration-[color:var(--neon-a)]">
                  partnerships
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Location badges */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-4">Regions</h4>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full text-xs font-mono uppercase tracking-widest bg-[color:var(--neon-surface)]/35 border border-[color:var(--neon-hairline)] px-3 py-2 text-[color:var(--neon-text0)] backdrop-blur">
                Hampton Roads
              </span>
              <span className="rounded-full text-xs font-mono uppercase tracking-widest bg-[color:var(--neon-surface)]/35 border border-[color:var(--neon-hairline)] px-3 py-2 text-[color:var(--neon-text0)] backdrop-blur">
                DMV
              </span>
              <span className="rounded-full text-xs font-mono uppercase tracking-widest bg-[color:var(--neon-a)]/15 border border-[color:var(--neon-a)]/35 px-3 py-2 text-[color:var(--neon-a)] backdrop-blur">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-[color:var(--neon-hairline)] flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-[color:var(--neon-text2)]">© {new Date().getFullYear()} VIZB. All rights reserved.</p>
          <p className="text-xs text-[color:var(--neon-text2)] font-mono">Virginia Isn't Boring.</p>
        </div>
      </div>
    </footer>
  )
}
