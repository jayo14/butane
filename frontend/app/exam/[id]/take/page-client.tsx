"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { ApiPublicQuestion } from "@/lib/api"

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

const OPTION_LABELS = ["A", "B", "C", "D"]

export function ExamTakeClient({ exam, questions }: ExamTakeClientProps) {
  const router = useRouter()
  const storageKey = `${STORAGE_KEY_PREFIX}${exam.id}`

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60)
  const mainRef = useRef<HTMLDivElement>(null)
  const answersRef = useRef(answers)
  const flaggedRef = useRef(flagged)
  const timeLeftRef = useRef(timeLeft)
  answersRef.current = answers
  flaggedRef.current = flagged
  timeLeftRef.current = timeLeft

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
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (timeLeftRef.current <= 0) {
      handleTimeoutRef.current()
      return
    }
    timerInterval.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          if (timerInterval.current) clearInterval(timerInterval.current)
          handleTimeoutRef.current()
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current)
    }
  }, [])

  const handleTimeoutRef = useRef<() => void>(() => {})
  const saveState = useCallback(() => {
    localStorage.setItem(
      storageKey,
      JSON.stringify({ answers: answersRef.current, flagged: [...flaggedRef.current], submitted: false }),
    )
  }, [storageKey])

  const goToReview = useCallback(() => {
    saveState()
    router.push(`/exam/${exam.id}/review`)
  }, [saveState, router, exam.id])

  handleTimeoutRef.current = goToReview

  // Keyboard shortcuts
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (timeLeftRef.current <= 0) return
      const key = e.key

      if (["1", "2", "3", "4"].includes(key)) {
        const q = questions[currentIndex]
        if (q) {
          const opt = q.options[parseInt(key) - 1]
          if (opt) {
            setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))
          }
        }
      }

      if (key === "Enter" || key === "ArrowRight") {
        e.preventDefault()
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((i) => i + 1)
        }
      }

      if (key === "ArrowLeft") {
        e.preventDefault()
        if (currentIndex > 0) {
          setCurrentIndex((i) => i - 1)
        }
      }

      if (key.toLowerCase() === "f") {
        e.preventDefault()
        const qId = questions[currentIndex]?.id
        if (qId) {
          setFlagged((prev) => {
            const next = new Set(prev)
            if (next.has(qId)) next.delete(qId)
            else next.add(qId)
            return next
          })
        }
      }
    }

    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [currentIndex, questions])

  useEffect(() => {
    mainRef.current?.focus()
  }, [currentIndex])

  const question = questions[currentIndex]
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const answeredCount = questions.filter((q) => answers[q.id]).length
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  return (
    <main className="flex-grow flex overflow-hidden h-screen" style={{ backgroundColor: "#eff3ff" }}>
      {/* Left Panel: Question Area (70%) */}
      <section className="w-full lg:w-[70%] h-full p-4 md:p-10 overflow-y-auto">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question Card */}
          <div className="bg-white rounded-xl p-6 md:p-10 shadow-sm border" style={{ borderColor: "#bbcabf" }}>
            {/* Question header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-widest mb-2 block"
                  style={{ color: "#006c49" }}
                >
                  Question {String(currentIndex + 1).padStart(2, "0")} of {questions.length}
                </span>
                <h2
                  className="text-xl md:text-[32px] font-bold leading-tight tracking-[-0.01em]"
                  style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                >
                  {question?.text}
                </h2>
              </div>
            </div>

            {/* Image placeholder */}
            <div
              className="w-full h-48 md:h-80 rounded-xl mb-6 overflow-hidden"
              style={{ backgroundColor: "#e6eeff", border: "1px solid #bbcabf" }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-sm" style={{ color: "#6c7a71" }}>Image display area</span>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question?.options.map((option, i) => {
                const isSelected = answers[question.id] === option.id
                return (
                  <label
                    key={option.id}
                    className="block cursor-pointer"
                  >
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      checked={isSelected}
                      onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: option.id }))}
                      className="hidden peer"
                    />
                    <div
                      className={`p-4 md:p-5 rounded-lg border flex items-center gap-4 transition-all ${
                        isSelected
                          ? "border-[#006c49] bg-[#006c49]/5"
                          : "border-[#bbcabf] bg-white hover:bg-[#eff3ff]"
                      }`}
                    >
                      <div
                        className={`flex size-8 md:size-10 items-center justify-center rounded-full text-sm font-bold transition-all ${
                          isSelected
                            ? "bg-[#006c49] text-white"
                            : "border-2 text-[#3c4a42]"
                        }`}
                        style={isSelected ? {} : { borderColor: "#bbcabf" }}
                      >
                        {OPTION_LABELS[i]}
                      </div>
                      <span
                        className="flex-1 text-base md:text-lg"
                        style={{ color: "#121c2a", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                      >
                        {option.text}
                      </span>
                      <span
                        className={`shrink-0 transition-opacity ${
                          isSelected ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        <span
                          className="material-symbols-outlined text-[#006c49]"
                          style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                        >
                          check_circle
                        </span>
                      </span>
                    </div>
                  </label>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="mt-8 md:mt-12 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (currentIndex > 0) setCurrentIndex((i) => i - 1)
                }}
                disabled={currentIndex === 0}
                className="px-6 md:px-8 py-3 rounded-lg text-sm font-semibold tracking-[0.02em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  color: "#006c49",
                  border: "1px solid #006c49",
                  backgroundColor: "transparent",
                }}
              >
                Previous
              </button>

              {currentIndex < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  className="px-8 md:px-10 py-3 rounded-lg text-sm font-semibold tracking-[0.02em] transition-all hover:brightness-105 flex items-center gap-2"
                  style={{
                    backgroundColor: "#006c49",
                    color: "#ffffff",
                  }}
                >
                  Next Question
                  <span
                    className="material-symbols-outlined text-sm"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
                  >
                    arrow_forward
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={goToReview}
                  className="px-8 md:px-10 py-3 rounded-lg text-sm font-semibold tracking-[0.02em] transition-all hover:brightness-105"
                  style={{
                    backgroundColor: "#006c49",
                    color: "#ffffff",
                  }}
                >
                  Review All Answers
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div
              className="flex justify-between items-center text-xs font-bold uppercase tracking-wider"
              style={{ color: "#3c4a42" }}
            >
              <span>Progress: {progressPct}%</span>
              <span>Question {currentIndex + 1} of {questions.length}</span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: "#dee9fd" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${progressPct}%`,
                  backgroundColor: "#10b981",
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Right Panel: Question Grid (30%) */}
      <aside
        className="hidden lg:flex lg:w-[30%] h-full flex-col border-l shadow-lg"
        style={{ backgroundColor: "#ffffff", borderColor: "#bbcabf" }}
      >
        <div className="flex flex-col w-full h-full p-6 md:p-8">
          {/* Timer */}
          <div className="mb-8 text-center">
            <div
              className="inline-flex flex-col items-center justify-center w-32 h-32 md:w-36 md:h-36 rounded-full border-4 mb-4"
              style={{
                borderColor: timeLeft < 300 ? "rgba(186,26,26,0.2)" : "rgba(0,108,73,0.2)",
                backgroundColor: "#f9f9ff",
              }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-widest mb-1"
                style={{ color: timeLeft < 300 ? "#ba1a1a" : "#006c49" }}
              >
                {timeLeft < 300 ? "Urgent" : "Remaining"}
              </span>
              <span
                className="text-xl md:text-2xl font-bold"
                style={{
                  color: timeLeft < 300 ? "#ba1a1a" : "#121c2a",
                  fontFamily: "'Source Serif 4', serif",
                }}
              >
                {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
              </span>
            </div>
            <h3
              className="text-lg font-semibold"
              style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}
            >
              Question Overview
            </h3>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 gap-2 md:gap-3 mb-8">
            {questions.map((q, i) => {
              const isAnswered = !!answers[q.id]
              const isFlagged = flagged.has(q.id)
              const isCurrent = i === currentIndex
              let bgColor = "#dee9fd"
              let textColor = "#3c4a42"
              let ring = ""

              if (isAnswered && isCurrent) {
                bgColor = "#006c49"
                textColor = "#ffffff"
                ring = "ring-4 ring-[#006c49]/10"
              } else if (isAnswered) {
                bgColor = "#006c49"
                textColor = "#ffffff"
              } else if (isCurrent) {
                bgColor = "#10b981"
                textColor = "#00422b"
                ring = "ring-4 ring-[#10b981]/10 border-2 border-[#006c49]"
              } else if (isFlagged) {
                bgColor = "#ffdad6"
                textColor = "#93000a"
              }

              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`aspect-square rounded-lg flex items-center justify-center text-sm font-bold shadow-sm transition-all hover:brightness-95 relative ${ring}`}
                  style={{ backgroundColor: bgColor, color: textColor }}
                  aria-label={`Go to question ${i + 1}${isAnswered ? " (answered)" : ""}${isFlagged ? " (flagged)" : ""}`}
                >
                  {i + 1}
                  {isFlagged && (
                    <span
                      className="absolute top-0.5 right-0.5 w-1.5 h-1.5 md:w-2 md:h-2 rounded-full"
                      style={{ backgroundColor: "#ba1a1a" }}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div
            className="space-y-3 p-4 md:p-5 rounded-xl border"
            style={{ backgroundColor: "#eff3ff", borderColor: "#bbcabf" }}
          >
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#006c49" }} />
              <span className="text-xs font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
                Answered
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: "#dee9fd" }} />
              <span className="text-xs font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
                Unanswered
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded relative" style={{ backgroundColor: "#ffdad6" }}>
                <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ba1a1a" }} />
              </div>
              <span className="text-xs font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
                Flagged
              </span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={goToReview}
            className="mt-auto w-full py-4 rounded-lg text-sm font-bold tracking-[0.02em] transition-all hover:brightness-105 shadow-md"
            style={{ backgroundColor: "#006c49", color: "#ffffff" }}
          >
            Submit Assessment
          </button>

          {/* Keyboard shortcut hint */}
          <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>
            <kbd className="mx-0.5 rounded border px-1 py-0.5" style={{ borderColor: "#bbcabf" }}>1-4</kbd> Select
            <kbd className="mx-0.5 rounded border px-1 py-0.5" style={{ borderColor: "#bbcabf" }}>←→</kbd> Navigate
            <kbd className="mx-0.5 rounded border px-1 py-0.5" style={{ borderColor: "#bbcabf" }}>F</kbd> Flag
            <kbd className="mx-0.5 rounded border px-1 py-0.5" style={{ borderColor: "#bbcabf" }}>Enter</kbd> Next
          </p>
        </div>
      </aside>

      {/* Mobile sidebar toggle */}
      <div className="lg:hidden fixed bottom-6 right-6 z-20">
        <button
          type="button"
          onClick={() => {
            const aside = document.querySelector("aside")
            if (aside) aside.classList.toggle("hidden")
          }}
          className="flex size-14 items-center justify-center rounded-full shadow-lg"
          style={{ backgroundColor: "#006c49", color: "#ffffff" }}
          aria-label="Toggle question navigator"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
          >
            grid_view
          </span>
        </button>
      </div>
    </main>
  )
}
