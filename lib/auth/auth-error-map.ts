import { supportMailtoHref } from "@/lib/auth/support-contact"

export type AuthErrorContext = "signup" | "login" | "reset" | "verify"

export interface AuthErrorAction {
  label: string
  href?: string
  /** Use for client-only actions (e.g. retry, clear). */
  onClick?: () => void
}

export interface MappedAuthError {
  code: string
  title: string
  message: string
  severity: "error" | "warning"
  hint?: string
  primaryAction?: AuthErrorAction
  secondaryAction?: AuthErrorAction
}

function norm(s: string): string {
  return s.trim().toLowerCase()
}

function extractParts(err: unknown): { message: string; status?: number; name?: string } {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>
    const message = typeof o.message === "string" ? o.message : ""
    const status = typeof o.status === "number" ? o.status : undefined
    const name = typeof o.name === "string" ? o.name : undefined
    if (message || status !== undefined || name) {
      return { message, status, name }
    }
  }
  if (err instanceof Error) return { message: err.message }
  if (typeof err === "string") return { message: err }
  return { message: "" }
}

function unknownFallback(options?: MapAuthErrorOptions): MappedAuthError {
  return {
    code: "unknown_error",
    title: "Something went wrong",
    message:
      "Please try again. If it keeps happening, contact support and we’ll help you get back in.",
    severity: "error",
    primaryAction: {
      label: "Try again",
      onClick:
        options?.onGenericRetry ??
        (() => {
          window.location.reload()
        }),
    },
    secondaryAction: { label: "Back to Home", href: "/" },
    hint: "No technical details are shown here on purpose — your account is still safe.",
  }
}

function isRateLimited(message: string, status?: number): boolean {
  if (status === 429) return true
  const m = norm(message)
  return (
    m.includes("too many requests") ||
    m.includes("rate limit") ||
    m.includes("email rate limit") ||
    m.includes("over_request_rate")
  )
}

function isNetworkError(message: string, name?: string): boolean {
  const m = norm(message)
  const n = name ? norm(name) : ""
  return (
    m.includes("failed to fetch") ||
    m.includes("network error") ||
    m.includes("network request failed") ||
    m.includes("load failed") ||
    m.includes("internet connection") ||
    n.includes("authretryablefetcherror")
  )
}

function isInvalidEmail(message: string): boolean {
  const m = norm(message)
  return (
    m.includes("invalid email") ||
    m.includes("unable to validate email") ||
    m.includes("email validat") ||
    m.includes("invalid e-mail")
  )
}

function isWeakPassword(message: string): boolean {
  const m = norm(message)
  return (
    m.includes("password") &&
    (m.includes("weak") ||
      m.includes("too short") ||
      m.includes("at least") ||
      m.includes("least 6") ||
      m.includes("least 8") ||
      m.includes("minimum") ||
      m.includes("breached") ||
      m.includes("common") ||
      m.includes("strength"))
  )
}

function isDuplicateUser(message: string): boolean {
  const m = norm(message)
  return (
    m.includes("user already registered") ||
    m.includes("email already registered") ||
    m.includes("email address is already") ||
    m.includes("email address already") ||
    m.includes("user_already_exists") ||
    (m.includes("already registered") && (m.includes("user") || m.includes("email")))
  )
}

function isInvalidCredentials(message: string): boolean {
  const m = norm(message)
  return (
    m.includes("invalid login credentials") ||
    m.includes("invalid credential") ||
    (m.includes("invalid") && m.includes("password") && m.includes("email")) ||
    m === "invalid grant" ||
    m.includes("invalid_grant")
  )
}

function isEmailNotConfirmed(message: string): boolean {
  const m = norm(message)
  return (
    m.includes("email not confirmed") ||
    m.includes("not confirmed") ||
    m.includes("email_not_confirmed") ||
    m.includes("unverified") ||
    m.includes("verify your email") ||
    m.includes("confirm your email")
  )
}

export interface MapAuthErrorOptions {
  /** When set, "Try again" uses this instead of reloading the page for network errors. */
  onNetworkRetry?: () => void
  /** Clears the form error and re-enables submit for unknown/fallback errors. */
  onGenericRetry?: () => void
}

