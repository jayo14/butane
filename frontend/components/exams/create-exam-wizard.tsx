"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useForm, FormProvider, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import {
  ChevronLeft, ChevronRight, Cloud, CloudOff, Loader2, Trash2, FileText,
  Copy, Plus, AlertCircle, Sparkles, ArrowLeft, Zap,
  ArrowRight, X, Lightbulb, ShieldCheck, GraduationCap, PenLine, School,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAutosave, type AutosaveStatus } from "@/hooks/use-autosave"
import { BasicInfoStep } from "./steps/basic-info-step"
import { QuestionBuilderStep, type QuestionBuilderHandle } from "./steps/question-builder-step"
import { SettingsStep } from "./steps/settings-step"
import { ReviewPublishStep } from "./steps/review-publish-step"
import type { Question, ExamSettings } from "@/types/exam"
import { api, ApiError } from "@/lib/api"

const DRAFT_STORAGE_KEY = "exam-wizard-draft"
const STEP_STORAGE_KEY = "exam-wizard-step"

const basicInfoSchema = z.object({
  title: z.string().min(1, "Exam title is required").max(200, "Title is too long"),
  subject: z.string().min(1, "Please select a subject"),
  class: z.string().min(1, "Please select a class"),
  term: z.string().min(1, "Please select a term"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 minute").max(480, "Duration cannot exceed 480 minutes"),
  questionCount: z.coerce.number().min(1, "At least 1 question is required").max(200, "Cannot exceed 200 questions"),
  instructions: z.string().max(2000, "Instructions are too long").optional(),
})

export type BasicInfoValues = z.infer<typeof basicInfoSchema>

export interface ExamDraft {
  basicInfo: BasicInfoValues
  questions: Question[]
  settings: ExamSettings
}

const defaultSettings: ExamSettings = {
  shuffleQuestions: false,
  shuffleAnswers: false,
  passMark: 50,
  availableFrom: "",
  availableTo: "",
  timeLimit: 60,
  showResult: true,
  allowReview: false,
}

const initialDraft: ExamDraft = {
  basicInfo: {
    title: "",
    subject: "",
    class: "",
    term: "first-term",
    duration: 60,
    questionCount: 10,
    instructions: "",
  },
  questions: [],
  settings: defaultSettings,
}

function loadDraft(): ExamDraft {
  if (typeof window === "undefined") return initialDraft
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY)
    if (!raw) return initialDraft
    const parsed = JSON.parse(raw)
    return { ...initialDraft, ...parsed, basicInfo: { ...initialDraft.basicInfo, ...parsed.basicInfo }, settings: { ...initialDraft.settings, ...parsed.settings } }
  } catch {
    return initialDraft
  }
}

function saveDraftToStorage(draft: ExamDraft) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft))
  } catch {}
}

function saveStepToStorage(step: number) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(STEP_STORAGE_KEY, String(step))
  } catch {}
}

function loadStep(): number {
  if (typeof window === "undefined") return 0
  try {
    const raw = localStorage.getItem(STEP_STORAGE_KEY)
    return raw ? Math.min(Math.max(parseInt(raw, 10) || 0, 0), 3) : 0
  } catch {
    return 0
  }
}

function clearDraftFromStorage() {
  if (typeof window === "undefined") return
  localStorage.removeItem(DRAFT_STORAGE_KEY)
  localStorage.removeItem(STEP_STORAGE_KEY)
}

const subjects = [
  { label: "Mathematics", value: "mathematics" },
  { label: "English Language", value: "english" },
  { label: "Biology", value: "biology" },
  { label: "Physics", value: "physics" },
  { label: "Chemistry", value: "chemistry" },
  { label: "History", value: "history" },
  { label: "Computer Science", value: "computer-science" },
  { label: "Geography", value: "geography" },
]

