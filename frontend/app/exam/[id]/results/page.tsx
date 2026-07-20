import { api } from "@/lib/api"
import { ExamResultsClient } from "./page-client"
import { notFound } from "next/navigation"

interface ResultsPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamResultsPage({ params }: ResultsPageProps) {
  const { id } = await params
  try {
    const exam = await api.public.exam(id)
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
