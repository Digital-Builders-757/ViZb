"use client"

import { saveMemberPreferences, type MemberPreferencesState } from "@/app/actions/member-preferences"
import { EventCategoryPicker } from "@/components/events/event-category-picker"
import { GlassCard } from "@/components/ui/glass-card"
import { MEMBER_HOME_CITY_OPTIONS, type MemberHomeCityValue } from "@/lib/member/home-cities"
import type { MemberPreferencesSnapshot } from "@/lib/member/preferences"
import { MapPin, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useActionState, useEffect, useState } from "react"

const initialState: MemberPreferencesState = { error: null, success: false }

const chipOn =
  "border-[color:var(--neon-a)] bg-[color:color-mix(in_srgb,var(--neon-a)_12%,transparent)] text-[color:var(--neon-text0)]"
const chipOff =
  "border-[color:var(--neon-hairline)] text-[color:var(--neon-text2)] hover:border-[color:color-mix(in_srgb,var(--neon-a)_35%,var(--neon-hairline))]"

export interface MemberPreferencesFormProps {
  initial: MemberPreferencesSnapshot
  variant?: "first-run" | "profile"
}

function buildPreferencesFormData(input: {
  homeCities: Set<MemberHomeCityValue>
  categories: Set<string>
  reminderOptIn: boolean
  emailReminders: boolean
  inAppReminders: boolean
}): FormData {
  const fd = new FormData()
  for (const city of input.homeCities) fd.append("homeCities", city)
  for (const category of input.categories) fd.append("categories", category)
  if (input.reminderOptIn) {
    fd.set("reminderOptIn", "on")
    if (input.inAppReminders) fd.set("inAppReminders", "on")
    if (input.emailReminders) fd.set("emailReminders", "on")
  }
  return fd
}

