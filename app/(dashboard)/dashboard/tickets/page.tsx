import Link from "next/link"

export default function TicketsPage() {
  return (
    <div>
      {/* Page header */}
      <span className="text-xs uppercase tracking-widest text-brand-cyan font-mono">Collection</span>
      <h1 className="font-serif text-xl md:text-3xl font-bold text-foreground mt-2">My Tickets</h1>
      <p className="text-sm text-muted-foreground mt-2">
        All your upcoming and past event tickets in one place.
      </p>

      {/* Empty state */}
      <div className="mt-8 md:mt-10 border border-dashed p-6 md:p-16 flex flex-col items-center text-center gradient-border">
        <span className="text-xs uppercase tracking-widest text-brand-cyan font-mono">No Tickets Yet</span>
        <h2 className="text-xl font-bold text-foreground uppercase mt-3">Your Collection Is Empty</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">
          When you RSVP or purchase tickets for events, they will appear here.
        </p>
        <Link
          href="/events"
          className="mt-8 bg-gradient-to-r from-brand-blue to-brand-cyan text-white px-8 py-4 text-xs uppercase tracking-widest font-bold hover:shadow-[0_0_30px_rgba(0,189,255,0.4)] transition-all"
        >
          Explore Events
        </Link>
      </div>
    </div>
  )
}
