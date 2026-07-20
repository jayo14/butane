"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { CreateExamWizard } from "@/components/exams/create-exam-wizard"
import { api } from "@/lib/api"
import type { ApiExam } from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function EditExamPage() {
  const params = useParams()
  const id = params?.id as string | undefined
  const [exam, setExam] = useState<ApiExam | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    const examId: string = id
    let cancelled = false
    async function load() {
      try {
        const data = await api.exams.get(examId)
        if (!cancelled) setExam(data)
      } catch {
        if (!cancelled) setError(true)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-content-muted" />
      </div>
    )
  }

  if (error || !exam) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-content-muted">
        <p className="text-lg font-medium">Failed to load exam</p>
        <p className="mt-1 text-sm">The exam could not be found or you don't have permission to edit it.</p>
      </div>
    )
  }

  return <CreateExamWizard initialExam={exam} />
}
