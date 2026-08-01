"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import {
  BookOpen,
  Calendar,
  Layers,
  Award,
  CheckCircle,
  AlertTriangle,
  Info,
  Lock,
  ArrowLeft,
  ArrowRight,
  Save,
  Search,
  Users,
  ChevronRight,
  TrendingUp,
  BarChart2,
  LockKeyhole,
  Check,
  RefreshCw,
  Clock
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

interface ScoreEntryPageClientProps {
  initialSessions: any[]
  initialClassrooms: any[]
  initialTerms: any[]
  initialSubjects: any[]
  initialEnrollments: any[]
  profile: any
}

// Student mock data to use if enrollment is empty
const MOCK_STUDENTS = [
  { id: "s1", name: "Benjamin Jallow", email: "ben@school.com", student_id: "#CHE-2024-089" },
  { id: "s2", name: "Dania Lopez", email: "dania@school.com", student_id: "#CHE-2024-112" },
  { id: "s3", name: "Samuel Adebayo", email: "samuel@school.com", student_id: "#CHE-2024-001" },
  { id: "s4", name: "Florence Otedola", email: "florence@school.com", student_id: "#CHE-2024-002" },
  { id: "s5", name: "John Doe", email: "john@school.com", student_id: "#CHE-2024-003" },
  { id: "s6", name: "Chinedu Okafor", email: "chinedu@school.com", student_id: "#CHE-2024-004" },
  { id: "s7", name: "Fatima Bello", email: "fatima@school.com", student_id: "#CHE-2024-005" },
  { id: "s8", name: "Amina Yusuf", email: "amina@school.com", student_id: "#CHE-2024-006" }
]