const classes = [
  { label: "JSS1", value: "jss1" },
  { label: "JSS2", value: "jss2" },
  { label: "JSS3", value: "jss3" },
  { label: "SSS1", value: "sss1" },
  { label: "SSS2", value: "sss2" },
  { label: "SSS3", value: "sss3" },
]

const terms = [
  { label: "First Term", value: "first-term" },
  { label: "Second Term", value: "second-term" },
  { label: "Third Term", value: "third-term" },
]

const STEPS = [
  { id: "basic-info", label: "Basic Info", description: "Exam info" },
  { id: "questions", label: "Questions", description: "Add questions" },
  { id: "settings", label: "Settings", description: "Configuration" },
  { id: "review", label: "Review & Publish", description: "Final review" },
]

const STEP_HEADERS = [
  {
    title: "Build Your Assessment",
    description: "Let's start with the fundamentals. Provide a clear title and description to help your students understand the scope of the exam.",
  },
  {
    title: "Add Questions",
    description: "Create and organize your exam questions. Each question can have up to four answer options with one correct answer.",
  },
  {
    title: "Configure Settings",
    description: "Set passing marks, time limits, and other preferences to control how the exam behaves for students.",
  },
  {
    title: "Review & Publish",
    description: "Double-check all exam details, questions, and settings before publishing it for your students.",
  },
]

const TIPS = [
  { icon: Lightbulb, title: "Naming Tip", text: "Clear titles help students locate the correct exam in their dashboard quickly." },
  { icon: Sparkles, title: "Auto-Save", text: "Your progress is automatically saved to drafts as you work through each step." },
  { icon: ShieldCheck, title: "Privacy", text: "Exams are private by default and only visible to students once published." },
]

const autosaveConfig: Record<AutosaveStatus, { icon: React.ReactNode; text: string; className: string }> = {
  idle: { icon: <CloudOff size={12} />, text: "Unsaved", className: "text-[#6c7a71]" },
  saving: { icon: <Loader2 size={12} className="animate-spin" />, text: "Saving...", className: "text-[#D97706]" },
  saved: { icon: <Cloud size={12} />, text: "Saved", className: "text-[#006c49]" },
  error: { icon: <CloudOff size={12} />, text: "Save failed", className: "text-[#ba1a1a]" },
}

function useKeyboard(handlers: Record<string, () => void>) {
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const key = [e.ctrlKey || e.metaKey ? "mod" : "", e.key].filter(Boolean).join("+")
      if (handlers[key]) {
        e.preventDefault()
        handlers[key]()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [handlers])
}