export function MemberPreferencesForm({ initial, variant = "profile" }: MemberPreferencesFormProps) {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(saveMemberPreferences, initialState)
  const [clientError, setClientError] = useState<string | null>(null)
  const [homeCities, setHomeCities] = useState(() => new Set(initial.homeCities))
  const [categories, setCategories] = useState(() => new Set(initial.categories))
  const [reminderOptIn, setReminderOptIn] = useState(initial.reminderOptIn)
  const [emailReminders, setEmailReminders] = useState(initial.emailReminders)
  const [inAppReminders, setInAppReminders] = useState(initial.inAppReminders)

  const toggleCity = (value: MemberHomeCityValue) => {
    setClientError(null)
    setHomeCities((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const toggleCategory = (value: string) => {
    setClientError(null)
    setCategories((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  useEffect(() => {
    if (state.success) router.refresh()
  }, [state.success, router])

  const isFirstRun = variant === "first-run"
  const displayError = clientError ?? state.error

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setClientError(null)

    if (homeCities.size === 0) {
      setClientError("Pick at least one home city or region.")
      return
    }
    if (categories.size === 0) {
      setClientError("Pick at least one event category you care about.")
      return
    }

    formAction(
      buildPreferencesFormData({
        homeCities,
        categories,
        reminderOptIn,
        emailReminders,
        inAppReminders,
      }),
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <GlassCard className="overflow-hidden shadow-[var(--vibe-neon-glow-subtle)]">
        <div className="flex items-center gap-3 px-5 pb-4 pt-5 md:px-6 md:pt-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:color-mix(in_srgb,var(--neon-b)_14%,transparent)]">
            <Sparkles className="h-4 w-4 text-[color:var(--neon-b)]" aria-hidden />
          </div>
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
              {isFirstRun ? "Step 2 · Your vibe" : "Culture preferences"}
            </span>
            {isFirstRun ? (
              <p className="mt-1 text-sm text-[color:var(--neon-text1)]">
                Tell us where you pull up and what you are into — we will personalize your feed.
              </p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-[color:var(--neon-hairline)]" />

        {state.success ? (
          <div className="mx-5 mt-5 border border-[color:color-mix(in_srgb,var(--neon-a)_40%,var(--neon-hairline))] bg-[color:color-mix(in_srgb,var(--neon-a)_10%,transparent)] px-4 py-3 md:mx-6">
            <p className="text-sm text-[color:var(--neon-a)]">
              {isFirstRun ? "Preferences saved — your dashboard is personalized." : "Preferences updated."}
            </p>
          </div>
        ) : null}
        {displayError ? (
          <div className="mx-5 mt-5 border border-destructive/50 bg-destructive/10 px-4 py-3 md:mx-6">
            <p className="text-sm text-destructive">{displayError}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-8 px-5 py-5 md:px-6 md:py-6">
          <fieldset className="flex flex-col gap-3">
            <legend className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
              <MapPin className="h-3.5 w-3.5 text-[color:var(--neon-a)]" aria-hidden />
              Home cities <span className="text-[color:var(--neon-a)]">*</span>
            </legend>
            <p className="text-[11px] leading-relaxed text-[color:var(--neon-text2)]">
              Pick where you usually show up — we use this for near-me picks and reminders.
            </p>
            <div className="flex flex-wrap gap-2">
              {MEMBER_HOME_CITY_OPTIONS.map((city) => {
                const on = homeCities.has(city.value)
                return (
                  <button
                    key={city.value}
                    type="button"
                    onClick={() => toggleCity(city.value)}
                    disabled={isPending}
                    className={`border px-3 py-2 text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      on ? chipOn : chipOff
                    }`}
                  >
                    {city.label}
                  </button>
                )
              })}
            </div>
          </fieldset>

          <EventCategoryPicker
            selected={categories}
            onToggle={toggleCategory}
            disabled={isPending}
            required
            helpText="What kind of events should we surface first?"
            legendClassName="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]"
            helpTextClassName="text-[11px] leading-relaxed text-[color:var(--neon-text2)] max-w-xl"
            chipOnClassName={chipOn}
            chipOffClassName={chipOff}
          />

          <fieldset className="flex flex-col gap-3">
            <legend className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-text2)]">
              Reminders
            </legend>
            <label className="flex cursor-pointer items-start gap-3 text-sm text-[color:var(--neon-text1)]">
              <input
                type="checkbox"
                checked={reminderOptIn}
                onChange={(e) => setReminderOptIn(e.target.checked)}
                disabled={isPending}
                className="mt-0.5"
              />
              <span>Remind me about saved events and tickets I hold</span>
            </label>
            {reminderOptIn ? (
              <div className="ml-6 flex flex-col gap-2">
                <label className="flex cursor-pointer items-start gap-3 text-sm text-[color:var(--neon-text1)]">
                  <input
                    type="checkbox"
                    checked={inAppReminders}
                    onChange={(e) => setInAppReminders(e.target.checked)}
                    disabled={isPending}
                    className="mt-0.5"
                  />
                  <span>In-app notifications (dashboard bell)</span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-sm text-[color:var(--neon-text1)]">
                  <input
                    type="checkbox"
                    checked={emailReminders}
                    onChange={(e) => setEmailReminders(e.target.checked)}
                    disabled={isPending}
                    className="mt-0.5"
                  />
                  <span>Email reminders (when configured)</span>
                </label>
              </div>
            ) : null}
          </fieldset>
        </div>

        <div className="border-t border-[color:var(--neon-hairline)]" />
        <div className="flex items-center gap-4 bg-[color:color-mix(in_srgb,var(--neon-bg1)_55%,transparent)] px-5 py-4 md:px-6">
          <button
            type="submit"
            disabled={isPending}
            className="group relative inline-flex min-h-11 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[color:var(--neon-a)] to-[color:var(--neon-b)] px-8 py-3 text-xs font-mono font-semibold uppercase tracking-widest text-[color:var(--neon-bg0)] shadow-[var(--vibe-neon-glow-subtle)] transition-[transform,opacity,box-shadow] hover:shadow-[var(--vibe-neon-glow)] active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50"
          >
            {isPending ? "Saving…" : isFirstRun ? "Save & personalize" : "Save preferences"}
          </button>
          {state.success ? (
            <span className="font-mono text-xs uppercase tracking-widest text-[color:var(--neon-a)]">Saved</span>
          ) : null}
        </div>
      </GlassCard>
    </form>
  )
}
