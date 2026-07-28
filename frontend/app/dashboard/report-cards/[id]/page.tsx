import { ReportCardReviewClient } from "./page-client"

export default function ReportCardReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <ReportCardReviewClient />
}
