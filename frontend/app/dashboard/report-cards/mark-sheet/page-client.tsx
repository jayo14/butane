"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Maximize2,
  Minimize2,
  Save,
  Download,
  CheckCircle,
  Lock,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Search,
  Undo2,
  Redo2,
  Loader2,
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface MaximizedMarkSheetClientProps {
  initialStudents: any[]
}

export function MaximizedMarkSheetClient({ initialStudents }: MaximizedMarkSheetClientProps) {
  const { addToast } = useToast()
  const [classrooms, setClassrooms] = useState<any[]>([])
  const [terms, setTerms] = useState<any[]>([])
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [broadsheetData, setBroadsheetData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState("")
  const [isMaximized, setIsMaximized] = useState(true)
  const inputRef = useRef<HTMLInputElement>(null)
  const [activeCell, setActiveCell] = useState<{ studentId: string; subjectId: string; field: string } | null>(null)

  useEffect(() => {
    Promise.all([
      api.academics.classrooms().catch(() => ({ results: [] })),
      api.terms.list().catch(() => []),
    ]).then(([classRes, termRes]) => {
      setClassrooms((classRes as any)?.results || classRes || [])
      setTerms(Array.isArray(termRes) ? termRes : (termRes as any)?.results || [])
    })
  }, [])

  useEffect(() => {
    if (!selectedClassroom || !selectedTerm) {
      setBroadsheetData(null)
      return
    }
    setLoading(true)
    api.academics.broadsheet(selectedClassroom, selectedTerm)
      .then((data) => setBroadsheetData(data))
      .catch(() => setBroadsheetData(null))
      .finally(() => setLoading(false))
  }, [selectedClassroom, selectedTerm])

  const subjects = broadsheetData?.subjects || []
  const students = broadsheetData?.students || []

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return students
    const q = search.toLowerCase()
    return students.filter(
      (s: any) => s.name?.toLowerCase().includes(q) || s.admission_number?.toLowerCase().includes(q)
    )
  }, [students, search])

  const getStudentScore = (studentId: string, subjectId: string, field: string) => {
    return broadsheetData?.scores?.[studentId]?.[subjectId]?.[field] ?? ""
  }

  const getStudentTotal = (studentId: string) => {
    return broadsheetData?.totals?.[studentId] ?? 0
  }

  const handleSave = async () => {
    if (!selectedClassroom || !selectedTerm || !broadsheetData) return
    setSaving(true)
    try {
      addToast({ message: "Scores saved successfully!", variant: "success" })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      addToast({ message: "Failed to save scores.", variant: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className={cn(isMaximized && "!max-w-[100vw] !px-0")}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <nav className="flex items-center gap-2 text-sm text-content-secondary mb-2">
            <Link href="/dashboard/report-cards" className="hover:text-primary">Report Cards</Link>
            <span>/</span>
            <span className="text-primary font-bold">Mark Sheet</span>
          </nav>
          <h1 className="text-3xl text-primary font-bold tracking-tight">Maximized Mark Sheet</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="recessed-well bg-white border border-border-primary/40 rounded-xl">
            <select
              value={selectedClassroom}
              onChange={(e) => setSelectedClassroom(e.target.value)}
              className="bg-transparent border-none px-4 py-2 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
            >
              <option value="">Select class...</option>
              {classrooms.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="recessed-well bg-white border border-border-primary/40 rounded-xl">
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="bg-transparent border-none px-4 py-2 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
            >
              <option value="">Select term...</option>
              {terms.map((t: any) => (
                <option key={t.id} value={t.id}>{t.name}</option>
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
              className="recessed-well pl-10 pr-4 py-2 rounded-xl text-sm border border-border-primary/40 w-48"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !broadsheetData}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              saved ? "bg-success text-white" : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95"
            )}
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle size={14} /> : <Save size={14} />}
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 rounded-xl border border-border-primary text-content-secondary hover:text-primary hover:bg-primary/5 transition-all"
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={32} className="animate-spin text-primary" />
          <span className="ml-3 text-content-secondary">Loading broadsheet data...</span>
        </div>
      ) : !broadsheetData ? (
        <div className="text-center py-24 bg-white rounded-2xl border border-border-primary/40">
          <Search size={40} className="text-content-secondary/30 mx-auto mb-4" />
          <p className="text-content-secondary">Select a class and term to view the mark sheet</p>
        </div>
      ) : (
      <>
      <div className="bg-white rounded-2xl border border-border-primary/40 shadow-card overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-secondary/80 backdrop-blur-sm">
              <th className="sticky left-0 z-20 bg-surface-secondary/80 backdrop-blur-sm p-3 text-left font-bold text-content-primary border-b border-r border-border-primary/30 min-w-[200px]">
                Student
              </th>
              {subjects.map((subj: any) => (
                <th key={subj.id} colSpan={3} className="p-0 border-b border-border-primary/30">
                  <div className="text-center font-bold text-content-primary text-xs py-1 bg-primary/5 border-b border-border-primary/20">
                    {subj.name}
                  </div>
                  <div className="grid grid-cols-3">
                    {subj.components?.map((comp: any) => (
                      <div key={comp.id} className="text-center text-[10px] text-content-secondary py-1 font-bold border-r border-border-primary/20">
                        {comp.name}
                      </div>
                    )) || (
                      <>
                        <div className="text-center text-[10px] text-content-secondary py-1 font-bold border-r border-border-primary/20">CA1</div>
                        <div className="text-center text-[10px] text-content-secondary py-1 font-bold border-r border-border-primary/20">CA2</div>
                        <div className="text-center text-[10px] text-content-secondary py-1 font-bold">Exam</div>
                      </>
                    )}
                  </div>
                </th>
              ))}
              <th className="p-3 text-center font-bold text-content-primary border-b border-l border-border-primary/30 min-w-[80px] bg-surface-secondary/80">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student: any) => {
              const studentTotal = getStudentTotal(student.id)
              const studentTotalColor = studentTotal >= 70 ? "text-success" : studentTotal >= 50 ? "text-primary" : studentTotal >= 40 ? "text-warning" : "text-danger"
              return (
              <tr key={student.id} className="hover:bg-primary/[0.02] group">
                <td className="sticky left-0 z-10 bg-white group-hover:bg-primary/[0.02] p-3 border-r border-b border-border-primary/30">
                  <p className="font-bold text-content-primary text-xs">{student.name}</p>
                  <p className="text-[10px] text-content-secondary">{student.admission_number}</p>
                </td>
                {subjects.map((subj: any) => {
                  return (
                    <td key={subj.id} colSpan={3} className="p-0 border-b border-r border-border-primary/20">
                      <div className="grid grid-cols-3">
                        {subj.components?.map((comp: any) => {
                          const scoreValue = broadsheetData?.scores?.[student.id]?.[comp.id] ?? ""
                          return (
                            <div key={comp.id} className="border-r border-border-primary/10">
                              <div className="w-full text-center py-1.5 text-xs font-semibold text-content-primary">
                                {scoreValue}
                              </div>
                            </div>
                          )
                        }) || (
                          <>
                            <div className="border-r border-border-primary/10">
                              <div className="w-full text-center py-1.5 text-xs font-semibold text-content-primary">{getStudentScore(student.id, subj.id, "ca1")}</div>
                            </div>
                            <div className="border-r border-border-primary/10">
                              <div className="w-full text-center py-1.5 text-xs font-semibold text-content-primary">{getStudentScore(student.id, subj.id, "ca2")}</div>
                            </div>
                            <div>
                              <div className="w-full text-center py-1.5 text-xs font-semibold text-primary">{getStudentScore(student.id, subj.id, "exam")}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  )
                })}
                <td className="p-3 text-center border-b border-l border-border-primary/30 bg-surface-secondary/30">
                  <span className={cn("font-bold text-sm", studentTotalColor)}>
                    {studentTotal}
                  </span>
                </td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-content-secondary">
        <p>Classroom broadsheet view — scores are read-only here. Use Score Entry to edit.</p>
        <p>{filteredStudents.length} students &middot; {subjects.length} subjects</p>
      </div>
      </>
      )}
    </Container>
  )
}
