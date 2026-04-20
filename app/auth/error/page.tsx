import Link from "next/link"

import { FullLogoImage } from "@/components/brand/full-logo-image"
import { AuthAlert } from "@/components/auth/auth-alert"
import { AppShell } from "@/components/ui/app-shell"
import { GlassCard } from "@/components/ui/glass-card"
import { WaterFrame } from "@/components/ui/water-frame"
import { NeonLink } from "@/components/ui/neon-link"

export default function AuthErrorPage() {
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
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(ellipse_70%_60%_at_50%_10%,rgba(157,77,255,0.14),transparent_60%)]"
                aria-hidden
              />

              <div className="relative">
                <Link href="/" className="inline-flex items-center justify-center">
                  <span className="relative block h-14 w-44 sm:w-48">
                    <FullLogoImage fill className="object-contain" priority />
                  </span>
                </Link>

                <div className="mt-8">
                  <p className="text-xs font-mono uppercase tracking-[0.35em] text-[color:var(--neon-b)]">
                    Auth error
                  </p>
                  <h1 className="mt-4 text-balance font-serif text-4xl font-bold text-[color:var(--neon-text0)] sm:text-5xl">
                    Link didn&apos;t work
                  </h1>
                </div>

                <div className="mt-6">
                  <AuthAlert
                    variant="warning"
                    title="We couldn’t finish signing you in"
                    message="This usually happens when a link expired, was already used, or was opened on a different device or browser than where you started."
                    hint="Request a fresh link from the sign-in or sign-up flow, then try again."
                    mapped={{
                      primaryAction: { label: "Go to Sign In", href: "/login" },
                      secondaryAction: { label: "Create account", href: "/signup" },
                    }}
                  />
                </div>

                <div className="mt-10 flex items-center gap-4">
                  <div className="h-px flex-1 bg-[color:var(--neon-hairline)]" />
                  <div className="h-2 w-2 rounded-sm bg-[color:var(--neon-a)] shadow-[0_0_18px_rgba(0,209,255,0.5)]" />
                  <div className="h-px flex-1 bg-[color:var(--neon-hairline)]" />
                </div>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <NeonLink href="/" variant="secondary" shape="xl" className="min-w-[10rem] justify-center text-center">
                    Back to Home
                  </NeonLink>
                </div>
              </div>
            </GlassCard>
          </WaterFrame>
        </div>
      </main>
    </AppShell>
  )
}
