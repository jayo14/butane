"use client"

import { useState, useMemo, useRef } from "react"
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
} from "lucide-react"
import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

const MOCK_SUBJECTS = [
  { id: "eng", name: "English Language", ca1: 20, ca2: 20, exam: 60 },
  { id: "math", name: "Mathematics", ca1: 20, ca2: 20, exam: 60 },
  { id: "bio", name: "Biology", ca1: 20, ca2: 20, exam: 60 },
  { id: "phy", name: "Physics", ca1: 20, ca2: 20, exam: 60 },
  { id: "che", name: "Chemistry", ca1: 20, ca2: 20, exam: 60 },
  { id: "lit", name: "Literature", ca1: 20, ca2: 20, exam: 60 },
  { id: "gov", name: "Government", ca1: 20, ca2: 20, exam: 60 },
  { id: "eco", name: "Economics", ca1: 20, ca2: 20, exam: 60 },
]

const MOCK_STUDENTS = [
  { id: "1", name: "Aisha Okonkwo", admission: "ADM001", scores: { eng: { ca1: 18, ca2: 17, exam: 52 }, math: { ca1: 19, ca2: 18, exam: 55 }, bio: { ca1: 16, ca2: 15, exam: 48 }, phy: { ca1: 14, ca2: 13, exam: 42 }, che: { ca1: 15, ca2: 14, exam: 45 }, lit: { ca1: 17, ca2: 16, exam: 50 }, gov: { ca1: 16, ca2: 15, exam: 46 }, eco: { ca1: 15, ca2: 14, exam: 44 } } },
  { id: "2", name: "Emeka Nwosu", admission: "ADM002", scores: { eng: { ca1: 16, ca2: 15, exam: 45 }, math: { ca1: 18, ca2: 17, exam: 52 }, bio: { ca1: 15, ca2: 14, exam: 42 }, phy: { ca1: 13, ca2: 12, exam: 38 }, che: { ca1: 14, ca2: 13, exam: 40 }, lit: { ca1: 16, ca2: 15, exam: 48 }, gov: { ca1: 15, ca2: 14, exam: 42 }, eco: { ca1: 14, ca2: 13, exam: 40 } } },
  { id: "3", name: "Fatima Abubakar", admission: "ADM003", scores: { eng: { ca1: 19, ca2: 18, exam: 55 }, math: { ca1: 20, ca2: 19, exam: 58 }, bio: { ca1: 17, ca2: 16, exam: 50 }, phy: { ca1: 16, ca2: 15, exam: 46 }, che: { ca1: 17, ca2: 16, exam: 48 }, lit: { ca1: 18, ca2: 17, exam: 52 }, gov: { ca1: 17, ca2: 16, exam: 50 }, eco: { ca1: 16, ca2: 15, exam: 46 } } },
  { id: "4", name: "Ibrahim Musa", admission: "ADM004", scores: { eng: { ca1: 12, ca2: 11, exam: 35 }, math: { ca1: 14, ca2: 13, exam: 40 }, bio: { ca1: 11, ca2: 10, exam: 32 }, phy: { ca1: 10, ca2: 9, exam: 28 }, che: { ca1: 11, ca2: 10, exam: 30 }, lit: { ca1: 13, ca2: 12, exam: 38 }, gov: { ca1: 12, ca2: 11, exam: 34 }, eco: { ca1: 11, ca2: 10, exam: 32 } } },
  { id: "5", name: "Chidinma Eze", admission: "ADM005", scores: { eng: { ca1: 17, ca2: 16, exam: 48 }, math: { ca1: 18, ca2: 17, exam: 52 }, bio: { ca1: 15, ca2: 14, exam: 44 }, phy: { ca1: 14, ca2: 13, exam: 40 }, che: { ca1: 15, ca2: 14, exam: 42 }, lit: { ca1: 17, ca2: 16, exam: 50 }, gov: { ca1: 16, ca2: 15, exam: 46 }, eco: { ca1: 15, ca2: 14, exam: 42 } } },
  { id: "6", name: "Yusuf Bello", admission: "ADM006", scores: { eng: { ca1: 15, ca2: 14, exam: 42 }, math: { ca1: 16, ca2: 15, exam: 46 }, bio: { ca1: 14, ca2: 13, exam: 40 }, phy: { ca1: 12, ca2: 11, exam: 34 }, che: { ca1: 13, ca2: 12, exam: 38 }, lit: { ca1: 15, ca2: 14, exam: 44 }, gov: { ca1: 14, ca2: 13, exam: 40 }, eco: { ca1: 13, ca2: 12, exam: 38 } } },
]

interface MaximizedMarkSheetClientProps {
  initialStudents: any[]
}

