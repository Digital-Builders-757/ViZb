import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="py-16 px-4 sm:px-8 border-t border-[color:var(--neon-hairline)]">
      <div className="max-w-[1800px] mx-auto">
        <div className="grid md:grid-cols-3 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="inline-block">
              <Image
                src="/vibe-logo.png"
                alt="ViZb Logo"
                width={60}
                height={60}
                className="h-14 w-auto"
              />
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
                <Link href="/advertise" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  Advertise with us
                </Link>
                <Link href="/p" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  From ViZb
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] mb-4">Social</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  Instagram
                </a>
                <a href="#" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  Twitter
                </a>
                <a href="#" className="block text-sm text-[color:var(--neon-text0)] hover:text-[color:var(--neon-a)] transition-colors">
                  TikTok
                </a>
              </div>
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
          <p className="text-xs text-[color:var(--neon-text2)]">© {new Date().getFullYear()} ViZb. All rights reserved.</p>
          <p className="text-xs text-[color:var(--neon-text2)] font-mono">Virginia Isn't Boring.</p>
        </div>
      </div>
    </footer>
  )
}
