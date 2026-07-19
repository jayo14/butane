import { mockExams } from "@/data/mock/exams"
import { ExamsPageClient } from "./page-client"

export default function ExamsPage() {
  return <ExamsPageClient exams={mockExams} />
}
