import { BroadsheetPageClient } from "./page-client"

export default function BroadsheetPage({
  params,
  searchParams,
}: {
  params: Promise<{}>
  searchParams: Promise<{ classroom?: string; term?: string }>
}) {
  return <BroadsheetPageClient />
}
