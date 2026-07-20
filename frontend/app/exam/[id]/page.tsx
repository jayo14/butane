import { api } from "@/lib/api"
import { StudentWelcomePageClient } from "./page-client"
import { notFound } from "next/navigation"

interface ExamPageProps {
  params: Promise<{ id: string }>
}

export default async function ExamWelcomePage({ params }: ExamPageProps) {
  const { id } = await params
  try {
    const exam = await api.public.exam(id)
    return <StudentWelcomePageClient exam={exam} />
  } catch {
    notFound()
  }
}
