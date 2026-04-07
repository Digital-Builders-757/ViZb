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
  "w-full border border-[color:var(--neon-hairline)] bg-[color:var(--neon-bg0)] rounded-lg px-4 py-3 text-sm text-[color:var(--neon-text0)] placeholder:text-[color:var(--neon-text2)]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--neon-a)]/40 focus-visible:border-[color:var(--neon-a)]/40 transition-all"

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
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg px-4 py-3 text-sm text-amber-200">
          Outbound email is not configured (missing <span className="font-mono">RESEND_API_KEY</span>). The
          form still validates input; add your key in{" "}
          <span className="font-mono">.env.local</span> to deliver to the team inbox.
        </div>
      )}

      {state?.ok ? (
        <div className="border border-[color:var(--neon-a)]/30 bg-[color:var(--neon-a)]/5 rounded-lg px-4 py-4 text-sm text-[color:var(--neon-text0)]">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[color:var(--neon-a)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {state.message}
          </div>
        </div>
      ) : null}

      {state && !state.ok && !fieldErrors?.companyWebsite ? (
        <div className="border border-destructive/30 bg-destructive/5 rounded-lg px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      ) : null}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <label htmlFor="fullName" className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
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
          <label htmlFor="email" className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
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
          <label htmlFor="company" className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
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
          <label htmlFor="phone" className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
            Phone <span className="text-[color:var(--neon-text2)]/70">(optional)</span>
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
        <label htmlFor="interestType" className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
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
        <label htmlFor="budgetRange" className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
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
        <label htmlFor="message" className="text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text2)]">
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
          className={`${inputClass} mt-2 resize-y min-h-[140px]`}
          placeholder="We're launching … and want to reach …"
          aria-invalid={!!fieldErrors?.message}
        />
        {fieldErrors?.message ? <p className="mt-1 text-xs text-destructive">{fieldErrors.message}</p> : null}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-[color:var(--neon-hairline)] pt-6">
        <p className="text-xs text-[color:var(--neon-text2)] max-w-md">
          Submissions go to our partnerships inbox. We typically reply within a few business days.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="group relative overflow-hidden rounded-lg p-[2px] shadow-[var(--vibe-neon-glow)] hover:shadow-[0_0_32px_rgba(0,209,255,0.45),0_0_64px_rgba(157,77,255,0.3)] transition-shadow duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-[color:var(--neon-a)] via-[color:var(--neon-b)] to-[color:var(--neon-a)] bg-[length:200%_100%] animate-[neon-border-flow_3s_linear_infinite]" />
          <span className="relative z-10 flex items-center justify-center bg-[color:var(--neon-bg0)]/80 group-hover:bg-[color:var(--neon-bg0)]/60 px-8 py-3 rounded-lg text-xs font-mono uppercase tracking-widest text-[color:var(--neon-text0)] transition-colors">
            {pending ? "Sending…" : "Send inquiry"}
          </span>
        </button>
      </div>
    </form>
  )
}
