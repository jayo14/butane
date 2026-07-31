import { api } from "@/lib/api"
import { AnalyticsPageClient } from "./page-client"

export default async function AnalyticsPage() {
  try {
    const [
      classroomsRes,
      subjectsRes,
      profile,
    ] = await Promise.all([
      api.academics.classrooms().catch(() => ({ results: [] })),
      api.subjects.list().catch(() => []),
      api.auth.profile().catch(() => null),
    ])

    return (
      <AnalyticsPageClient
        classrooms={classroomsRes?.results || []}
        subjects={subjectsRes || []}
        profile={profile}
      />
    )
  } catch (error) {
    console.error("Error loading analytics page", error)
    return (
      <AnalyticsPageClient
        classrooms={[]}
        subjects={[]}
        profile={null}
      />
    )
  }
}
