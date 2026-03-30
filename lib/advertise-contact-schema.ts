import { z } from "zod"

export const INTEREST_OPTIONS = [
  "sponsorship",
  "newsletter_placement",
  "event_partnership",
  "brand_collaboration",
  "other",
] as const

export const BUDGET_OPTIONS = [
  "under_500",
  "500_2500",
  "2500_10000",
  "10000_plus",
  "not_sure",
  "prefer_not_to_say",
] as const

const BUDGET_OR_EMPTY = [...BUDGET_OPTIONS, ""] as const

export const advertiseInquirySchema = z.object({
  fullName: z.string().trim().min(2, "Please enter your name.").max(120),
  email: z.string().trim().email("Enter a valid email address."),
  company: z.string().trim().max(120).transform((s) => (s === "" ? undefined : s)),
  phone: z.string().trim().max(40).transform((s) => (s === "" ? undefined : s)),
  interestType: z.enum(INTEREST_OPTIONS, {
    message: "Select how you’d like to work with us.",
  }),
  budgetRange: z
    .enum(BUDGET_OR_EMPTY)
    .transform((v) => (v === "" ? undefined : v)),
  message: z
    .string()
    .trim()
    .min(40, "Tell us a bit more — at least a few sentences (40+ characters).")
    .max(5000),
  /** Honeypot — leave blank (bots fill hidden fields) */
  companyWebsite: z
    .any()
    .transform((v) => (typeof v === "string" ? v : ""))
    .refine((s) => s.length === 0, { message: "Invalid submission." }),
})

export type AdvertiseInquiryInput = z.infer<typeof advertiseInquirySchema>
