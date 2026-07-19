import { mockExams } from "@/data/mock/exams"
import { mockQuestions } from "@/data/mock/exam-questions"
import { ExamReviewClient } from "./page-client"
import { notFound } from "next/navigation"

interface ReviewPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamReviewPage({ params }: ReviewPageProps) {
  const { id } = await params
  const exam = mockExams.find((e) => e.id === id)
  if (!exam) notFound()

  return (
    <ExamReviewClient
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
