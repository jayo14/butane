"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Search,
  Save,
  Check,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Archive,
  ClipboardCheck,
  Settings,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const REMARK_TEMPLATES = [
  "A dedicated and hardworking student who consistently produces excellent work.",
  "Shows great improvement this term. Keep up the good work!",
  "A well-behaved and respectful student who is a positive role model.",
  "Needs to focus more in class and complete assignments on time.",
  "Demonstrates strong leadership skills and is an active participant in class discussions.",
  "Has the potential to excel with more effort and dedication to studies.",
  "A creative thinker who brings unique perspectives to class activities.",
  "Consistently meets deadlines and produces quality work.",
]

interface TeacherRemarksClientProps {
  initialClassrooms?: any[]
}

export function TeacherRemarksClient({ initialClassrooms = [] }: TeacherRemarksClientProps = {}) {
  const { addToast } = useToast()
  const [classrooms, setClassrooms] = useState(initialClassrooms)
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [reportCards, setReportCards] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [remarks, setRemarks] = useState<Record<string, string>>({})
  const [selectedStudent, setSelectedStudent] = useState<any>(null)
  const [search, setSearch] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (classrooms.length > 0) return
    api.academics.classrooms()
      .then((res: any) => setClassrooms((res?.results || []).map((c: any) => ({ id: c.id, name: c.name }))))
      .catch(() => {})
  }, [classrooms.length])

  useEffect(() => {
    if (!selectedClassroom) {
      setReportCards([])
      return
    }
    setLoading(true)
    api.academics.reportCardsList({ classroom: selectedClassroom, page_size: 100 })
      .then((res) => {
        const results = (res as any)?.results || res || []
        setReportCards(results)
        const initialRemarks: Record<string, string> = {}
        results.forEach((r: any) => {
          initialRemarks[r.id] = r.teacher_remark || ""
        })
        setRemarks(initialRemarks)
        if (results.length > 0) setSelectedStudent(results[0])
      })
      .catch(() => setReportCards([]))
      .finally(() => setLoading(false))
  }, [selectedClassroom])

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return reportCards
    const q = search.toLowerCase()
    return reportCards.filter((s: any) => {
      const name = `${s.student_first_name || ""} ${s.student_last_name || ""}`.toLowerCase()
      return name.includes(q)
    })
  }, [reportCards, search])

  const handleSave = async () => {
    if (!selectedStudent) return
    setSaving(true)
    try {
      await api.academics.reportCardUpdate(selectedStudent.id, {
        teacher_remark: remarks[selectedStudent.id] || "",
      })
      setSaved(true)
      addToast({ message: "Remark saved successfully!", variant: "success" })
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      addToast({ message: "Failed to save remark.", variant: "error" })
    } finally {
      setSaving(false)
    }
  }

  const insertTemplate = (template: string) => {
    if (!selectedStudent) return
    setRemarks((prev) => ({
      ...prev,
      [selectedStudent.id]: prev[selectedStudent.id]
        ? `${prev[selectedStudent.id]} ${template}`
        : template,
    }))
  }

  const filledCount = Object.values(remarks).filter((r) => r.trim().length > 0).length

  return (
    <Container>
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-content-secondary mb-2">
          <Link href="/dashboard/report-cards" className="hover:text-primary">Report Cards</Link>
          <span>/</span>
          <span className="text-primary font-bold">Remarks</span>
        </nav>
        <h1 className="text-4xl text-primary font-bold tracking-tight">Teacher Remarks</h1>
        <p className="text-content-secondary mt-2 max-w-xl">
          Write personalized comments for each student in your class.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Student List */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden flex flex-col flex-1">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10 flex flex-col flex-1">
              <div className="p-4 border-b border-border-primary/30">
                <div className="recessed-well bg-white border border-border-primary/40 rounded-xl mb-3">
                  <select
                    value={selectedClassroom}
                    onChange={(e) => { setSelectedClassroom(e.target.value); setSelectedStudent(null) }}
                    className="w-full bg-transparent border-none px-4 py-2 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
                  >
                    <option value="">Select a class...</option>
                    {classrooms.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-content-secondary" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search students..."
                    className="recessed-well w-full pl-10 pr-4 py-2 rounded-xl text-sm border border-border-primary/40"
                  />
                </div>
                <div className="flex items-center justify-between mt-3 px-1">
                  <span className="text-xs text-content-secondary">
                    {filledCount}/{reportCards.length} remarks written
                  </span>
                  <div className="w-24 h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${reportCards.length > 0 ? (filledCount / reportCards.length) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px] p-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare size={24} className="text-content-secondary/40 mx-auto mb-2" />
                    <p className="text-xs text-content-secondary">
                      {selectedClassroom ? "No students found" : "Select a class to load students"}
                    </p>
                  </div>
                ) : (
                filteredStudents.map((student: any) => {
                  const name = `${student.student_first_name || ""} ${student.student_last_name || ""}`.trim()
                  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                  const hasRemark = (remarks[student.id] || "").trim().length > 0
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left hover:scale-[1.01]",
                        selectedStudent?.id === student.id
                          ? "bg-primary/5 border border-primary/20 shadow-sm"
                          : "hover:bg-surface-secondary/50 border border-transparent"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-content-primary truncate">{name}</p>
                        <p className="text-xs text-content-secondary">{student.classroom_name || ""}</p>
                      </div>
                      {hasRemark && (
                        <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  )
                })
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Remark Editor */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden flex flex-col flex-1">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10 flex flex-col flex-1">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedStudent ? (() => {
                      const name = `${selectedStudent.student_first_name || ""} ${selectedStudent.student_last_name || ""}`.trim()
                      return name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
                    })() : "?"}
                  </div>
                  <div>
                    <h2 className="text-xl text-content-primary font-bold">
                      {selectedStudent ? `${selectedStudent.student_first_name || ""} ${selectedStudent.student_last_name || ""}`.trim() : "Select a student"}
                    </h2>
                    <p className="text-sm text-content-secondary">{selectedStudent?.classroom_name || ""}</p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  disabled={!selectedStudent || saving}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                    saved
                      ? "bg-success text-white"
                      : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95 shadow-md"
                  )}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
                  {saving ? "Saving..." : saved ? "Saved" : "Save Remark"}
                </button>
              </div>

              <div className="flex-1">
                <label className="text-xs font-bold text-content-secondary uppercase tracking-wider block mb-2 px-1">Teacher Remark</label>
                <textarea
                  value={selectedStudent ? (remarks[selectedStudent.id] || "") : ""}
                  onChange={(e) => {
                    if (selectedStudent) {
                      setRemarks((prev) => ({ ...prev, [selectedStudent.id]: e.target.value }))
                    }
                  }}
                  placeholder={selectedStudent ? "Write a personalized remark for this student..." : "Select a student to write a remark"}
                  disabled={!selectedStudent}
                  className="w-full min-h-[200px] p-4 rounded-2xl border border-border-primary/40 text-sm text-content-primary bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all resize-y outline-none disabled:opacity-50"
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-xs text-content-secondary">
                    {selectedStudent ? (remarks[selectedStudent.id] || "").length : 0} characters
                  </span>
                </div>
              </div>

              {/* Quick Templates */}
              <div className="mt-6 pt-6 border-t border-border-primary/30">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={16} className="text-primary" />
                  <p className="text-sm font-bold text-content-primary">Quick Templates</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {REMARK_TEMPLATES.map((template, i) => (
                    <button
                      key={i}
                      onClick={() => insertTemplate(template)}
                      className="text-xs px-3 py-2 rounded-xl bg-surface-secondary/50 text-content-secondary hover:bg-primary/5 hover:text-primary border border-border-primary/20 transition-all text-left"
                    >
                      {template.length > 50 ? template.slice(0, 50) + "..." : template}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Container>
  )
}
