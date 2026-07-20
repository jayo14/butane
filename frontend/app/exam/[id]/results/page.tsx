import { api } from "@/lib/api"
import { ExamResultsClient } from "./page-client"
import { notFound } from "next/navigation"

interface ResultsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; attemptId?: string; accessToken?: string }>
}

export default async function ExamResultsPage({ params, searchParams }: ResultsPageProps) {
  const [{ id }, { token, attemptId, accessToken }] = await Promise.all([params, searchParams])
  try {
    const exam = await api.public.exam(token || id)
    return (
      <ExamResultsClient
        exam={{
          id: exam.id,
          title: exam.title,
          duration: exam.duration_minutes,
          totalMarks: exam.total_marks,
          questionCount: exam.question_count,
        }}
        questions={exam.questions.map((q) => ({
          id: q.id,
          number: q.number,
          text: q.text,
          options: q.options,
          correctAnswerId: "",
        }))}
      />
    )
  } catch {
    notFound()
  }
}
