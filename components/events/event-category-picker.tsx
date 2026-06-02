"use client"

import { EVENT_CATEGORY_OPTIONS } from "@/lib/events/categories"

const DEFAULT_CHIP_ON =
  "border-neon-a bg-neon-a/10 text-foreground"
const DEFAULT_CHIP_OFF =
  "border-border text-muted-foreground hover:border-muted-foreground/50"

export interface EventCategoryPickerProps {
  selected: Set<string>
  onToggle: (value: string) => void
  disabled?: boolean
  required?: boolean
  helpText?: string
  legendClassName?: string
  helpTextClassName?: string
  chipOnClassName?: string
  chipOffClassName?: string
}

export function EventCategoryPicker({
  selected,
  onToggle,
  disabled = false,
  required = false,
  helpText = "Pick all that apply — used for discovery on /events.",
  legendClassName = "text-xs font-mono uppercase tracking-widest text-muted-foreground",
  helpTextClassName = "text-[11px] text-muted-foreground leading-relaxed max-w-xl",
  chipOnClassName = DEFAULT_CHIP_ON,
  chipOffClassName = DEFAULT_CHIP_OFF,
}: EventCategoryPickerProps) {
  return (
    <fieldset className="flex flex-col gap-3" disabled={disabled}>
      <legend className={legendClassName}>
        Categories {required ? <span className="text-neon-a">*</span> : null}
      </legend>
      {helpText ? <p className={helpTextClassName}>{helpText}</p> : null}
      <div className="flex flex-wrap gap-2">
        {EVENT_CATEGORY_OPTIONS.map((cat) => {
          const on = selected.has(cat.value)
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => onToggle(cat.value)}
              disabled={disabled}
              className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 ${
                on ? chipOnClassName : chipOffClassName
              }`}
            >
              {cat.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
