"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X, User } from "lucide-react"
import { createClient, isBrowserSupabaseConfigured } from "@/lib/supabase/client"
import { NeonLink } from "@/components/ui/neon-link"

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<{ email?: string } | null>(null)
  const [isVisible, setIsVisible] = useState(true)
  const [isHovering, setIsHovering] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  // When Supabase public env is missing, skip auth fetch and show marketing CTAs immediately.
  const [loading, setLoading] = useState(() => isBrowserSupabaseConfigured())

  useEffect(() => {
    if (!isBrowserSupabaseConfigured()) return

    const supabase = createClient()
    let cancelled = false
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (cancelled) return
      setUser(user)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Auto-hide navbar after 3 seconds of inactivity
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Show navbar when mouse is near the top of the screen (within 100px)
      if (e.clientY < 100) {
        setIsVisible(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      } else if (!isHovering && !isOpen) {
        // Start fade timer when mouse moves away from top
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false)
        }, 2000)
      }
    }

    // Initial fade after page load
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, 3000)

    window.addEventListener("mousemove", handleMouseMove)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [isHovering, isOpen])

  const isLoggedIn = !!user

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/72 backdrop-blur-xl transition-all duration-500 ease-in-out ${
        isVisible || isHovering || isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none"
      }`}
      onMouseEnter={() => {
        setIsHovering(true)
        setIsVisible(true)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }}
      onMouseLeave={() => {
        setIsHovering(false)
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false)
        }, 1500)
      }}
    >
      <div className="max-w-[1800px] mx-auto px-4 sm:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/vibe-logo.png"
              alt="VIZB Logo"
              width={40}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              href="/events"
              className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
            >
              Events
            </Link>
            <Link
              href="/p"
              className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
            >
              Posts
            </Link>
            <Link
              href="/advertise"
              className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
            >
              Advertise
            </Link>
            <Link
              href="#about"
              className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
            >
              About
            </Link>

            {!loading && (
              <>
                {isLoggedIn ? (
                  <NeonLink href="/dashboard" shape="xl" size="sm" className="sm:w-auto">
                    <User className="w-3.5 h-3.5" />
                    Dashboard
                  </NeonLink>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
                    >
                      Sign In
                    </Link>
                    <NeonLink href="/signup" shape="xl" size="sm" className="sm:w-auto">
                      Join
                    </NeonLink>
                  </>
                )}
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="vibe-focus-ring rounded-md p-1 text-[color:var(--neon-text0)] md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-b border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)]/92 backdrop-blur-xl">
          <div className="px-4 py-6 space-y-4">
            <Link
              href="/events"
              className="block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Events
            </Link>
            <Link
              href="/p"
              className="block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Posts
            </Link>
            <Link
              href="/advertise"
              className="block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              Advertise
            </Link>
            <Link
              href="#about"
              className="block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
              onClick={() => setIsOpen(false)}
            >
              About
            </Link>

            {!loading && (
              <>
                {isLoggedIn ? (
                  <NeonLink
                    href="/dashboard"
                    shape="xl"
                    fullWidth
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-3.5 h-3.5" />
                    Dashboard
                  </NeonLink>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)] hover:text-[color:var(--neon-text0)] transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      Sign In
                    </Link>
                    <NeonLink
                      href="/signup"
                      shape="xl"
                      fullWidth
                      size="sm"
                      onClick={() => setIsOpen(false)}
                    >
                      Join
                    </NeonLink>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
