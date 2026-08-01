import { api } from "@/lib/api"
import { MaximizedMarkSheetClient } from "./page-client"

export default async function MaximizedMarkSheetPage() {
  let students: any[] = []

  try {
    const studentsRes = await api.students.list().catch(() => [])
    students = (studentsRes as any)?.results || studentsRes || []
  } catch {
    // Use empty array as fallback
  }

  return <MaximizedMarkSheetClient initialStudents={students} />
}
