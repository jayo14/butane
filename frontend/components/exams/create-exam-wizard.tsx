"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useForm, FormProvider, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Check, ChevronLeft, ChevronRight, Cloud, CloudOff, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAutosave, type AutosaveStatus } from "@/hooks/use-autosave"
import { BasicInfoStep } from "./steps/basic-info-step"
import { QuestionBuilderStep, type QuestionBuilderHandle } from "./steps/question-builder-step"
import { SettingsStep } from "./steps/settings-step"
import { ReviewPublishStep } from "./steps/review-publish-step"
import type { Question, ExamSettings } from "@/types/exam"

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
    term: "",
    duration: 60,
    questionCount: 10,
    instructions: "",
  },
  questions: [],
  settings: defaultSettings,
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
  { label: "Grade 7", value: "grade-7" },
  { label: "Grade 8", value: "grade-8" },
  { label: "Grade 9", value: "grade-9" },
  { label: "Grade 10", value: "grade-10" },
  { label: "Grade 11", value: "grade-11" },
  { label: "Grade 12", value: "grade-12" },
]

const terms = [
  { label: "First Term", value: "first-term" },
  { label: "Second Term", value: "second-term" },
  { label: "Third Term", value: "third-term" },
]

const steps = [
  { id: "basic-info", label: "Basic Information", description: "Exam details & settings" },
  { id: "questions", label: "Questions", description: "Add exam questions" },
  { id: "settings", label: "Settings", description: "Exam configuration" },
  { id: "review", label: "Review & Publish", description: "Final review" },
]

const autosaveStatusConfig: Record<AutosaveStatus, { icon: React.ReactNode; text: string; className: string }> = {
  idle: { icon: <CloudOff size={14} />, text: "Unsaved", className: "text-content-muted" },
  saving: { icon: <Loader2 size={14} className="animate-spin" />, text: "Saving...", className: "text-warning" },
  saved: { icon: <Cloud size={14} />, text: "Saved", className: "text-success" },
  error: { icon: <CloudOff size={14} />, text: "Save failed", className: "text-danger" },
}

export function CreateExamWizard() {
  const [currentStep, setCurrentStep] = useState(0)
  const [draft, setDraft] = useState<ExamDraft>(initialDraft)
  const [isPublishing, setIsPublishing] = useState(false)
  const [published, setPublished] = useState(false)
  const questionBuilderRef = useRef<QuestionBuilderHandle>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [currentStep])

  const form = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema) as unknown as Resolver<BasicInfoValues>,
    mode: "onBlur",
    defaultValues: draft.basicInfo,
  })

  const { watch } = form
  const watchedBasicInfo = watch()

  const saveDraft = useCallback(async (data: ExamDraft) => {
    await new Promise((r) => setTimeout(r, 800))
    setDraft(data)
  }, [])

  const { status: autosaveStatus, triggerSave } = useAutosave({
    data: { ...draft, basicInfo: watchedBasicInfo },
    onSave: saveDraft,
    delay: 3000,
  })

  async function handleNext() {
    if (currentStep === 0) {
      const isValid = await form.trigger()
      if (!isValid) return
      setDraft((prev) => ({ ...prev, basicInfo: form.getValues() }))
    }

    if (currentStep === 1) {
      const isValid = questionBuilderRef.current?.validate() ?? false
      if (!isValid) return
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1)
    }
  }

  function handleBack() {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }

  async function handlePublish() {
    setIsPublishing(true)
    triggerSave()
    await new Promise((r) => setTimeout(r, 2000))
    setIsPublishing(false)
    setPublished(true)
  }

  if (published) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-content-primary">Create New Exam</h1>
          <p className="mt-1 text-content-secondary">Set up a computer-based test in a few steps</p>
        </div>
        <div className="rounded-2xl border border-border-primary bg-white p-6 md:p-8">
          <ReviewPublishStep
            basicInfo={draft.basicInfo}
            questions={draft.questions}
            settings={draft.settings}
          />
        </div>
      </div>
    )
  }

  const asConfig = autosaveStatusConfig[autosaveStatus]

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-content-primary">Create New Exam</h1>
        <p className="mt-1 text-content-secondary">Set up a computer-based test in a few steps</p>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.id} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-300",
                    i < currentStep && "bg-success text-white",
                    i === currentStep && "bg-primary text-white ring-4 ring-primary/20",
                    i > currentStep && "bg-surface-secondary text-content-muted",
                  )}
                >
                  {i < currentStep ? <Check size={18} /> : i + 1}
                </div>
                <div className="mt-2 hidden text-center md:block">
                  <p
                    className={cn(
                      "text-xs font-medium",
                      i <= currentStep ? "text-content-primary" : "text-content-muted",
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-content-muted">{step.description}</p>
                </div>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={cn(
                    "mx-4 h-px w-12 sm:w-16 md:w-24 transition-colors duration-300",
                    i < currentStep ? "bg-success" : "bg-border-primary",
                  )}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Autosave Indicator */}
      <div className="mb-4 flex items-center justify-end gap-1.5">
        <span className={cn("flex items-center gap-1 text-xs", asConfig.className)}>
          {asConfig.icon}
          {asConfig.text}
        </span>
      </div>

      {/* Step Content */}
      <div ref={contentRef} className="rounded-2xl border border-border-primary bg-white p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        <FormProvider {...form}>
          {currentStep === 0 && (
            <BasicInfoStep subjects={subjects} classes={classes} terms={terms} />
          )}
          {currentStep === 1 && (
            <QuestionBuilderStep
              ref={questionBuilderRef}
              questions={draft.questions}
              onChange={(questions) => setDraft((prev) => ({ ...prev, questions }))}
            />
          )}
          {currentStep === 2 && (
            <SettingsStep
              settings={draft.settings}
              onChange={(settings) => setDraft((prev) => ({ ...prev, settings }))}
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

      {/* Progress bar */}
      <div className="mt-4 h-1 w-full rounded-full bg-surface-secondary overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Footer Buttons */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <Button variant="outline" onClick={handleBack} leftIcon={<ChevronLeft size={18} />}>
              Back
            </Button>
          )}
          <span className="text-xs text-content-muted">
            Step {currentStep + 1} of {steps.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-content-muted md:block">
            <kbd className="rounded-md border border-border-primary px-1.5 py-0.5 text-[10px] bg-surface-secondary">Ctrl</kbd>
            + <kbd className="rounded-md border border-border-primary px-1.5 py-0.5 text-[10px] bg-surface-secondary">→</kbd>
            {" "}next
          </span>
          {currentStep < steps.length - 1 ? (
            <Button onClick={handleNext} rightIcon={<ChevronRight size={18} />}>
              Continue
            </Button>
          ) : (
            <Button onClick={handlePublish} isLoading={isPublishing} leftIcon={<Cloud size={18} />}>
              {isPublishing ? "Publishing..." : "Publish Exam"}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