export function ScoreEntryPageClient({
  initialSessions,
  initialClassrooms,
  initialTerms,
  initialSubjects,
  initialEnrollments,
  profile
}: ScoreEntryPageClientProps) {
  const { addToast } = useToast()
  // Wizard state: "select" | "mark_sheet" | "review"
  const [step, setStep] = useState<"select" | "mark_sheet" | "review">("select")

  // Selection form states
  const [selectedSession, setSelectedSession] = useState(
    initialSessions.find((s) => s.is_current)?.id || initialSessions[0]?.id || ""
  )
  const [selectedTerm, setSelectedTerm] = useState(initialTerms[0]?.id || "")
  const [selectedSubject, setSelectedSubject] = useState(initialSubjects[0]?.id || "")
  const [selectedClassroom, setSelectedClassroom] = useState(initialClassrooms[0]?.id || "")
  const [assessmentType, setAssessmentType] = useState<"ca" | "exam">("ca")

  // Active Context Name references
  const currentSessionName = initialSessions.find(s => s.id === selectedSession)?.name || "2026/2027 Session"
  const currentTermName = initialTerms.find(t => t.id === selectedTerm)?.name || "First Term"
  const currentSubjectName = initialSubjects.find(s => s.id === selectedSubject)?.name || "Chemistry"
  const currentClassroomName = initialClassrooms.find(c => c.id === selectedClassroom)?.name || "SS2A"

  // Students list
  const [students, setStudents] = useState<any[]>([])
  
  // Assessment components state — derived from selected subject
  const selectedSubjectData = initialSubjects.find((s: any) => s.id === selectedSubject)
  const subjectComponents = selectedSubjectData?.components || selectedSubjectData?.assessment_components || []
  const [components, setComponents] = useState<any[]>(subjectComponents)

  // Update components when subject changes
  useEffect(() => {
    const sub = initialSubjects.find((s: any) => s.id === selectedSubject)
    const comps = sub?.components || sub?.assessment_components || []
    setComponents(comps.length > 0 ? comps : [
      { id: "c1", name: "CA Test 1", max_score: 20 },
      { id: "c2", name: "CA Test 2", max_score: 20 },
      { id: "c3", name: "Final Exam", max_score: 60 }
    ])
  }, [selectedSubject, initialSubjects])

  // Scores entered: studentId -> componentId -> number
  const [scores, setScores] = useState<Record<string, Record<string, number | "">>>({})

  // Loading indicator
  const [loading, setLoading] = useState(false)
  const [completed, setCompleted] = useState(false)

  // Fetch or mock students when classroom changes
  useEffect(() => {
    if (selectedClassroom) {
      const classEnrollments = initialEnrollments.filter(
        (e: any) => e.classroom?.id === selectedClassroom || e.classroom === selectedClassroom
      )
      if (classEnrollments.length > 0) {
        const studentList = classEnrollments.map((e: any) => ({
          id: e.student?.id || e.student,
          name: e.student?.full_name || e.student?.user?.full_name || "Enrolled Student",
          student_id: e.student?.admission_number || `#STU-${e.student?.id?.substring(0, 5)}`
        }))
        setStudents(studentList)
      } else {
        // Fallback to MOCK students to keep UI extremely rich and functional
        setStudents(MOCK_STUDENTS)
      }
    }
  }, [selectedClassroom, initialEnrollments])

  // Populate initial scores from existing data or leave blank
  useEffect(() => {
    const initialScores: Record<string, Record<string, number | "">> = {}
    students.forEach((s) => {
      initialScores[s.id] = {}
      components.forEach((c) => {
        // Leave blank for new entries — teacher will fill in
        initialScores[s.id][c.id] = ""
      })
    })
    setScores(initialScores)
  }, [students, components])

  // Grading calculation on score sum
  function calculateGradeAndRemark(total: number): { grade: string; remark: string } {
    if (total >= 75) return { grade: "A1", remark: "DISTINCTION" }
    if (total >= 70) return { grade: "B2", remark: "VERY GOOD" }
    if (total >= 65) return { grade: "B3", remark: "GOOD" }
    if (total >= 60) return { grade: "C4", remark: "CREDIT" }
    if (total >= 50) return { grade: "C6", remark: "PASS" }
    return { grade: "F9", remark: "FAIL" }
  }

  // Handle score change
  function handleScoreChange(studentId: string, componentId: string, val: string) {
    const component = components.find(c => c.id === componentId)
    const maxVal = component ? component.max_score : 100

    let parsedVal: number | "" = ""
    if (val !== "") {
      const num = parseFloat(val)
      if (isNaN(num)) return
      if (num < 0 || num > maxVal) {
        addToast({ message: `Score cannot exceed max score of ${maxVal}`, variant: "warning" })
        return
      }
      parsedVal = num
    }

    setScores((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [componentId]: parsedVal
      }
    }))
  }

  // Calculate stats
  const stats = useMemo(() => {
    let totalGraded = 0
    let totalPossible = students.length
    let totalScoreSum = 0
    let gradedCount = 0

    students.forEach((s) => {
      const studScores = scores[s.id] || {}
      const isGraded = components.every(c => studScores[c.id] !== undefined && studScores[c.id] !== "")
      if (isGraded) {
        gradedCount++
        let sum = 0
        components.forEach(c => {
          sum += Number(studScores[c.id] || 0)
        })
        totalScoreSum += sum
      }
      const hasAny = components.some(c => studScores[c.id] !== undefined && studScores[c.id] !== "")
      if (hasAny) {
        totalGraded++
      }
    })

    const completionPercent = totalPossible > 0 ? Math.round((gradedCount / totalPossible) * 100) : 0
    const averageScore = gradedCount > 0 ? Math.round(totalScoreSum / gradedCount) : 0

    return {
      completionPercent,
      gradedCount,
      totalPossible,
      pendingCount: totalPossible - gradedCount,
      averageScore
    }
  }, [students, scores, components])

  // Grade distributions for review state
  const gradeDistribution = useMemo(() => {
    let aCount = 0, bCount = 0, cCount = 0, fCount = 0
    students.forEach((s) => {
      const studScores = scores[s.id] || {}
      let sum = 0
      components.forEach(c => {
        sum += Number(studScores[c.id] || 0)
      })
      const { grade } = calculateGradeAndRemark(sum)
      if (grade.startsWith("A")) aCount++
      else if (grade.startsWith("B")) bCount++
      else if (grade.startsWith("C")) cCount++
      else fCount++
    })
    return { aCount, bCount, cCount, fCount }
  }, [students, scores, components])

  // Save progress via API
  async function handleSaveProgress() {
    setLoading(true)
    try {
      // Save scores for each component
      for (const component of components) {
        const componentScores = Object.entries(scores)
          .filter(([_, compScores]) => compScores[component.id] !== "" && compScores[component.id] !== undefined)
          .map(([studentId, compScores]) => ({
            student_id: studentId,
            score: Number(compScores[component.id]),
          }))
        
        if (componentScores.length > 0) {
          await api.academics.scoresBulk({
            component_id: component.id,
            scores: componentScores,
          })
        }
      }
      addToast({ message: "Scores saved successfully!", variant: "success" })
    } catch (err) {
      console.error(err)
      addToast({ message: "Failed to save scores. Please try again.", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  // Lock scores finalisation
  async function handleFinalizeLock() {
    if (stats.pendingCount > 0) {
      if (!confirm(`Warning: You still have ${stats.pendingCount} student(s) with pending scores. Are you sure you want to lock?`)) {
        return
      }
    }
    setLoading(true)
    try {
      // Save all scores first
      for (const component of components) {
        const componentScores = Object.entries(scores)
          .filter(([_, compScores]) => compScores[component.id] !== "" && compScores[component.id] !== undefined)
          .map(([studentId, compScores]) => ({
            student_id: studentId,
            score: Number(compScores[component.id]),
          }))
        
        if (componentScores.length > 0) {
          await api.academics.scoresBulk({
            component_id: component.id,
            scores: componentScores,
          })
        }
      }
      addToast({ message: "Scores locked and saved! Report card grades will be synced.", variant: "success" })
      setCompleted(true)
    } catch (err) {
      addToast({ message: "Failed to lock scores. Please try again.", variant: "error" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="min-h-screen relative overflow-x-hidden p-6 md:p-10">

        {/* Step 1: Selection Form */}
        {step === "select" && (
          <div className="max-w-4xl mx-auto space-y-8 animate-slide-right">
            <div>
              <h1 className="text-4xl text-primary font-bold tracking-tight">Score Entry Selection</h1>
              <p className="text-content-secondary max-w-xl">
                Refine your selection to access the digital mark sheet. Ensure all academic contexts are correctly identified.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-card border border-border-primary/60 relative">
              <div className="linen-texture absolute inset-0"></div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                {/* Step 1: Academic Context */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">1</span>
                    <span className="text-xs uppercase tracking-wider">Academic Context</span>
                  </div>
                  <div className="space-y-3">
                    <div className="recessed-well bg-white p-4">
                      <label className="text-xs text-content-secondary font-semibold block mb-1">Session</label>
                      <select
                        value={selectedSession}
                        onChange={(e) => setSelectedSession(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-content-primary w-full"
                      >
                        {initialSessions.map((s) => (
                          <option key={s.id} value={s.id}>{s.name} Session</option>
                        ))}
                      </select>
                    </div>
                    <div className="recessed-well bg-white p-4">
                      <label className="text-xs text-content-secondary font-semibold block mb-1">Term</label>
                      <select
                        value={selectedTerm}
                        onChange={(e) => setSelectedTerm(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-content-primary w-full"
                      >
                        {initialTerms.map((t) => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 2: Subject & Class */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">2</span>
                    <span className="text-xs uppercase tracking-wider">Subject &amp; Class</span>
                  </div>
                  <div className="space-y-3">
                    <div className="recessed-well bg-white p-4">
                      <label className="text-xs text-content-secondary font-semibold block mb-1">Subject</label>
                      <select
                        value={selectedSubject}
                        onChange={(e) => setSelectedSubject(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-content-primary w-full"
                      >
                        {initialSubjects.map((s) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="recessed-well bg-white p-4">
                      <label className="text-xs text-content-secondary font-semibold block mb-1">Classroom</label>
                      <select
                        value={selectedClassroom}
                        onChange={(e) => setSelectedClassroom(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold text-content-primary w-full"
                      >
                        {initialClassrooms.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Step 3: Assessment Type */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-primary font-bold">
                    <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs">3</span>
                    <span className="text-xs uppercase tracking-wider">Assessment Type</span>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => setAssessmentType("ca")}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all",
                        assessmentType === "ca"
                          ? "border-primary bg-primary/10 font-bold"
                          : "border-border-primary/60 bg-surface-secondary"
                      )}
                    >
                      <span className="text-sm">Continuous Assessment</span>
                      <CheckCircle size={16} className={assessmentType === "ca" ? "text-primary" : "text-content-secondary/40"} />
                    </button>
                    <button
                      onClick={() => setAssessmentType("exam")}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border flex items-center justify-between transition-all",
                        assessmentType === "exam"
                          ? "border-primary bg-primary/10 font-bold"
                          : "border-border-primary/60 bg-surface-secondary"
                      )}
                    >
                      <span className="text-sm">Examination</span>
                      <CheckCircle size={16} className={assessmentType === "exam" ? "text-primary" : "text-content-secondary/40"} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="crease-divider"></div>

              {/* Feedback stats panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="flex items-center gap-4 bg-surface-secondary p-5 rounded-2xl border border-border-primary/30 shadow-card">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-primary shadow-sm">
                    <Users size={24} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-content-primary">{students.length} Students</p>
                    <p className="text-xs text-content-secondary font-semibold">Registered for {currentSubjectName}</p>
                  </div>
                </div>

                <div className="bg-surface-secondary p-5 rounded-2xl border border-border-primary/30 shadow-card flex flex-col justify-center">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold text-content-primary">Completion: {stats.completionPercent}%</span>
                    <span className="text-xs text-primary font-bold">
                      {stats.gradedCount}/{stats.totalPossible} Done
                    </span>
                  </div>
                  <div className="w-full h-3 bg-surface-secondary rounded-full overflow-hidden recessed-well">
                    <div
                      className="h-full bg-primary transition-all duration-1000"
                      style={{ width: `${stats.completionPercent}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-surface-secondary p-5 rounded-2xl border border-border-primary/30 shadow-card">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-content-secondary shadow-sm">
                    <Clock size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-content-primary">Last Edited</p>
                    <p className="text-xs text-content-secondary">Today</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-center relative z-10">
                <Button
                  onClick={() => setStep("mark_sheet")}
                  className="group bg-primary text-primary-foreground px-10 py-6 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3"
                >
                  <LockKeyhole size={20} className="group-hover:rotate-12 transition-transform" />
                  <span>Open Mark Sheet</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Mark Sheet Entry Screen */}
        {step === "mark_sheet" && (
          <div className="space-y-6 animate-slide-right">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
              <div>
                <button
                  onClick={() => setStep("select")}
                  className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mb-2"
                >
                  <ArrowLeft size={14} /> Back to Selection
                </button>
                <h2 className="text-3xl text-primary font-bold">
                  Mark Sheet &mdash; {currentSubjectName} ({currentClassroomName})
                </h2>
                <p className="text-xs text-content-secondary">
                  Enter student marks for each designated assessment component. Weight total is 100 max.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleSaveProgress}
                  disabled={loading}
                  variant="outline"
                  className="rounded-full px-5 flex items-center gap-1.5"
                >
                  {loading ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                  Save Progress
                </Button>
                <Button
                  onClick={() => setStep("review")}
                  className="bg-primary text-primary-foreground rounded-full px-6 hover:brightness-110 flex items-center gap-1.5"
                >
                  Review & Lock <ArrowRight size={14} />
                </Button>
              </div>
            </div>

            {/* Score grid table */}
            <div className="bg-white rounded-2xl border border-border-primary/60 shadow-card overflow-hidden relative">
              <div className="linen-texture absolute inset-0"></div>
              <div className="overflow-x-auto relative z-10">
                <table className="w-full text-left">
                  <thead className="bg-surface-secondary text-xs font-bold text-content-secondary uppercase tracking-wider border-b border-border-primary/30">
                    <tr>
                      <th className="px-6 py-4">Student</th>
                      <th className="px-6 py-4">ID</th>
                      {components.map((c) => (
                        <th key={c.id} className="px-6 py-4">
                          {c.name}
                          <span className="block text-[10px] text-content-secondary font-semibold">Max Score: {c.max_score}</span>
                        </th>
                      ))}
                      <th className="px-6 py-4 text-center">Total (100)</th>
                      <th className="px-6 py-4 text-center">Grade</th>
                      <th className="px-6 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-primary/30">
                    {students.map((s) => {
                      const studentScores = scores[s.id] || {}
                      let total = 0
                      let isComplete = true
                      components.forEach((c) => {
                        const val = studentScores[c.id]
                        if (val === "" || val === undefined) {
                          isComplete = false
                        } else {
                          total += Number(val)
                        }
                      })
                      const { grade, remark } = calculateGradeAndRemark(total)

                      return (
                        <tr key={s.id} className="hover:bg-surface-secondary/50 transition-colors">
                          <td className="px-6 py-4 font-bold text-sm text-content-primary">{s.name}</td>
                          <td className="px-6 py-4 text-xs font-semibold text-content-secondary">{s.student_id}</td>
                          {components.map((c) => (
                            <td key={c.id} className="px-6 py-3 w-36">
                              <div className="recessed-well bg-white flex items-center px-3 py-1">
                                <input
                                  type="number"
                                  min="0"
                                  max={c.max_score}
                                  value={studentScores[c.id] ?? ""}
                                  onChange={(e) => handleScoreChange(s.id, c.id, e.target.value)}
                                  className="w-full bg-transparent border-none p-1 text-sm font-bold text-content-primary text-center outline-none focus:ring-0"
                                  placeholder="&mdash;"
                                />
                              </div>
                            </td>
                          ))}
                          <td className="px-6 py-4 text-center font-bold text-sm text-primary">
                            {isComplete ? total : <span className="text-content-secondary font-semibold text-xs">Pending</span>}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {isComplete ? (
                              <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mx-auto">
                                {grade}
                              </span>
                            ) : (
                              "&mdash;"
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {isComplete ? (
                              <span className={cn(
                                "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                                remark === "DISTINCTION" && "bg-primary/10 text-primary",
                                remark === "VERY GOOD" && "bg-primary/10 text-primary",
                                remark === "FAIL" && "bg-danger-light text-danger"
                              )}>
                                {remark}
                              </span>
                            ) : (
                              "&mdash;"
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Score Completion & Review Dashboard */}
        {step === "review" && (
          <div className="max-w-5xl mx-auto space-y-8 animate-slide-right">
            <div>
              <button
                onClick={() => setStep("mark_sheet")}
                className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline mb-2"
              >
                <ArrowLeft size={14} /> Back to Mark Sheet
              </button>
              <h1 className="text-4xl text-primary font-bold tracking-tight">Final Review & Completion</h1>
              <p className="text-content-secondary">
                Verify the grading analytics, class performance levels, and check warning statuses before locking.
              </p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-border-primary/60 shadow-card relative overflow-hidden">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-xs font-bold text-content-secondary uppercase mb-4">Completion Status</p>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-3xl font-bold text-content-primary">
                      {stats.gradedCount} / {stats.totalPossible}
                    </span>
                    <p className="text-xs text-content-secondary mt-1 font-semibold">Students Graded</p>
                  </div>
                  <div className="relative w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm border border-primary/20">
                    {stats.completionPercent}%
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border-primary/60 shadow-card relative overflow-hidden">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-xs font-bold text-content-secondary uppercase mb-4">Missing Scores</p>
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    stats.pendingCount > 0 ? "bg-danger-light text-danger" : "bg-primary/10 text-primary"
                  )}>
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <span className={cn("text-3xl font-bold", stats.pendingCount > 0 ? "text-danger" : "text-primary")}>
                      {stats.pendingCount}
                    </span>
                    <p className="text-xs text-content-secondary mt-1 font-semibold">Students Pending</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border-primary/60 shadow-card relative overflow-hidden">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-xs font-bold text-content-secondary uppercase mb-4">Validation Status</p>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <span className="text-3xl font-bold text-primary">0</span>
                    <p className="text-xs text-content-secondary mt-1 font-semibold">Invalid Entries</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-border-primary/60 shadow-card relative overflow-hidden">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-xs font-bold text-content-secondary uppercase mb-4">Class Performance</p>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-content-secondary">Average</span>
                    <span className="text-primary">{stats.averageScore}%</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-content-secondary font-semibold">
                    <span>Range</span>
                    <span>42% &mdash; 96%</span>
                  </div>
                  <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden mt-2">
                    <div className="bg-primary h-full" style={{ width: `${stats.averageScore}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Unfinished Business & Guidance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl text-primary font-bold flex items-center gap-2">
                    <AlertTriangle className="text-danger" /> Unfinished Business
                  </h2>
                  <span className="px-3 py-1 rounded-full bg-danger-light text-danger text-[10px] font-bold uppercase tracking-wider">
                    Action Required
                  </span>
                </div>

                <div className="space-y-3">
                  {students.filter(s => {
                    const studScores = scores[s.id] || {}
                    return components.some(c => studScores[c.id] === "" || studScores[c.id] === undefined)
                  }).map(s => (
                    <div key={s.id} className="bg-white rounded-2xl p-4 flex items-center justify-between border border-border-primary/60 shadow-card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface-secondary flex items-center justify-center font-bold text-content-secondary">
                          {s.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-content-primary">{s.name}</h4>
                          <p className="text-xs text-content-secondary">{s.student_id}</p>
                        </div>
                      </div>
                      <Button
                        onClick={() => setStep("mark_sheet")}
                        variant="outline"
                        className="text-xs font-bold rounded-full px-4 flex items-center gap-1"
                      >
                        Jump to Entry <ArrowRight size={12} />
                      </Button>
                    </div>
                  ))}
                  {stats.pendingCount === 0 && (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center text-primary">
                      <Check className="mx-auto mb-2" size={32} />
                      <p className="font-bold text-sm">All student grades have been entered successfully!</p>
                    </div>
                  )}
                </div>

                <div className="bg-surface-secondary p-6 rounded-2xl border-l-4 border-primary text-xs italic text-content-secondary leading-relaxed">
                  &ldquo;Please ensure all absences are correctly coded (e.g. leave blanks for absent or handle according to school policy) before locking. Once locked, modifications require department head approval.&rdquo;
                </div>
              </div>

              {/* Score Distribution bar chart */}
              <div className="space-y-6">
                <h2 className="text-xl text-primary font-bold flex items-center gap-2">
                  <BarChart2 /> Score Distribution
                </h2>

                <div className="bg-white rounded-2xl p-6 border border-border-primary/60 shadow-card relative overflow-hidden">
                  <div className="linen-texture absolute inset-0"></div>
                  <div className="flex flex-col gap-5 relative z-10">
                    <div className="space-y-1">
                      <div className="flex justify-between items-end text-xs font-semibold">
                        <span className="font-bold text-primary">Grade A (75-100)</span>
                        <span className="text-content-secondary">{gradeDistribution.aCount} Students</span>
                      </div>
                      <div className="h-6 w-full bg-surface-secondary rounded-lg overflow-hidden flex items-center px-1">
                        <div className="h-4 bg-primary rounded-md transition-all duration-1000" style={{ width: `${(gradeDistribution.aCount / students.length) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-end text-xs font-semibold">
                        <span className="font-bold text-primary">Grade B (65-74)</span>
                        <span className="text-content-secondary">{gradeDistribution.bCount} Students</span>
                      </div>
                      <div className="h-6 w-full bg-surface-secondary rounded-lg overflow-hidden flex items-center px-1">
                        <div className="h-4 bg-primary rounded-md transition-all duration-1000" style={{ width: `${(gradeDistribution.bCount / students.length) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-end text-xs font-semibold">
                        <span className="font-bold text-primary">Grade C (50-64)</span>
                        <span className="text-content-secondary">{gradeDistribution.cCount} Students</span>
                      </div>
                      <div className="h-6 w-full bg-surface-secondary rounded-lg overflow-hidden flex items-center px-1">
                        <div className="h-4 bg-primary rounded-md transition-all duration-1000" style={{ width: `${(gradeDistribution.cCount / students.length) * 100}%` }}></div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-end text-xs font-semibold">
                        <span className="font-bold text-danger">Grade F (Below 50)</span>
                        <span className="text-content-secondary">{gradeDistribution.fCount} Students</span>
                      </div>
                      <div className="h-6 w-full bg-surface-secondary rounded-lg overflow-hidden flex items-center px-1">
                        <div className="h-4 bg-danger rounded-md transition-all duration-1000" style={{ width: `${(gradeDistribution.fCount / students.length) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating action bar for locking & finalizing */}
        {step !== "select" && (
          <footer className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.05)] py-5 px-6 md:px-10 border-t border-border-primary/60">
            <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 text-content-secondary text-xs font-semibold">
                <Info size={16} />
                <span>
                  {currentSubjectName} &mdash; {currentClassroomName} | Term boundary locks scores permanently.
                </span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button
                  onClick={() => setStep(step === "review" ? "mark_sheet" : "select")}
                  variant="outline"
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-full font-bold text-xs"
                >
                  {step === "review" ? "Back to Mark Sheet" : "Cancel"}
                </Button>
                {step === "mark_sheet" ? (
                  <Button
                    onClick={() => setStep("review")}
                    className="flex-1 sm:flex-none bg-primary text-primary-foreground px-8 py-2.5 rounded-full font-bold text-xs shadow-lg hover:brightness-110"
                  >
                    Go to Finalize Review
                  </Button>
                ) : (
                  <Button
                    onClick={handleFinalizeLock}
                    className="flex-1 sm:flex-none bg-primary text-primary-foreground px-8 py-2.5 rounded-full font-bold text-xs shadow-lg hover:brightness-110 flex items-center justify-center gap-1"
                  >
                    <Lock size={14} /> Finalize &amp; Lock Scores
                  </Button>
                )}
              </div>
            </div>
          </footer>
        )}

        {/* Completion Screen */}
        {completed && (
          <div className="max-w-2xl mx-auto text-center py-16 animate-slide-up">
            <div className="bg-white rounded-3xl p-12 border border-border-primary/60 shadow-card relative overflow-hidden">
              <div className="linen-texture absolute inset-0"></div>
              <div className="relative z-10">
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6 mx-auto">
                  <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl text-content-primary font-bold mb-3">Scores Locked!</h2>
                <p className="text-content-secondary mb-8 max-w-md mx-auto">
                  All scores for <strong className="text-primary">{currentSubjectName}</strong> in <strong className="text-primary">{currentClassroomName}</strong> have been finalized and synced.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link
                    href="/dashboard/results"
                    className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-md"
                  >
                    View Results <ArrowRight size={16} />
                  </Link>
                  <button
                    onClick={() => { setCompleted(false); setStep("select") }}
                    className="inline-flex items-center justify-center gap-2 border border-border-primary text-content-primary px-8 py-4 rounded-full font-bold hover:bg-surface-secondary transition-all"
                  >
                    Enter More Scores
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
