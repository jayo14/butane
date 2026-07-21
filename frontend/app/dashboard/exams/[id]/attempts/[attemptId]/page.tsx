import { AttemptReviewClient } from "./page-client"

export default async function AttemptReviewPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>
}) {
  const { id, attemptId } = await params
  return <AttemptReviewClient examId={id} attemptId={attemptId} />
}
