import { ExamReviewClient } from "./page-client"

export default async function ExamReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <ExamReviewClient examId={id} />
}
