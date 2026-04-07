"use client"

import { useState } from "react"
import { submitAdvertiseInquiry } from "@/app/actions/advertise-contact"
import { BUDGET_OPTIONS, INTEREST_OPTIONS } from "@/lib/advertise-contact-schema"

const INTEREST_LABELS: Record<(typeof INTEREST_OPTIONS)[number], string> = {
  sponsorship: "Sponsorship / paid placement",
  newsletter_placement: "Newsletter or email feature",
  event_partnership: "Event or venue partnership",
  brand_collaboration: "Brand / creative collaboration",
  other: "Other",
}

const BUDGET_LABELS: Record<(typeof BUDGET_OPTIONS)[number], string> = {
  under_500: "Under $500",
  "500_2500": "$500 – $2,500",
  "2500_10000": "$2,500 – $10,000",
  "10000_plus": "$10,000+",
  not_sure: "Not sure yet",
  prefer_not_to_say: "Prefer not to say",
}

const inputClass =
  "vibe-focus-ring w-full rounded-lg border border-[color:var(--neon-hairline)] bg-[rgb(5_6_18/0.72)] px-4 py-3 text-sm text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)] focus-visible:border-[color:var(--neon-a)]/50 transition-all"

interface AdvertiseContactFormProps {
  emailConfigured: boolean
}

export function AdvertiseContactForm({ emailConfigured }: AdvertiseContactFormProps) {
  const [state, setState] = useState<Awaited<ReturnType<typeof submitAdvertiseInquiry>> | null>(null)
  const [pending, setPending] = useState(false)

  async function onSubmit(formData: FormData) {
    setPending(true)
    setState(null)
    const result = await submitAdvertiseInquiry(formData)
    setState(result)
    setPending(false)
    if (result.ok) {
      const form = document.getElementById("advertise-inquiry-form") as HTMLFormElement | null
      form?.reset()
    }
  }

  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined

  return (
    <form id="advertise-inquiry-form" action={onSubmit} className="relative space-y-8">
      {!emailConfigured && (
        <div
          className="rounded-lg border-2 border-amber-400/50 bg-amber-500/15 px-4 py-3 text-sm font-medium text-amber-100 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
          role="status"
        >
          Outbound email is not configured (missing <span className="font-mono">RESEND_API_KEY</span>). The
          form still validates input; add your key in{" "}
          <span className="font-mono">.env.local</span> to deliver to the team inbox.
        </div>
      )}

      {state?.ok ? (
        <div
          className="rounded-lg border-2 border-[color:var(--neon-a)]/45 bg-[color:var(--neon-a)]/10 px-4 py-4 text-sm font-medium text-[color:var(--neon-text0)] shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
          role="status"
        >
          {state.message}
        </div>
      ) : null}

      {state && !state.ok && !fieldErrors?.companyWebsite ? (
        <div
          className="rounded-lg border-2 border-destructive/55 bg-destructive/15 px-4 py-3 text-sm font-medium text-destructive shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
          role="alert"
        >
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label
            htmlFor="fullName"
            className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]"
          >
            Full name <span className="text-[color:var(--neon-a)]">*</span>
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            required
            autoComplete="name"
            className={`${inputClass} mt-2`}
            placeholder="Jordan Lee"
            aria-invalid={!!fieldErrors?.fullName}
          />
          {fieldErrors?.fullName ? (
            <p className="mt-1 text-xs text-destructive">{fieldErrors.fullName}</p>
          ) : null}
        </div>
        <div className="sm:col-span-1">
          <label
            htmlFor="email"
            className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]"
          >
            Work email <span className="text-[color:var(--neon-a)]">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={`${inputClass} mt-2`}
            placeholder="you@brand.com"
            aria-invalid={!!fieldErrors?.email}
          />
          {fieldErrors?.email ? <p className="mt-1 text-xs text-destructive">{fieldErrors.email}</p> : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="company"
            className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]"
          >
            Organization / brand
          </label>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            className={`${inputClass} mt-2`}
            placeholder="Company or project name"
          />
        </div>
        <div>
          <label
            htmlFor="phone"
            className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]"
          >
            Phone <span className="text-[color:var(--neon-text2)]/80">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            className={`${inputClass} mt-2`}
            placeholder="+1 …"
          />
        </div>
      </div>

      {/* Honeypot — hidden from users */}
      <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden="true">
        <label htmlFor="companyWebsite">Company website</label>
        <input id="companyWebsite" name="companyWebsite" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label
          htmlFor="interestType"
          className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]"
        >
          What are you interested in? <span className="text-[color:var(--neon-a)]">*</span>
        </label>
        <select
          id="interestType"
          name="interestType"
          required
          defaultValue=""
          className={`${inputClass} mt-2`}
          aria-invalid={!!fieldErrors?.interestType}
        >
          <option value="" disabled>
            Select one
          </option>
          {INTEREST_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {INTEREST_LABELS[key]}
            </option>
          ))}
        </select>
        {fieldErrors?.interestType ? (
          <p className="mt-1 text-xs text-destructive">{fieldErrors.interestType}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="budgetRange"
          className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]"
        >
          Rough budget (optional)
        </label>
        <select id="budgetRange" name="budgetRange" className={`${inputClass} mt-2`} defaultValue="">
          <option value="">Prefer not to say</option>
          {BUDGET_OPTIONS.map((key) => (
            <option key={key} value={key}>
              {BUDGET_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="message"
          className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]"
        >
          Goals, timing & audience <span className="text-[color:var(--neon-a)]">*</span>
        </label>
        <p className="mt-1 text-xs text-[color:var(--neon-text2)]">
          Share what you want to promote, ideal run dates, and who you are trying to reach in Virginia / DMV.
        </p>
        <textarea
          id="message"
          name="message"
          required
          rows={6}
          className={`${inputClass} mt-2 min-h-[140px] resize-y`}
          placeholder="We’re launching … and want to reach …"
          aria-invalid={!!fieldErrors?.message}
        />
        {fieldErrors?.message ? <p className="mt-1 text-xs text-destructive">{fieldErrors.message}</p> : null}
      </div>

      <div className="flex flex-col gap-3 border-t border-[color:var(--neon-hairline)] pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-md text-xs text-[color:var(--neon-text2)]">
          Submissions go to our partnerships inbox. We typically reply within a few business days.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="vibe-focus-ring inline-flex shrink-0 items-center justify-center rounded-xl bg-[color:var(--neon-text0)] px-8 py-3 text-xs font-mono uppercase tracking-widest text-[color:var(--neon-bg0)] shadow-[var(--vibe-neon-glow-subtle)] transition-[opacity,transform,box-shadow] hover:shadow-[0_0_28px_rgb(0_209_255/0.35)] disabled:pointer-events-none disabled:opacity-50"
        >
          {pending ? "Sending…" : "Send inquiry"}
        </button>
      </div>
    </form>
  )
}
