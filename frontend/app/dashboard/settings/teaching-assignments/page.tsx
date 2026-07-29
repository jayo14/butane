import { Suspense } from "react"
import { TeachingAssignmentsClient } from "./page-client"

export default function TeachingAssignmentsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary" /></div>}>
      <TeachingAssignmentsClient />
    </Suspense>
  )
}
