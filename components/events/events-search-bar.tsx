import Link from "next/link"
import type { DiscoveryPreset } from "@/lib/events/discovery-filters"

export interface EventsSearchBarProps {
  searchQ: string
  activeFilter?: string | null
  activeCity?: string | null
  vibesFilter: boolean
  discoveryPreset: DiscoveryPreset | null
  sortMode: "soonest" | "city"
  clearSearchHref: string
}

export function EventsSearchBar({
  searchQ,
  activeFilter,
  activeCity,
  vibesFilter,
  discoveryPreset,
  sortMode,
  clearSearchHref,
}: EventsSearchBarProps) {
  return (
    <form
      method="get"
      action="/events"
      className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-3"
      role="search"
    >
      {activeFilter && activeFilter !== "all" ? (
        <input type="hidden" name="category" value={activeFilter} />
      ) : null}
      {activeCity ? <input type="hidden" name="city" value={activeCity} /> : null}
      {vibesFilter ? <input type="hidden" name="vibes" value="1" /> : null}
      {discoveryPreset ? <input type="hidden" name="discover" value={discoveryPreset} /> : null}
      {sortMode === "city" ? <input type="hidden" name="sort" value="city" /> : null}
      <label htmlFor="events-q" className="sr-only">
        Search events
      </label>
      <div className="relative w-full max-w-md rounded-full p-[2px] shadow-[var(--vibe-neon-glow)] transition-shadow duration-300 focus-within:shadow-[0_0_32px_rgba(0,209,255,0.45),0_0_64px_rgba(157,77,255,0.3)]">
        <span
          className="absolute inset-0 animate-neon-border-flow rounded-full bg-gradient-to-r from-[color:var(--neon-a)] via-[color:var(--neon-b)] to-[color:var(--neon-a)] bg-[length:200%_100%]"
          aria-hidden
        />
        <input
          id="events-q"
          name="q"
          type="search"
          defaultValue={searchQ}
          placeholder="Search title, venue, city…"
          className="vibe-focus-ring relative z-[1] min-h-11 w-full rounded-full border-0 bg-[color:var(--neon-bg0)]/80 px-5 py-3 font-mono text-xs text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)] backdrop-blur focus-visible:outline-none md:min-h-12"
          autoComplete="off"
        />
      </div>
      <button
        type="submit"
        className="vibe-focus-ring shrink-0 rounded-full border border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/12 px-7 py-3 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text0)] transition-[background-color,box-shadow] hover:bg-[color:var(--neon-a)]/22 hover:shadow-[var(--vibe-neon-glow-subtle)]"
      >
        Search
      </button>
      {searchQ.trim() ? (
        <Link
          href={clearSearchHref}
          className="shrink-0 text-center font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-text0)] hover:underline"
        >
          Clear search
        </Link>
      ) : null}
    </form>
  )
}
