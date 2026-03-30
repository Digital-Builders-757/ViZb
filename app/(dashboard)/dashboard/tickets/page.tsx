import { EmptyStateCard } from "@/components/ui/empty-state-card"
import { NeonLink } from "@/components/ui/neon-link"

export default function TicketsPage() {
  return (
    <div className="space-y-8 md:space-y-10">
      <header>
        <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
          Collection
        </span>
        <h1 className="mt-2 font-serif text-2xl font-bold text-[color:var(--neon-text0)] md:text-3xl">
          My Tickets
        </h1>
        <p className="mt-2 max-w-lg text-[15px] leading-relaxed text-[color:var(--neon-text1)]">
          All your upcoming and past event tickets in one place.
        </p>
      </header>

      <EmptyStateCard
        kicker="No tickets yet"
        title="Your collection is empty"
        description="When you RSVP or purchase tickets for events, they will appear here."
      >
        <NeonLink href="/events" fullWidth className="sm:w-auto" shape="xl">
          Explore events
        </NeonLink>
      </EmptyStateCard>
    </div>
  )
}
