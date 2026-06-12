"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { useState } from "react"
import {
  DISCOVERY_PRESET_OPTIONS,
  type DiscoveryPreset,
} from "@/lib/events/discovery-filters"
import { EVENT_CATEGORY_OPTIONS } from "@/lib/events/categories"
import type { ListingQueryOpts } from "@/lib/events/listing-query"
import { eventsListingQuery } from "@/lib/events/listing-query"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const chipBase =
  "vibe-focus-ring inline-flex min-h-[40px] items-center rounded-full border px-3 py-2 font-mono text-[10px] uppercase tracking-widest backdrop-blur transition-all whitespace-nowrap sm:min-h-[44px] sm:px-4 sm:text-xs"
const chipActive =
  "border-[color:var(--neon-a)]/60 bg-[color:color-mix(in_srgb,var(--neon-a)_14%,var(--neon-surface))] text-[color:var(--neon-text0)] shadow-[0_0_22px_rgba(0,209,255,0.18)]"
const chipIdle =
  "border-[color:var(--neon-hairline)] bg-[color:var(--neon-surface)]/18 text-[color:color-mix(in_srgb,var(--neon-text1)_82%,var(--neon-text2))] hover:border-[color:var(--neon-a)]/40 hover:bg-[color:var(--neon-surface)]/28 hover:text-[color:var(--neon-text0)]"

const WHEN_PRESETS: DiscoveryPreset[] = ["tonight", "weekend"]
const PRICE_PRESETS: DiscoveryPreset[] = ["free", "paid"]
const VIBE_PRESETS: DiscoveryPreset[] = ["family", "after_hours", "open_mic"]

export interface EventsFilterSheetProps {
  listingBase: ListingQueryOpts
  activeFilter?: string | null
  activeCity?: string | null
  vibesFilter: boolean
  discoveryPreset: DiscoveryPreset | null
  cityOptions: string[]
}

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="font-mono text-[10px] uppercase tracking-widest text-[color:var(--neon-a)]">{title}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

export function EventsFilterSheet({
  listingBase,
  activeFilter,
  activeCity,
  vibesFilter,
  discoveryPreset,
  cityOptions,
}: EventsFilterSheetProps) {
  const [open, setOpen] = useState(false)

  function ql(overrides: Partial<ListingQueryOpts> = {}): string {
    return eventsListingQuery({ ...listingBase, ...overrides })
  }

  function sheetLink(href: string, label: string, active: boolean) {
    return (
      <Link
        href={href}
        onClick={() => setOpen(false)}
        className={`${chipBase} ${active ? chipActive : chipIdle}`}
        aria-pressed={active}
      >
        {label}
      </Link>
    )
  }

  const secondaryActiveCount =
    (activeFilter && activeFilter !== "all" ? 1 : 0) +
    (activeCity ? 1 : 0) +
    (discoveryPreset && !["tonight", "weekend", "free"].includes(discoveryPreset) ? 1 : 0) +
    (discoveryPreset === "paid" ? 1 : 0)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className={`${chipBase} ${secondaryActiveCount > 0 ? chipActive : chipIdle}`}
          aria-expanded={open}
        >
          Filters{secondaryActiveCount > 0 ? ` (${secondaryActiveCount})` : ""}
        </button>
      </SheetTrigger>
      <SheetContent
        side="bottom"
        className="max-h-[85vh] overflow-y-auto border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)] pb-8"
      >
        <SheetHeader>
          <SheetTitle className="font-serif text-lg text-[color:var(--neon-text0)]">Find your vibe</SheetTitle>
          <SheetDescription className="text-[color:var(--neon-text2)]">
            When, where, what, price, and intent — without scrolling past the events.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4">
          <FilterSection title="When">
            {WHEN_PRESETS.map((value) => {
              const opt = DISCOVERY_PRESET_OPTIONS.find((d) => d.value === value)!
              const active = discoveryPreset === value
              const href = active ? `/events${ql({ discover: undefined })}` : `/events${ql({ discover: value })}`
              return sheetLink(href, opt.label, active)
            })}
          </FilterSection>

          {cityOptions.length > 0 ? (
            <FilterSection title="Where">
              {activeCity
                ? sheetLink(`/events${ql({ city: undefined })}`, `${activeCity} ×`, true)
                : null}
              {cityOptions
                .filter((c) => c !== activeCity)
                .map((city) => sheetLink(`/events${ql({ city })}`, city, false))}
            </FilterSection>
          ) : null}

          <FilterSection title="What">
            {sheetLink(
              `/events${ql({ category: undefined })}`,
              "All types",
              !activeFilter || activeFilter === "all",
            )}
            {EVENT_CATEGORY_OPTIONS.map((cat) => {
              const active = activeFilter === cat.value
              const href = active
                ? `/events${ql({ category: undefined })}`
                : `/events${ql({ category: cat.value })}`
              return sheetLink(href, cat.label, active)
            })}
          </FilterSection>

          <FilterSection title="Price">
            {PRICE_PRESETS.map((value) => {
              const opt = DISCOVERY_PRESET_OPTIONS.find((d) => d.value === value)!
              const active = discoveryPreset === value
              const href = active ? `/events${ql({ discover: undefined })}` : `/events${ql({ discover: value })}`
              return sheetLink(href, opt.label, active)
            })}
          </FilterSection>

          <FilterSection title="Vibe / intent">
            {VIBE_PRESETS.map((value) => {
              const opt = DISCOVERY_PRESET_OPTIONS.find((d) => d.value === value)!
              const active = discoveryPreset === value
              const href = active ? `/events${ql({ discover: undefined })}` : `/events${ql({ discover: value })}`
              return sheetLink(href, opt.label, active)
            })}
            {sheetLink(
              vibesFilter ? `/events${ql({ vibes: false })}` : `/events${ql({ vibes: true })}`,
              "My Vibes",
              vibesFilter,
            )}
          </FilterSection>
        </div>
      </SheetContent>
    </Sheet>
  )
}
