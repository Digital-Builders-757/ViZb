import type React from "react"
import type { Metadata } from "next"
import { Poppins, Playfair_Display, JetBrains_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { StarfieldBackground } from "@/components/ui/starfield-background"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const _poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })
const _playfair = Playfair_Display({ subsets: ["latin"] })
const _jetbrainsMono = JetBrains_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "VIZB | Driving Culture Forward",
  description:
    "VIZB creates experiences that bring people together — music, culture, creativity, and community — all across Virginia.",
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
      <body className={`font-sans antialiased`}>
        <StarfieldBackground />
        <div className="relative z-10 min-h-dvh">{children}</div>
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
