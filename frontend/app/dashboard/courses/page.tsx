import { mockCourses } from "@/data/mock/courses"
import { CoursesPageClient } from "./page-client"

export default function CoursesPage() {
  return <CoursesPageClient courses={mockCourses} />
}
