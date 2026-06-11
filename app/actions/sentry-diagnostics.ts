"use server"

import { requireAdmin } from "@/lib/auth-helpers"

export async function triggerSentryServerTestError(): Promise<{ ok: false; message: string }> {
  await requireAdmin()
  throw new Error("ViZb Sentry server test (admin diagnostics)")
}
