import Link from "next/link"
import Image from "next/image"

export function Footer() {
  return (
    <footer className="py-16 px-4 sm:px-8 border-t border-border">
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
            <p className="text-sm text-muted-foreground mt-4 max-w-xs">
              Driving culture forward in Virginia. Workshops. Meetups. Parties.
            </p>
          </div>

          {/* Links */}
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Navigate</h4>
              <div className="space-y-2">
                <Link href="#events" className="block text-sm text-foreground hover:text-primary transition-colors">
                  Events
                </Link>
                <Link href="#about" className="block text-sm text-foreground hover:text-primary transition-colors">
                  About
                </Link>
              </div>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Social</h4>
              <div className="space-y-2">
                <a href="#" className="block text-sm text-foreground hover:text-primary transition-colors">
                  Instagram
                </a>
                <a href="#" className="block text-sm text-foreground hover:text-primary transition-colors">
                  Twitter
                </a>
                <a href="#" className="block text-sm text-foreground hover:text-primary transition-colors">
                  TikTok
                </a>
              </div>
            </div>
          </div>

          {/* Location badges */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Regions</h4>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs uppercase tracking-widest bg-card border border-border px-3 py-2 text-foreground">
                Hampton Roads
              </span>
              <span className="text-xs uppercase tracking-widest bg-card border border-border px-3 py-2 text-foreground">
                DMV
              </span>
              <span className="text-xs uppercase tracking-widest bg-primary text-background px-3 py-2">
                Coming Soon
              </span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col sm:flex-row justify-between gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} ViZb. All rights reserved.</p>
          <p className="text-xs text-muted-foreground font-mono">Virginia Isn't Boring.</p>
        </div>
      </div>
    </footer>
  )
}
