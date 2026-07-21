import type { Metadata } from "next"
import { ExamTakeClient } from "./page-client"

interface TakePageProps {
  searchParams: Promise<{ name?: string }>
}

export async function generateMetadata({ searchParams }: TakePageProps): Promise<Metadata> {
  const { name } = await searchParams
  return {
    title: name ? `${name} — Dee Soar CBT` : "Exam — Dee Soar CBT",
    robots: { index: false },
  }
}

export default function ExamTakePage() {
  return <ExamTakeClient />
}
