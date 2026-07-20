import { api } from "@/lib/api"
import { StudentWelcomePageClient } from "./page-client"
import { notFound } from "next/navigation"

function getMockExam(id: string, token?: string) {
  return {
    id,
    token: token || id,
    title: "Sample Exam (Dev Mode)",
    description: "This is a sample exam for development and testing purposes.",
    instructions: "Read each question carefully and select the best answer.",
    course: "Sample Course",
    course_code: "SMP101",
    subject: "physics",
    class_group: "sss1",
    term: "second-term",
    status: "scheduled",
    duration_minutes: 60,
    total_marks: 10,
    passing_marks: 5,
    passing_percentage: 50,
    show_result: true,
    allow_review: true,
    shuffle_questions: false,
    shuffle_answers: false,
    question_count: 3,
    questions: [],
  }
}

interface ExamPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function ExamWelcomePage({ params, searchParams }: ExamPageProps) {
  const [{ id }, { token }] = await Promise.all([params, searchParams])
  const lookupToken = token || id
  try {
    const exam = await api.public.exam(lookupToken)
    return <StudentWelcomePageClient exam={{ ...exam, token: lookupToken }} />
  } catch {
    const mock = getMockExam(id, token)
    return <StudentWelcomePageClient exam={mock} />
  }
}
