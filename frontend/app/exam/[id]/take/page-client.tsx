"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { api, ApiError } from "@/lib/api"
import type { ApiPublicQuestion, ApiPublicExam } from "@/lib/api"
import { LatexRenderer } from "@/components/ui/latex-renderer"

interface TakeExam {
  id: string
  title: string
  duration: number
  totalMarks: number
  questionCount: number
  allowReview: boolean
  showResult: boolean
}

interface TakeQuestion {
  id: string
  number: number
  text: string
  image?: string | null
  options: { id: string; label: string; text: string }[]
  correctAnswerId: string
}

const STORAGE_KEY_PREFIX = "exam-take-"
const OPTION_LABELS = ["A", "B", "C", "D"]

export function ExamTakeClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const attemptId = searchParams.get("attemptId") || ""
  const accessToken = searchParams.get("accessToken") || ""
  const token = searchParams.get("token") || ""
  const studentName = searchParams.get("name") || ""
  const examId = searchParams.get("id") || ""

  const [exam, setExam] = useState<TakeExam | null>(null)
  const [questions, setQuestions] = useState<TakeQuestion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [submitError, setSubmitError] = useState("")

  const storageKey = exam && attemptId ? `${STORAGE_KEY_PREFIX}${exam.id}-${attemptId}` : ""

  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [dirtyAnswers, setDirtyAnswers] = useState<Set<string>>(new Set())
  const [syncStatus, setSyncStatus] = useState<"synced" | "pending" | "offline">("synced")
  const [flagged, setFlagged] = useState<Set<string>>(new Set())
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showMobileNav, setShowMobileNav] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const mainRef = useRef<HTMLDivElement>(null)
  const answersRef = useRef(answers)
  const dirtyRef = useRef(dirtyAnswers)
  const flaggedRef = useRef(flagged)
  const timeLeftRef = useRef(timeLeft)
  const attemptIdRef = useRef(attemptId)
  const accessTokenRef = useRef(accessToken)
  const examRef = useRef(exam)
  const questionsRef = useRef(questions)
  const saveRetryRef = useRef(0)

  answersRef.current = answers
  dirtyRef.current = dirtyAnswers
  flaggedRef.current = flagged
  timeLeftRef.current = timeLeft
  attemptIdRef.current = attemptId
  accessTokenRef.current = accessToken
  examRef.current = exam
  questionsRef.current = questions

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }))
    setDirtyAnswers((prev) => {
      const next = new Set(prev)
      next.add(questionId)
      return next
    })
    setSyncStatus("pending")
  }

  // Fetch exam data
  useEffect(() => {
    async function loadExam() {
      setLoading(true)
      setError("")
      try {
        let examData: ApiPublicExam | null = null

        if (token) {
          examData = await api.public.exam(token)
        } else if (attemptId && accessToken && examId) {
          const attempt = await api.public.resumeAttempt(attemptId, accessToken)
          examData = await api.public.exam(examId)
          if (attempt?.duration_seconds != null) {
            const remaining = Math.max(examData.duration_minutes * 60 - attempt.duration_seconds, 0)
            setTimeLeft(remaining)
          }
        } else if (examId) {
          examData = await api.public.exam(examId)
        }

        if (!examData) {
          throw new Error("Exam not found")
        }

        const mappedExam: TakeExam = {
          id: examData.id,
          title: examData.title,
          duration: examData.duration_minutes,
          totalMarks: examData.total_marks,
          questionCount: examData.question_count,
          allowReview: examData.allow_review,
          showResult: examData.show_result,
        }

        const mappedQuestions: TakeQuestion[] = examData.questions.map((q) => ({
          id: q.id,
          number: q.number,
          text: q.text,
          image: q.image,
          options: q.options,
          correctAnswerId: "",
        }))

        setExam(mappedExam)
        setQuestions(mappedQuestions)
        // Only set timeLeft from duration if not already set by resume
        setTimeLeft((prev) => prev === 0 ? mappedExam.duration * 60 : prev)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load exam")
      } finally {
        setLoading(false)
      }
    }
    loadExam()
  }, [token, attemptId, accessToken, examId])

  // Restore state from localStorage
  useEffect(() => {
    if (!exam) return
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
  }, [storageKey, exam, router])

  // Autosave to localStorage
  useEffect(() => {
    if (!exam) return
    const data = { answers, flagged: [...flagged], currentIndex, timeLeft }
    localStorage.setItem(storageKey, JSON.stringify(data))
  }, [answers, flagged, currentIndex, timeLeft, storageKey, exam])

  // Auto-save to API — only dirty answers, with retry on failure
  const apiSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (!attemptId || !accessToken || !exam || submitting) return
    if (dirtyAnswers.size === 0) return
    if (apiSaveTimerRef.current) clearTimeout(apiSaveTimerRef.current)
    apiSaveTimerRef.current = setTimeout(async () => {
      const dirty = Array.from(dirtyRef.current)
      if (dirty.length === 0) return
      const dirtyPayload = dirty.map((qId) => ({
        question: qId,
        selected_choice: answersRef.current[qId] || null,
      }))
      try {
        await api.public.saveAttempt(attemptId, accessToken, {
          answers: dirtyPayload,
        })
        setDirtyAnswers(new Set())
        setSyncStatus("synced")
        saveRetryRef.current = 0
      } catch {
        saveRetryRef.current++
        if (saveRetryRef.current <= 3) {
          // Retry with increasing backoff: 5s, 10s, 20s
        } else {
          setSyncStatus("offline")
        }
      }
    }, 5000)
    return () => {
      if (apiSaveTimerRef.current) clearTimeout(apiSaveTimerRef.current)
    }
  }, [dirtyAnswers, answers, questions, attemptId, accessToken, exam, submitting])

  // Timer
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  useEffect(() => {
    if (!exam) return
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
  }, [exam])

  const handleTimeoutRef = useRef<() => void>(() => {})
  const saveState = useCallback(() => {
    if (!exam) return
    localStorage.setItem(
      storageKey,
      JSON.stringify({ answers: answersRef.current, flagged: [...flaggedRef.current], submitted: false }),
    )
  }, [storageKey, exam])

  async function finalSaveBeforeSubmit() {
    if (!attemptId || !accessToken) return
    const allAnswers = questionsRef.current.map((q) => ({
      question: q.id,
      selected_choice: answersRef.current[q.id] || null,
    }))
    for (let i = 0; i < 3; i++) {
      try {
        await api.public.saveAttempt(attemptId, accessToken, { answers: allAnswers })
        return
      } catch {
        if (i < 2) await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
      }
    }
  }

  const goToReview = useCallback(async () => {
    setSubmitting(true)
    setSubmitError("")
    saveState()
    await finalSaveBeforeSubmit()
    if (attemptId && accessToken && exam) {
      try {
        const result = await api.public.submitAttempt(attemptId, accessToken, {
          answers: questions.map((q) => ({
            question: q.id,
            selected_choice: answersRef.current[q.id] || null,
          })),
        })
        if (result) {
          localStorage.setItem(
            `exam-result-${exam.id}-${attemptId}`,
            JSON.stringify(result),
          )
        }
      } catch {
        if (!exam) { setSubmitting(false); return }
        localStorage.setItem(
          `exam-result-${exam.id}-${attemptId}`,
          JSON.stringify({ submitted: true }),
        )
        const resultParams = new URLSearchParams()
        if (attemptId) resultParams.set("attemptId", attemptId)
        if (!exam.allowReview && !exam.showResult) {
          router.push(`/exam/${exam.id}/submitted?${resultParams.toString()}`)
        } else if (!exam.allowReview) {
          router.push(`/exam/${exam.id}/results?${resultParams.toString()}`)
        } else {
          const reviewParams = new URLSearchParams()
          if (token) reviewParams.set("token", token)
          if (examId) reviewParams.set("id", examId)
          if (attemptId) reviewParams.set("attemptId", attemptId)
          router.push(`/exam/${exam.id}/review?${reviewParams.toString()}`)
        }
        return
      }
    }
    if (!exam) { setSubmitting(false); return }
    const resultParams = new URLSearchParams()
    if (attemptId) resultParams.set("attemptId", attemptId)
    if (!exam.allowReview && !exam.showResult) {
      router.push(`/exam/${exam.id}/submitted?${resultParams.toString()}`)
    } else if (!exam.allowReview) {
      router.push(`/exam/${exam.id}/results?${resultParams.toString()}`)
    } else {
      const reviewParams = new URLSearchParams()
      if (token) reviewParams.set("token", token)
      if (examId) reviewParams.set("id", examId)
      router.push(`/exam/${exam.id}/review?${reviewParams.toString()}`)
    }
  }, [saveState, router, exam, questions, token, examId])

  const handleSubmitClick = useCallback(() => {
    setShowSubmitConfirm(true)
  }, [])

  handleTimeoutRef.current = goToReview

  // Keyboard shortcuts
  useEffect(() => {
    if (!exam) return
    function handleKey(e: KeyboardEvent) {
      if (timeLeftRef.current <= 0) return
      const key = e.key

      if (["1", "2", "3", "4"].includes(key)) {
        const q = questionsRef.current[currentIndex]
        if (q) {
          const opt = q.options[parseInt(key) - 1]
          if (opt) {
            selectAnswer(q.id, opt.id)
          }
        }
      }

      if (key === "Enter" || key === "ArrowRight") {
        e.preventDefault()
        if (currentIndex < questionsRef.current.length - 1) {
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
        const qId = questionsRef.current[currentIndex]?.id
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
  }, [currentIndex, exam])

  useEffect(() => {
    mainRef.current?.focus()
  }, [currentIndex])

  if (loading) {
    return (
      <main className="flex-grow flex items-center justify-center h-screen" style={{ backgroundColor: "#eff3ff" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 rounded-full border-4 border-[#006c49] border-t-transparent animate-spin" />
          <p className="text-sm font-medium" style={{ color: "#3c4a42" }}>Loading exam...</p>
        </div>
      </main>
    )
  }

  if (error || !exam || questions.length === 0) {
    return (
      <main className="flex-grow flex items-center justify-center h-screen" style={{ backgroundColor: "#eff3ff" }}>
        <div className="flex flex-col items-center gap-4 max-w-md mx-auto px-4 text-center">
          <div className="size-16 rounded-full bg-danger-light flex items-center justify-center">
            <span className="text-3xl">!</span>
          </div>
          <h2 className="text-xl font-bold" style={{ color: "#121c2a" }}>Exam Not Available</h2>
          <p className="text-sm" style={{ color: "#3c4a42" }}>
            {error || "This exam could not be loaded. Please check the link and try again."}
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

  const question = questions[currentIndex]
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const answeredCount = questions.filter((q) => answers[q.id]).length
  const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0

  return (
    <main className="flex-grow flex overflow-hidden h-screen" style={{ backgroundColor: "#eff3ff" }}>
      {/* Left Panel: Question Area (70%) */}
      <section className="w-full lg:w-[70%] h-full p-4 md:p-10 overflow-y-auto relative">
        {/* Dee Soar CBT header */}
        <div className="mb-4">
          <span
            className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm"
            style={{ backgroundColor: "#006c49", color: "#ffffff" }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}>
              school
            </span>
            Dee Soar CBT
          </span>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Question Card */}
          <div className="bg-white rounded-xl p-4 md:p-10 shadow-sm border" style={{ borderColor: "#bbcabf" }}>
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
                  {question?.text ? <LatexRenderer text={question.text} /> : ""}
                </h2>
                {question?.image && (
                  <div className="mt-4">
                    <img
                      src={question.image}
                      alt="Question illustration"
                      className="max-h-64 w-auto rounded-lg border object-contain"
                      style={{ borderColor: "#bbcabf" }}
                    />
                  </div>
                )}
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
                      onChange={() => selectAnswer(question.id, option.id)}
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
                        <LatexRenderer text={option.text} />
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
            <div className="mt-6 md:mt-12 flex gap-3 md:gap-0 justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  if (currentIndex > 0) setCurrentIndex((i) => i - 1)
                }}
                disabled={currentIndex === 0}
                className="flex-1 md:flex-none px-4 md:px-8 py-3 rounded-lg text-xs md:text-sm font-semibold tracking-[0.02em] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="flex-1 md:flex-none px-6 md:px-10 py-3 rounded-lg text-xs md:text-sm font-semibold tracking-[0.02em] transition-all hover:brightness-105 flex items-center justify-center gap-2"
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
                  onClick={handleSubmitClick}
                  disabled={submitting}
                  className="flex-1 md:flex-none px-6 md:px-10 py-3 rounded-lg text-xs md:text-sm font-semibold tracking-[0.02em] transition-all hover:brightness-105 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: "#006c49",
                    color: "#ffffff",
                  }}
                >
                  {submitting ? "Submitting..." : "Review All Answers"}
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
          {/* Student name */}
          {studentName && (
            <div className="mb-6 text-center shrink-0">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#6c7a71" }}
              >
                Student
              </span>
              <p
                className="text-sm font-semibold truncate mt-1"
                style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
              >
                {studentName}
              </p>
            </div>
          )}

          {/* Timer */}
          <div className="mb-8 text-center shrink-0">
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

          {/* Scrollable question grid area */}
          <div className="flex-1 overflow-y-auto min-h-0 space-y-6">
            {/* Question Grid */}
            <div className="grid grid-cols-5 gap-2 md:gap-3">
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
          </div>

          {/* Sync status */}
          {syncStatus !== "synced" && (
            <div className="mt-auto mb-3 flex items-center justify-center gap-1.5 shrink-0">
              {syncStatus === "pending" ? (
                <>
                  <span className="size-2 rounded-full bg-amber-500 animate-pulse" />
                  <span className="text-[10px] font-medium text-amber-600">Saving answers...</span>
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-red-500" />
                  <span className="text-[10px] font-medium text-red-600">Connection lost — answers saved locally</span>
                </>
              )}
            </div>
          )}
          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={submitting}
            className="mt-auto w-full py-4 rounded-lg text-sm font-bold tracking-[0.02em] transition-all hover:brightness-105 shadow-md shrink-0 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: "#006c49", color: "#ffffff" }}
          >
            {submitting ? (
              <>
                <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Assessment"
            )}
          </button>

          {/* Keyboard shortcut hint */}
          <p className="mt-4 text-center text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ color: "#6c7a71" }}>
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
          onClick={() => setShowMobileNav(true)}
          className="flex size-14 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform"
          style={{ backgroundColor: "#006c49", color: "#ffffff" }}
          aria-label="Open question navigator"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
          >
            grid_view
          </span>
        </button>
      </div>

      {/* Mobile bottom sheet */}
      {showMobileNav && (
        <div className="fixed inset-0 z-50 lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowMobileNav(false)} />
          <div
            className="relative w-full max-h-[85vh] flex flex-col rounded-t-2xl shadow-2xl"
            style={{ backgroundColor: "#ffffff" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "#bbcabf" }} />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 shrink-0">
              <span className="text-sm font-bold" style={{ color: "#121c2a" }}>Question Navigator</span>
              <button
                type="button"
                onClick={() => setShowMobileNav(false)}
                className="flex size-7 items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Timer row */}
            <div className="flex items-center justify-center gap-3 px-5 pb-4 shrink-0">
              {studentName && (
                <div className="text-center">
                  <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#6c7a71" }}>Student</span>
                  <p className="text-xs font-semibold truncate mt-0.5" style={{ color: "#121c2a" }}>{studentName}</p>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-full border px-4 py-1.5" style={{ borderColor: timeLeft < 300 ? "rgba(186,26,26,0.3)" : "rgba(0,108,73,0.3)", backgroundColor: "#f9f9ff" }}>
                <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: timeLeft < 300 ? "#ba1a1a" : "#006c49" }}>
                  {timeLeft < 300 ? "Urgent" : "Remaining"}
                </span>
                <span className="text-sm font-bold" style={{ color: timeLeft < 300 ? "#ba1a1a" : "#121c2a", fontFamily: "'Source Serif 4', serif" }}>
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </span>
              </div>
            </div>

            {/* Question Grid */}
            <div className="overflow-y-auto px-5 pb-4">
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, i) => {
                  const isAnswered = !!answers[q.id]
                  const isFlagged = flagged.has(q.id)
                  const isCurrent = i === currentIndex
                  let bgColor = "#dee9fd"
                  let textColor = "#3c4a42"
                  let ring = ""
                  if (isAnswered && isCurrent) { bgColor = "#006c49"; textColor = "#ffffff"; ring = "ring-4 ring-[#006c49]/10" }
                  else if (isAnswered) { bgColor = "#006c49"; textColor = "#ffffff" }
                  else if (isCurrent) { bgColor = "#10b981"; textColor = "#00422b"; ring = "ring-4 ring-[#10b981]/10 border-2 border-[#006c49]" }
                  else if (isFlagged) { bgColor = "#ffdad6"; textColor = "#93000a" }
                  return (
                    <button key={q.id} onClick={() => { setCurrentIndex(i); setShowMobileNav(false) }}
                      className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold shadow-sm transition-all relative ${ring}`}
                      style={{ backgroundColor: bgColor, color: textColor }}
                      aria-label={`Go to question ${i + 1}`}>
                      {i + 1}
                      {isFlagged && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#ba1a1a" }} />}
                    </button>
                  )
                })}
              </div>

              {/* Legend + Submit row */}
              <div className="mt-4 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#006c49" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#3c4a42" }}>Answered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: "#dee9fd" }} />
                  <span className="text-[10px] font-semibold" style={{ color: "#3c4a42" }}>Unanswered</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded relative" style={{ backgroundColor: "#ffdad6" }}>
                    <span className="absolute top-0 right-0 w-1 h-1 rounded-full" style={{ backgroundColor: "#ba1a1a" }} />
                  </div>
                  <span className="text-[10px] font-semibold" style={{ color: "#3c4a42" }}>Flagged</span>
                </div>
                <div className="flex-1" />
                <button type="button" onClick={handleSubmitClick} disabled={submitting}
                  className="px-5 py-2 rounded-lg text-xs font-bold tracking-[0.02em] transition-all hover:brightness-105 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-1.5"
                  style={{ backgroundColor: "#006c49", color: "#ffffff" }}>
                  {submitting ? (
                    <>
                      <span className="size-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submit confirmation dialog */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-sm rounded-2xl border p-6 shadow-xl"
            style={{ backgroundColor: "#ffffff", borderColor: "#bbcabf" }}
          >
            <h3
              className="text-lg font-bold mb-2 text-center"
              style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
            >
              Submit Assessment?
            </h3>
            <p className="text-sm text-center mb-6" style={{ color: "#3c4a42" }}>
              You have answered {Object.keys(answers).length} of {questions.length} questions.
              {questions.length - Object.keys(answers).length > 0 && (
                <span style={{ color: "#ba1a1a" }}>
                  {" "}{questions.length - Object.keys(answers).length} unanswered.
                </span>
              )}
              <br />
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-3 rounded-xl border text-sm font-semibold transition-all active:scale-95"
                style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false)
                  setTimeout(() => goToReview(), 50)
                }}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ backgroundColor: "#006c49", color: "#ffffff" }}
              >
                {submitting ? (
                  <>
                    <span className="size-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Now"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
