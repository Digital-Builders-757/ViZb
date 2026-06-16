import type React from "react"
import type { Metadata, Viewport } from "next"
import { Suspense } from "react"
import { Poppins, Playfair_Display, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { PwaInstallPrompt } from "@/components/pwa-install-prompt"
import { StarfieldBackground } from "@/components/ui/starfield-background"
import { Toaster } from "@/components/ui/sonner"
import {
  APPLE_ICON_SRC,
  FAVICON_32_SRC,
  FAVICON_ICO_SRC,
  PWA_ICON_192_SRC,
  PWA_ICON_512_SRC,
} from "@/lib/brand-assets"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D40FF",
}

export const metadata: Metadata = {
  title: "VIZB | Virginia Isn't Boring",
  description:
    "Discover events across Virginia and the DMV. Parties, pop-ups, workshops, and culture worth pulling up to.",
  generator: "v0.app",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ViZb",
  },
  icons: {
    icon: [
      { url: FAVICON_ICO_SRC, sizes: "any" },
      { url: FAVICON_32_SRC, sizes: "32x32", type: "image/png" },
      { url: PWA_ICON_192_SRC, sizes: "192x192", type: "image/png" },
      { url: PWA_ICON_512_SRC, sizes: "512x512", type: "image/png" },
    ],
    apple: APPLE_ICON_SRC,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${poppins.variable} ${playfair.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <StarfieldBackground />
        <div className="relative z-10 min-h-dvh">{children}</div>
        <Toaster />
        <Suspense fallback={null}>
          <PwaInstallPrompt />
        </Suspense>
        <Analytics />
      </body>
    </html>
  )
}