/**
 * Map Supabase Auth errors (or generic Errors) into user-facing copy and actions.
 * Never surfaces raw provider strings in UI — consumers should use `title`, `message`, and actions only.
 */
export function mapAuthError(
  err: unknown,
  context: AuthErrorContext,
  options?: MapAuthErrorOptions,
): MappedAuthError {
  const { message, status, name } = extractParts(err)
  const m = norm(message)

  if (!message && !status) {
    return unknownFallback(options)
  }

  if (isNetworkError(message, name)) {
    return {
      code: "network_error",
      title: "Connection problem",
      message:
        "We couldn’t reach our servers. Check your connection and try again in a moment.",
      severity: "error",
      primaryAction: options?.onNetworkRetry
        ? { label: "Try again", onClick: options.onNetworkRetry }
        : { label: "Back to Home", href: "/" },
      secondaryAction: options?.onNetworkRetry
        ? { label: "Back to Home", href: "/" }
        : { label: "Reload page", onClick: () => window.location.reload() },
    }
  }

  if (isRateLimited(message, status)) {
    return {
      code: "rate_limited",
      title: "Slow down a moment",
      message:
        "Too many attempts were made from this device. Wait a minute, then try again.",
      severity: "warning",
      primaryAction: { label: "Back to Home", href: "/" },
    }
  }

  if (context === "signup") {
    if (isDuplicateUser(message)) {
      return {
        code: "account_exists",
        title: "Account already exists",
        message: "An account with this email is already registered. Sign in instead, or use a different email.",
        severity: "warning",
        primaryAction: { label: "Go to Sign In", href: "/login" },
        secondaryAction: { label: "Forgot password?", href: "/auth/forgot-password" },
      }
    }
    if (isInvalidEmail(message)) {
      return {
        code: "invalid_email",
        title: "Check your email",
        message: "That email doesn’t look valid. Fix any typos and try again.",
        severity: "error",
      }
    }
    if (isWeakPassword(message)) {
      return {
        code: "weak_password",
        title: "Choose a stronger password",
        message:
          "Use at least 6 characters. For better security, mix letters, numbers, and symbols.",
        severity: "error",
      }
    }
    return unknownFallback(options)
  }

  if (context === "login") {
    if (isInvalidCredentials(message)) {
      return {
        code: "invalid_credentials",
        title: "Wrong email or password",
        message: "Those credentials don’t match an account. Double-check both fields, or reset your password.",
        severity: "error",
        primaryAction: { label: "Reset password", href: "/auth/forgot-password" },
        secondaryAction: { label: "Create account", href: "/signup" },
      }
    }
    if (isEmailNotConfirmed(message)) {
      return {
        code: "email_not_verified",
        title: "Confirm your email first",
        message:
          "Your account isn’t activated yet. Open the link we sent you, then sign in here.",
        severity: "warning",
        primaryAction: { label: "Resend help", href: "/auth/sign-up-success" },
        secondaryAction: { label: "Try another email", href: "/login" },
      }
    }
    if (isInvalidEmail(message)) {
      return {
        code: "invalid_email",
        title: "Check your email",
        message: "That email doesn’t look valid. Fix any typos and try again.",
        severity: "error",
      }
    }
    return unknownFallback(options)
  }

  if (context === "reset") {
    if (isInvalidEmail(message)) {
      return {
        code: "invalid_email",
        title: "Check your email",
        message: "That email doesn’t look valid. Fix any typos and try again.",
        severity: "error",
      }
    }
    return unknownFallback(options)
  }

  if (context === "verify") {
    return {
      code: "verify_send_failed",
      title: "Couldn’t resend the email",
      message:
        "Something blocked the resend. Check your connection, wait a minute, or try signing up again with the same email.",
      severity: "error",
      primaryAction: { label: "Back to Sign Up", href: "/signup" },
      secondaryAction: {
        label: "Contact support",
        href: supportMailtoHref("VIZB email confirmation"),
      },
    }
  }

  return unknownFallback(options)
}
