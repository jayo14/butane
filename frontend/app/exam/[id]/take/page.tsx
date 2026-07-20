import { api } from "@/lib/api"
import { ExamTakeClient } from "./page-client"
import { notFound } from "next/navigation"

interface TakePageProps {
  params: Promise<{ id: string }>
}

export default async function ExamTakePage({ params }: TakePageProps) {
  const { id } = await params
  try {
    const exam = await api.public.exam(id)
    return (
      <ExamTakeClient
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
