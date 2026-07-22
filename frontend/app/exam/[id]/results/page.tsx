import { ExamResultsClient } from "./page-client"

export default async function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ExamResultsClient examId={id} />
}
