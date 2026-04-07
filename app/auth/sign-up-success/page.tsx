import Link from "next/link";
import Image from "next/image";

import { AppShell } from "@/components/ui/app-shell";
import { GlassCard } from "@/components/ui/glass-card";
import { WaterFrame } from "@/components/ui/water-frame";
import { NeonLink } from "@/components/ui/neon-link";

export default function SignUpSuccessPage() {
  return (
    <AppShell
      withNeonBackdrop
      className="text-[15px] leading-relaxed text-[color:var(--neon-text1)]"
    >
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-5xl items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-xl">
          <WaterFrame className="rounded-2xl">
            <GlassCard
              emphasis
              className="relative overflow-hidden rounded-2xl px-6 py-10 sm:px-10"
            >
              {/* soft top glow */}
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_60%_at_50%_10%,rgba(0,209,255,0.18),transparent_60%)]"
                aria-hidden
              />

              <div className="relative">
                <Link
                  href="/"
                  className="inline-flex items-center justify-center"
                >
                  <span className="relative h-12 w-12">
                    <Image
                      src="/vibe-logo.png"
                      alt="VIZB"
                      fill
                      className="object-contain"
                      priority
                    />
                  </span>
                </Link>

                <div className="mt-8">
                  <p className="text-xs font-mono uppercase tracking-[0.35em] text-[color:var(--neon-a)]">
                    Almost there
                  </p>
                  <h1 className="mt-4 text-balance font-serif text-4xl font-bold text-[color:var(--neon-text0)] sm:text-5xl">
                    Check your inbox
                  </h1>
                  <p className="mt-5 max-w-lg text-[color:var(--neon-text2)]">
                    We’ve sent a confirmation link to your email. Open it to
                    activate your account and join the movement.
                  </p>
                </div>

                <div className="mt-10 flex items-center gap-4">
                  <div className="h-px flex-1 bg-[color:var(--neon-hairline)]" />
                  <div className="h-2 w-2 rounded-sm bg-[color:var(--neon-a)] shadow-[0_0_18px_rgba(0,209,255,0.5)]" />
                  <div className="h-px flex-1 bg-[color:var(--neon-hairline)]" />
                </div>

                <div className="mt-10 space-y-4">
                  <NeonLink href="/login" fullWidth shape="xl">
                    GO TO SIGN IN
                  </NeonLink>

                  <p className="text-center text-xs text-[color:var(--neon-text2)]">
                    Didn’t receive an email? Check your spam folder or{" "}
                    <Link
                      href="/signup"
                      className="font-mono text-[color:var(--neon-a)] underline decoration-[color:var(--neon-hairline)] underline-offset-4 transition hover:decoration-[color:var(--neon-a)]"
                    >
                      try again
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </GlassCard>
          </WaterFrame>
        </div>
      </main>
    </AppShell>
  );
}
