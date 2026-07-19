"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  Circle,
  Flag,
  AlertTriangle,
  ChevronLeft,
  Send,
  Eye,
  HelpCircle,
  Clock,
} from "lucide-react"

interface ReviewExam {
  id: string
  title: string
  duration: number
  totalMarks: number
  questionCount: number
}

interface ReviewQuestion {
  id: string
  number: number
  text: string
  options: { id: string; label: string; text: string }[]
  correctAnswerId: string
}

interface ExamReviewClientProps {
  exam: ReviewExam
  questions: ReviewQuestion[]
}

const STORAGE_KEY_PREFIX = "exam-take-"

export function ExamReviewClient({ exam, questions }: ExamReviewClientProps) {
  const router = useRouter()
  const storageKey = `${STORAGE_KEY_PREFIX}${exam.id}`

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.flagged) setFlagged(new Set(parsed.flagged))
        if (parsed.isSubmitted) {
          router.replace(`/exam/${exam.id}/results`)
          return
        }
      }
    } catch {}
  }, [storageKey, exam.id, router])

  const answeredCount = questions.filter((q) => answers[q.id]).length
  const skippedCount = questions.length - answeredCount
  const flaggedCount = flagged.size

  function handleSubmit() {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        answers,
        flagged: [...flagged],
        submitted: true,
      }),
    )
    router.push(`/exam/${exam.id}/results`)
  }

  function navigateToQuestion(questionId: string) {
    router.push(`/exam/${exam.id}/take?focus=${questionId}`)
  }

  if (showConfirm) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
        <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200 rounded-2xl border border-border-primary bg-white p-6 shadow-modal">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-warning-light text-warning">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-lg font-semibold text-content-primary">Submit Your Answers?</h2>
            <p className="mt-2 text-sm text-content-secondary">
              You answered <strong className="text-content-primary">{answeredCount}</strong> of{" "}
              {questions.length} questions.
            </p>
            {skippedCount > 0 && (
              <p className="mt-1 text-sm text-warning">
                {skippedCount} question{skippedCount > 1 ? "s" : ""} skipped.{" "}
                {flaggedCount > 0 && `${flaggedCount} flagged.`}
              </p>
            )}
            <p className="mt-3 text-xs text-content-muted">This action cannot be undone.</p>
          </div>
          <div className="mt-6 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
              Keep Reviewing
            </Button>
            <Button variant="primary" className="flex-1" onClick={handleSubmit}>
              Submit Now
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border-primary bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-4 px-4">
          <button
            type="button"
            onClick={() => router.push(`/exam/${exam.id}/take`)}
            className="flex size-9 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
            aria-label="Back to exam"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-content-primary">Review Answers</h1>
            <p className="truncate text-xs text-content-muted">{exam.title}</p>
          </div>
          <div className="hidden items-center gap-2 text-xs text-content-muted sm:flex">
            <Clock size={14} />
            <span>{exam.duration} min</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 md:py-10">
        {/* Summary */}
        <div className="mb-8 rounded-2xl border border-border-primary bg-white p-5 shadow-card md:p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-3 gap-4 md:gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 size={18} className="text-success" />
                <span className="text-2xl font-bold text-content-primary">{answeredCount}</span>
              </div>
              <p className="mt-0.5 text-xs text-content-muted">Answered</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <HelpCircle size={18} className={skippedCount > 0 ? "text-warning" : "text-content-muted"} />
                <span className={cn("text-2xl font-bold", skippedCount > 0 ? "text-warning" : "text-content-muted")}>
                  {skippedCount}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-content-muted">Skipped</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <Flag size={18} className={flaggedCount > 0 ? "text-warning" : "text-content-muted"} />
                <span className={cn("text-2xl font-bold", flaggedCount > 0 ? "text-warning" : "text-content-muted")}>
                  {flaggedCount}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-content-muted">Flagged</p>
            </div>
          </div>

          <div className="mt-4 h-2 w-full rounded-full bg-surface-secondary overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all duration-700"
              style={{ width: `${questions.length > 0 ? (answeredCount / questions.length) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-xs text-content-muted">
            {Math.round((answeredCount / questions.length) * 100)}% complete
          </p>
        </div>

        {/* Question Grid */}
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id]
            const isFlagged = flagged.has(q.id)
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => navigateToQuestion(q.id)}
                className={cn(
                  "group relative rounded-xl border-2 p-4 text-left transition-all duration-200",
                  "hover:shadow-md hover:-translate-y-0.5",
                  "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                  isAnswered
                    ? "border-success/30 bg-success-light/10"
                    : "border-border-primary bg-white",
                  isFlagged && !isAnswered && "border-warning/30 bg-warning-light/10",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-lg text-xs font-bold",
                        isAnswered
                          ? "bg-success text-white"
                          : isFlagged
                            ? "bg-warning text-white"
                            : "bg-surface-secondary text-content-muted",
                      )}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs font-medium text-content-primary">
                      Question {i + 1}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {isAnswered && (
                      <span className="rounded-md bg-success-light px-1.5 py-0.5 text-[10px] font-medium text-success">
                        Answered
                      </span>
                    )}
                    {!isAnswered && (
                      <span className="rounded-md bg-surface-secondary px-1.5 py-0.5 text-[10px] font-medium text-content-muted">
                        Skipped
                      </span>
                    )}
                    {isFlagged && (
                      <Flag size={12} className="text-warning" fill="currentColor" />
                    )}
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-content-secondary">
                  {q.text}
                </p>
                <div className="mt-2 flex items-center gap-1 text-[11px] text-content-muted transition-colors group-hover:text-primary">
                  <Eye size={12} />
                  <span>View question</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Submit */}
        <div className="sticky bottom-4 rounded-2xl border border-border-primary bg-white p-4 shadow-card md:p-5">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm font-medium text-content-primary">
                {answeredCount === questions.length
                  ? "All questions answered"
                  : `${skippedCount} question${skippedCount > 1 ? "s" : ""} skipped`}
              </p>
              <p className="text-xs text-content-muted">
                {flaggedCount > 0 ? `${flaggedCount} flagged for review · ` : ""}
                Tap any question above to review your answer
              </p>
            </div>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setShowConfirm(true)}
              leftIcon={<Send size={18} />}
              className="w-full sm:w-auto"
            >
              Submit Exam
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
