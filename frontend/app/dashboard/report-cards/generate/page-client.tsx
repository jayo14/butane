"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Search,
  Users,
  FileText,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

interface ReportCardGenerateClientProps {
  initialSessions: any[]
  initialTerms: any[]
  initialClassrooms: any[]
  initialStudents: any[]
}

export function ReportCardGenerateClient({
  initialSessions,
  initialTerms,
  initialClassrooms,
  initialStudents,
}: ReportCardGenerateClientProps) {
  const [selectedSession, setSelectedSession] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [generating, setGenerating] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [studentSearch, setStudentSearch] = useState("")

  const filteredStudents = useMemo(() => {
    if (!studentSearch.trim()) return initialStudents
    const q = studentSearch.toLowerCase()
    return initialStudents.filter(
      (s: any) =>
        s.user?.first_name?.toLowerCase().includes(q) ||
        s.user?.last_name?.toLowerCase().includes(q) ||
        s.admission_number?.toLowerCase().includes(q)
    )
  }, [initialStudents, studentSearch])

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      setSelectedStudents(new Set())
    } else {
      setSelectedStudents(new Set(filteredStudents.map((s: any) => s.id)))
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    // Simulate generation
    await new Promise((r) => setTimeout(r, 2000))
    setGenerating(false)
    setCompleted(true)
  }

  if (completed) {
    return (
      <Container>
        <div className="max-w-2xl mx-auto text-center py-16 animate-slide-up">
          <div className="bg-white rounded-3xl p-12 border border-border-primary/60 shadow-card relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 mx-auto">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-3xl text-content-primary font-bold mb-3">Reports Generated!</h2>
              <p className="text-content-secondary mb-8 max-w-md mx-auto">
                {selectedStudents.size} report cards have been generated and are ready for review and approval.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/dashboard/report-cards/approval"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                >
                  Review & Approve <ArrowRight size={16} />
                </Link>
                <button
                  onClick={() => { setCompleted(false); setSelectedStudents(new Set()) }}
                  className="inline-flex items-center justify-center gap-2 border border-border-primary text-content-primary px-8 py-4 rounded-full font-bold hover:bg-surface-secondary transition-all"
                >
                  Generate More
                </button>
              </div>
            </div>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-content-secondary mb-2">
          <Link href="/dashboard/report-cards" className="hover:text-primary">Report Cards</Link>
          <span>/</span>
          <span className="text-primary font-bold">Generate</span>
        </nav>
        <h1 className="text-4xl text-primary font-bold tracking-tight">Report Card Generator</h1>
        <p className="text-content-secondary mt-2 max-w-xl">
          Automated academic performance evaluation and PDF compilation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Selection Panel */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">1</div>
                <h2 className="text-xl text-content-primary font-bold">Selection Panel</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-content-secondary uppercase tracking-wider block mb-1.5 px-1">Academic Session</label>
                  <div className="recessed-well bg-white border border-border-primary/40 rounded-2xl">
                    <select
                      value={selectedSession}
                      onChange={(e) => setSelectedSession(e.target.value)}
                      className="w-full bg-transparent border-none px-4 py-3 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
                    >
                      <option value="">Select session...</option>
                      {initialSessions.map((s: any) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-content-secondary uppercase tracking-wider block mb-1.5 px-1">Term</label>
                  <div className="recessed-well bg-white border border-border-primary/40 rounded-2xl">
                    <select
                      value={selectedTerm}
                      onChange={(e) => setSelectedTerm(e.target.value)}
                      className="w-full bg-transparent border-none px-4 py-3 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
                    >
                      <option value="">Select term...</option>
                      {initialTerms.map((t: any) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-content-secondary uppercase tracking-wider block mb-1.5 px-1">Class</label>
                  <div className="recessed-well bg-white border border-border-primary/40 rounded-2xl">
                    <select
                      value={selectedClassroom}
                      onChange={(e) => setSelectedClassroom(e.target.value)}
                      className="w-full bg-transparent border-none px-4 py-3 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
                    >
                      <option value="">Select class...</option>
                      {initialClassrooms.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <p className="text-xs text-primary flex items-start gap-2">
                  <span className="material-symbols-outlined text-[18px] mt-0.5">info</span>
                  Selecting a class will automatically populate the student list for processing.
                </p>
              </div>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <p className="text-xs text-content-secondary uppercase tracking-widest font-bold mb-1">Selection Status</p>
              <div className="flex items-baseline justify-between mb-4">
                <p className="text-sm font-bold text-primary">
                  {selectedStudents.size} of {filteredStudents.length} students selected
                </p>
                <span className="text-xl font-bold text-primary">
                  {filteredStudents.length > 0 ? Math.round((selectedStudents.size / filteredStudents.length) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${filteredStudents.length > 0 ? (selectedStudents.size / filteredStudents.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </section>

        {/* Right: Student Selection */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-card border border-border-primary/60 flex flex-col flex-1">
            <div className="p-6 border-b border-border-primary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold text-sm">2</div>
                <h2 className="text-xl text-content-primary font-bold">Student Selection</h2>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder="Search student..."
                    className="recessed-well pl-10 pr-4 py-2 rounded-xl text-sm border border-border-primary/40 w-48 sm:w-64"
                  />
                </div>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedStudents.size === filteredStudents.length && filteredStudents.length > 0}
                    onChange={toggleAll}
                    className="w-5 h-5 rounded border-border-primary accent-primary"
                  />
                  <span className="text-sm text-content-secondary group-hover:text-primary transition-colors">Select All</span>
                </label>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[500px]">
              {filteredStudents.map((student: any) => {
                const name = `${student.user?.first_name || ""} ${student.user?.last_name || ""}`.trim()
                const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                const isSelected = selectedStudents.has(student.id)
                return (
                  <div
                    key={student.id}
                    onClick={() => toggleStudent(student.id)}
                    className={cn(
                      "p-4 rounded-2xl border flex items-center gap-4 cursor-pointer transition-all group",
                      isSelected
                        ? "bg-primary/5 border-primary/30"
                        : "bg-surface-secondary/30 border-border-primary/20 hover:border-primary/20"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleStudent(student.id)}
                      className="w-5 h-5 rounded border-border-primary accent-primary"
                    />
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-content-primary truncate">{name}</p>
                      <p className="text-xs text-content-secondary">ID: {student.admission_number || student.id}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="p-6 border-t border-border-primary/30 flex justify-end">
              <Button
                onClick={handleGenerate}
                disabled={selectedStudents.size === 0 || generating}
                className={cn(
                  "bg-primary text-primary-foreground font-bold px-10 py-4 rounded-2xl shadow-xl flex items-center gap-3 transition-all",
                  selectedStudents.size > 0 && !generating
                    ? "hover:brightness-110 active:scale-95"
                    : "opacity-60 cursor-not-allowed"
                )}
              >
                {generating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    Generate {selectedStudents.size > 0 ? `${selectedStudents.size} ` : ""}Reports
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </Container>
  )
}
