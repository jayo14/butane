import { fetchExams } from "@/lib/api"
import { ExamsPageClient } from "./page-client"

export default async function ExamsPage() {
  try {
    const exams = await fetchExams()
    return <ExamsPageClient exams={exams} />
  } catch {
    return <ExamsPageClient exams={[]} />
  }
}
