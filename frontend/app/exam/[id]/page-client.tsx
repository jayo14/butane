"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  const router = useRouter()
  const [studentName, setStudentName] = useState("")

  const config = statusConfig[exam.status] ?? { label: exam.status, className: "bg-[#006c49]/10 text-[#006c49]" }
  const canStart = exam.status === "scheduled" || exam.status === "ongoing"

  function handleBegin() {
    if (!studentName.trim()) return
    const params = new URLSearchParams({
      name: studentName.trim(),
    })
    router.push(`/exam/${exam.id}/take?${params.toString()}`)
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden" style={{ backgroundColor: "#f9f9ff" }}>
      <div className="fixed inset-0 z-0">
        <img
          alt=""
          className="w-full h-full object-cover"
          src="https://lh3.googleusercontent.com/aida/AP1WRLvv2YfmA6tY0ktcl3gG2FKvnn5RQvODs0DvcFdOFKaS1EgI3uVf3q89_xyfs2xohgyMZTiYmoemLwKDTs_XtoBdYNvBbg5kPp3OU1x2LPMms2WisLRmt0UWJZ5BVsCl7wZGT2WvUdlLksVCK3a4IdCnJvWK9FoYeLenv-vFHve_P0nWGCEdDiyNnjtKBI5eYmGthNnVYDcPR3IRJYSIcWswGPYM5Iof77PN5zph9sZcuj7a1NnXJ94EHw_y"
        />
        <div className="absolute inset-0" style={{ backgroundColor: "rgba(0,0,0,0.05)" }} />
      </div>

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

            {/* Info Grid - 5 columns */}
            <div className="px-8 mb-8">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  {
                    icon: "schedule",
                    label: "Duration",
                    value: `${exam.duration_minutes} mins`,
                    accent: "#10b981",
                    bgLight: "rgba(16,185,129,0.08)",
                  },
                  {
                    icon: "quiz",
                    label: "Questions",
                    value: `${exam.question_count} Total`,
                    accent: "#3b82f6",
                    bgLight: "rgba(59,130,246,0.08)",
                  },
                  {
                    icon: "book",
                    label: "Subject",
                    value: subjectLabels[(exam as any).subject] || exam.course || "General",
                    accent: "#8b5cf6",
                    bgLight: "rgba(139,92,246,0.08)",
                  },
                  {
                    icon: "group",
                    label: "Class",
                    value: (exam as any).class_group || "General",
                    accent: "#f59e0b",
                    bgLight: "rgba(245,158,11,0.08)",
                  },
                  {
                    icon: "calendar_month",
                    label: "Term",
                    value: (exam as any).term || "General",
                    accent: "#ec4899",
                    bgLight: "rgba(236,72,153,0.08)",
                  },
                ].map((card) => (
                  <div
                    key={card.label}
                    className="group relative overflow-hidden rounded-xl border transition-all hover:-translate-y-0.5 hover:shadow-md"
                    style={{
                      borderColor: "rgba(187,202,191,0.25)",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    {/* Top accent bar */}
                    <div
                      className="h-1 w-full transition-all group-hover:h-1.5"
                      style={{ backgroundColor: card.accent }}
                    />
                    <div className="p-4 flex flex-col items-center gap-2 relative">
                      {/* Decorative icon background */}
                      <div
                        className="absolute -right-3 -top-3 text-[56px] leading-none select-none transition-all group-hover:scale-110"
                        style={{
                          color: card.bgLight,
                          fontFamily: "'Material Symbols Outlined'",
                          opacity: 0.5,
                        }}
                      >
                        {card.icon}
                      </div>
                      <span
                        className="flex items-center justify-center size-9 rounded-full text-base transition-all group-hover:scale-110"
                        style={{ backgroundColor: card.bgLight, color: card.accent }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{card.icon}</span>
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#6c7a71" }}>
                        {card.label}
                      </span>
                      <span
                        className="text-base font-bold leading-tight text-center"
                        style={{ color: card.accent, fontFamily: "'Source Serif 4', serif" }}
                      >
                        {card.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form - only name */}
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


              </div>
            </div>

            {/* Action */}
            <div className="w-full text-center pt-8 pb-14 px-8">
              <button
                type="button"
                onClick={handleBegin}
                disabled={!studentName.trim() || !canStart}
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
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
