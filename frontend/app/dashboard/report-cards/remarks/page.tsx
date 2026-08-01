import { api } from "@/lib/api"
import { TeacherRemarksClient } from "./page-client"

export default async function TeacherRemarksPage() {
  let classrooms: any[] = []

  try {
    const classroomsRes = await api.academics.classrooms().catch(() => [])
    classrooms = (classroomsRes as any)?.results || classroomsRes || []
  } catch {
    // Use empty array as fallback
  }

  return <TeacherRemarksClient initialClassrooms={classrooms} />
}
