import Link from "next/link"
import Image from "next/image"

export default function SignUpSuccessPage() {
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
        <span className="text-xs uppercase tracking-widest text-primary font-mono">Almost There</span>
        <h1 className="font-serif text-4xl font-bold text-foreground mt-4">Check Your Inbox</h1>
        <p className="text-muted-foreground mt-4 leading-relaxed max-w-md mx-auto">
          {"We've sent a confirmation link to your email. Click it to activate your account and join the movement."}
        </p>

        {/* Decorative divider */}
        <div className="flex items-center gap-4 my-10">
          <div className="flex-1 h-px bg-border" />
          <div className="w-2 h-2 bg-primary" />
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Actions */}
        <div className="space-y-4">
          <Link
            href="/login"
            className="inline-block bg-primary text-background px-8 py-4 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(13,64,255,0.5)] transition-all"
          >
            Go to Sign In
          </Link>
          <p className="text-xs text-muted-foreground">
            {"Didn't receive an email? Check your spam folder or "}
            <Link href="/signup" className="text-primary hover:underline">
              try again
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
