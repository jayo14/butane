"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import type { ApiAttempt, ApiQuestion } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Container } from "@/components/layout/container"
import { ArrowLeft, CheckCircle2, XCircle, MinusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/utils"

interface AttemptReviewClientProps {
  examId: string
  attemptId: string
}

export function AttemptReviewClient({ examId, attemptId }: AttemptReviewClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [attempt, setAttempt] = useState<ApiAttempt | null>(null)
  const [questions, setQuestions] = useState<ApiQuestion[]>([])

  useEffect(() => {
    async function load() {
      try {
        const [attemptData, questionsData] = await Promise.all([
          api.attempts.get(attemptId) as Promise<ApiAttempt>,
          api.questions.list(examId),
        ])
        setAttempt(attemptData)
        const qList = Array.isArray(questionsData) ? questionsData : (questionsData as any)?.results ?? []
        setQuestions(qList)
      } catch {
        setError("Failed to load attempt details")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [examId, attemptId])

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="mx-auto mb-4 size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-content-muted">Loading attempt review...</p>
          </div>
        </div>
      </Container>
    )
  }

  if (error || !attempt) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-danger mb-2">{error || "Attempt not found"}</p>
            <Link href={`/dashboard/exams/${examId}`} className="text-sm text-primary hover:underline">
              Back to Exam
            </Link>
          </div>
        </div>
      </Container>
    )
  }

  const correctCount = attempt.answers?.filter((a) => a.is_correct).length ?? 0
  const incorrectCount = attempt.answers?.filter((a) => a.selected_choice && !a.is_correct).length ?? 0
  const unansweredCount = attempt.answers?.filter((a) => !a.selected_choice).length ?? 0
  const totalMarks = questions.reduce((sum, q) => sum + q.marks, 0)
  const earnedMarks = attempt.answers?.reduce((sum, a) => sum + a.awarded_marks, 0) ?? 0
  const pct = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0

  const questionMap = new Map(questions.map((q) => [q.id, q]))

  return (
    <Container>
      <div className="mb-6">
        <Link
          href={`/dashboard/exams/${examId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-content-muted transition-colors hover:text-content-primary"
        >
          <ArrowLeft size={16} />
          Back to Exam
        </Link>
        <div className="mt-2">
          <h1 className="text-2xl font-bold text-content-primary">
            {attempt.exam ? "Attempt Review" : "Attempt Review"}
          </h1>
          <p className="text-content-secondary mt-1">{attempt.student_name}</p>
        </div>
      </div>

      {/* Score Summary */}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card padding="md" className="text-center">
          <p className={cn("text-2xl font-bold", pct >= 60 ? "text-success" : "text-danger")}>
            {earnedMarks}/{totalMarks}
          </p>
          <p className="text-xs text-content-muted">Score</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-content-primary">{pct}%</p>
          <p className="text-xs text-content-muted">Percentage</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-success">{correctCount}</p>
          <p className="text-xs text-content-muted">Correct</p>
        </Card>
        <Card padding="md" className="text-center">
          <p className="text-2xl font-bold text-danger">{incorrectCount + unansweredCount}</p>
          <p className="text-xs text-content-muted">Incorrect</p>
        </Card>
      </div>

      {/* Questions Breakdown */}
      <div className="space-y-4">
        {attempt.answers?.map((answer, i) => {
          const q = questionMap.get(answer.question)
          if (!q) {
            return (
              <Card key={answer.id} padding="lg">
                <p className="text-sm text-content-muted">Question {i + 1}: (not found)</p>
              </Card>
            )
          }

          const correctChoice = q.choices.find((c) => c.is_correct)
          const studentChoice = q.choices.find((c) => c.id === answer.selected_choice)
          const isCorrect = answer.is_correct
          const isUnanswered = !answer.selected_choice

          let statusIcon = <CheckCircle2 size={20} className="text-success shrink-0" />
          let statusBg = "bg-success/10"
          let borderStyle = "border-success/20"
          if (isUnanswered) {
            statusIcon = <MinusCircle size={20} className="text-content-muted shrink-0" />
            statusBg = "bg-surface-secondary"
            borderStyle = "border-border-primary"
          } else if (!isCorrect) {
            statusIcon = <XCircle size={20} className="text-danger shrink-0" />
            statusBg = "bg-danger/10"
            borderStyle = "border-danger/20"
          }

          return (
            <Card key={answer.id} padding="lg" className={cn("border-l-4", borderStyle)}>
              <div className="flex items-start gap-4">
                <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-full", statusBg)}>
                  {statusIcon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-content-primary">
                      Question {i + 1}
                    </p>
                    <span className={cn("text-xs font-medium", isCorrect ? "text-success" : "text-content-muted")}>
                      {answer.awarded_marks}/{q.marks} marks
                    </span>
                  </div>
                  <p className="text-content-primary mb-3">{q.text}</p>
                  {q.image && (
                    <img
                      src={q.image}
                      alt="Question illustration"
                      className="max-h-48 w-auto rounded-lg border object-contain mb-3"
                    />
                  )}

                  <div className="space-y-1.5">
                    {q.choices.map((choice) => {
                      const isStudentAnswer = choice.id === answer.selected_choice
                      const isCorrectAnswer = choice.is_correct
                      let bg = ""
                      let indicator = null
                      if (isCorrectAnswer && isStudentAnswer) {
                        bg = "bg-success/10 border-success/30"
                        indicator = <span className="text-xs font-semibold text-success">Correct</span>
                      } else if (isCorrectAnswer) {
                        bg = "bg-success/5 border-success/20"
                        indicator = <span className="text-xs font-semibold text-success">Correct Answer</span>
                      } else if (isStudentAnswer && !isCorrectAnswer) {
                        bg = "bg-danger/10 border-danger/30"
                        indicator = <span className="text-xs font-semibold text-danger">Selected</span>
                      }
                      return (
                        <div
                          key={choice.id}
                          className={cn("flex items-center gap-2 rounded-lg border px-3 py-2 text-sm", bg, "border-transparent")}
                        >
                          <span className="font-semibold text-content-muted shrink-0">{choice.label}.</span>
                          <span className="text-content-primary">{choice.text}</span>
                          {indicator && <span className="ml-auto shrink-0">{indicator}</span>}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <div className="mt-8 flex justify-center gap-4 pb-8">
        <Link
          href={`/dashboard/exams/${examId}`}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          <ArrowLeft size={16} />
          Back to Exam
        </Link>
      </div>
    </Container>
  )
}
