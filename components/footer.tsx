import Link from "next/link"

import { FullLogoImage } from "@/components/brand/full-logo-image"

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--neon-hairline)] px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-[1800px]">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <Link href="/" className="inline-block">
              <FullLogoImage width={200} height={200} className="h-14 w-auto max-w-[min(100%,220px)]" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[color:var(--neon-text1)]">
              Virginia events, real people, real nights out. Music, workshops, meetups, parties,
              and the moments between.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="mb-4 font-mono text-xs uppercase tracking-normal text-[color:var(--neon-text2)]">
                Navigate
              </h4>
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
                <Link href="/#waitlist" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  Join the list
                </Link>
                <Link href="/host/apply" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  Host with VIZB
                </Link>
                <Link href="/advertise" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  Advertise with us
                </Link>
                <Link href="/p" className="block text-sm text-[color:var(--neon-text0)] transition-colors hover:text-[color:var(--neon-a)]">
                  News
                </Link>
              </div>
            </div>
            <div>
              <h4 className="mb-4 font-mono text-xs uppercase tracking-normal text-[color:var(--neon-text2)]">
                Connect
              </h4>
              <p className="max-w-[12rem] text-sm leading-relaxed text-[color:var(--neon-text2)]">
                For collaborations, placements, or regional campaigns, reach out through{" "}
                <Link href="/advertise" className="text-[color:var(--neon-a)] underline decoration-[color:var(--neon-hairline)] underline-offset-4 hover:decoration-[color:var(--neon-a)]">
                  partnerships
                </Link>
                .
              </p>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-mono text-xs uppercase tracking-normal text-[color:var(--neon-text2)]">
              Regions
            </h4>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-3 py-2.5 font-mono text-xs uppercase tracking-normal text-[color:var(--neon-text0)] backdrop-blur">
                Hampton Roads
              </span>
              <span className="rounded-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/35 px-3 py-2.5 font-mono text-xs uppercase tracking-normal text-[color:var(--neon-text0)] backdrop-blur">
                DMV
              </span>
              <span className="rounded-full border border-[color:var(--neon-a)]/35 bg-[color:var(--neon-a)]/15 px-3 py-2.5 font-mono text-xs uppercase tracking-normal text-[color:var(--neon-a)] backdrop-blur">
                More VA soon
              </span>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col justify-between gap-4 border-t border-[color:var(--neon-hairline)] pt-8 sm:flex-row">
          <p className="text-xs text-[color:var(--neon-text2)]">
            Copyright {new Date().getFullYear()} VIZB. All rights reserved.
          </p>
          <p className="font-mono text-xs text-[color:var(--neon-text2)]">Virginia Isn&apos;t Boring.</p>
        </div>
      </div>
    </footer>
  )
}
