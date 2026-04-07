"use client"

import Image from "next/image"

// VIZB app mockup with ocean neon styling
// Event data using real ViBE imagery
const mockEvents = [
  {
    image: "/curated-events-crowd.jpg",
    title: "Summer Block Party",
    venue: "Tysons Corner",
    date: "FEB 15",
    time: "6:00 PM",
    attendees: "127",
  },
  {
    image: "/host-with-vibe-santa-bull.jpg",
    title: "Holiday Throwdown",
    venue: "The Banquet Hall",
    date: "DEC 21",
    time: "8:00 PM",
    attendees: "89",
  },
  {
    image: "/community-real-connections.jpg",
    title: "Garden Social",
    venue: "Meadowlark Gardens",
    date: "MAR 02",
    time: "4:00 PM",
    attendees: "64",
  },
]

export function AppPreview() {
  return (
    <section className="relative overflow-hidden px-4 py-20 sm:px-8 md:py-28">
      {/* Ocean gradient background */}
      <div className="absolute inset-0 -z-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[color:var(--neon-a)]/5 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_50%,rgba(0,209,255,0.08),transparent)]" />
      </div>

      <div className="mx-auto max-w-[1200px]">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16">
          {/* Content */}
          <div>
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">
              <span className="h-px w-8 bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] animate-pulse" />
              Coming soon
            </span>
            <h2 className="mt-4 font-serif text-5xl font-bold leading-[0.92] text-[color:var(--neon-text0)] sm:text-6xl">
              The
              <br />
              <span className="neon-gradient-text">VIZB</span>
              <br />
              app
            </h2>
            <p className="mt-7 max-w-md text-base leading-relaxed text-[color:var(--neon-text1)] sm:text-lg">
              Discover events, connect with creators, and never miss a vibe. The VIZB app is launching soon — be the
              first to know.
            </p>

            {/* Feature list - with animated neon lines */}
            <div className="mt-10 space-y-4">
              {[
                "Discover local events",
                "Connect with creators",
                "Exclusive drops & access",
              ].map((feature, i) => (
                <div key={i} className="group flex items-center gap-4">
                  <span 
                    className="h-px w-10 bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] shadow-[0_0_14px_rgba(0,209,255,0.4)] transition-all duration-500 group-hover:w-16 group-hover:shadow-[0_0_20px_rgba(0,209,255,0.6)]"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                  <span className="font-mono text-[11px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors duration-300 group-hover:text-[color:var(--neon-a)]">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* App mockup - Ocean neon style */}
          <div className="relative">
            {/* Animated water ripples behind phone */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10">
              <div className="absolute w-[300px] h-[300px] rounded-full border border-[color:var(--neon-a)]/20 animate-[ping_3s_ease-out_infinite]" style={{ animationDelay: "0s" }} />
              <div className="absolute w-[400px] h-[400px] -top-[50px] -left-[50px] rounded-full border border-[color:var(--neon-b)]/15 animate-[ping_3s_ease-out_infinite]" style={{ animationDelay: "1s" }} />
              <div className="absolute w-[500px] h-[500px] -top-[100px] -left-[100px] rounded-full border border-[color:var(--neon-a)]/10 animate-[ping_3s_ease-out_infinite]" style={{ animationDelay: "2s" }} />
            </div>

            {/* Phone frame */}
            <div className="relative aspect-[9/19] max-w-[320px] mx-auto">
              {/* Phone outer shell with ocean neon glow */}
              <div className="water-frame water-border absolute inset-0 rounded-[3rem] p-2 shadow-[0_0_60px_rgba(0,209,255,0.25),0_0_120px_rgba(157,77,255,0.15)] bg-gradient-to-b from-[#0a0a12] to-[#05050a]">
                {/* Phone inner bezel */}
                <div className="relative w-full h-full bg-[color:var(--neon-bg0)] rounded-[2.5rem] overflow-hidden border border-[color:var(--neon-hairline)]">
                  {/* Subtle inner glow at top */}
                  <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[color:var(--neon-a)]/10 via-[color:var(--neon-b)]/5 to-transparent pointer-events-none" />
                  
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 py-3 bg-[color:var(--neon-bg0)]/80 backdrop-blur-sm">
                    <span className="text-xs font-medium text-[color:var(--neon-text0)]">9:41</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-[color:var(--neon-text0)]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.12 0-.23-.01-.35-.21.26-.45.5-.72.71C18.34 14.13 15.36 15 12 15s-6.34-.87-8.27-2.64c-.27-.21-.51-.45-.72-.71C3 11.77 3 11.88 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9-4.03-9-9-9z"/>
                      </svg>
                      <svg className="w-4 h-4 text-[color:var(--neon-text0)]" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z"/>
                      </svg>
                      <div className="w-6 h-3 bg-[color:var(--neon-hairline)] rounded-sm relative overflow-hidden">
                        <div className="absolute inset-0.5 rounded-sm bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)]" style={{ width: "75%" }} />
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Island / Notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full" />

                  {/* App Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b border-[color:var(--neon-hairline)]">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Image src="/vibe-logo.png" alt="VIZB" width={28} height={28} className="rounded" />
                        <div className="absolute inset-0 rounded bg-[color:var(--neon-a)]/20 blur-sm animate-pulse" />
                      </div>
                      <span className="text-lg font-bold text-[color:var(--neon-text0)] tracking-tight">Events</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-[color:var(--neon-text2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <svg className="w-5 h-5 text-[color:var(--neon-text2)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                  </div>

                  {/* Tab selector - with neon glow */}
                  <div className="px-5 py-3">
                    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[color:var(--neon-surface)]">
                      <span className="px-4 py-1.5 bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] text-[color:var(--neon-bg0)] text-xs font-bold rounded-full shadow-[0_0_16px_rgba(0,209,255,0.5)]">Events</span>
                      <span className="px-4 py-1.5 text-[color:var(--neon-text2)] text-xs font-medium">For You</span>
                    </div>
                  </div>

                  {/* Event Feed */}
                  <div className="px-4 pb-20 space-y-2 overflow-hidden">
                    {mockEvents.map((event, i) => (
                      <div
                        key={i}
                        className="group flex gap-3 p-2 rounded-xl border border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)] hover:border-[color:var(--neon-a)]/40 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,209,255,0.15)]"
                      >
                        {/* Event image with ocean gradient overlay */}
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <Image
                            src={event.image || "/placeholder.svg"}
                            alt={event.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          {/* Ocean gradient overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-[color:var(--neon-a)]/40 via-[color:var(--neon-b)]/20 to-transparent mix-blend-overlay" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          {/* Date badge with neon glow */}
                          <div className="absolute bottom-1 left-1 bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] px-1.5 py-0.5 text-[9px] font-bold text-[color:var(--neon-bg0)] tracking-wide rounded shadow-[0_0_8px_rgba(0,209,255,0.5)]">
                            {event.date}
                          </div>
                        </div>

                        {/* Event details */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <h4 className="text-[13px] font-bold text-[color:var(--neon-text0)] truncate leading-tight">{event.title}</h4>
                          <p className="text-[11px] text-[color:var(--neon-text2)] mt-1 truncate">{event.venue}</p>
                          <div className="flex items-center gap-1.5 mt-2">
                            <svg className="w-3 h-3 text-[color:var(--neon-a)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-[10px] text-[color:var(--neon-a)] font-medium">{event.time}</span>
                            <span className="text-[10px] text-[color:var(--neon-text2)] ml-1">• {event.attendees} going</span>
                          </div>
                        </div>

                        {/* Bookmark */}
                        <button type="button" className="self-start p-1 text-[color:var(--neon-text2)] hover:text-[color:var(--neon-a)] transition-colors">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Navigation with glass effect */}
                  <div className="absolute bottom-0 left-0 right-0 bg-[color:var(--neon-bg0)]/90 backdrop-blur-md border-t border-[color:var(--neon-hairline)] px-6 py-3">
                    <div className="flex items-center justify-around">
                      <button type="button" className="flex flex-col items-center gap-1 text-[color:var(--neon-text2)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        <span className="text-[10px]">Home</span>
                      </button>
                      <button type="button" className="relative flex flex-col items-center gap-1 text-[color:var(--neon-a)]">
                        <div className="absolute -inset-2 bg-[color:var(--neon-a)]/10 rounded-full blur-md" />
                        <svg className="relative w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11zM9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm-8 4H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2z" />
                        </svg>
                        <span className="relative text-[10px] font-medium">Events</span>
                      </button>
                      <button type="button" className="flex flex-col items-center gap-1 text-[color:var(--neon-text2)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className="text-[10px]">Community</span>
                      </button>
                      <button type="button" className="flex flex-col items-center gap-1 text-[color:var(--neon-text2)]">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-[10px]">Profile</span>
                      </button>
                    </div>
                    {/* Home indicator with gradient */}
                    <div className="mt-2 mx-auto w-32 h-1 bg-gradient-to-r from-[color:var(--neon-a)]/50 via-[color:var(--neon-b)]/50 to-[color:var(--neon-a)]/50 rounded-full" />
                  </div>
                </div>
              </div>
            </div>

            {/* Decorative glows - ocean colors */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-[color:var(--neon-a)]/15 rounded-full blur-[120px] -z-10" />
            <div className="absolute top-1/4 left-1/4 w-[200px] h-[200px] bg-[color:var(--neon-b)]/20 rounded-full blur-[80px] -z-10 animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-[150px] h-[150px] bg-[color:var(--neon-a)]/15 rounded-full blur-[60px] -z-10 animate-pulse" style={{ animationDelay: "1s" }} />
            
            {/* Decorative elements with gradient borders */}
            <div className="absolute -top-4 -left-4 w-20 h-20 border-2 border-transparent bg-gradient-to-br from-[color:var(--neon-a)]/60 to-[color:var(--neon-b)]/40 bg-clip-border" style={{ border: "2px solid transparent", backgroundImage: "linear-gradient(var(--neon-bg0), var(--neon-bg0)), linear-gradient(135deg, var(--neon-a), var(--neon-b))", backgroundOrigin: "border-box", backgroundClip: "padding-box, border-box" }} />
            <div className="absolute -bottom-4 -right-4 w-28 h-28 bg-gradient-to-br from-[color:var(--neon-a)]/20 to-[color:var(--neon-b)]/15" />
          </div>
        </div>
      </div>
    </section>
  )
}
