import { studentResults } from "@/data/mock/student-results"
import { ResultsPageClient } from "./page-client"

export default function ResultsPage() {
  const allAttempts = studentResults.flatMap((s) => s.attempts)
  return <ResultsPageClient attempts={allAttempts} students={studentResults} />
}
