"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import { LatexRenderer } from "@/components/ui/latex-renderer"

interface ReviewExam {
  id: string
  title: string
  duration: number
  totalMarks: number
  questionCount: number
  allowReview: boolean
  showResult: boolean
}

interface ReviewQuestion {
  id: string
  number: number
  text: string
  image?: string | null
  options: { id: string; label: string; text: string }[]
  correctAnswerId: string
}

const STORAGE_KEY_PREFIX = "exam-take-"
const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"]

export function ExamReviewClient({ examId }: { examId: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const token = searchParams.get("token") || ""

  const [exam, setExam] = useState<ReviewExam | null>(null)
  const [questions, setQuestions] = useState<ReviewQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const storageKey = exam ? `${STORAGE_KEY_PREFIX}${exam.id}` : ""

  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [timeLeft, setTimeLeft] = useState<number | null>(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [showAllQuestions, setShowAllQuestions] = useState(false)

  // Fetch exam data
  useEffect(() => {
    async function loadExam() {
      setLoading(true)
      setError("")
      try {
        const examData = await api.public.exam(token || examId)
        if (!examData.allow_review) {
          if (!examData.show_result) {
            router.push(`/exam/${examData.id}/submitted`)
            return
          } else {
            router.push(`/exam/${examData.id}/results`)
            return
          }
        }
        setExam({
          id: examData.id,
          title: examData.title,
          duration: examData.duration_minutes,
          totalMarks: examData.total_marks,
          questionCount: examData.question_count,
          allowReview: examData.allow_review,
          showResult: examData.show_result,
        })
        setQuestions(examData.questions.map((q) => ({
          id: q.id,
          number: q.number,
          text: q.text,
          image: q.image,
          options: q.options,
          correctAnswerId: "",
        })))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Failed to load exam")
      } finally {
        setLoading(false)
      }
    }
    if (token || examId) {
      loadExam()
    }
  }, [token, examId, router])

  useEffect(() => {
    if (!showConfirm) return
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setShowConfirm(false)
    }
    window.addEventListener("keydown", handleEscape)
    return () => window.removeEventListener("keydown", handleEscape)
  }, [showConfirm])

  useEffect(() => {
    if (!exam) return
    try {
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.answers) setAnswers(parsed.answers)
        if (parsed.flagged) setFlagged(new Set(parsed.flagged))
        if (parsed.timeLeft != null) setTimeLeft(parsed.timeLeft)
        if (parsed.isSubmitted || parsed.submitted) {
          router.replace(`/exam/${exam.id}/results`)
          return
        }
      }
    } catch {}
  }, [storageKey, exam, router])

  const answeredCount = questions.filter((q) => answers[q.id]).length
  const flaggedCount = flagged.size
  const timerMinutes = timeLeft != null ? Math.floor(timeLeft / 60) : exam?.duration || 0
  const timerSeconds = timeLeft != null ? timeLeft % 60 : 0

  function handleSubmit() {
    if (!exam) return
    localStorage.setItem(
      storageKey,
      JSON.stringify({ answers, flagged: [...flagged], submitted: true }),
    )
    router.push(`/exam/${exam.id}/results`)
  }

  function navigateToQuestion(questionId: string) {
    if (!exam) return
    router.push(`/exam/${exam.id}/take?focus=${questionId}`)
  }

  const displayedQuestions = showAllQuestions ? questions : questions.slice(0, 4)
  const hiddenCount = questions.length - 4

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f9f9ff" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-[#006c49] border-t-transparent animate-spin" />
          <p className="text-sm font-medium" style={{ color: "#3c4a42" }}>Loading review...</p>
        </div>
      </main>
    )
  }

  if (error || !exam) {
    return (
      <main className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f9f9ff" }}>
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto px-4 text-center">
          <div className="size-16 rounded-full bg-danger-light flex items-center justify-center">
            <span className="text-3xl">!</span>
          </div>
          <h2 className="text-xl font-bold" style={{ color: "#121c2a" }}>Review Not Available</h2>
          <p className="text-sm" style={{ color: "#3c4a42" }}>
            {error || "Review could not be loaded. Please check the link and try again."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/exam/portal")}
            className="mt-4 px-6 py-3 rounded-xl text-sm font-semibold transition-all hover:brightness-105"
            style={{ backgroundColor: "#006c49", color: "#ffffff" }}
          >
            Go to Exam Portal
          </button>
        </div>
      </main>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ backgroundColor: "#f9f9ff", color: "#121c2a", fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <main className="flex-grow w-full max-w-4xl mx-auto px-4 md:px-10 py-12">
        {/* Header Section */}
        <div className="mb-10 text-center md:text-left">
          <h1
            className="text-[32px] md:text-[48px] font-bold leading-tight tracking-[-0.02em] mb-3"
            style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
          >
            Review Your Answers
          </h1>
          <p className="text-base max-w-2xl mx-auto md:mx-0" style={{ color: "#3c4a42" }}>
            Carefully check your selections. Questions highlighted in red or marked as flagged may
            need a second look.
          </p>
        </div>

        {/* Enhanced Summary Bar */}
        <div
          className="sticky top-4 z-40 rounded-2xl p-6 md:p-8 flex flex-wrap gap-8 items-center justify-between mb-12 border backdrop-blur-xl shadow-xl"
          style={{
            backgroundColor: "rgba(239, 243, 255, 0.95)",
            borderColor: "rgba(187, 202, 191, 0.3)",
          }}
        >
          <div className="flex flex-wrap gap-8 items-center">
            {/* Total */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "#d9e3f7" }}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#006c49", fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  quiz
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-[12px] font-bold uppercase tracking-widest"
                  style={{ color: "#3c4a42" }}
                >
                  Total
                </span>
                <span
                  className="text-[24px] font-bold leading-tight"
                  style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                >
                  {questions.length}
                </span>
              </div>
            </div>

            <div className="h-10 w-px hidden md:block" style={{ backgroundColor: "rgba(187, 202, 191, 0.4)" }} />

            {/* Answered */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(16, 185, 129, 0.2)" }}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#006c49", fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                >
                  task_alt
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-[12px] font-bold uppercase tracking-widest"
                  style={{ color: "#3c4a42" }}
                >
                  Answered
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="text-[24px] font-bold leading-tight"
                    style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                  >
                    {answeredCount}
                  </span>
                  <span
                    className="text-sm font-bold px-2 py-0.5 rounded-full"
                    style={{
                      color: "#006c49",
                      backgroundColor: "rgba(0, 108, 73, 0.1)",
                    }}
                  >
                    {questions.length > 0
                      ? Math.round((answeredCount / questions.length) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            <div className="h-10 w-px hidden md:block" style={{ backgroundColor: "rgba(187, 202, 191, 0.4)" }} />

            {/* Flagged */}
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl" style={{ backgroundColor: "rgba(255, 218, 214, 0.4)" }}>
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#ba1a1a", fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                >
                  flag
                </span>
              </div>
              <div className="flex flex-col">
                <span
                  className="text-[12px] font-bold uppercase tracking-widest"
                  style={{ color: "#3c4a42" }}
                >
                  Flagged
                </span>
                <span
                  className="text-[24px] font-bold leading-tight"
                  style={{ color: "#ba1a1a", fontFamily: "'Source Serif 4', serif" }}
                >
                  {flaggedCount}
                </span>
              </div>
            </div>
          </div>

          {/* Timer */}
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl"
            style={{ backgroundColor: "#273140", color: "#ebf1ff" }}
          >
            <span className="material-symbols-outlined text-xl">timer</span>
            <span className="font-mono text-xl font-bold tracking-tight">
              {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-6 pb-40">
          {displayedQuestions.map((q, i) => {
            const isAnswered = !!answers[q.id]
            const isFlagged = flagged.has(q.id)
            const selectedOption = q.options.find((opt) => opt.id === answers[q.id])

            let borderStyle: React.CSSProperties = {}
            if (isFlagged) {
              borderStyle = { borderColor: "rgba(186, 26, 26, 0.1)" }
            } else if (!isAnswered) {
              borderStyle = { borderColor: "#bbcabf" }
            } else {
              borderStyle = { borderColor: "transparent" }
            }

            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl overflow-hidden group cursor-pointer transition-all duration-300"
                style={{
                  boxShadow: "0 4px 6px -1px rgba(55, 65, 81, 0.08)",
                  ...borderStyle,
                }}
                onClick={() => navigateToQuestion(q.id)}
                onMouseEnter={(e) => {
                  if (isAnswered) {
                    e.currentTarget.style.transform = "translateY(-4px)"
                    e.currentTarget.style.boxShadow =
                      "0 10px 25px -5px rgba(55, 65, 81, 0.12)"
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0px)"
                  e.currentTarget.style.boxShadow =
                    "0 4px 6px -1px rgba(55, 65, 81, 0.08)"
                }}
              >
                <div className="p-8 flex flex-col gap-5">
                  {/* Header row */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 flex items-center justify-center rounded-lg font-bold text-sm"
                        style={{ backgroundColor: "#121c2a", color: "#f9f9ff" }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </div>
                      {isFlagged ? (
                        <span
                          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest"
                          style={{
                            color: "#ba1a1a",
                            backgroundColor: "rgba(255, 218, 214, 0.1)",
                          }}
                        >
                          <span
                            className="material-symbols-outlined text-xs"
                            style={{
                              fontVariationSettings: "'FILL' 1, 'wght' 400",
                            }}
                          >
                            flag
                          </span>
                          Flagged
                        </span>
                      ) : isAnswered ? (
                        <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#006c49]">
                          <span
                            className="material-symbols-outlined text-sm"
                            style={{
                              fontVariationSettings: "'FILL' 1, 'wght' 400",
                            }}
                          >
                            check_circle
                          </span>
                          Answered
                        </span>
                      ) : (
                        <span
                          className="font-bold text-[10px] uppercase tracking-widest px-2 py-1 rounded-full"
                          style={{
                            color: "#ba1a1a",
                            backgroundColor: "rgba(255, 218, 214, 0.05)",
                          }}
                        >
                          Unanswered
                        </span>
                      )}
                    </div>
                    <span
                      className="material-symbols-outlined transition-colors"
                      style={{
                        color: "#bbcabf",
                        fontVariationSettings: "'FILL' 0, 'wght' 400",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#006c49"
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "#bbcabf"
                      }}
                    >
                      edit
                    </span>
                  </div>

                  {/* Question text */}
                  <h3
                    className="text-[24px] font-semibold leading-snug"
                    style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                  >
                    <LatexRenderer text={q.text} />
                  </h3>
                  {q.image && (
                    <div className="mt-3">
                      <img
                        src={q.image}
                        alt="Question illustration"
                        className="max-h-48 w-auto rounded-lg border object-contain"
                        style={{ borderColor: "#bbcabf" }}
                      />
                    </div>
                  )}

                  {/* Answer display */}
                  {isAnswered && selectedOption ? (
                    <div
                      className="p-5 rounded-xl flex items-center gap-4"
                      style={{
                        backgroundColor: "rgba(0, 108, 73, 0.05)",
                        border: "1px solid rgba(0, 108, 73, 0.1)",
                      }}
                    >
                      <span
                        className="h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ backgroundColor: "#006c49", color: "#ffffff" }}
                      >
                        {OPTION_LABELS[q.options.indexOf(selectedOption)] ||
                          selectedOption.label}
                      </span>
                      <span className="font-medium" style={{ color: "#121c2a" }}>
                        <LatexRenderer text={selectedOption.text} />
                      </span>
                    </div>
                  ) : (
                    <div
                      className="p-5 rounded-xl italic flex items-center gap-3"
                      style={{
                        backgroundColor: "rgba(217, 227, 247, 0.2)",
                        color: "#3c4a42",
                        border: "1px solid rgba(108, 122, 113, 0.3)",
                      }}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          color: "#6c7a71",
                          fontVariationSettings: "'FILL' 0, 'wght' 400",
                        }}
                      >
                        error
                      </span>
                      No answer selected yet. Click to choose an option.
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* View remaining questions */}
          {!showAllQuestions && hiddenCount > 0 && (
            <div className="pt-8 text-center">
              <button
                type="button"
                onClick={() => setShowAllQuestions(true)}
                className="group inline-flex flex-col items-center gap-3 transition-all"
              >
                <span
                  className="text-sm font-semibold tracking-[0.02em] transition-colors group-hover:text-[#006c49]"
                  style={{ color: "#3c4a42" }}
                >
                  View remaining {hiddenCount} question{hiddenCount > 1 ? "s" : ""}
                </span>
                <div
                  className="p-3 rounded-full transition-all shadow-md"
                  style={{ backgroundColor: "#d9e3f7", color: "#3c4a42" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#006c49"
                    e.currentTarget.style.color = "#ffffff"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#d9e3f7"
                    e.currentTarget.style.color = "#3c4a42"
                  }}
                >
                  <span
                    className="material-symbols-outlined align-middle transition-transform group-hover:translate-y-1"
                    style={{ fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                  >
                    expand_more
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Fixed Bottom Action Bar */}
      <div
        className="fixed bottom-0 left-0 right-0 backdrop-blur-xl border-t py-8 z-50"
        style={{
          backgroundColor: "rgba(249, 249, 255, 0.9)",
          borderColor: "rgba(187, 202, 191, 0.3)",
        }}
      >
        <div className="max-w-4xl mx-auto px-4 md:px-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div
              className="h-3 w-3 rounded-full animate-pulse"
              style={{ backgroundColor: "#10b981" }}
            />
            <span
              className="text-sm font-bold uppercase tracking-widest"
              style={{ color: "#3c4a42" }}
            >
              Final Review Stage
            </span>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <button
              type="button"
              onClick={() => router.push(`/exam/${exam.id}/take`)}
              className="flex-1 md:flex-none px-10 py-4 rounded-xl font-bold text-sm border-2 transition-all active:scale-95"
              style={{ borderColor: "#6c7a71", color: "#121c2a" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "rgba(217, 227, 247, 0.3)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
            >
              Back to Exam
            </button>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              className="flex-1 md:flex-none px-14 py-4 rounded-xl font-bold text-sm transition-all active:scale-95"
              style={{
                backgroundColor: "#006c49",
                color: "#ffffff",
                boxShadow: "0 8px 25px rgba(0, 108, 73, 0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)"
              }}
            >
              Submit Exam
            </button>
          </div>
        </div>
      </div>

      {/* Submission Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0"
            style={{
              backgroundColor: "rgba(18, 28, 42, 0.6)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => setShowConfirm(false)}
          />
          <div
            className="relative rounded-3xl p-10 max-w-md w-full mx-4 shadow-2xl border"
            style={{
              backgroundColor: "#f9f9ff",
              borderColor: "rgba(187, 202, 191, 0.2)",
            }}
          >
            <div className="text-center">
              <div
                className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: "rgba(0, 108, 73, 0.1)" }}
              >
                <span
                  className="material-symbols-outlined text-5xl"
                  style={{
                    color: "#006c49",
                    fontVariationSettings: "'FILL' 1, 'wght' 400",
                  }}
                >
                  rocket_launch
                </span>
              </div>
              <h2
                className="text-[32px] font-bold mb-3"
                style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
              >
                Ready to Submit?
              </h2>
              <p className="text-base mb-10 leading-relaxed" style={{ color: "#3c4a42" }}>
                You&apos;ve answered {answeredCount}/{questions.length} questions. Please ensure
                all your responses are final as they cannot be changed after submission.
              </p>
              <div className="flex flex-col gap-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-5 rounded-2xl font-bold text-sm transition-transform hover:scale-[1.02]"
                  style={{
                    backgroundColor: "#006c49",
                    color: "#ffffff",
                    boxShadow: "0 8px 25px rgba(0, 108, 73, 0.3)",
                  }}
                >
                  Confirm Submission
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="w-full py-4 font-bold text-sm transition-colors"
                  style={{ color: "#3c4a42" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#006c49"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#3c4a42"
                  }}
                >
                  Go back to Review
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
