"use client"

import { useState } from "react"
import { Check, Copy, CheckCheck, Eye, ExternalLink, Calendar, Clock, Users, Shuffle, Percent, Lock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { BasicInfoValues } from "../create-exam-wizard"
import type { Question, ExamSettings } from "@/types/exam"

interface ReviewPublishStepProps {
  basicInfo: BasicInfoValues
  questions: Question[]
  settings: ExamSettings
}

const subjectLabels: Record<string, string> = {
  mathematics: "Mathematics",
  english: "English Language",
  biology: "Biology",
  physics: "Physics",
  chemistry: "Chemistry",
  history: "History",
  "computer-science": "Computer Science",
  geography: "Geography",
}

const classLabels: Record<string, string> = {
  jss1: "JSS1",
  jss2: "JSS2",
  jss3: "JSS3",
  sss1: "SSS1",
  sss2: "SSS2",
  sss3: "SSS3",
}

const termLabels: Record<string, string> = {
  "first-term": "First Term",
  "second-term": "Second Term",
  "third-term": "Third Term",
}

export function ReviewPublishStep({ basicInfo, questions, settings }: ReviewPublishStepProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [copied, setCopied] = useState(false)
  const [published, setPublished] = useState(false)

  const examLink = `https://deesoar.edu/exam/${basicInfo.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(examLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const input = document.createElement("input")
      input.value = examLink
      document.body.appendChild(input)
      input.select()
      document.execCommand("copy")
      document.body.removeChild(input)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const OPTION_LABELS = ["A", "B", "C", "D"]
  const totalMarks = questions.length

  if (published) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-success-light text-success">
          <CheckCheck size={44} />
        </div>
        <h2 className="text-xl font-bold text-content-primary">Exam Published Successfully</h2>
        <p className="mt-2 max-w-sm text-sm text-content-secondary">
          Your exam is now available for students. Share the link below to give them access.
        </p>

        <div className="mt-8 w-full max-w-md">
          <label className="mb-1.5 block text-left text-xs font-medium text-content-muted">
            Exam Link
          </label>
          <div className="flex items-center gap-2">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-border-primary bg-surface-secondary px-4 py-2.5">
              <ExternalLink size={16} className="shrink-0 text-content-muted" />
              <span className="truncate text-sm text-content-primary">{examLink}</span>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={copyLink}
              leftIcon={copied ? <Check size={18} /> : <Copy size={18} />}
              className={cn(copied && "bg-success hover:bg-success")}
            >
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => setPublished(false)}>
            Back to Review
          </Button>
          <Button variant="primary" onClick={copyLink}>
            Copy Link
          </Button>
        </div>
      </div>
    )
  }

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-content-primary">Exam Preview</h2>
          <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
            Back to Review
          </Button>
        </div>

        <div className="rounded-xl border border-border-primary bg-surface-secondary p-4">
          <h3 className="font-semibold text-content-primary">{basicInfo.title}</h3>
          <p className="mt-1 text-xs text-content-secondary">
            {subjectLabels[basicInfo.subject] || basicInfo.subject} &middot; {classLabels[basicInfo.class] || basicInfo.class}
          </p>
          {basicInfo.instructions && (
            <div className="mt-3 rounded-lg bg-white p-3 text-sm text-content-secondary">
              <p className="text-xs font-medium text-content-muted mb-1">Instructions:</p>
              <p>{basicInfo.instructions}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div key={q.id} className="rounded-xl border border-border-primary bg-white p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                  {i + 1}
                </span>
                <p className="text-sm font-medium text-content-primary">{q.text}</p>
                <span className="ml-auto text-xs text-content-muted">{totalMarks > 0 ? `${1} mark` : ""}</span>
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <div
                    key={opt.id}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm",
                      opt.id === q.correctAnswerId
                        ? "border-success/50 bg-success-light/50 text-success"
                        : "border-border-primary text-content-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-lg text-xs font-medium",
                        opt.id === q.correctAnswerId ? "bg-success text-white" : "bg-surface-secondary text-content-muted",
                      )}
                    >
                      {OPTION_LABELS[oi]}
                    </span>
                    {opt.text}
                    {opt.id === q.correctAnswerId && (
                      <Check size={14} className="ml-auto shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-content-primary">Review & Publish</h2>
        <p className="mt-0.5 text-sm text-content-secondary">
          Review all exam details before publishing
        </p>
      </div>

      {/* Basic Info Summary */}
      <div className="rounded-xl border border-border-primary p-5">
        <h3 className="mb-3 text-sm font-semibold text-content-primary">Exam Information</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Title" value={basicInfo.title} />
          <InfoRow label="Subject" value={subjectLabels[basicInfo.subject] || basicInfo.subject} />
          <InfoRow label="Class" value={classLabels[basicInfo.class] || basicInfo.class} />
          <InfoRow label="Term" value={termLabels[basicInfo.term] || basicInfo.term} />
        </div>
        {basicInfo.instructions && (
          <div className="mt-3 rounded-lg bg-surface-secondary p-3">
            <span className="text-xs font-medium text-content-muted">Instructions:</span>
            <p className="mt-0.5 text-sm text-content-primary">{basicInfo.instructions}</p>
          </div>
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { icon: <Clock size={16} />, label: "Duration", value: `${basicInfo.duration} min` },
          { icon: <Users size={16} />, label: "Questions", value: questions.length.toString() },
          { icon: <Percent size={16} />, label: "Total Marks", value: totalMarks.toString() },
          { icon: <Calendar size={16} />, label: "Pass Mark", value: `${settings.passMark}%` },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border-primary bg-surface-secondary p-3 text-center">
            <div className="mb-1 flex justify-center text-primary">{item.icon}</div>
            <p className="text-xs text-content-muted">{item.label}</p>
            <p className="text-sm font-semibold text-content-primary">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Settings Summary */}
      <div className="rounded-xl border border-border-primary p-5">
        <h3 className="mb-3 text-sm font-semibold text-content-primary">Configuration</h3>
        <div className="space-y-2">
          <ConfigRow icon={<Shuffle size={14} />} label="Shuffle Questions" enabled={settings.shuffleQuestions} />
          <ConfigRow icon={<Shuffle size={14} />} label="Shuffle Answers" enabled={settings.shuffleAnswers} />
          <ConfigRow icon={<Eye size={14} />} label="Show Results Immediately" enabled={settings.showResult} />
          <ConfigRow icon={<Lock size={14} />} label="Allow Review" enabled={settings.allowReview} />
          <ConfigRow
            icon={<Calendar size={14} />}
            label="Availability"
            value={
              settings.availableFrom && settings.availableTo
                ? `${new Date(settings.availableFrom).toLocaleDateString()} - ${new Date(settings.availableTo).toLocaleDateString()}`
                : "Not set"
            }
          />
        </div>
      </div>

      {/* Generated Link Preview */}
      <div className="rounded-xl border border-border-primary bg-surface-secondary p-5">
        <div className="flex items-center gap-2.5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ExternalLink size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-content-muted">Generated Exam Link</p>
            <p className="truncate text-sm text-content-primary">{examLink}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyLink}
            leftIcon={copied ? <Check size={14} /> : <Copy size={14} />}
            className={cn(copied && "text-success border-success")}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <Button variant="outline" onClick={() => setShowPreview(true)} leftIcon={<Eye size={18} />}>
          Preview Exam
        </Button>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-content-muted">{label}</span>
      <p className="text-sm font-medium text-content-primary">{value}</p>
    </div>
  )
}

function ConfigRow({
  icon,
  label,
  enabled,
  value,
}: {
  icon: React.ReactNode
  label: string
  enabled?: boolean
  value?: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1">
      <span className="text-content-muted">{icon}</span>
      <span className="flex-1 text-sm text-content-primary">{label}</span>
      {enabled !== undefined ? (
        enabled ? (
          <Badge variant="success" size="sm">Enabled</Badge>
        ) : (
          <Badge variant="primary" size="sm">Disabled</Badge>
        )
      ) : (
        <span className="text-xs text-content-muted">{value}</span>
      )}
    </div>
  )
}
