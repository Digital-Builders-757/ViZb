import { notFound } from "next/navigation"
import { requireAdmin } from "@/lib/auth-helpers"
import { loadCandidateDetail } from "@/lib/admin/load-candidate-detail"
import { CandidateImportDetail } from "@/components/admin/candidate-import-detail"
import { NeonLink } from "@/components/ui/neon-link"

export default async function AdminCandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { supabase } = await requireAdmin()
  const { id } = await params
  const detail = await loadCandidateDetail(supabase, id)

  if (detail.error && !detail.candidate) {
    if (detail.error === "Candidate not found.") {
      notFound()
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <NeonLink href="/admin/events/imports" variant="secondary" size="sm">
          ← Import review queue
        </NeonLink>
      </div>

      {detail.error ? (
        <p className="text-sm text-destructive">{detail.error}</p>
      ) : null}

      {detail.candidate ? (
        <CandidateImportDetail
          candidate={detail.candidate}
          reviews={detail.reviews}
          canonicalEvent={detail.canonicalEvent}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Candidate not found.</p>
      )}
    </div>
  )
}
