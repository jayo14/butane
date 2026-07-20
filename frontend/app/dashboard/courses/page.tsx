import { api } from "@/lib/api"
import { CoursesPageClient } from "./page-client"

export default async function CoursesPage() {
  try {
    const examsRes = await api.exams.list()
    const exams = examsRes?.results || []

    const courseMap = new Map<string, { code: string; name: string; students: number }>()
    for (const e of exams) {
      const key = e.course_code || e.course
      if (!courseMap.has(key)) {
        courseMap.set(key, {
          code: e.course_code,
          name: e.course,
          students: 0,
        })
      }
    }

    const courses = Array.from(courseMap.entries()).map(([code, info], i) => ({
      id: `CRS-${String(i + 1).padStart(3, "0")}`,
      code: info.code,
      name: info.name,
      description: "",
      teacher: "",
      credits: 0,
      students: info.students,
      status: "active" as const,
      schedule: "",
    }))

    return <CoursesPageClient courses={courses} />
  } catch {
    const { mockCourses } = await import("@/data/mock/courses")
    return <CoursesPageClient courses={mockCourses} />
  }
}
