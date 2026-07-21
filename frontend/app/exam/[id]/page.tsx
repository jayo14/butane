import { api, ApiError } from "@/lib/api"
import type { ApiPublicExam } from "@/lib/api"
import { StudentWelcomePageClient } from "./page-client"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

interface ExamPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params, searchParams }: ExamPageProps): Promise<Metadata> {
  const [{ id }, { token }] = await Promise.all([params, searchParams])
  const lookupToken = token || id
  try {
    const exam = await api.public.exam(lookupToken)
    return {
      title: `${exam.title} — Dee Soar CBT`,
      description: exam.description || `Computer-Based Test for ${exam.subject || exam.course || "General Studies"}`,
      openGraph: {
        title: `${exam.title} — Dee Soar CBT`,
        description: exam.description || `${(exam as any).class_group || ""} ${(exam as any).term || ""} ${exam.subject || exam.course || ""}`.trim() || "Computer-Based Test",
        siteName: "Dee Soar CBT",
        type: "website",
      },
    }
  } catch {
    return {
      title: "Dee Soar CBT",
      description: "Computer-Based Testing Management System",
    }
  }
}

export default async function ExamWelcomePage({ params, searchParams }: ExamPageProps) {
  const [{ id }, { token }] = await Promise.all([params, searchParams])
  const lookupToken = token || id
  let exam: ApiPublicExam
  try {
    exam = await api.public.exam(lookupToken)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound()
    }
    throw err
  }
  return <StudentWelcomePageClient exam={{ ...exam, token: lookupToken }} />
}
