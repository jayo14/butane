import { studentResults } from "@/data/mock/student-results"
import { StudentsPageClient } from "./page-client"

export default function StudentsPage() {
  return <StudentsPageClient students={studentResults} />
}
