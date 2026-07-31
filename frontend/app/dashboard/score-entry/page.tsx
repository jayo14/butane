import { api } from "@/lib/api"
import { ScoreEntryPageClient } from "./page-client"

export default async function ScoreEntryPage() {
  try {
    const [
      sessionsRes,
      classroomsRes,
      termsRes,
      subjectsRes,
      enrollmentsRes,
      profile,
    ] = await Promise.all([
      api.academics.sessions().catch(() => ({ results: [] })),
      api.academics.classrooms().catch(() => ({ results: [] })),
      api.terms.list().catch(() => []),
      api.subjects.list().catch(() => []),
      api.academics.enrollments().catch(() => ({ results: [] })),
      api.auth.profile().catch(() => null),
    ])

    return (
      <ScoreEntryPageClient
        initialSessions={sessionsRes?.results || []}
        initialClassrooms={classroomsRes?.results || []}
        initialTerms={termsRes || []}
        initialSubjects={subjectsRes || []}
        initialEnrollments={enrollmentsRes?.results || []}
        profile={profile}
      />
    )
  } catch (error) {
    console.error("Error loading score entry page", error)
    return (
      <ScoreEntryPageClient
        initialSessions={[]}
        initialClassrooms={[]}
        initialTerms={[]}
        initialSubjects={[]}
        initialEnrollments={[]}
        profile={null}
      />
    )
  }
}
