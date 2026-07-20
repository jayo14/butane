import { api } from "@/lib/api"
import { notFound } from "next/navigation"
import { CreateExamWizard } from "@/components/exams/create-exam-wizard"

interface EditExamPageProps {
  params: Promise<{ id: string }>
}

export default async function EditExamPage({ params }: EditExamPageProps) {
  const { id } = await params
  try {
    const exam = await api.exams.get(id)
    return <CreateExamWizard initialExam={exam} />
  } catch {
    notFound()
  }
}
