"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  MessageSquare,
  Search,
  Save,
  Check,
  Lightbulb,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

const MOCK_STUDENTS = [
  { id: 1, name: "Aisha Okonkwo", initials: "AO", class: "JSS 1A", remark: "Aisha has shown excellent improvement in her academic performance this term. She is diligent and contributes actively in class." },
  { id: 2, name: "Emeka Nwosu", initials: "EN", class: "JSS 1A", remark: "Emeka is a focused student who consistently meets deadlines. His performance in mathematics is outstanding." },
  { id: 3, name: "Fatima Abubakar", initials: "FA", class: "JSS 1A", remark: "" },
  { id: 4, name: "Ibrahim Musa", initials: "IM", class: "JSS 1A", remark: "Ibrahim needs to pay more attention in class. With more effort, he can achieve better results." },
  { id: 5, name: "Chidinma Eze", initials: "CE", class: "JSS 1A", remark: "" },
  { id: 6, name: "Yusuf Bello", initials: "YB", class: "JSS 1A", remark: "Yusuf is a well-behaved student. He shows great potential in the sciences." },
  { id: 7, name: "Ngozi Okafor", initials: "NO", class: "JSS 1A", remark: "" },
  { id: 8, name: "Tunde Adeyemi", initials: "TA", class: "JSS 1A", remark: "Tunde has been a leader in the classroom. His academic performance is commendable." },
]

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
  initialClassrooms: any[]
}

export function TeacherRemarksClient({ initialClassrooms }: TeacherRemarksClientProps) {
  const [remarks, setRemarks] = useState<Record<number, string>>(
    Object.fromEntries(MOCK_STUDENTS.map((s) => [s.id, s.remark]))
  )
  const [selectedStudent, setSelectedStudent] = useState(MOCK_STUDENTS[0])
  const [search, setSearch] = useState("")
  const [saved, setSaved] = useState(false)

  const filteredStudents = useMemo(() => {
    if (!search.trim()) return MOCK_STUDENTS
    const q = search.toLowerCase()
    return MOCK_STUDENTS.filter((s) => s.name.toLowerCase().includes(q))
  }, [search])

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const insertTemplate = (template: string) => {
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
                    {filledCount}/{MOCK_STUDENTS.length} remarks written
                  </span>
                  <div className="w-24 h-2 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(filledCount / MOCK_STUDENTS.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[500px] p-2">
                {filteredStudents.map((student) => {
                  const hasRemark = (remarks[student.id] || "").trim().length > 0
                  return (
                    <button
                      key={student.id}
                      onClick={() => setSelectedStudent(student)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left",
                        selectedStudent.id === student.id
                          ? "bg-primary/5 border border-primary/20"
                          : "hover:bg-surface-secondary/50 border border-transparent"
                      )}
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {student.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-content-primary truncate">{student.name}</p>
                        <p className="text-xs text-content-secondary">{student.class}</p>
                      </div>
                      {hasRemark && (
                        <div className="w-3 h-3 rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  )
                })}
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
                    {selectedStudent.initials}
                  </div>
                  <div>
                    <h2 className="text-xl text-content-primary font-bold">{selectedStudent.name}</h2>
                    <p className="text-sm text-content-secondary">{selectedStudent.class}</p>
                  </div>
                </div>
                <button
                  onClick={handleSave}
                  className={cn(
                    "flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-bold transition-all",
                    saved
                      ? "bg-success text-white"
                      : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95 shadow-md"
                  )}
                >
                  {saved ? <><Check size={16} /> Saved</> : <><Save size={16} /> Save Remark</>}
                </button>
              </div>

              <div className="flex-1">
                <label className="text-xs font-bold text-content-secondary uppercase tracking-wider block mb-2 px-1">Teacher Remark</label>
                <textarea
                  value={remarks[selectedStudent.id] || ""}
                  onChange={(e) =>
                    setRemarks((prev) => ({ ...prev, [selectedStudent.id]: e.target.value }))
                  }
                  placeholder="Write a personalized remark for this student..."
                  className="w-full min-h-[200px] p-4 rounded-2xl border border-border-primary/40 text-sm text-content-primary bg-white focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition-all resize-y outline-none"
                />
                <div className="flex items-center justify-between mt-2 px-1">
                  <span className="text-xs text-content-secondary">
                    {(remarks[selectedStudent.id] || "").length} characters
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
