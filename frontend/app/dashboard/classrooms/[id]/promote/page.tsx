import { PromoteClassPageClient } from "./page-client"

export default function PromoteClassPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  return <PromoteClassPageClient />
}
