"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { CreateExamWizard } from "@/components/exams/create-exam-wizard"

function CreateExamPageInner() {
  const searchParams = useSearchParams()
  const editId = searchParams.get("editId") ?? undefined
  return <CreateExamWizard editId={editId} />
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={null}>
      <CreateExamPageInner />
    </Suspense>
  )
}
