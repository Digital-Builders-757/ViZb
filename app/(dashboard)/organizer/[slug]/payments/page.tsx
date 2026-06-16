import Link from "next/link"

import { getOrganizerStripeConnectStatus } from "@/app/actions/organizer-stripe-connect"
import { OrganizerStripeConnectPanel } from "@/components/organizer/organizer-stripe-connect-panel"
import { requireOrgMember } from "@/lib/auth-helpers"

export default async function OrganizerPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ connect?: string }>
}) {
  const { slug } = await params
  const query = await searchParams
  await requireOrgMember(slug)

  const { status } = await getOrganizerStripeConnectStatus(slug)
  const connectBanner =
    query.connect === "return" ? "return" : query.connect === "refresh" ? "refresh" : null

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-neon-b">Organizer</span>
          <h1 className="mt-2 font-serif text-xl font-bold text-foreground md:text-3xl">Payments</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Connect Stripe to receive payouts for paid ticket sales on events you host.
          </p>
        </div>
        <Link
          href={`/organizer/${slug}`}
          className="text-xs font-mono uppercase tracking-widest text-neon-a hover:underline"
        >
          Back to dashboard
        </Link>
      </div>

      <OrganizerStripeConnectPanel orgSlug={slug} initialStatus={status} connectBanner={connectBanner} />
    </div>
  )
}
