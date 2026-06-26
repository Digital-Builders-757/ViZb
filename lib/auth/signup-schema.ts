import { z } from "zod"

export const REFERRAL_SOURCE_OPTIONS = ["social_media", "google"] as const

export type ReferralSource = (typeof REFERRAL_SOURCE_OPTIONS)[number]

export const REFERRAL_SOURCE_LABELS: Record<ReferralSource, string> = {
  social_media: "Social media",
  google: "Google",
}

const REFERRAL_OR_EMPTY = [...REFERRAL_SOURCE_OPTIONS, ""] as const

function digitCount(value: string): number {
  return value.replace(/\D/g, "").length
}

export const signupFormSchema = z.object({
  displayName: z.string().trim().min(1, "Add the name you want other members to see."),
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(6, "Use at least 6 characters for your password."),
  phone: z
    .string()
    .trim()
    .min(1, "Add a phone number so we can reach you.")
    .max(40, "Phone number is too long.")
    .refine((value) => digitCount(value) >= 10, {
      message: "Enter a valid phone number with at least 10 digits.",
    }),
  referralSource: z
    .enum(REFERRAL_OR_EMPTY)
    .transform((value) => (value === "" ? undefined : value)),
})

export type SignupFormInput = z.input<typeof signupFormSchema>
export type SignupFormValues = z.output<typeof signupFormSchema>

export function parseSignupForm(input: SignupFormInput) {
  return signupFormSchema.safeParse(input)
}
