import { api } from "@/lib/api"
import { ExamReviewClient } from "./page-client"
import { notFound } from "next/navigation"

interface ReviewPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; attemptId?: string; accessToken?: string }>
}

export default async function ExamReviewPage({ params, searchParams }: ReviewPageProps) {
  const [{ id }, { token, attemptId, accessToken }] = await Promise.all([params, searchParams])
  try {
    const exam = await api.public.exam(token || id)
    return (
      <ExamReviewClient
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
