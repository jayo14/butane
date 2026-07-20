"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

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

function AnimatedScoreCircle({ score }: { score: number }) {
  const [animDone, setAnimDone] = useState(false)
  const circumference = 100

  useEffect(() => {
    const t = setTimeout(() => setAnimDone(true), 100)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="relative w-56 h-56 flex items-center justify-center">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="stroke-surface-container-high"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeWidth="3"
        />
        <path
          className="stroke-primary"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeLinecap="round"
          strokeWidth="3"
          style={{
            strokeDasharray: `${animDone ? score : 0} ${circumference}`,
            transition: "stroke-dasharray 1.5s ease-out",
          }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span
          className="text-[48px] font-bold leading-[56px] tracking-[-0.02em]"
          style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
        >
          {animDone ? Math.round(score) : 0}%
        </span>
        <span
          className="text-[14px] font-semibold tracking-[0.02em] uppercase"
          style={{ color: "#3c4a42" }}
        >
          Final Score
        </span>
      </div>
    </div>
  )
}

export function ExamResultsClient({ exam, questions }: ExamResultsClientProps) {
  const router = useRouter()
  const storageKey = `${STORAGE_KEY_PREFIX}${exam.id}`

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [resultData, setResultData] = useState<{
    score: number
    total_marks: number
    percentage: number
    passed: boolean
    correct_count: number
    incorrect_count: number
    unanswered_count: number
  } | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.timeLeft != null) setTimeLeft(parsed.timeLeft)
      }
    } catch {}

    try {
      const resultSaved = localStorage.getItem(`exam-result-${exam.id}`)
      if (resultSaved) {
        const parsed = JSON.parse(resultSaved)
        setResultData(parsed)
      }
    } catch {}
  }, [storageKey, exam.id])

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 600)
    return () => clearTimeout(timer)
  }, [])

  const totalPossible = questions.length
  const correctCount = resultData?.correct_count ?? questions.filter((q) => answers[q.id] && answers[q.id] === q.correctAnswerId).length
  const incorrectCount = resultData?.incorrect_count ?? questions.filter((q) => answers[q.id] && answers[q.id] !== q.correctAnswerId).length
  const skippedCount = resultData?.unanswered_count ?? questions.filter((q) => !answers[q.id]).length
  const score = resultData?.percentage ?? (totalPossible > 0 ? Math.round((correctCount / totalPossible) * 100) : 0)

  const timeSpentSeconds = timeLeft != null ? exam.duration * 60 - timeLeft : null
  const timeSpentMinutes = timeSpentSeconds != null ? Math.floor(timeSpentSeconds / 60) : null
  const timeSpentSecs = timeSpentSeconds != null ? timeSpentSeconds % 60 : null

  const accuracyLabel =
    score >= 80 ? "High" : score >= 50 ? "Medium" : "Low"

  function handleQuestionClick(_questionId: string) {
    router.push(`/exam/${exam.id}/review`)
  }

  if (!revealed) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#f9f9ff" }}
      >
        <div className="text-center">
          <div className="relative w-56 h-56 flex items-center justify-center mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="stroke-[#d9e3f7]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
              />
              <path
                className="stroke-[#006c49]"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeLinecap="round"
                strokeWidth="3"
                style={{
                  strokeDasharray: "0 100",
                  strokeDashoffset: "0",
                }}
              />
            </svg>
            <div className="absolute flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{ backgroundColor: "#006c49", animationDelay: "0ms" }}
              />
              <div
                className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{ backgroundColor: "#006c49", animationDelay: "150ms" }}
              />
              <div
                className="w-2.5 h-2.5 rounded-full animate-bounce"
                style={{ backgroundColor: "#006c49", animationDelay: "300ms" }}
              />
            </div>
          </div>
          <p className="mt-8 text-sm" style={{ color: "#3c4a42" }}>
            Calculating your results...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-4 md:px-10 py-12 overflow-x-hidden"
      style={{ backgroundColor: "#f9f9ff", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <main className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 mb-12">
          <h1
            className="text-[48px] font-bold leading-[56px] tracking-[-0.02em]"
            style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}
          >
            Assessment Complete
          </h1>
          <p className="text-lg leading-7" style={{ color: "#3c4a42" }}>
            Great progress today. Here&apos;s your detailed performance breakdown.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
          {/* Left Panel: Donut */}
          <div
            className="md:col-span-5 p-8 rounded-[2.5rem] flex flex-col items-center justify-center space-y-6"
            style={{
              backgroundColor: "#ffffff",
              boxShadow: "0 12px 24px -8px rgba(0,0,0,0.06)",
            }}
          >
            <AnimatedScoreCircle score={score} />
            <div className="text-center px-4">
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[14px] font-semibold tracking-[0.02em]"
                style={{ backgroundColor: "#82f5c1", color: "#00714e" }}
              >
                <span
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                >
                  stars
                </span>
                {score >= 80
                  ? "Excellent Effort"
                  : score >= 50
                    ? "Good Attempt"
                    : "Keep Practicing"}
              </span>
            </div>
          </div>

          {/* Right Panel: Summary + Insights */}
          <div className="md:col-span-7 flex flex-col gap-6">
            {/* Summary Stats */}
            <div
              className="p-8 rounded-[2rem] flex-1 grid grid-cols-2 gap-6"
              style={{
                backgroundColor: "#ffffff",
                boxShadow: "0 12px 24px -8px rgba(0,0,0,0.06)",
              }}
            >
              <div className="space-y-1">
                <p
                  className="text-[14px] font-semibold tracking-[0.02em] uppercase"
                  style={{ color: "#3c4a42" }}
                >
                  Questions Correct
                </p>
                <p
                  className="text-[32px] font-bold leading-[40px] tracking-[-0.01em]"
                  style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                >
                  {correctCount} <span className="text-lg font-normal" style={{ color: "#3c4a42" }}>/ {totalPossible}</span>
                </p>
              </div>
              <div className="space-y-1">
                <p
                  className="text-[14px] font-semibold tracking-[0.02em] uppercase"
                  style={{ color: "#3c4a42" }}
                >
                  Time Spent
                </p>
                <p
                  className="text-[32px] font-bold leading-[40px] tracking-[-0.01em]"
                  style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                >
                  {timeSpentMinutes != null
                    ? `${String(timeSpentMinutes).padStart(2, "0")}:${String(timeSpentSecs).padStart(2, "0")}`
                    : "--:--"}{" "}
                  <span className="text-lg font-normal" style={{ color: "#3c4a42" }}>min</span>
                </p>
              </div>
              <div className="space-y-1">
                <p
                  className="text-[14px] font-semibold tracking-[0.02em] uppercase"
                  style={{ color: "#3c4a42" }}
                >
                  Accuracy Rate
                </p>
                <p
                  className="text-[32px] font-bold leading-[40px] tracking-[-0.01em]"
                  style={{ color: score >= 50 ? "#006c4a" : "#ba1a1a", fontFamily: "'Source Serif 4', serif" }}
                >
                  {accuracyLabel}
                </p>
              </div>
              <div className="space-y-1">
                <p
                  className="text-[14px] font-semibold tracking-[0.02em] uppercase"
                  style={{ color: "#3c4a42" }}
                >
                  Questions
                </p>
                <p
                  className="text-[32px] font-bold leading-[40px] tracking-[-0.01em]"
                  style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                >
                  {totalPossible}
                </p>
              </div>
            </div>

            {/* Insights */}
            <div
              className="p-6 rounded-[1.5rem] flex items-center gap-4"
              style={{
                backgroundColor: "rgba(0, 108, 73, 0.05)",
                border: "1px solid rgba(0, 108, 73, 0.1)",
              }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#10b981" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#00422b", fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  analytics
                </span>
              </div>
              <div>
                <p
                  className="text-[14px] font-bold tracking-[0.02em]"
                  style={{ color: "#006c49" }}
                >
                  Performance Insights
                </p>
                <p className="text-sm" style={{ color: "#3c4a42" }}>
                  {score >= 80
                    ? "Excellent work across all sections. Keep up the great effort!"
                    : score >= 50
                      ? "You passed the assessment. Review the areas you missed to strengthen your understanding."
                      : "Focus on the topics you found challenging and try again for a better score."}
                </p>
              </div>
            </div>
          </div>

          {/* Question Grid */}
          <div
            className="md:col-span-12 p-8 rounded-[2.5rem]"
            style={{
              backgroundColor: "#ffffff",
              boxShadow: "0 12px 24px -8px rgba(0,0,0,0.06)",
            }}
          >
            <div className="flex justify-between items-center mb-8">
              <h3
                className="text-[24px] font-semibold leading-[32px]"
                style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
              >
                Question Breakdown
              </h3>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#10b981" }}
                  />
                  <span
                    className="text-[12px] font-bold uppercase tracking-[0.05em]"
                    style={{ color: "#3c4a42" }}
                  >
                    Correct
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: "#ffdad6" }}
                  />
                  <span
                    className="text-[12px] font-bold uppercase tracking-[0.05em]"
                    style={{ color: "#3c4a42" }}
                  >
                    Incorrect
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-3 md:gap-4">
              {questions.map((q, i) => {
                const isCorrect = answers[q.id] === q.correctAnswerId
                const isAnswered = !!answers[q.id]
                let bg = "#d9e3f7"
                let textColor = "#3c4a42"
                let borderStyle = ""

                if (isCorrect) {
                  bg = "#10b981"
                  textColor = "#00422b"
                } else if (isAnswered) {
                  bg = "#ffdad6"
                  textColor = "#93000a"
                  borderStyle = "border-2 border-[#ba1a1a]"
                } else {
                  bg = "#d9e3f7"
                  textColor = "#3c4a42"
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => handleQuestionClick(q.id)}
                    className={`aspect-square flex items-center justify-center rounded-xl md:rounded-2xl font-bold text-lg hover:scale-105 transition-transform cursor-pointer active:scale-90 ${borderStyle}`}
                    style={{ backgroundColor: bg, color: textColor }}
                    aria-label={`Question ${i + 1}${isCorrect ? " (correct)" : isAnswered ? " (incorrect)" : " (unanswered)"}`}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-8">
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full md:w-auto px-10 py-5 rounded-[1.25rem] text-[14px] font-semibold tracking-[0.02em] shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95"
            style={{
              backgroundColor: "#006c49",
              color: "#ffffff",
              boxShadow: "0 8px 25px rgba(0, 108, 73, 0.2)",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              dashboard
            </span>
            Back to Dashboard
          </button>
          <button
            type="button"
            onClick={() => router.push(`/exam/${exam.id}/review`)}
            className="w-full md:w-auto px-10 py-5 rounded-[1.25rem] text-[14px] font-semibold tracking-[0.02em] flex items-center justify-center gap-3 transition-all active:scale-95"
            style={{
              backgroundColor: "#dee9fd",
              color: "#121c2a",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#d9e3f7" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#dee9fd" }}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
            >
              preview
            </span>
            Review Answers
          </button>
        </div>
      </main>
    </div>
  )
}
