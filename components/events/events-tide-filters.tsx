import Link from "next/link"
import {
  DISCOVERY_PRESET_OPTIONS,
  type DiscoveryPreset,
} from "@/lib/events/discovery-filters"
import { EVENT_CATEGORY_OPTIONS } from "@/lib/events/categories"
import type { ListingQueryOpts } from "@/lib/events/listing-query"
import { eventsListingQuery } from "@/lib/events/listing-query"

const EVENT_LISTING_FILTERS = [
  { slug: "all" as const, label: "All" },
  ...EVENT_CATEGORY_OPTIONS.map((o) => ({ slug: o.value, label: o.label })),
] as const

const QUICK_PRESETS: DiscoveryPreset[] = ["tonight", "weekend", "free", "paid"]

const chipBase =
  "vibe-focus-ring inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all whitespace-nowrap sm:min-h-[44px] sm:px-4 sm:text-xs"
const chipActive =
  "border-[color:var(--neon-a)]/60 bg-[color:color-mix(in_srgb,var(--neon-a)_14%,var(--neon-surface))] text-[color:var(--neon-text0)] shadow-[0_0_22px_rgba(0,209,255,0.18)]"
const chipIdle =
  "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:color-mix(in_srgb,var(--neon-text1)_82%,var(--neon-text2))] hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/28 hover:text-[color:var(--neon-text0)]"

export interface EventsTideFiltersProps {
  listingBase: ListingQueryOpts
  activeFilter?: string | null
  activeCity?: string | null
  vibesFilter: boolean
  discoveryPreset: DiscoveryPreset | null
  cityOptions: string[]
  searchQ: string
}

export function EventsTideFilters({
  listingBase,
  activeFilter,
  activeCity,
  vibesFilter,
  discoveryPreset,
  cityOptions,
  searchQ,
}: EventsTideFiltersProps) {
  function ql(overrides: Partial<ListingQueryOpts> = {}): string {
    return eventsListingQuery({ ...listingBase, ...overrides })
  }

  const hasActiveFilters =
    discoveryPreset ||
    searchQ.trim() ||
    (activeFilter && activeFilter !== "all") ||
    activeCity ||
    vibesFilter

  const quickOptions = DISCOVERY_PRESET_OPTIONS.filter((d) => QUICK_PRESETS.includes(d.value))

  return (
    <div className="mt-10 flex flex-col gap-4 border-t border-[color:var(--neon-hairline)]/35 pt-8 md:mt-12">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">Tide filters</p>
          <p className="mt-1 text-xs text-[color:var(--neon-text2)]">Category, city, and quick discovery presets</p>
        </div>
        {hasActiveFilters ? (
          <Link
            href={`/events${eventsListingQuery({ vibes: vibesFilter || undefined })}`}
            className="inline-flex min-h-[36px] shrink-0 items-center rounded-full border border-dashed border-[color:var(--neon-hairline)] px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] hover:border-[color:var(--neon-a)]/40 hover:text-[color:var(--neon-text0)]"
          >
            Reset all
          </Link>
        ) : null}
      </div>

      <div role="group" aria-label="Quick filters" className="flex flex-wrap gap-2 sm:gap-3">
        {quickOptions.map((d) => {
          const active = discoveryPreset === d.value
          const href = active ? `/events${ql({ discover: undefined })}` : `/events${ql({ discover: d.value })}`
          return (
            <Link key={d.value} href={href} className={`${chipBase} ${active ? chipActive : chipIdle}`} aria-pressed={active}>
              {d.label}
            </Link>
          )
        })}
        <Link
          href={vibesFilter ? ql({ vibes: false }) : ql({ vibes: true })}
          className={`${chipBase} ${
            vibesFilter
              ? "border-[color:var(--neon-b)]/50 bg-[color:color-mix(in_srgb,var(--neon-b)_12%,var(--neon-surface))] text-[color:var(--neon-text0)] shadow-[0_0_20px_rgba(157,77,255,0.14)]"
              : chipIdle
          }`}
          aria-pressed={vibesFilter}
        >
          My Vibes
        </Link>
      </div>

      {cityOptions.length > 0 ? (
        <div role="group" aria-label="City filters" className="flex flex-col gap-2">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">Cities</p>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none sm:gap-3">
            {activeCity ? (
              <Link
                href={`/events${ql({ city: undefined })}`}
                className={`${chipBase} ${chipActive}`}
                aria-pressed
              >
                {activeCity} ×
              </Link>
            ) : null}
            {cityOptions
              .filter((c) => c !== activeCity)
              .map((city) => (
                <Link
                  key={city}
                  href={`/events${ql({ city })}`}
                  className={`${chipBase} ${chipIdle}`}
                >
                  {city}
                </Link>
              ))}
          </div>
        </div>
      ) : null}

      <div role="group" aria-label="Category filters" className="flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">Categories</p>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none sm:gap-3">
          {EVENT_LISTING_FILTERS.map((cat) => {
            const isActive =
              cat.slug === "all" ? !activeFilter || activeFilter === "all" : activeFilter === cat.slug
            const categoryParam = cat.slug === "all" ? undefined : cat.slug
            const href =
              cat.slug === "all"
                ? `/events${ql({ category: undefined })}`
                : `/events${ql({ category: categoryParam })}`

            return (
              <Link
                key={cat.slug}
                href={href}
                className={`${chipBase} ${isActive ? chipActive : chipIdle}`}
                aria-pressed={isActive}
              >
                {cat.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div role="group" aria-label="More discovery presets" className="flex items-center gap-2 overflow-x-auto scrollbar-none sm:gap-3">
        {DISCOVERY_PRESET_OPTIONS.filter((d) => !QUICK_PRESETS.includes(d.value)).map((d) => {
          const active = discoveryPreset === d.value
          const href = active ? `/events${ql({ discover: undefined })}` : `/events${ql({ discover: d.value })}`
          return (
            <Link
              key={d.value}
              href={href}
              className={`${chipBase} ${
                active
                  ? "border-violet-500/55 bg-violet-500/10 text-[color:var(--neon-text0)] shadow-[0_0_18px_rgba(139,92,246,0.2)]"
                  : chipIdle
              }`}
              aria-pressed={active}
            >
              {d.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
