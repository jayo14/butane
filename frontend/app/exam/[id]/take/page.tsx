import { api } from "@/lib/api"
import { ExamTakeClient } from "./page-client"
import { notFound } from "next/navigation"

interface TakePageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ token?: string; name?: string }>
}

function getMockExam(id: string) {
  return {
    id,
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
    questions: [
      {
        id: "mock-q-1",
        number: 1,
        text: "Which of the following substances is responsible for hardness in water?",
        type: "single_choice",
        marks: 2,
        options: [
          { id: "mock-opt-a", label: "A", text: "Sodium chloride" },
          { id: "mock-opt-b", label: "B", text: "Calcium hydrogen trioxocarbonate(IV)" },
          { id: "mock-opt-c", label: "C", text: "Potassium nitrate" },
          { id: "mock-opt-d", label: "D", text: "Ammonium sulphate" },
        ],
      },
      {
        id: "mock-q-2",
        number: 2,
        text: "What is the chemical symbol for gold?",
        type: "single_choice",
        marks: 2,
        options: [
          { id: "mock-opt-e", label: "A", text: "Go" },
          { id: "mock-opt-f", label: "B", text: "Gd" },
          { id: "mock-opt-g", label: "C", text: "Au" },
          { id: "mock-opt-h", label: "D", text: "Ag" },
        ],
      },
      {
        id: "mock-q-3",
        number: 3,
        text: "The process by which plants make their own food is called:",
        type: "single_choice",
        marks: 2,
        options: [
          { id: "mock-opt-i", label: "A", text: "Respiration" },
          { id: "mock-opt-j", label: "B", text: "Photosynthesis" },
          { id: "mock-opt-k", label: "C", text: "Transpiration" },
          { id: "mock-opt-l", label: "D", text: "Digestion" },
        ],
      },
    ],
  }
}

export default async function ExamTakePage({ params, searchParams }: TakePageProps) {
  const [{ id }, { token, name }] = await Promise.all([params, searchParams])
  try {
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
      />
    )
  } catch {
    // Dev fallback — backend unavailable
    const mock = getMockExam(id)
    return (
      <ExamTakeClient
        exam={{
          id: mock.id,
          title: mock.title,
          duration: mock.duration_minutes,
          totalMarks: mock.total_marks,
          questionCount: mock.question_count,
          allowReview: mock.allow_review,
          showResult: mock.show_result,
        }}
        questions={mock.questions.map((q) => ({
          id: q.id,
          number: q.number,
          text: q.text,
          options: q.options,
          correctAnswerId: "",
        }))}
        studentName={name || ""}
      />
    )
  }
}
