import { mockExams } from "@/data/mock/exams"
import { mockQuestions } from "@/data/mock/exam-questions"
import { ExamResultsClient } from "./page-client"
import { notFound } from "next/navigation"

interface ResultsPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamResultsPage({ params }: ResultsPageProps) {
  const { id } = await params
  const exam = mockExams.find((e) => e.id === id)
  if (!exam) notFound()

  return (
    <ExamResultsClient
      exam={{
        id: exam.id,
        title: exam.title,
        duration: exam.duration,
        totalMarks: exam.totalMarks,
        questionCount: mockQuestions.length,
      }}
      questions={mockQuestions}
    />
  )
}