export function MaximizedMarkSheetClient({ initialStudents }: MaximizedMarkSheetClientProps) {
  const [scores, setScores] = useState<Record<string, Record<string, { ca1: number; ca2: number; exam: number }>>>(
    Object.fromEntries(MOCK_STUDENTS.map((s) => [s.id, s.scores]))
  )
  const [activeCell, setActiveCell] = useState<{ studentId: string; subjectId: string; field: string } | null>(null)
  const [isMaximized, setIsMaximized] = useState(true)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return MOCK_STUDENTS
    const q = search.toLowerCase()
    return MOCK_STUDENTS.filter(
      (s) => s.name.toLowerCase().includes(q) || s.admission.toLowerCase().includes(q)
    )
  }, [search])

  const updateScore = (studentId: string, subjectId: string, field: string, value: number) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: {
          ...prev[studentId]?.[subjectId],
          [field]: Math.max(0, Math.min(field === "exam" ? 60 : 20, value)),
        },
      },
    }))
  }

  const handleKeyDown = (e: React.KeyboardEvent, studentId: string, subjectId: string, field: string) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault()
      const allCells: { studentId: string; subjectId: string; field: string }[] = []
      for (const s of filteredStudents) {
        for (const subj of MOCK_SUBJECTS) {
          for (const f of ["ca1", "ca2", "exam"]) {
            allCells.push({ studentId: s.id, subjectId: subj.id, field: f })
          }
        }
      }
      const currentIdx = allCells.findIndex(
        (c) => c.studentId === studentId && c.subjectId === subjectId && c.field === field
      )
      const nextIdx = e.shiftKey
        ? (currentIdx - 1 + allCells.length) % allCells.length
        : (currentIdx + 1) % allCells.length
      setActiveCell(allCells[nextIdx])
    } else if (e.key === "Escape") {
      setActiveCell(null)
    }
  }

  const getSubjectTotal = (studentId: string, subjectId: string) => {
    const s = scores[studentId]?.[subjectId]
    if (!s) return 0
    return s.ca1 + s.ca2 + s.exam
  }

  const getStudentTotal = (studentId: string) => {
    return MOCK_SUBJECTS.reduce((sum, subj) => sum + getSubjectTotal(studentId, subj.id), 0)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
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
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
              saved ? "bg-success text-white" : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95"
            )}
          >
            {saved ? <><CheckCircle size={14} /> Saved</> : <><Save size={14} /> Save</>}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-border-primary text-content-primary hover:bg-surface-secondary transition-all">
            <Download size={14} /> Export
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-2 rounded-xl border border-border-primary text-content-secondary hover:text-primary hover:bg-primary/5 transition-all"
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border-primary/40 shadow-card overflow-auto max-h-[calc(100vh-200px)]">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr className="bg-surface-secondary/80 backdrop-blur-sm">
              <th className="sticky left-0 z-20 bg-surface-secondary/80 backdrop-blur-sm p-3 text-left font-bold text-content-primary border-b border-r border-border-primary/30 min-w-[200px]">
                Student
              </th>
              {MOCK_SUBJECTS.map((subj) => (
                <th key={subj.id} colSpan={3} className="p-0 border-b border-border-primary/30">
                  <div className="text-center font-bold text-content-primary text-xs py-1 bg-primary/5 border-b border-border-primary/20">
                    {subj.name}
                  </div>
                  <div className="grid grid-cols-3">
                    <div className="text-center text-[10px] text-content-secondary py-1 font-bold border-r border-border-primary/20">CA1</div>
                    <div className="text-center text-[10px] text-content-secondary py-1 font-bold border-r border-border-primary/20">CA2</div>
                    <div className="text-center text-[10px] text-content-secondary py-1 font-bold">Exam</div>
                  </div>
                </th>
              ))}
              <th className="p-3 text-center font-bold text-content-primary border-b border-l border-border-primary/30 min-w-[80px] bg-surface-secondary/80">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => {
              const studentTotal = getStudentTotal(student.id)
              const studentTotalColor = studentTotal >= 70 ? "text-success" : studentTotal >= 50 ? "text-primary" : studentTotal >= 40 ? "text-warning" : "text-danger"
              return (
              <tr key={student.id} className="hover:bg-primary/[0.02] group">
                <td className="sticky left-0 z-10 bg-white group-hover:bg-primary/[0.02] p-3 border-r border-b border-border-primary/30">
                  <p className="font-bold text-content-primary text-xs">{student.name}</p>
                  <p className="text-[10px] text-content-secondary">{student.admission}</p>
                </td>
                {MOCK_SUBJECTS.map((subj) => {
                  const total = getSubjectTotal(student.id, subj.id)
                  const totalColor = total >= 70 ? "text-success" : total >= 50 ? "text-primary" : total >= 40 ? "text-warning" : "text-danger"
                  return (
                    <td key={subj.id} colSpan={3} className="p-0 border-b border-r border-border-primary/20">
                      <div className="grid grid-cols-3">
                        {(["ca1", "ca2", "exam"] as const).map((field) => {
                          const isActive = activeCell?.studentId === student.id && activeCell?.subjectId === subj.id && activeCell?.field === field
                          return (
                            <div key={field} className={cn("border-r border-border-primary/10", isActive && "bg-primary/10")}>
                              <input
                                ref={isActive ? inputRef : undefined}
                                type="number"
                                value={scores[student.id]?.[subj.id]?.[field] ?? ""}
                                onChange={(e) => updateScore(student.id, subj.id, field, parseInt(e.target.value) || 0)}
                                onFocus={() => setActiveCell({ studentId: student.id, subjectId: subj.id, field })}
                                onKeyDown={(e) => handleKeyDown(e, student.id, subj.id, field)}
                                className={cn(
                                  "w-full text-center py-1.5 text-xs font-semibold text-content-primary bg-transparent border-none outline-none focus:bg-primary/5",
                                  field === "exam" ? "text-primary" : "text-content-secondary"
                                )}
                              />
                            </div>
                          )
                        })}
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
        <p>Use <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-primary/40 font-mono text-[10px]">Tab</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-surface-secondary border border-border-primary/40 font-mono text-[10px]">Shift+Tab</kbd> to navigate between cells</p>
        <p>{MOCK_STUDENTS.length} students &middot; {MOCK_SUBJECTS.length} subjects</p>
      </div>
    </Container>
  )
}
