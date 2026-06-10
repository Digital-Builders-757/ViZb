/** Maps ticket QR verification errors to scanner API codes/messages. */
export function verifyErrorToCode(msg: string): { code: string; error: string } {
  if (msg === "Token expired") {
    return { code: "token_expired", error: "This ticket code has expired. Ask the guest to refresh My tickets." }
  }
  if (msg === "Expiry too far in future") {
    return { code: "token_expiry_invalid", error: "This ticket code is not valid." }
  }
  return { code: "invalid_token", error: "This ticket code could not be verified." }
}
