import { api } from "@/lib/api"
import { ExamTakeClient } from "./page-client"
import { notFound } from "next/navigation"

interface TakePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; name?: string; attemptId?: string; accessToken?: string }>
}

export default async function ExamTakePage({ params, searchParams }: TakePageProps) {
  const [{ id }, { token, name, attemptId, accessToken }] = await Promise.all([params, searchParams])
  const exam = await api.public.exam(token || id)
  return (
    <ExamTakeClient
      exam={{
        id: exam.id,
        title: exam.title,
        duration: exam.duration_minutes,
        totalMarks: exam.total_marks,
        questionCount: exam.question_count,
        allowReview: exam.allow_review,
        showResult: exam.show_result,
      }}
      questions={exam.questions.map((q) => ({
        id: q.id,
        number: q.number,
        text: q.text,
        options: q.options,
        correctAnswerId: "",
      }))}
      studentName={name || ""}
      attemptId={attemptId || ""}
      accessToken={accessToken || ""}
    />
  )
}
