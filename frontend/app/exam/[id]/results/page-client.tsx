"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trophy,
  MessageSquareText,
  Download,
  BarChart3,
  Sparkles,
} from "lucide-react"

interface ResultsExam {
  id: string
  title: string
  duration: number
  totalMarks: number
  questionCount: number
}

interface ResultsQuestion {
  id: string
  number: number
  text: string
  options: { id: string; label: string; text: string }[]
  correctAnswerId: string
}

interface ExamResultsClientProps {
  exam: ResultsExam
  questions: ResultsQuestion[]
}

const STORAGE_KEY_PREFIX = "exam-take-"

function getPerformanceMessage(score: number): { title: string; message: string; icon: typeof Trophy } {
  if (score >= 90) return { title: "Outstanding!", message: "Exceptional performance. You have mastered this subject.", icon: Sparkles }
  if (score >= 75) return { title: "Great Job!", message: "Strong understanding demonstrated. Keep up the excellent work.", icon: Trophy }
  if (score >= 50) return { title: "Well Done!", message: "You passed. Review the areas you missed to improve further.", icon: Trophy }
  if (score >= 30) return { title: "Keep Trying", message: "You're making progress. Focus on the topics you found challenging.", icon: Trophy }
  return { title: "Needs Improvement", message: "Don't give up. Review the material and try again.", icon: Trophy }
}

function AnimatedScoreCircle({ score, size = 160 }: { score: number; size?: number }) {
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const center = size / 2
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setProgress(score), 300)
    return () => clearTimeout(timer)
  }, [score])

  const color =
    score >= 75 ? "stroke-success" :
    score >= 50 ? "stroke-warning" :
    "stroke-danger"

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-surface-secondary"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={cn("transition-all duration-[1500ms] ease-out", color)}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (progress / 100) * circumference}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold text-content-primary transition-all duration-1000">
          {Math.round(progress)}%
        </span>
        <span className="text-xs text-content-muted">Score</span>
      </div>
    </div>
  )
}

export function ExamResultsClient({ exam, questions }: ExamResultsClientProps) {
  const router = useRouter()
  const storageKey = `${STORAGE_KEY_PREFIX}${exam.id}`

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [revealed, setRevealed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.answers) setAnswers(parsed.answers)
      }
    } catch {}
    setLoaded(true)
  }, [storageKey])

  useEffect(() => {
    if (!loaded) return
    const timer = setTimeout(() => setRevealed(true), 1800)
    return () => clearTimeout(timer)
  }, [loaded])

  const totalPossible = questions.length
  const correct = questions.filter((q) => answers[q.id] === q.correctAnswerId).length
  const incorrect = questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctAnswerId).length
  const skipped = questions.filter((q) => !answers[q.id]).length
  const score = totalPossible > 0 ? Math.round((correct / totalPossible) * 100) : 0
  const performance = getPerformanceMessage(score)
  const passed = score >= 50
  const PerformanceIcon = performance.icon

  // Loading state
  if (!revealed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-secondary p-4">
        <div className="text-center">
          <AnimatedScoreCircle score={score} />
          <div className="mt-8 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <div className="size-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "0ms" }} />
              <div className="size-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "150ms" }} />
              <div className="size-2.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-sm text-content-muted">Calculating your results...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="mx-auto max-w-2xl px-4 py-8 md:py-16">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Score Card */}
          <div className="rounded-2xl border border-border-primary bg-white p-8 text-center shadow-card md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
            <div className="mb-6 flex justify-center">
              <div className={cn(
                "flex size-16 items-center justify-center rounded-2xl",
                passed ? "bg-success-light" : "bg-danger-light",
              )}>
                <PerformanceIcon
                  size={32}
                  className={passed ? "text-success" : "text-danger"}
                />
              </div>
            </div>

            <h1 className="text-2xl font-bold text-content-primary">{performance.title}</h1>
            <p className="mt-1 text-content-secondary">{exam.title}</p>
            <p className="mt-1 text-sm text-content-muted">{performance.message}</p>

            <div className="mt-8 flex justify-center">
              <AnimatedScoreCircle score={score} size={180} />
            </div>

            {/* Breakdown */}
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="rounded-xl bg-success-light/50 p-3">
                <CheckCircle2 size={20} className="mx-auto text-success" />
                <p className="mt-1 text-lg font-bold text-content-primary">{correct}</p>
                <p className="text-xs text-content-muted">Correct</p>
              </div>
              <div className="rounded-xl bg-danger-light/50 p-3">
                <XCircle size={20} className="mx-auto text-danger" />
                <p className="mt-1 text-lg font-bold text-content-primary">{incorrect}</p>
                <p className="text-xs text-content-muted">Incorrect</p>
              </div>
              <div className="rounded-xl bg-surface-secondary p-3">
                <HelpCircle size={20} className="mx-auto text-content-muted" />
                <p className="mt-1 text-lg font-bold text-content-primary">{skipped}</p>
                <p className="text-xs text-content-muted">Skipped</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-surface-secondary p-4">
              <div className="text-center">
                <p className="text-xs text-content-muted">Duration</p>
                <p className="mt-0.5 text-sm font-medium text-content-primary">{exam.duration} minutes</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-content-muted">Total Marks</p>
                <p className="mt-0.5 text-sm font-medium text-content-primary">{exam.totalMarks}</p>
              </div>
            </div>
          </div>

          {/* Teacher Message Placeholder */}
          <div className="mt-6 rounded-2xl border border-border-primary bg-white p-6 shadow-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info-light text-info">
                <MessageSquareText size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-content-primary">Teacher&apos;s Feedback</h3>
                <p className="mt-1 text-sm leading-relaxed text-content-muted">
                  Your teacher&apos;s personalized feedback will appear here once reviewed. Check back after
                  your teacher has marked your exam.
                </p>
                <div className="mt-3 flex items-center gap-2 text-xs text-content-muted">
                  <BarChart3 size={14} />
                  <span>Feedback typically available within 48 hours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Download Placeholder */}
          <div className="mt-6 rounded-2xl border border-border-primary bg-white p-6 shadow-card animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
            <div className="flex items-start gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-content-muted">
                <Download size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-content-primary">Download Result</h3>
                <p className="mt-1 text-sm leading-relaxed text-content-muted">
                  Download a PDF copy of your result slip for your records.
                </p>
                <button
                  type="button"
                  disabled
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-border-primary bg-surface-secondary px-4 py-2 text-xs font-medium text-content-muted transition-colors hover:bg-surface-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  Download PDF
                  <span className="rounded-md bg-content-muted/10 px-1.5 py-0.5 text-[10px]">Coming soon</span>
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="primary"
              className="flex-1"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push(`/exam/${exam.id}/review`)}
            >
              Review Answers
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
