import { getStudentById } from "@/data/mock/student-results"
import { StudentProfileClient } from "./page-client"
import { notFound } from "next/navigation"

interface ProfilePageProps {
  params: Promise<{ id: string }>
}

export default async function StudentProfilePage({ params }: ProfilePageProps) {
  const { id } = await params
  const student = getStudentById(id)
  if (!student) notFound()

  return <StudentProfileClient student={student} />
}
