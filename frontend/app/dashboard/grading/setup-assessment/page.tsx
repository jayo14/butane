import { api } from "@/lib/api"
import { SetupAssessmentPageClient } from "./page-client"

export default async function SetupAssessmentPage() {
  try {
    const [
      classroomsRes,
      termsRes,
      subjectsRes,
    ] = await Promise.all([
      api.academics.classrooms().catch(() => ({ results: [] })),
      api.terms.list().catch(() => []),
      api.subjects.list().catch(() => []),
    ])

    return (
      <SetupAssessmentPageClient
        classrooms={classroomsRes?.results || []}
        terms={termsRes || []}
        subjects={subjectsRes || []}
      />
    )
  } catch (error) {
    console.error("Error loading assessment setup data", error)
    return (
      <SetupAssessmentPageClient
        classrooms={[]}
        terms={[]}
        subjects={[]}
      />
    )
  }
}
