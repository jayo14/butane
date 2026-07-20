"use client"

import { useState } from "react"
import type { ApiPublicExam } from "@/lib/api"

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-[#D97706]/20 text-[#D97706]" },
  ongoing: { label: "In Progress", className: "bg-[#10b981]/20 text-[#006c49]" },
  completed: { label: "Completed", className: "bg-[#6c7a71]/20 text-[#6c7a71]" },
  cancelled: { label: "Cancelled", className: "bg-[#ba1a1a]/20 text-[#ba1a1a]" },
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

interface StudentWelcomePageClientProps {
  exam: ApiPublicExam
}

export function StudentWelcomePageClient({ exam }: StudentWelcomePageClientProps) {
  const [studentName, setStudentName] = useState("")
  const [admissionNo, setAdmissionNo] = useState("")
  const [selectedClass, setSelectedClass] = useState("sss1")
  const [selectedTerm, setSelectedTerm] = useState("first-term")
  const [started, setStarted] = useState(false)

  const config = statusConfig[exam.status] ?? { label: exam.status, className: "bg-[#006c49]/10 text-[#006c49]" }
  const canStart = exam.status === "scheduled" || exam.status === "ongoing"

  if (started) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#f9f9ff" }}>
        <div className="w-full max-w-lg text-center">
          <div
            className="rounded-xl border p-8"
            style={{ borderColor: "rgba(187,202,191,0.3)", backgroundColor: "#ffffff", boxShadow: "0 12px 32px -4px rgba(55,65,81,0.08)" }}
          >
            <div
              className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#82f5c1" }}
            >
              <span className="material-symbols-outlined text-3xl" style={{ color: "#006c49", fontVariationSettings: "'FILL' 1" }}>
                check_circle
              </span>
            </div>
            <h1 className="text-xl font-bold" style={{ color: "#121c2a" }}>
              Exam Started
            </h1>
            <p className="mt-2 text-sm" style={{ color: "#3c4a42" }}>
              The exam interface is loading. In production, questions would appear here.
            </p>
            <div
              className="mt-6 rounded-xl p-4 text-left"
              style={{ backgroundColor: "#eff3ff" }}
            >
              <p className="text-xs" style={{ color: "#6c7a71" }}>Student: {studentName}</p>
              <p className="mt-0.5 text-xs" style={{ color: "#6c7a71" }}>Admission: {admissionNo}</p>
              <p className="mt-0.5 text-xs" style={{ color: "#6c7a71" }}>Exam: {exam.title}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: "#f9f9ff" }}>
      {/* Background image overlay */}
      <div className="fixed inset-0 z-0">
        <img
          alt=""
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida/AP1WRLvv2YfmA6tY0ktcl3gG2FKvnn5RQvODs0DvcFdOFKaS1EgI3uVf3q89_xyfs2xohgyMZTiYmoemLwKDTs_XtoBdYNvBbg5kPp3OU1x2LPMms2WisLRmt0UWJZ5BVsCl7wZGT2WvUdlLksVCK3a4IdCnJvWK9FoYeLenv-vFHve_P0nWGCEdDiyNnjtKBI5eYmGthNnVYDcPR3IRJYSIcWswGPYM5Iof77PN5zph9sZcuj7a1NnXJ94EHw_y"
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />
      </div>

      {/* Centered card */}
      <main className="min-h-screen w-full flex items-center justify-center p-6 relative z-10">
        <section
          className="max-w-3xl w-full overflow-hidden rounded-xl border"
          style={{
            borderColor: "rgba(187,202,191,0.3)",
            backgroundColor: "#ffffff",
            boxShadow: "0 12px 32px -4px rgba(55,65,81,0.08)",
          }}
        >
          <div className="flex flex-col">
            {/* Top: Exam Title */}
            <div className="w-full text-center pt-14 pb-8 px-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <h1
                  className="text-[32px] font-bold leading-tight tracking-[-0.01em]"
                  style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}
                >
                  {exam.title}
                </h1>
                <span
                  className="rounded-full px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                  style={{ backgroundColor: "#82f5c1", color: "#00422b" }}
                >
                  {config.label}
                </span>
              </div>
              <p className="text-base" style={{ color: "#3c4a42", opacity: 0.8 }}>
                Please verify your details before starting
              </p>
            </div>

            {/* Info Grid */}
            <div className="px-8 mb-8">
              <div
                className="grid grid-cols-1 md:grid-cols-3 rounded-xl border overflow-hidden"
                style={{ borderColor: "rgba(187,202,191,0.3)" }}
              >
                <div
                  className="p-6 flex flex-col items-center"
                  style={{ backgroundColor: "#eff3ff" }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"
                    style={{ color: "#6c7a71" }}
                  >
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Duration
                  </span>
                  <span
                    className="text-xl font-semibold"
                    style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                  >
                    {exam.duration_minutes} mins
                  </span>
                </div>
                <div
                  className="p-6 flex flex-col items-center"
                  style={{ backgroundColor: "#eff3ff" }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"
                    style={{ color: "#6c7a71" }}
                  >
                    <span className="material-symbols-outlined text-sm">quiz</span>
                    Questions
                  </span>
                  <span
                    className="text-xl font-semibold"
                    style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                  >
                    {exam.question_count} Total
                  </span>
                </div>
                <div
                  className="p-6 flex flex-col items-center"
                  style={{ backgroundColor: "#eff3ff" }}
                >
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1"
                    style={{ color: "#6c7a71" }}
                  >
                    <span className="material-symbols-outlined text-sm">book</span>
                    Subject
                  </span>
                  <span
                    className="text-xl font-semibold"
                    style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}
                  >
                    {subjectLabels[(exam as any).subject] || exam.course || "General"}
                  </span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="w-full max-w-xl mx-auto py-4 px-8">
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <label
                    className="flex items-center gap-2 ml-1 text-sm font-semibold tracking-[0.02em]"
                    style={{ color: "#3c4a42" }}
                  >
                    <span className="material-symbols-outlined text-sm">person</span>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="e.g. Julian Henderson"
                    className="w-full p-4 rounded-full border text-base transition-all outline-none"
                    style={{
                      borderColor: "rgba(187,202,191,0.4)",
                      backgroundColor: "#ffffff",
                      color: "#121c2a",
                      boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
                    }}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    className="flex items-center gap-2 ml-1 text-sm font-semibold tracking-[0.02em]"
                    style={{ color: "#3c4a42" }}
                  >
                    <span className="material-symbols-outlined text-sm">badge</span>
                    Admission Number
                  </label>
                  <input
                    type="text"
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    placeholder="e.g. ADM-2023-001"
                    className="w-full p-4 rounded-full border text-base transition-all outline-none"
                    style={{
                      borderColor: "rgba(187,202,191,0.4)",
                      backgroundColor: "#ffffff",
                      color: "#121c2a",
                      boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label
                      className="flex items-center gap-2 ml-1 text-sm font-semibold tracking-[0.02em]"
                      style={{ color: "#3c4a42" }}
                    >
                      <span className="material-symbols-outlined text-sm">group</span>
                      Class
                    </label>
                    <div className="relative">
                      <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="w-full appearance-none rounded-full border py-4 px-4 text-base transition-all outline-none cursor-pointer"
                        style={{
                          borderColor: "rgba(187,202,191,0.4)",
                          backgroundColor: "#ffffff",
                          color: "#121c2a",
                          boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
                        }}
                        aria-label="Select class"
                      >
                        <option value="jss1">JSS1</option>
                        <option value="jss2">JSS2</option>
                        <option value="jss3">JSS3</option>
                        <option value="sss1">SSS1</option>
                        <option value="sss2">SSS2</option>
                        <option value="sss3">SSS3</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4" style={{ color: "#6c7a71" }}>
                        <span className="material-symbols-outlined text-base">expand_more</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label
                      className="flex items-center gap-2 ml-1 text-sm font-semibold tracking-[0.02em]"
                      style={{ color: "#3c4a42" }}
                    >
                      <span className="material-symbols-outlined text-sm">calendar_month</span>
                      Term
                    </label>
                    <div className="relative">
                      <select
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        className="w-full appearance-none rounded-full border py-4 px-4 text-base transition-all outline-none cursor-pointer"
                        style={{
                          borderColor: "rgba(187,202,191,0.4)",
                          backgroundColor: "#ffffff",
                          color: "#121c2a",
                          boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
                        }}
                      >
                        <option value="first-term">First Term</option>
                        <option value="second-term">Second Term</option>
                        <option value="third-term">Third Term</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4" style={{ color: "#6c7a71" }}>
                        <span className="material-symbols-outlined text-base">expand_more</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Info Note */}
                <div
                  className="flex gap-4 p-4 rounded-lg mt-8"
                  style={{
                    backgroundColor: "rgba(16,185,129,0.08)",
                    borderLeft: "4px solid #006c49",
                  }}
                >
                  <span
                    className="material-symbols-outlined shrink-0"
                    style={{ color: "#006c49", fontVariationSettings: "'FILL' 1" }}
                  >
                    info
                  </span>
                  <p className="text-sm font-semibold leading-relaxed" style={{ color: "#3c4a42" }}>
                    Ensure your information matches your student record. Once the exam begins, you cannot change these details.
                  </p>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="w-full text-center pt-8 pb-14 px-8">
              <button
                type="button"
                onClick={() => setStarted(true)}
                disabled={!studentName.trim() || !admissionNo.trim() || !canStart}
                className="group w-full md:w-auto px-12 py-5 font-bold text-base shadow-xl transition-all flex items-center justify-center gap-3 mx-auto rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canStart ? "#006c49" : "#6c7a71",
                  color: "#ffffff",
                }}
              >
                {canStart ? "Begin Exam" : "Exam Not Available"}
                <span
                  className="material-symbols-outlined transition-transform group-hover:translate-x-1"
                  style={{ fontVariationSettings: "'FILL' 0, 'wght' 500" }}
                >
                  arrow_forward
                </span>
              </button>
              <p className="mt-8 text-xs font-bold uppercase tracking-wider" style={{ color: "#6c7a71", opacity: 0.7 }}>
                By clicking &ldquo;Begin Exam&rdquo;, you agree to the{" "}
                <a href="#" className="underline hover:text-[#006c49] transition-colors font-semibold">
                  Academic Integrity Policy
                </a>.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
