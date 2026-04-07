function trimEnv(name: string): string {
  return process.env[name]?.trim() ?? ""
}

/**
 * Phase 1 wallet scaffold: enough env for UI + stub pass routes without certs or HMAC.
 * Uses the same variable names as `docs/operations/WALLET_PASSES_SETUP.md`.
 *
 * Phase 2 will add signing material, barcode secret, and real `.pkpass` / Google save JWT.
 */
export function isAppleWalletPassConfigured(): boolean {
  return Boolean(trimEnv("APPLE_WALLET_TEAM_ID") && trimEnv("APPLE_WALLET_PASS_TYPE_ID"))
}

export function isGoogleWalletPassConfigured(): boolean {
  return Boolean(trimEnv("GOOGLE_WALLET_ISSUER_ID") && trimEnv("GOOGLE_WALLET_CLASS_ID"))
}
