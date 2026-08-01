import { api } from "@/lib/api"
import { ReportCardApprovalClient } from "./page-client"

export default async function ReportCardApprovalPage() {
  let terms: any[] = []
  let classrooms: any[] = []

  try {
    const [termsRes, classroomsRes] = await Promise.all([
      api.terms.list().catch(() => []),
      api.academics.classrooms().catch(() => []),
    ])
    terms = (termsRes as any)?.results || termsRes || []
    classrooms = (classroomsRes as any)?.results || classroomsRes || []
  } catch {
    // Use empty arrays as fallback
  }

  return (
    <ReportCardApprovalClient
      initialTerms={terms}
      initialClassrooms={classrooms}
    />
  )
}
