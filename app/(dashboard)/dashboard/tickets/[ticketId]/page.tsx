import { TicketWalletDetailView } from "@/components/dashboard/tickets/ticket-wallet-detail-view"

export default async function DashboardTicketDetailPage({
  params,
}: {
  params: Promise<{ ticketId: string }>
}) {
  const { ticketId } = await params
  return <TicketWalletDetailView ticketId={ticketId} ticketsListHref="/dashboard/tickets" />
}
