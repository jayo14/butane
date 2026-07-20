"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink, Clock, Users, Shuffle, Eye, Lock, Calendar } from "lucide-react"
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

  const totalMarks = questions.length

  const examLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/exam/${basicInfo.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`
      : ""

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

  const configItems = [
    { label: `Time Limit: ${basicInfo.duration} Minutes`, enabled: true },
    { label: "Shuffle Question Order", enabled: settings.shuffleQuestions },
    { label: "Shuffle Answer Order", enabled: settings.shuffleAnswers },
    { label: "Results visible immediately", enabled: settings.showResult },
    { label: "Allow Review", enabled: settings.allowReview },
  ]

  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: "#121c2a" }}>
            Exam Preview
          </h2>
          <button
            type="button"
            onClick={() => setShowPreview(false)}
            className="rounded-full border px-5 py-2 text-sm font-semibold transition-all"
            style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
          >
            Back to Review
          </button>
        </div>

        <div
          className="rounded-xl border p-4"
          style={{ borderColor: "#bbcabf", backgroundColor: "#eff3ff" }}
        >
          <h3 className="font-semibold" style={{ color: "#121c2a" }}>
            {basicInfo.title}
          </h3>
          <p className="mt-1 text-xs" style={{ color: "#3c4a42" }}>
            {subjectLabels[basicInfo.subject] || basicInfo.subject} &middot;{" "}
            {classLabels[basicInfo.class] || basicInfo.class}
          </p>
          {basicInfo.instructions && (
            <div className="mt-3 rounded-lg bg-white p-3 text-sm" style={{ color: "#3c4a42" }}>
              <p className="mb-1 text-xs font-medium" style={{ color: "#6c7a71" }}>
                Instructions:
              </p>
              <p>{basicInfo.instructions}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {questions.map((q, i) => (
            <div
              key={q.id}
              className="rounded-xl border bg-white p-5"
              style={{ borderColor: "#bbcabf" }}
            >
              <div className="mb-3 flex items-center gap-3">
                <span
                  className="flex size-7 items-center justify-center rounded-lg text-xs font-semibold"
                  style={{ backgroundColor: "rgba(0,108,73,0.1)", color: "#006c49" }}
                >
                  {i + 1}
                </span>
                <p className="text-sm font-medium" style={{ color: "#121c2a" }}>
                  {q.text}
                </p>
                <span className="ml-auto text-xs" style={{ color: "#6c7a71" }}>
                  {totalMarks > 0 ? `${1} mark` : ""}
                </span>
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = opt.id === q.correctAnswerId
                  return (
                    <div
                      key={opt.id}
                      className="flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm"
                      style={{
                        borderColor: isCorrect ? "rgba(0,108,73,0.5)" : "#bbcabf",
                        backgroundColor: isCorrect ? "rgba(0,108,73,0.05)" : "transparent",
                        color: isCorrect ? "#006c49" : "#121c2a",
                      }}
                    >
                      <span
                        className="flex size-7 items-center justify-center rounded-lg text-xs font-medium"
                        style={{
                          backgroundColor: isCorrect ? "#006c49" : "#eff3ff",
                          color: isCorrect ? "white" : "#6c7a71",
                        }}
                      >
                        {["A", "B", "C", "D"][oi]}
                      </span>
                      {opt.text}
                      {isCorrect && <Check size={14} className="ml-auto shrink-0" />}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border p-6 md:p-8 relative overflow-hidden"
      style={{
        borderColor: "rgba(187,202,191,0.3)",
        backgroundImage:
          "url('https://www.transparenttextures.com/patterns/natural-linen.png')",
        backgroundBlendMode: "overlay",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 24px -10px rgba(55,65,81,0.12)",
      }}
    >
      {/* Decorative accent */}
      <div
        className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: "rgba(111,251,190,0.15)",
          filter: "blur(48px)",
          transform: "translate(20%, -20%)",
        }}
      />

      <div className="relative z-10">
        {/* Summary bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Primary Identity Card full width */}
          <div
            className="md:col-span-2 rounded-xl border p-6"
            style={{
              borderColor: "rgba(187,202,191,0.5)",
              backgroundColor: "#eff3ff",
              boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.05)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#006c49" }}
                >
                  Exam Title
                </span>
                <h2
                  className="mt-1 text-xl font-semibold"
                  style={{
                    color: "#121c2a",
                    fontFamily: "'Source Serif 4', serif",
                  }}
                >
                  {basicInfo.title}
                </h2>
                {basicInfo.instructions && (
                  <p className="mt-2 text-sm" style={{ color: "#3c4a42" }}>
                    {basicInfo.instructions}
                  </p>
                )}
              </div>
              <div
                className="flex size-12 items-center justify-center rounded-xl shrink-0"
                style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
              >
                <span
                  className="material-symbols-outlined text-3xl"
                  style={{ color: "#006c49", fontVariationSettings: "'FILL' 0, 'wght' 300" }}
                >
                  school
                </span>
              </div>
            </div>
          </div>

          {/* Subject & Class */}
          <div className="space-y-6">
            <div
              className="rounded-xl border bg-white p-6 flex items-center gap-4"
              style={{ borderColor: "rgba(187,202,191,0.3)" }}
            >
              <div
                className="flex size-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#d9e3f7" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#3c4a42", fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  subject
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3c4a42" }}>
                  Subject
                </p>
                <p className="text-sm font-semibold" style={{ color: "#121c2a" }}>
                  {subjectLabels[basicInfo.subject] || basicInfo.subject}
                </p>
              </div>
            </div>

            <div
              className="rounded-xl border bg-white p-6 flex items-center gap-4"
              style={{ borderColor: "rgba(187,202,191,0.3)" }}
            >
              <div
                className="flex size-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: "#d9e3f7" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ color: "#3c4a42", fontVariationSettings: "'FILL' 0, 'wght' 400" }}
                >
                  quiz
                </span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#3c4a42" }}>
                  Questions
                </p>
                <p className="text-sm font-semibold" style={{ color: "#121c2a" }}>
                  {questions.length} Multiple Choice
                </p>
              </div>
            </div>
          </div>

          {/* Configuration */}
          <div
            className="rounded-xl border bg-white p-6"
            style={{ borderColor: "rgba(187,202,191,0.3)" }}
          >
            <p
              className="text-xs font-bold uppercase tracking-wider mb-4"
              style={{ color: "#3c4a42" }}
            >
              Configuration
            </p>
            <ul className="space-y-4">
              {configItems
                .filter((item) => item.enabled)
                .map((item) => (
                  <li key={item.label} className="flex items-center gap-3">
                    <span
                      className="material-symbols-outlined text-sm shrink-0"
                      style={{ color: "#006c49", fontVariationSettings: "'FILL' 1, 'wght' 400" }}
                    >
                      check_circle
                    </span>
                    <span className="text-sm" style={{ color: "#121c2a" }}>
                      {item.label}
                    </span>
                  </li>
                ))}
              {configItems.filter((item) => item.enabled).length === 0 && (
                <li className="text-sm" style={{ color: "#6c7a71" }}>
                  No special configuration enabled
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="mt-6 grid grid-cols-3 gap-4 rounded-xl border p-4"
          style={{ borderColor: "rgba(187,202,191,0.3)", backgroundColor: "#fcfbf7" }}
        >
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>
              Duration
            </p>
            <p
              className="mt-1 text-lg font-bold"
              style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}
            >
              {basicInfo.duration}
              <span className="text-sm font-semibold" style={{ color: "#3c4a42" }}>
                {" "}
                min
              </span>
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>
              Questions
            </p>
            <p
              className="mt-1 text-lg font-bold"
              style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}
            >
              {questions.length}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>
              Pass Mark
            </p>
            <p
              className="mt-1 text-lg font-bold"
              style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}
            >
              {settings.passMark}
              <span className="text-sm font-semibold" style={{ color: "#3c4a42" }}>
                %
              </span>
            </p>
          </div>
        </div>

        {/* Link preview */}
        <div
          className="mt-6 flex items-center gap-3 rounded-xl border p-4"
          style={{ borderColor: "rgba(187,202,191,0.3)", backgroundColor: "#eff3ff" }}
        >
          <div
            className="flex size-10 items-center justify-center rounded-lg shrink-0"
            style={{ backgroundColor: "rgba(0,108,73,0.1)" }}
          >
            <ExternalLink size={18} style={{ color: "#006c49" }} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold" style={{ color: "#6c7a71" }}>
              Generated Exam Link
            </p>
            <p className="truncate text-sm" style={{ color: "#121c2a" }}>
              {examLink || "Link will be generated on publish"}
            </p>
          </div>
          <button
            type="button"
            onClick={copyLink}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:brightness-105 active:scale-95 shrink-0"
            style={{
              backgroundColor: copied ? "#006c49" : "#10b981",
              color: "#00422b",
            }}
          >
            {copied ? (
              <>
                <Check size={14} /> Copied
              </>
            ) : (
              <>
                <Copy size={14} /> Copy
              </>
            )}
          </button>
        </div>

        {/* Preview exam button */}
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all"
            style={{
              backgroundColor: "transparent",
              border: "1px solid #bbcabf",
              color: "#3c4a42",
            }}
          >
            <Eye size={18} />
            Preview Full Exam
          </button>
        </div>
      </div>
    </div>
  )
}
