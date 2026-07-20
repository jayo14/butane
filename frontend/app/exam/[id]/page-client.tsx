"use client"

import { useState } from "react"
import {
  GraduationCap,
  Clock,
  FileText,
  HelpCircle,
  AlertCircle,
  ChevronRight,
  Shield,
  BarChart3,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatDuration } from "@/lib/utils"
import type { ApiPublicExam } from "@/lib/api"

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-info/20 text-info" },
  ongoing: { label: "In Progress", className: "bg-warning/20 text-warning" },
  completed: { label: "Completed", className: "bg-success/20 text-success" },
  cancelled: { label: "Cancelled", className: "bg-danger/20 text-danger" },
}

interface StudentWelcomePageClientProps {
  exam: ApiPublicExam
}

export function StudentWelcomePageClient({ exam }: StudentWelcomePageClientProps) {
  const [studentName, setStudentName] = useState("")
  const [admissionNo, setAdmissionNo] = useState("")
  const [selectedClass, setSelectedClass] = useState("sss1")
  const [selectedTerm, setSelectedTerm] = useState("first-term")
  const [started, setStarted] = useState(false)

  const config = statusConfig[exam.status] ?? { label: exam.status, className: "bg-primary/10 text-primary" }
  const canStart = exam.status === "scheduled" || exam.status === "ongoing"

  if (started) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-surface-secondary via-white to-baby-pink/10 p-4">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-500 text-center">
          <div className="rounded-2xl border border-border-primary bg-white p-8 shadow-card">
            <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <HelpCircle size={36} />
            </div>
            <h1 className="text-xl font-bold text-content-primary">Exam Started</h1>
            <p className="mt-2 text-sm text-content-secondary">
              The exam interface is loading. In production, questions would appear here.
            </p>
            <div className="mt-6 rounded-xl bg-surface-secondary p-4">
              <p className="text-xs text-content-muted">Student: {studentName}</p>
              <p className="text-xs text-content-muted mt-0.5">Admission: {admissionNo}</p>
              <p className="text-xs text-content-muted mt-0.5">Exam: {exam.title}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-secondary via-white to-baby-pink/10">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 px-4 pb-24 pt-12 md:pb-32 md:pt-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-32 -left-32 size-96 rounded-full bg-white/5" />

        <div className="relative mx-auto max-w-3xl">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur-sm">
                <GraduationCap size="28" />
              </div>
              <div>
                <p className="text-sm font-medium text-white/80">Dee Soar School</p>
                <h1 className="text-2xl font-bold text-white md:text-3xl">Computer-Based Testing</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative mx-auto max-w-3xl -mt-16 px-4 pb-12 md:-mt-24">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          {/* Exam Info Card */}
          <div className="mb-6 rounded-2xl border border-border-primary bg-white p-6 shadow-card md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-content-primary md:text-2xl">{exam.title}</h2>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", config.className)}>
                    {config.label}
                  </span>
                </div>
                <p className="mt-1.5 text-content-secondary">
                  {exam.course} &middot; {exam.course_code}
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { icon: <FileText size={18} />, label: "Questions", value: `${exam.question_count}` },
                { icon: <Clock size={18} />, label: "Duration", value: formatDuration(exam.duration_minutes) },
                { icon: <BarChart3 size={18} />, label: "Total Marks", value: `${exam.total_marks}` },
                { icon: <HelpCircle size={18} />, label: "Pass Mark", value: `${exam.passing_percentage}%` },
              ].map((item, i) => (
                <div
                  key={item.label}
                  className="flex flex-col items-center rounded-xl bg-surface-secondary p-3 text-center animate-in fade-in slide-in-from-bottom-2 duration-300"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <span className="text-primary">{item.icon}</span>
                  <p className="mt-1.5 text-lg font-semibold text-content-primary">{item.value}</p>
                  <p className="text-[11px] text-content-muted">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Student Information Form */}
          <div className="rounded-2xl border border-border-primary bg-white p-6 shadow-card md:p-8">
            <h3 className="mb-1 text-lg font-semibold text-content-primary">Student Information</h3>
            <p className="mb-6 text-sm text-content-secondary">
              Please confirm your details before starting the exam
            </p>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-primary">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Enter your full name"
                    className="block w-full rounded-xl border border-border-primary bg-white px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-primary">Admission Number</label>
                <input
                  type="text"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  placeholder="e.g. STU-001"
                  className="block w-full rounded-xl border border-border-primary bg-white px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-primary">Class</label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-border-primary bg-white px-4 py-2.5 pr-10 text-sm text-content-primary transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20"
                    aria-label="Select class"
                  >
                    <option value="jss1">JSS1</option>
                    <option value="jss2">JSS2</option>
                    <option value="jss3">JSS3</option>
                    <option value="sss1">SSS1</option>
                    <option value="sss2">SSS2</option>
                    <option value="sss3">SSS3</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-content-primary">Term</label>
                <div className="relative">
                  <select
                    value={selectedTerm}
                    onChange={(e) => setSelectedTerm(e.target.value)}
                    className="block w-full appearance-none rounded-xl border border-border-primary bg-white px-4 py-2.5 pr-10 text-sm text-content-primary transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="first-term">First Term</option>
                    <option value="second-term">Second Term</option>
                    <option value="third-term">Third Term</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 rounded-xl border border-border-primary bg-surface-secondary p-4">
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium text-content-primary">Before you start</p>
                  <ul className="mt-2 space-y-1.5 text-sm text-content-secondary">
                    {[
                      "Ensure you have a stable internet connection",
                      `You have ${formatDuration(exam.duration_minutes)} to complete this exam`,
                      "Do not refresh or close the browser during the exam",
                      "You cannot pause once the exam has started",
                    ].map((text, i) => (
                      <li
                        key={text}
                        className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300"
                        style={{ animationDelay: `${i * 80}ms` }}
                      >
                        <span className="size-1.5 rounded-full bg-primary/50 shrink-0" />
                        {text}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-xs text-content-muted">
                <Shield size={14} />
                Secured by Dee Soar CBT System
              </div>
              <Button
                size="lg"
                onClick={() => setStarted(true)}
                disabled={!studentName.trim() || !admissionNo.trim() || !canStart}
                rightIcon={<ChevronRight size={20} />}
                className={cn(
                  "w-full sm:w-auto",
                  !canStart && "opacity-60",
                )}
              >
                {canStart ? "Start Exam" : "Exam Not Available"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
