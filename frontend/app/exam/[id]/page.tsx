import { api } from "@/lib/api"
import { StudentWelcomePageClient } from "./page-client"
import { notFound } from "next/navigation"

interface ExamPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function ExamWelcomePage({ params, searchParams }: ExamPageProps) {
  const [{ id }, { token }] = await Promise.all([params, searchParams])
  const lookupToken = token || id
  try {
    const exam = await api.public.exam(lookupToken)
    return <StudentWelcomePageClient exam={exam} />
  } catch {
    notFound()
  }
}
