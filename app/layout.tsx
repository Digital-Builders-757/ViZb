import type React from "react"
import type { Metadata } from "next"
import { Poppins, Playfair_Display, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { StarfieldBackground } from "@/components/ui/starfield-background"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" })
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono" })

export const metadata: Metadata = {
  title: "VIZB | Virginia Isn't Boring",
  description:
    "Discover events across Virginia and the DMV. Parties, pop-ups, workshops, and culture worth pulling up to.",
  generator: "v0.app",
  icons: {
    icon: "/icon.png",
    apple: "/apple-icon.png",
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
        <Analytics />
      </body>
    </html>
  )
}
