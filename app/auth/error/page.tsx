import Link from "next/link"
import Image from "next/image"

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-lg text-center">
        {/* Logo */}
        <Link href="/" className="inline-block mb-12">
          <Image
            src="/vibe-logo.png"
            alt="ViZb"
            width={48}
            height={48}
            className="h-12 w-auto"
          />
        </Link>

        {/* Content */}
        <span className="text-xs uppercase tracking-widest text-destructive font-mono">Error</span>
        <h1 className="font-serif text-4xl font-bold text-foreground mt-4">Something Went Wrong</h1>
        <p className="text-muted-foreground mt-4 leading-relaxed max-w-md mx-auto">
          We had trouble authenticating your account. This can happen if the link expired or was already used.
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 bg-destructive" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-primary text-background px-8 py-4 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(13,64,255,0.5)] transition-all"
          >
            Try Sign In
          </Link>
          <Link
            href="/signup"
            className="border border-foreground/30 text-foreground px-8 py-4 text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  )
}
