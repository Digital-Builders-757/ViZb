/** Map common Supabase Storage API errors to actionable hints (missing bucket = migrations not applied). */
export function augmentStorageErrorMessage(message: string): string {
  if (/bucket not found/i.test(message)) {
    return `${message} Apply the latest Supabase migrations (e.g. supabase db push) so buckets like post-covers and event-flyers exist, or create the bucket in the Supabase Dashboard.`
  }
  return message
}
