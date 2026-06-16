import Link from "next/link"
import type { DiscoveryPreset } from "@/lib/events/discovery-filters"
import { DISCOVERY_PRESET_OPTIONS } from "@/lib/events/discovery-filters"
import { EVENT_CATEGORY_OPTIONS } from "@/lib/events/categories"
import type { ListingQueryOpts } from "@/lib/events/listing-query"
import { eventsListingQuery } from "@/lib/events/listing-query"
import { EventsFilterSheet } from "@/components/events/events-filter-sheet"

const chipBase =
  "vibe-focus-ring inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all whitespace-nowrap sm:min-h-[44px] sm:px-4 sm:text-xs"
const chipActive =
  "border-[color:var(--neon-a)]/65 bg-[color:color-mix(in_srgb,var(--neon-a)_16%,var(--neon-surface))] text-[color:var(--neon-text0)] shadow-[var(--events-chip-active-glow)]"
const chipIdle =
  "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:color-mix(in_srgb,var(--neon-text1)_82%,var(--neon-text2))] hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/28 hover:text-[color:var(--neon-text0)]"

type QuickFilter =
  | { kind: "all" }
  | { kind: "discover"; value: DiscoveryPreset }
  | { kind: "category"; value: string; label: string }
  | { kind: "vibes" }

const VISIBLE_QUICK_FILTERS: QuickFilter[] = [
  { kind: "all" },
  { kind: "discover", value: "tonight" },
  { kind: "discover", value: "weekend" },
]

export interface EventsTideFiltersProps {
  listingBase: ListingQueryOpts
  activeFilter?: string | null
  activeCity?: string | null
  vibesFilter: boolean
  discoveryPreset: DiscoveryPreset | null
  cityOptions: string[]
  searchQ: string
}

function quickFilterLabel(filter: QuickFilter): string {
  if (filter.kind === "all") return "All events"
  if (filter.kind === "vibes") return "My Vibes"
  if (filter.kind === "category") return filter.label
  return DISCOVERY_PRESET_OPTIONS.find((d) => d.value === filter.value)?.label ?? filter.value
}

function isQuickFilterActive(filter: QuickFilter, props: EventsTideFiltersProps): boolean {
  if (filter.kind === "all") {
    return (
      !props.discoveryPreset &&
      !props.searchQ.trim() &&
      (!props.activeFilter || props.activeFilter === "all") &&
      !props.activeCity &&
      !props.vibesFilter
    )
  }
  if (filter.kind === "vibes") return props.vibesFilter
  if (filter.kind === "discover") return props.discoveryPreset === filter.value && !props.activeCity
  if (filter.kind === "category") {
    return props.activeFilter === filter.value && !props.discoveryPreset
  }
  return false
}

export function EventsTideFilters(props: EventsTideFiltersProps) {
  const {
    listingBase,
    activeFilter,
    activeCity,
    vibesFilter,
    discoveryPreset,
    cityOptions,
    searchQ,
  } = props

  function ql(overrides: Partial<ListingQueryOpts> = {}): string {
    return eventsListingQuery({ ...listingBase, ...overrides })
  }

  const hasActiveFilters =
    discoveryPreset ||
    searchQ.trim() ||
    (activeFilter && activeFilter !== "all") ||
    activeCity ||
    vibesFilter

  const activeChips: { label: string; href: string }[] = []

  if (discoveryPreset) {
    const label = DISCOVERY_PRESET_OPTIONS.find((d) => d.value === discoveryPreset)?.label ?? discoveryPreset
    activeChips.push({ label, href: `/events${ql({ discover: undefined })}` })
  }
  if (activeFilter && activeFilter !== "all") {
    const label = EVENT_CATEGORY_OPTIONS.find((c) => c.value === activeFilter)?.label ?? activeFilter
    activeChips.push({ label, href: `/events${ql({ category: undefined })}` })
  }
  if (activeCity) {
    activeChips.push({ label: activeCity, href: `/events${ql({ city: undefined })}` })
  }
  if (vibesFilter) {
    activeChips.push({ label: "My Vibes", href: `/events${ql({ vibes: false })}` })
  }
  if (searchQ.trim()) {
    activeChips.push({ label: `Search: ${searchQ.trim()}`, href: `/events${ql({ q: undefined })}` })
  }

  return (
    <div className="mt-2 flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div role="group" aria-label="Quick filters" className="flex flex-1 flex-wrap gap-2 sm:gap-3">
          {VISIBLE_QUICK_FILTERS.map((filter) => {
            const active = isQuickFilterActive(filter, props)
            let href = "/events"

            if (filter.kind === "all") {
              href = `/events${eventsListingQuery({})}`
            } else if (filter.kind === "vibes") {
              href = vibesFilter
                ? `/events${ql({ vibes: false })}`
                : `/events${ql({ vibes: true, discover: undefined, category: undefined, city: undefined, q: undefined })}`
            } else if (filter.kind === "discover") {
              href = active
                ? `/events${ql({ discover: undefined })}`
                : `/events${ql({ discover: filter.value, category: undefined, city: undefined })}`
            } else if (filter.kind === "category") {
              href = active
                ? `/events${ql({ category: undefined })}`
                : `/events${ql({ category: filter.value, discover: undefined })}`
            }

            const className =
              filter.kind === "vibes" && vibesFilter
                ? `${chipBase} border-[color:var(--neon-b)]/55 bg-[color:color-mix(in_srgb,var(--neon-b)_14%,var(--neon-surface))] text-[color:var(--neon-text0)] shadow-[var(--events-chip-active-glow-purple)]`
                : `${chipBase} ${active ? chipActive : chipIdle}`

            return (
              <Link key={quickFilterLabel(filter)} href={href} className={className} aria-pressed={active}>
                {quickFilterLabel(filter)}
              </Link>
            )
          })}
        </div>

        <EventsFilterSheet
          listingBase={listingBase}
          activeFilter={activeFilter}
          activeCity={activeCity}
          vibesFilter={vibesFilter}
          discoveryPreset={discoveryPreset}
          cityOptions={cityOptions}
        />
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)]">
            Active
          </span>
          {activeChips.map((chip) => (
            <Link
              key={chip.label}
              href={chip.href}
              className={`${chipBase} ${chipActive}`}
              aria-label={`Remove filter ${chip.label}`}
            >
              {chip.label} ×
            </Link>
          ))}
          {hasActiveFilters ? (
            <Link
              href={`/events${eventsListingQuery({})}`}
              className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-text2)] underline-offset-4 hover:text-[color:var(--neon-a)] hover:underline"
            >
              Reset all
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
