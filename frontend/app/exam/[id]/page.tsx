import { mockExams } from "@/data/mock/exams"
import { StudentWelcomePageClient } from "./page-client"
import { notFound } from "next/navigation"

interface ExamPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamWelcomePage({ params }: ExamPageProps) {
  const { id } = await params
  const exam = mockExams.find((e) => e.id === id)
  if (!exam) notFound()
  return <StudentWelcomePageClient exam={exam} />
}
