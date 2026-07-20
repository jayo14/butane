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
  const [admissionNo, setAdmissionNo] = useState("")

  const config = statusConfig[exam.status] ?? { label: exam.status, className: "bg-[#006c49]/10 text-[#006c49]" }
  const canStart = exam.status === "scheduled" || exam.status === "ongoing"

  function handleBegin() {
    if (!studentName.trim() || !admissionNo.trim()) return
    const params = new URLSearchParams({
      name: studentName.trim(),
      admission: admissionNo.trim(),
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
              <div
                className="grid grid-cols-2 md:grid-cols-5 rounded-xl border overflow-hidden"
                style={{ borderColor: "rgba(187,202,191,0.3)" }}
              >
                <div className="p-5 flex flex-col items-center" style={{ backgroundColor: "#eff3ff" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "#6c7a71" }}>
                    <span className="material-symbols-outlined text-sm">schedule</span>
                    Duration
                  </span>
                  <span className="text-lg font-semibold" style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}>
                    {exam.duration_minutes} mins
                  </span>
                </div>
                <div className="p-5 flex flex-col items-center" style={{ backgroundColor: "#eff3ff" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "#6c7a71" }}>
                    <span className="material-symbols-outlined text-sm">quiz</span>
                    Questions
                  </span>
                  <span className="text-lg font-semibold" style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}>
                    {exam.question_count} Total
                  </span>
                </div>
                <div className="p-5 flex flex-col items-center" style={{ backgroundColor: "#eff3ff" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "#6c7a71" }}>
                    <span className="material-symbols-outlined text-sm">book</span>
                    Subject
                  </span>
                  <span className="text-lg font-semibold" style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}>
                    {subjectLabels[(exam as any).subject] || exam.course || "General"}
                  </span>
                </div>
                <div className="p-5 flex flex-col items-center" style={{ backgroundColor: "#eff3ff" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "#6c7a71" }}>
                    <span className="material-symbols-outlined text-sm">group</span>
                    Class
                  </span>
                  <span className="text-lg font-semibold" style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}>
                    {(exam as any).class_group || "General"}
                  </span>
                </div>
                <div className="p-5 flex flex-col items-center" style={{ backgroundColor: "#eff3ff" }}>
                  <span className="text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center gap-1" style={{ color: "#6c7a71" }}>
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Term
                  </span>
                  <span className="text-lg font-semibold" style={{ color: "#006c49", fontFamily: "'Source Serif 4', serif" }}>
                    {(exam as any).term || "General"}
                  </span>
                </div>
              </div>
            </div>

            {/* Form - only name and admission */}
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
              </div>
            </div>

            {/* Action */}
            <div className="w-full text-center pt-8 pb-14 px-8">
              <button
                type="button"
                onClick={handleBegin}
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
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
