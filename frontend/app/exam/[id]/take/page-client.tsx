"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { QuestionView } from "@/components/exam-take/question-view"
import { ExamSidebar } from "@/components/exam-take/exam-sidebar"
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Clock,
  BarChart3,
} from "lucide-react"

interface TakeExam {
  id: string
  title: string
  duration: number
  totalMarks: number
  questionCount: number
}

interface TakeQuestion {
  id: string
  number: number
  text: string
  options: { id: string; label: string; text: string }[]
  correctAnswerId: string
}

interface ExamTakeClientProps {
  exam: TakeExam
  questions: TakeQuestion[]
}

const STORAGE_KEY_PREFIX = "exam-take-"

export function ExamTakeClient({ exam, questions }: ExamTakeClientProps) {
  const router = useRouter()
  const storageKey = `${STORAGE_KEY_PREFIX}${exam.id}`

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60)
  const [showSidebar, setShowSidebar] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Restore state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.submitted) {
          router.replace(`/exam/${exam.id}/results`)
          return
        }
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.flagged) setFlagged(new Set(parsed.flagged))
        if (parsed.currentIndex != null) setCurrentIndex(parsed.currentIndex)
        if (parsed.timeLeft != null) setTimeLeft(parsed.timeLeft)
      }
    } catch {}
  }, [storageKey, exam.id, router])

  // Autosave
  useEffect(() => {
    const data = { answers, flagged: [...flagged], currentIndex, timeLeft }
    localStorage.setItem(storageKey, JSON.stringify(data))
  }, [answers, flagged, currentIndex, timeLeft, storageKey])

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) { handleTimeout(); return }
    const interval = setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => clearInterval(interval)
  }, [timeLeft])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (timeLeft <= 0) return
      const key = e.key

      if (["1", "2", "3", "4"].includes(key)) {
        const q = questions[currentIndex]
        if (q) {
          const opt = q.options[parseInt(key) - 1]
          if (opt) setAnswer(q.id, opt.id)
        }
      }

      if (key === "Enter" || key === "ArrowRight") {
        e.preventDefault()
        goNext()
      }

      if (key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
      }

      if (key.toLowerCase() === "f") {
        e.preventDefault()
        toggleFlag(questions[currentIndex]?.id)
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [currentIndex, questions, answers])

  useEffect(() => {
    mainRef.current?.focus()
  }, [currentIndex])

  function setAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
  }

  function toggleFlag(questionId: string) {
    setFlagged((prev) => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  function goNext() {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1)
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1)
    }
  }

  function goTo(index: number) {
    setCurrentIndex(index)
    setShowSidebar(false)
  }

  function saveState() {
    localStorage.setItem(storageKey, JSON.stringify({ answers, flagged: [...flagged], submitted: false }))
  }

  function handleTimeout() {
    saveState()
    router.push(`/exam/${exam.id}/review`)
  }

  function goToReview() {
    saveState()
    router.push(`/exam/${exam.id}/review`)
  }

  const question = questions[currentIndex]
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeLow = timeLeft < 300

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      {/* Sidebar */}
      <ExamSidebar
        questions={questions}
        answers={answers}
        flagged={flagged}
        currentIndex={currentIndex}
        timeLeft={timeLeft}
        onGoTo={goTo}
        onSubmit={goToReview}
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
      />

      {/* Main Content */}
      <div
        ref={mainRef}
        tabIndex={-1}
        className="flex flex-1 flex-col min-w-0 outline-none"
      >
        {/* Top Bar */}
        <header className="flex h-16 shrink-0 items-center gap-3 border-b border-border-primary bg-white px-4 md:px-6">
          <button
            type="button"
            onClick={() => setShowSidebar(true)}
            className="flex size-9 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary md:hidden"
            aria-label="Open question navigator"
          >
            <BarChart3 size={20} />
          </button>

          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="truncate text-sm font-semibold text-content-primary">{exam.title}</span>
          </div>

          {/* Timer */}
          <div className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm font-medium transition-colors",
            timeLow
              ? "border-danger/30 bg-danger-light text-danger animate-pulse"
              : "border-border-primary bg-surface-secondary text-content-primary",
          )}>
            <Clock size={16} className={cn(timeLow && "animate-pulse")} />
            <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
          </div>

          {/* Progress chips - desktop */}
          <div className="hidden md:flex items-center gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => goTo(i)}
                className={cn(
                  "size-7 rounded-lg text-[11px] font-medium transition-all",
                  i === currentIndex && "ring-2 ring-primary ring-offset-2",
                  answers[q.id] && i !== currentIndex && "bg-primary/20 text-primary",
                  !answers[q.id] && i !== currentIndex && "bg-surface-secondary text-content-muted",
                  flagged.has(q.id) && "ring-2 ring-warning/50",
                )}
                aria-label={`Go to question ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </header>

        {/* Question Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-2xl">
            {/* Progress info */}
            <div className="mb-6 flex items-center justify-between text-sm">
              <span className="text-content-muted">
                Question {currentIndex + 1} of {questions.length}
              </span>
              <button
                type="button"
                onClick={() => toggleFlag(question?.id)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  flagged.has(question?.id)
                    ? "bg-warning/10 text-warning"
                    : "text-content-muted hover:bg-surface-secondary hover:text-content-primary",
                )}
              >
                <Flag size={14} className={flagged.has(question?.id) ? "fill-warning" : ""} />
                {flagged.has(question?.id) ? "Flagged" : "Flag for review"}
              </button>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 h-1.5 w-full rounded-full bg-surface-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question */}
            {question && (
              <QuestionView
                key={question.id}
                question={question}
                selectedAnswer={answers[question.id] ?? null}
                onSelect={(optionId) => setAnswer(question.id, optionId)}
              />
            )}

            {/* Navigation */}
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={goPrev}
                disabled={currentIndex === 0}
                leftIcon={<ChevronLeft size={18} />}
              >
                Previous
              </Button>

              {currentIndex < questions.length - 1 ? (
                <Button onClick={goNext} rightIcon={<ChevronRight size={18} />}>
                  Next
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={goToReview}
                  leftIcon={<Flag size={18} />}
                >
                  Review All Answers
                </Button>
              )}
            </div>

            {/* Keyboard shortcuts hint */}
            <div className="mt-6 text-center">
              <p className="text-[11px] text-content-muted">
                Keyboard: <kbd className="mx-0.5 rounded-md border border-border-primary px-1.5 py-0.5 text-[10px] bg-surface-secondary">1-4</kbd> Select answer
                &nbsp;<kbd className="mx-0.5 rounded-md border border-border-primary px-1.5 py-0.5 text-[10px] bg-surface-secondary">←</kbd><kbd className="mx-0.5 rounded-md border border-border-primary px-1.5 py-0.5 text-[10px] bg-surface-secondary">→</kbd> Navigate
                &nbsp;<kbd className="mx-0.5 rounded-md border border-border-primary px-1.5 py-0.5 text-[10px] bg-surface-secondary">F</kbd> Flag
                &nbsp;<kbd className="mx-0.5 rounded-md border border-border-primary px-1.5 py-0.5 text-[10px] bg-surface-secondary">Enter</kbd> Next
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