export function CreateExamWizard() {
  const [currentStep, setCurrentStep] = useState(loadStep)
  const [draft, setDraft] = useState<ExamDraft>(loadDraft)
  const [isPublishing, setIsPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const [publishedUrl, setPublishedUrl] = useState("")
  const [shortCode, setShortCode] = useState("")
  const [publishError, setPublishError] = useState("")
  const [copied, setCopied] = useState(false)
  const [restored, setRestored] = useState(false)
  const [slideDir, setSlideDir] = useState<"left" | "right">("right")
  const questionBuilderRef = useRef<QuestionBuilderHandle>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [copiedShort, setCopiedShort] = useState(false)

  useEffect(() => {
    const saved = loadDraft()
    if (saved !== initialDraft && (saved.basicInfo.title || saved.questions.length > 0)) {
      setRestored(true)
    }
  }, [])

  useEffect(() => {
    saveStepToStorage(currentStep)
  }, [currentStep])

  const form = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema) as unknown as Resolver<BasicInfoValues>,
    mode: "onBlur",
    defaultValues: draft.basicInfo,
  })

  const { watch } = form
  const watchedBasicInfo = watch()

  const saveDraft = useCallback(async (data: ExamDraft) => {
    setDraft(data)
    saveDraftToStorage(data)
  }, [])

  const { status: autosaveStatus, triggerSave } = useAutosave({
    data: { ...draft, basicInfo: watchedBasicInfo },
    onSave: saveDraft,
    delay: 3000,
  })

  function goToStep(target: number) {
    if (target < 0 || target >= STEPS.length || target === currentStep) return
    setSlideDir(target > currentStep ? "right" : "left")
    setCurrentStep(target)
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  function handleClearDraft() {
    if (confirm("Clear the current exam draft? This cannot be undone.")) {
      clearDraftFromStorage()
      setDraft(initialDraft)
      setCurrentStep(0)
      form.reset(initialDraft.basicInfo)
      setRestored(false)
    }
  }

  async function handleNext() {
    setPublishError("")
    try {
      if (currentStep === 0) {
        const isValid = await form.trigger()
        if (!isValid) {
          contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          return
        }
        const basicInfo = form.getValues()
        const updated = { ...draft, basicInfo }
        setDraft(updated)
        saveDraftToStorage(updated)
      }
      if (currentStep === 1) {
        const isValid = questionBuilderRef.current?.validate() ?? false
        if (!isValid) {
          contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
          return
        }
      }
      if (currentStep < STEPS.length - 1) goToStep(currentStep + 1)
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : "An unexpected error occurred. Please try again.")
    }
  }

  function handleBack() {
    if (currentStep > 0) goToStep(currentStep - 1)
  }

  async function handlePublish() {
    setIsPublishing(true)
    setPublishError("")
    triggerSave()

    try {
      const courseCode = draft.basicInfo.subject.toUpperCase().slice(0, 6)

      if (draft.questions.length === 0) {
        throw new Error("At least one question is required to publish.")
      }

      const created = await api.exams.create({
        title: draft.basicInfo.title,
        subject: draft.basicInfo.subject,
        class_group: draft.basicInfo.class,
        term: draft.basicInfo.term,
        course: draft.basicInfo.subject,
        course_code: courseCode,
        duration_minutes: draft.basicInfo.duration,
        passing_percentage: draft.settings.passMark,
        shuffle_questions: draft.settings.shuffleQuestions,
        shuffle_answers: draft.settings.shuffleAnswers,
        show_result: draft.settings.showResult,
        allow_review: draft.settings.allowReview,
        instructions: draft.basicInfo.instructions || "",
        questions: draft.questions.map((q, i) => ({
          order: i + 1,
          text: q.text,
          type: "single_choice" as const,
          marks: 1,
          choices: q.options.map((opt, oi) => ({
            label: String.fromCharCode(65 + oi),
            text: opt.text,
            is_correct: opt.id === q.correctAnswerId,
          })),
        })),
      } as any)

      const published = await api.exams.publish(created.id)
      const url = published.public_url || `${window.location.origin}/exam/${created.id}`
      setPublishedUrl(url)
      setShortCode(published.short_code || "")
      clearDraftFromStorage()
      setPublished(true)
    } catch (err) {
      setPublishError(err instanceof ApiError ? err.message : "Failed to publish exam. Please try again.")
    } finally {
      setIsPublishing(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publishedUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement("input")
      input.value = publishedUrl
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  function handleReset() {
    clearDraftFromStorage()
    setDraft(initialDraft)
    setCurrentStep(0)
    setPublished(false)
    setPublishedUrl("")
    form.reset(initialDraft.basicInfo)
  }

  useKeyboard({
    "mod+Enter": () => { if (currentStep < STEPS.length - 1) handleNext(); else handlePublish() },
    "mod+ArrowRight": () => { if (currentStep < STEPS.length - 1) handleNext() },
    "mod+ArrowLeft": () => handleBack(),
  })

  // --- Published success screen ---
  if (published) {
    const shortUrl = `${window.location.origin}/exam/c/${shortCode}`
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 md:p-10"
        style={{
          backgroundColor: "#fcfbf7",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
      >
        {/* Confetti canvas */}
        <canvas id="confetti-canvas" className="fixed inset-0 pointer-events-none z-0" />

        <div className="relative z-10 mx-auto w-full max-w-2xl flex flex-col items-center text-center">
          {/* Success Illustration */}
          <div className="mb-8">
            <div
              className="size-32 md:size-40 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
              style={{ backgroundColor: "#10b981" }}
            >
              <span
                className="material-symbols-outlined text-on-primary-container !text-6xl md:!text-7xl"
                style={{ fontVariationSettings: "'FILL' 1", color: "#00422b", fontSize: "64px" }}
              >
                check_circle
              </span>
            </div>
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-4 mb-10">
            <h1
              className="text-[40px] md:text-[64px] font-bold leading-tight"
              style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}
            >
              Exam Published Successfully!
            </h1>
            <p className="text-base max-w-md mx-auto" style={{ color: "#3c4a42" }}>
              Your exam is now live and ready for students. Share the details below to start the assessment.
            </p>
          </div>

          {/* Sharing Section Card */}
          <div
            className="w-full border p-8 md:p-12 rounded-[2.5rem] mb-10 transition-all hover:shadow-xl"
            style={{
              backgroundColor: "#ffffff",
              borderColor: "#bbcabf",
              boxShadow: "0 12px 32px -4px rgba(55,65,81,0.08)",
            }}
          >
            <div className="grid grid-cols-1 gap-8">
              {/* Access Code */}
              <div className="flex flex-col items-center space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#3c4a42" }}>
                  Access Code
                </span>
                <div
                  className="flex items-center gap-4 px-6 py-4 rounded-xl w-full justify-between"
                  style={{
                    backgroundColor: "#eff3ff",
                    border: "1px solid #bbcabf",
                    boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
                  }}
                >
                  <span
                    className="text-[32px] font-bold tracking-[0.15em]"
                    style={{ color: "#006c4a", fontFamily: "'Source Serif 4', serif" }}
                  >
                    {shortCode || "------"}
                  </span>
                  <button
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(shortCode || "")
                        setCopiedShort(true)
                        setTimeout(() => setCopiedShort(false), 2000)
                      } catch {}
                    }}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors group"
                    style={{ color: "#006c49" }}
                  >
                    <span className="material-symbols-outlined !text-xl group-active:scale-90 transition-transform">
                      {copiedShort ? "done" : "content_copy"}
                    </span>
                    <span>{copiedShort ? "Copied" : "Copy Code"}</span>
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1" style={{ backgroundColor: "#bbcabf" }} />
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6c7a71" }}>OR</span>
                <div className="h-px flex-1" style={{ backgroundColor: "#bbcabf" }} />
              </div>

              {/* Exam Link */}
              <div className="flex flex-col items-center space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#3c4a42" }}>
                  Exam Link
                </span>
                <div
                  className="flex items-center gap-3 px-6 py-3 rounded-full w-full justify-between overflow-hidden"
                  style={{
                    backgroundColor: "rgba(16,185,129,0.08)",
                    border: "1px solid rgba(0,108,73,0.2)",
                  }}
                >
                  <span className="text-sm italic truncate" style={{ color: "#00422b" }}>
                    {shortUrl || publishedUrl}
                  </span>
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-2 text-sm font-semibold transition-colors flex-shrink-0 group"
                    style={{ color: "#006c4a" }}
                  >
                    <span className="material-symbols-outlined !text-xl group-active:scale-90 transition-transform">
                      {copied ? "done" : "link"}
                    </span>
                    <span>{copied ? "Copied" : "Copy Link"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col md:flex-row items-center gap-6 w-full md:w-auto">
            <Link href="/dashboard/exams" className="w-full md:w-auto">
              <button
                className="w-full px-10 py-5 font-bold text-sm rounded-full shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#006c49",
                  color: "#ffffff",
                }}
              >
                Go to Dashboard
                <span className="material-symbols-outlined !text-xl">arrow_forward</span>
              </button>
            </Link>
            <a
              href={publishedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full md:w-auto"
            >
              <button
                className="w-full px-10 py-5 font-bold text-sm rounded-full transition-all active:scale-95 flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "#e6eeff",
                  border: "1px solid #bbcabf",
                  color: "#121c2a",
                }}
              >
                <span className="material-symbols-outlined !text-xl">visibility</span>
                View Exam Preview
              </button>
            </a>
          </div>
        </div>

        <ConfettiAnimation />
      </div>
    )
  }

  const asConf = autosaveConfig[autosaveStatus]
  const stepHeader = STEP_HEADERS[currentStep]

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto"
      style={{
        backgroundColor: "#fcfbf7",
        backgroundImage: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.4) 0%, transparent 100%)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        .glass-panel {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          box-shadow: 0 12px 32px -4px rgba(55, 65, 81, 0.08);
        }
        .form-well {
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.03);
        }
        .step-content {
          animation: fadeInSlideUp 0.35s ease-out;
        }
        @keyframes fadeInSlideUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Top Navigation */}
      <div className="fixed top-0 left-0 z-10 w-full px-4 py-6 md:px-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2" style={{ fontFamily: "'Source Serif 4', serif", fontSize: "24px", fontWeight: 700, color: "#006c49" }}>
            <School size={28} color="#006c49" />
            Dee Soar CBT
          </div>

          <nav className="flex items-center gap-4 rounded-full border bg-white p-2 shadow-sm" style={{ borderColor: "#bbcabf" }}>
            {STEPS.map((step, i) => {
              const isActive = i === currentStep
              const isPast = i < currentStep
              return (
                <div key={step.id} className="flex items-center">
                  <button
                    type="button"
                    onClick={() => isPast && goToStep(i)}
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-semibold transition-all",
                      "tracking-[0.02em]",
                      isActive && "text-white",
                      isPast && "cursor-pointer opacity-70 hover:opacity-100",
                      !isActive && !isPast && "cursor-default opacity-70",
                    )}
                    style={{
                      backgroundColor: isActive ? "#006c49" : "transparent",
                      color: isActive ? "white" : "#3c4a42",
                    }}
                  >
                    {step.label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <div className="mx-2 h-px w-3" style={{ backgroundColor: "#bbcabf" }} />
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex w-full flex-grow flex-col items-center px-4 pb-12 pt-[140px] md:px-10 md:pt-[120px]">
        <div className="w-full max-w-3xl">
          {/* Alerts */}
          {restored && (
            <div
              className="mb-6 flex items-center gap-3 rounded-lg p-4 text-sm animate-in fade-in slide-in-from-top-2"
              style={{ backgroundColor: "#d9e3f7", color: "#005236" }}
            >
              <Sparkles size={16} className="shrink-0" />
              <span className="flex-1">Draft restored from your last session.</span>
              <button
                type="button"
                onClick={() => setRestored(false)}
                className="shrink-0 text-xs font-semibold uppercase tracking-wider underline"
                style={{ color: "#006c49" }}
              >
                Dismiss
              </button>
            </div>
          )}

          {publishError && (
            <div
              className="mb-6 flex items-start gap-2.5 rounded-lg p-4 text-sm animate-in fade-in slide-in-from-top-2 shake-error"
              style={{ backgroundColor: "#ffdad6", color: "#93000a" }}
            >
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{publishError}</span>
            </div>
          )}

          {/* Glass Panel Card */}
          <section className="glass-panel overflow-hidden rounded-xl border border-white">
            {/* Step Header */}
            <div className="border-b px-6 py-10 text-center md:px-12" style={{ borderColor: "#dee9fd", backgroundColor: "#eff3ff" }}>
              <h1
                className="mb-2"
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontSize: "32px",
                  lineHeight: "40px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#121c2a",
                }}
              >
                {stepHeader.title}
              </h1>
              <p className="mx-auto max-w-md text-sm leading-relaxed" style={{ color: "#3c4a42" }}>
                {stepHeader.description}
              </p>

              {/* Autosave + Clear */}
              <div className="mt-4 flex items-center justify-center gap-3">
                <span
                  className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
                  style={{ borderColor: "currentColor", color: asConf.className.includes("text-") ? asConf.className.replace("text-", "#") : "#6c7a71" }}
                >
                  {asConf.icon}
                  {asConf.text}
                </span>
                {(draft.basicInfo.title || draft.questions.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    className="flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition-colors"
                    style={{ borderColor: "#bbcabf", color: "#6c7a71" }}
                  >
                    <Trash2 size={12} />
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Form Content */}
            <div className="space-y-8 p-6 md:p-8">
              <div key={currentStep} className="step-content">
                <FormProvider {...form}>
                  {currentStep === 0 && <BasicInfoStep subjects={subjects} classes={classes} terms={terms} />}
                  {currentStep === 1 && (
                    <QuestionBuilderStep
                      ref={questionBuilderRef}
                      questions={draft.questions}
                      onChange={(questions) => {
                        const updated = { ...draft, questions }
                        setDraft(updated)
                        saveDraftToStorage(updated)
                      }}
                    />
                  )}
                  {currentStep === 2 && (
                    <SettingsStep
                      settings={draft.settings}
                      onChange={(settings) => {
                        const updated = { ...draft, settings }
                        setDraft(updated)
                        saveDraftToStorage(updated)
                      }}
                    />
                  )}
                  {currentStep === 3 && (
                    <ReviewPublishStep
                      basicInfo={draft.basicInfo}
                      questions={draft.questions}
                      settings={draft.settings}
                    />
                  )}
                </FormProvider>
              </div>
            </div>

            {/* Footer Actions */}
            <div
              className="flex items-center justify-between border-t px-6 py-5 md:px-8"
              style={{ borderColor: "#dee9fd", backgroundColor: "#eff3ff" }}
            >
              <Link href="/dashboard/exams">
                <button
                  type="button"
                  className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all hover:opacity-80"
                  style={{ color: "#6c7a71" }}
                >
                  <X size={18} />
                  Cancel
                </button>
              </Link>

              <div className="flex items-center gap-3">
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: "transparent",
                      border: "1px solid #bbcabf",
                      color: "#3c4a42",
                    }}
                  >
                    <ChevronLeft size={18} />
                    Back
                  </button>
                )}
                {currentStep < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-all hover:brightness-105 active:scale-[0.98]"
                    style={{
                      backgroundColor: "#10b981",
                      color: "#00422b",
                      boxShadow: "0 4px 12px rgba(0,108,73,0.2)",
                    }}
                  >
                    Next Step
                    <ArrowRight size={18} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
                    style={{
                      backgroundColor: "#10b981",
                      color: "#00422b",
                      boxShadow: "0 4px 12px rgba(0,108,73,0.2)",
                    }}
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Publishing...
                      </>
                    ) : (
                      <>
                        Publish Exam
                        <Zap size={18} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Tips Section */}
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3" style={{ opacity: 0.8 }}>
            {TIPS.map((tip) => (
              <div key={tip.title} className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: "#82f5c1" }}>
                  <tip.icon size={16} color="#006c49" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#121c2a" }}>{tip.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#3c4a42" }}>{tip.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

function ConfettiAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const colors = ["#10b981", "#006c49", "#6ffbbe", "#f9f9ff", "#85f8c4"]
    const pieces = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4,
      speed: Math.random() * 3 + 2,
      rotationSpeed: Math.random() * 10 - 5,
    }))
    let frameId: number
    function animate() {
      if (!ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      pieces.forEach((p) => {
        p.y += p.speed
        p.rotation += p.rotationSpeed
        if (p.y > canvas.height) {
          p.y = -20
          p.x = Math.random() * canvas.width
        }
        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rotation * Math.PI) / 180)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size)
        ctx.restore()
      })
      frameId = requestAnimationFrame(animate)
    }
    animate()
    return () => cancelAnimationFrame(frameId)
  }, [])

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
}
