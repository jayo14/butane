"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Calendar,
  Layers,
  BookOpen,
  Clipboard,
  Award,
  Plus,
  Search,
  Sliders,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  FileText,
  User,
  HelpCircle,
  Bell,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Download,
  Filter,
  PlusCircle,
  Eye,
  Trash2,
  Edit2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

interface GradingPageClientProps {
  initialSessions: any[]
  initialClassrooms: any[]
  initialTerms: any[]
  initialSubjects: any[]
  initialGradeScales: any[]
  initialAssignments: any[]
  profile: any
}

export function GradingPageClient({
  initialSessions,
  initialClassrooms,
  initialTerms,
  initialSubjects,
  initialGradeScales,
  initialAssignments,
  profile
}: GradingPageClientProps) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<"dashboard" | "sessions" | "terms" | "classes" | "subjects" | "grading">("dashboard")
  const [sessions, setSessions] = useState(initialSessions)
  const [classrooms, setClassrooms] = useState(initialClassrooms)
  const [terms, setTerms] = useState(initialTerms)
  const [subjects, setSubjects] = useState(initialSubjects)
  const [gradeScales, setGradeScales] = useState(initialGradeScales)
  const [assignments, setAssignments] = useState(initialAssignments)

  const [isEmptyState, setIsEmptyState] = useState(false)

  // Modals / forms state
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionForm, setSessionForm] = useState({ name: "", start_date: "", end_date: "", is_current: false })

  const [showClassModal, setShowClassModal] = useState(false)
  const [classForm, setClassForm] = useState({ name: "", grade_level: "" })

  const [showTermModal, setShowTermModal] = useState(false)
  const [termForm, setTermForm] = useState({ name: "", display_order: 1 })

  const [showSubjectModal, setShowSubjectModal] = useState(false)
  const [subjectForm, setSubjectForm] = useState({ name: "", code: "", description: "" })

  // Filters for Classes tab
  const [classSearch, setClassSearch] = useState("")
  const [selectedGrade, setSelectedGrade] = useState("All Grade Levels")
  const [selectedDept, setSelectedDept] = useState("All Departments")

  // API submit functions
  async function handleAddSession(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = await api.academics.sessionsCreate(sessionForm)
      setSessions([data, ...sessions])
      setShowSessionModal(false)
      setSessionForm({ name: "", start_date: "", end_date: "", is_current: false })
      addToast({ message: "Academic Session created successfully!", variant: "success" })
    } catch (err) {
      console.error(err)
      addToast({ message: "Failed to create session.", variant: "error" })
    }
  }

  async function handleAddClass(e: React.FormEvent) {
    e.preventDefault()
    try {
      // Find a grade level ID from existing classrooms, or mock one if none exists
      let gradeLevelId = classForm.grade_level
      if (!gradeLevelId) {
        // Fallback: try to find a grade level from the database or create a dummy uuid
        gradeLevelId = "da8d3e23-74e8-4682-8bc1-6f4e82df423d" 
      }
      const data = await api.academics.classroomsCreate({
        name: classForm.name,
        grade_level: gradeLevelId
      })
      setClassrooms([data, ...classrooms])
      setShowClassModal(false)
      setClassForm({ name: "", grade_level: "" })
      addToast({ message: "Classroom created successfully!", variant: "success" })
    } catch (err) {
      console.error(err)
      addToast({ message: "Failed to create classroom. Ensure Grade Level is correct.", variant: "error" })
    }
  }

  async function handleAddTerm(e: React.FormEvent) {
    e.preventDefault()
    try {
      const currentSession = sessions.find(s => s.is_current)?.id || (sessions[0]?.id)
      const data = await api.terms.create({
        name: termForm.name,
        display_order: termForm.display_order,
        session: currentSession
      })
      setTerms([...terms, data])
      setShowTermModal(false)
      setTermForm({ name: "", display_order: 1 })
      addToast({ message: "Academic Term created successfully!", variant: "success" })
    } catch (err) {
      console.error(err)
      addToast({ message: "Failed to create academic term.", variant: "error" })
    }
  }

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = await api.subjects.create(subjectForm)
      setSubjects([...subjects, data])
      setShowSubjectModal(false)
      setSubjectForm({ name: "", code: "", description: "" })
      addToast({ message: "Subject created successfully!", variant: "success" })
    } catch (err) {
      console.error(err)
      addToast({ message: "Failed to create subject.", variant: "error" })
    }
  }

  // Filtered classrooms
  const filteredClassrooms = useMemo(() => {
    return classrooms.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(classSearch.toLowerCase())
      // Add other filters as mockable if needed
      return matchesSearch
    })
  }, [classrooms, classSearch])

  return (
    <>
      <style jsx global>{`
        /* Artisanal Canvas Textures & Effects */
        .canvas-bg {
          background-color: #fcfbf7;
          background-image: url("https://www.transparenttextures.com/patterns/natural-paper.png");
          background-blend-mode: multiply;
        }

        .stitched-border {
          position: relative;
        }
        .stitched-border::after {
          content: '';
          position: absolute;
          inset: 4px;
          border: 1.5px dashed #00422b;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0.3;
        }

        .recessed-input {
          box-shadow: inset 2px 2px 5px rgba(0,0,0,0.05);
          background: #ffffff;
        }

        .tactile-card {
          box-shadow: 0 12px 24px -2px rgba(55, 65, 81, 0.08);
          border: 1px solid rgba(187, 202, 191, 0.3);
        }

        .convex-button {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255,255,255,0.4);
        }
        
        /* Soft Crease Divider */
        .crease-line {
          height: 1px;
          background: linear-gradient(to right, transparent, #bbcabf, transparent);
          box-shadow: 0 1px 0 #ffffff;
        }

        .linen-texture {
          background-image: url("https://www.transparenttextures.com/patterns/linen.png");
          opacity: 0.03;
          pointer-events: none;
        }
      `}</style>

      <div className="canvas-bg min-h-screen text-on-surface font-body-md relative overflow-x-hidden p-6 md:p-10">
        
        {/* Top Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="font-headline-xl text-4xl text-primary font-bold tracking-tight">Academic Setup & Grading</h1>
            <p className="text-body-lg text-tertiary max-w-xl">
              Configure sessions, terms, classes, subjects, and grade scales.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold uppercase stitched-border">
              ACADEMIC CONTROL
            </span>
          </div>
        </div>

        {/* Tab System */}
        <div className="flex flex-wrap gap-2 mb-8 bg-surface-container-low p-1.5 rounded-2xl w-fit border border-outline-variant/30 shadow-inner">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
              activeTab === "dashboard"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
              activeTab === "sessions"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Sessions
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
              activeTab === "terms"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Terms
          </button>
          <button
            onClick={() => setActiveTab("classes")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
              activeTab === "classes"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Classes
          </button>
          <button
            onClick={() => setActiveTab("subjects")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
              activeTab === "subjects"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Subjects
          </button>
          <button
            onClick={() => setActiveTab("grading")}
            className={cn(
              "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
              activeTab === "grading"
                ? "bg-primary text-on-primary shadow-md"
                : "text-on-surface-variant hover:bg-surface-container-high"
            )}
          >
            Grade Scales
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "dashboard" && (
          <div className="space-y-8 animate-slide-right">
            {/* Welcome banner */}
            <section className="relative overflow-hidden bg-primary-container/15 rounded-3xl p-8 border border-primary-container/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
              <div className="relative z-10 flex-1">
                <h2 className="font-headline-lg text-2xl text-on-primary-container mb-2 font-bold">
                  Good Day, {profile?.full_name || "School Administrator"}
                </h2>
                <p className="font-body-lg text-on-surface-variant max-w-xl">
                  Manage the school structural framework, build grade distributions, or finalize assessment weights. Use quick actions to fast-track setups.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setIsEmptyState(!isEmptyState)}
                  className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-full px-4"
                >
                  Toggle Demo Empty State
                </Button>
              </div>
            </section>

            {/* KPI Cards Row */}
            <section className="grid grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-surface-container-lowest p-6 rounded-3xl tactile-card relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-label-sm text-on-surface-variant uppercase mb-2 font-semibold">Sessions</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-3xl text-on-surface font-bold">{sessions.length || 1}</span>
                  <span className="text-secondary text-xs font-bold">Active</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-3xl tactile-card relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-label-sm text-on-surface-variant uppercase mb-2 font-semibold">Classrooms</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-3xl text-on-surface font-bold">{classrooms.length || 4}</span>
                  <span className="text-on-surface-variant text-xs font-medium">Assigned</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-3xl tactile-card relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-label-sm text-on-surface-variant uppercase mb-2 font-semibold">Terms</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-3xl text-on-surface font-bold">{terms.length || 3}</span>
                  <span className="text-primary text-xs font-bold">Setup</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-3xl tactile-card relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-label-sm text-on-surface-variant uppercase mb-2 font-semibold">Subjects</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-3xl text-on-surface font-bold">{subjects.length || 6}</span>
                  <span className="text-on-surface-variant text-xs font-medium">Active</span>
                </div>
              </div>
              <div className="bg-surface-container-lowest p-6 rounded-3xl tactile-card relative overflow-hidden group hover:-translate-y-1 transition-transform">
                <div className="linen-texture absolute inset-0"></div>
                <p className="text-label-sm text-on-surface-variant uppercase mb-2 font-semibold">Grade Scales</p>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline-lg text-3xl text-on-surface font-bold">{gradeScales.length || 4}</span>
                  <span className="text-primary text-xs font-bold">Standard</span>
                </div>
              </div>
            </section>

            {/* Main Double Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Recent Activity */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface-container-lowest p-8 rounded-3xl tactile-card relative overflow-hidden min-h-[400px]">
                  <div className="linen-texture absolute inset-0"></div>
                  <h3 className="font-headline-md text-xl text-on-surface font-bold mb-6">Recent Activity</h3>
                  
                  {!isEmptyState ? (
                    <div className="space-y-4">
                      {/* Activity Item 1 */}
                      <div className="group p-4 flex items-center justify-between transition-all hover:bg-surface-container-low/50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-secondary-container flex items-center justify-center text-secondary shadow-inner">
                            <Layers size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-sm">Grading Policy Initialized</p>
                            <p className="text-xs text-on-surface-variant">WAEC Standard Scale sync completed across all grade arms.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-on-surface-variant">2 hours ago</p>
                          <span className="text-primary text-xs font-bold hover:underline cursor-pointer">Details</span>
                        </div>
                      </div>
                      <div className="crease-line"></div>
                      
                      {/* Activity Item 2 */}
                      <div className="group p-4 flex items-center justify-between transition-all hover:bg-surface-container-low/50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-primary shadow-inner">
                            <Calendar size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-sm">New Session 2026/2027</p>
                            <p className="text-xs text-on-surface-variant">Academic calendar and term boundaries set up.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-on-surface-variant">Yesterday</p>
                          <span className="text-primary text-xs font-bold hover:underline cursor-pointer">View Setup</span>
                        </div>
                      </div>
                      <div className="crease-line"></div>

                      {/* Activity Item 3 */}
                      <div className="group p-4 flex items-center justify-between transition-all hover:bg-surface-container-low/50 rounded-2xl">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-tertiary-container/20 flex items-center justify-center text-tertiary shadow-inner">
                            <BookOpen size={20} />
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-sm">Course List Synchronized</p>
                            <p className="text-xs text-on-surface-variant">Science, Arts, and Commercial departments updated.</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-on-surface-variant">3 days ago</p>
                          <span className="text-primary text-xs font-bold hover:underline cursor-pointer">Audit</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center py-16 animate-pulse-slow">
                      <div className="w-36 h-36 mb-6 bg-primary-container/10 rounded-full flex items-center justify-center text-primary border border-primary/10">
                        <Sparkles size={64} className="opacity-40 animate-float" />
                      </div>
                      <h4 className="font-headline-md text-lg text-on-surface font-bold mb-2">A clean start awaits</h4>
                      <p className="text-sm text-on-surface-variant max-w-sm">
                        Welcome to the grading system dashboard! Setup your academic terms, sessions, and subjects to begin tracking performance.
                      </p>
                      <Button
                        onClick={() => setActiveTab("sessions")}
                        className="mt-6 bg-primary text-on-primary px-6 rounded-full stitched-border active:scale-95 transition-all"
                      >
                        Start Setup Wizard
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Quick Actions & Tips */}
              <div className="space-y-6">
                <div className="bg-surface-container-lowest p-8 rounded-3xl tactile-card relative overflow-hidden">
                  <div className="linen-texture absolute inset-0"></div>
                  <h3 className="font-headline-md text-xl text-on-surface font-bold mb-6">Quick Actions</h3>
                  
                  <div className="space-y-4">
                    <Link
                      href="/dashboard/score-entry"
                      className="w-full text-left p-4 bg-surface-container hover:bg-primary-container/20 rounded-2xl flex items-center gap-4 transition-all group border border-outline-variant/30 active:scale-[0.98]"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shadow-md group-hover:scale-110 transition-transform">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">Enter Scores</p>
                        <p className="text-xs text-on-surface-variant">Access digital mark sheets & enter grades</p>
                      </div>
                    </Link>

                    <button
                      onClick={() => setActiveTab("classes")}
                      className="w-full text-left p-4 bg-surface-container hover:bg-secondary-container/30 rounded-2xl flex items-center gap-4 transition-all group border border-outline-variant/30 active:scale-[0.98]"
                    >
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-on-secondary shadow-md group-hover:scale-110 transition-transform">
                        <PlusCircle size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">Create Classroom</p>
                        <p className="text-xs text-on-surface-variant">Add new classrooms and assign teachers</p>
                      </div>
                    </button>

                    <Link
                      href="/dashboard/report-cards"
                      className="w-full text-left p-4 bg-surface-container hover:bg-tertiary-container/30 rounded-2xl flex items-center gap-4 transition-all group border border-outline-variant/30 active:scale-[0.98]"
                    >
                      <div className="w-10 h-10 rounded-full bg-tertiary flex items-center justify-center text-on-tertiary shadow-md group-hover:scale-110 transition-transform">
                        <Award size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-on-surface text-sm">Generate Reports</p>
                        <p className="text-xs text-on-surface-variant">Print or export student report cards</p>
                      </div>
                    </Link>
                  </div>

                  <div className="mt-8 p-6 rounded-2xl bg-[#002114] text-secondary-container relative overflow-hidden stitched-border">
                    <div className="absolute top-2 right-2 opacity-20">
                      <Sparkles size={48} />
                    </div>
                    <p className="font-bold text-sm mb-1 text-white">Grading Tip</p>
                    <p className="text-xs opacity-90 leading-relaxed">
                      Syncing session settings upfront ensures all student lists, term schedules, and class assignments calculate correctly in automated report cards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Sessions */}
        {activeTab === "sessions" && (
          <div className="space-y-6 animate-slide-right">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-headline-lg text-2xl text-primary font-bold">Academic Sessions</h3>
                <p className="text-sm text-tertiary">Create and manage your school's annual academic calendar cycles.</p>
              </div>
              <Button
                onClick={() => setShowSessionModal(true)}
                className="bg-primary text-on-primary rounded-full px-5 stitched-border hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus size={16} className="mr-1" /> Add New Session
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sessions.map((s: any) => (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-3xl p-8 shadow-sm border relative overflow-hidden flex flex-col min-h-[220px] transition-all duration-300 hover:shadow-md",
                    s.is_current
                      ? "bg-white border-primary-container ring-2 ring-primary-container/20"
                      : "bg-white border-outline-variant/30 opacity-80"
                  )}
                >
                  <div className="linen-texture absolute inset-0"></div>
                  <div className="flex justify-between items-start mb-6 z-10">
                    <span className="material-symbols-outlined text-primary text-4xl">history_edu</span>
                    {s.is_current ? (
                      <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
                        Active
                      </span>
                    ) : (
                      <span className="bg-tertiary-fixed text-on-tertiary-fixed px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                        Archived
                      </span>
                    )}
                  </div>
                  <h3 className="font-headline-md text-2xl text-on-surface font-bold z-10">{s.name}</h3>
                  <p className="text-xs text-outline font-semibold mb-6 z-10">Academic Cycle</p>
                  
                  <div className="mt-auto pt-4 flex justify-between items-center border-t border-outline-variant/20 z-10">
                    <span className="text-xs text-on-surface-variant font-semibold">
                      {s.start_date} &mdash; {s.end_date}
                    </span>
                    <button className="text-primary font-bold text-xs flex items-center hover:underline">
                      Edit <Edit2 size={12} className="ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Terms */}
        {activeTab === "terms" && (
          <div className="space-y-6 animate-slide-right">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-headline-lg text-2xl text-primary font-bold">Academic Terms</h3>
                <p className="text-sm text-tertiary">Configure and transition between terms within the current session.</p>
              </div>
              <Button
                onClick={() => setShowTermModal(true)}
                className="bg-primary text-on-primary rounded-full px-5 stitched-border hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus size={16} className="mr-1" /> Add New Term
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {terms.map((t: any, idx: number) => {
                const status = idx === 0 ? "Concluded" : idx === 1 ? "Active" : "Upcoming"
                return (
                  <div
                    key={t.id || idx}
                    className={cn(
                      "relative rounded-3xl p-8 shadow-sm border overflow-hidden flex flex-col justify-between min-h-[240px] transition-all hover:shadow-md bg-white",
                      status === "Active" ? "border-primary-container ring-2 ring-primary-container/20" : "border-outline-variant/30"
                    )}
                  >
                    <div className="linen-texture absolute inset-0"></div>
                    <div>
                      <div className="flex justify-between items-start mb-6">
                        <span
                          className={cn(
                            "px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold",
                            status === "Concluded" && "bg-surface-container-highest text-on-surface-variant",
                            status === "Active" && "bg-secondary-container text-on-secondary-container shadow-sm",
                            status === "Upcoming" && "bg-tertiary-fixed text-on-tertiary-fixed"
                          )}
                        >
                          {status}
                        </span>
                        <button className="text-on-surface-variant hover:text-primary transition-colors">
                          <Edit2 size={14} />
                        </button>
                      </div>
                      <h3 className="font-headline-md text-2xl text-on-surface font-bold mb-1">{t.name}</h3>
                      <div className="flex items-center gap-2 text-on-surface-variant/70 text-xs">
                        <Calendar size={14} />
                        <span>Display Order: {t.display_order}</span>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
                      <span className="text-xs text-on-surface-variant font-semibold">
                        {status === "Active" ? "Currently in progress" : "Scheduled"}
                      </span>
                      {status === "Upcoming" && (
                        <button className="bg-surface-container-high px-3 py-1 rounded-full text-xs font-bold text-on-surface hover:bg-primary hover:text-on-primary transition-all">
                          Initialize
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/30 flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1">
                <h4 className="font-headline-md text-lg font-bold mb-2 italic">Did you know?</h4>
                <p className="text-sm text-on-surface-variant mb-4">
                  Standardizing your term dates across all departments ensures synchronized grading cycles and easier credit transferability for your students.
                </p>
                <Button className="bg-white hover:bg-white/95 text-primary border border-primary/20 rounded-full px-5 text-xs shadow-sm">
                  Download 2026 Academic Calendar
                </Button>
              </div>
              <div className="bg-[#002114] text-secondary-container rounded-2xl p-6 stitched-border md:w-80">
                <div className="flex items-center gap-2 mb-2 text-white">
                  <AlertCircle size={16} />
                  <span className="font-bold text-xs uppercase tracking-wider">System Alert</span>
                </div>
                <p className="text-xs opacity-90 leading-relaxed">
                  The transition to 'Third Term' is scheduled for automatic activation in 42 days. Make sure all assessment records for Second Term are locked.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Classes */}
        {activeTab === "classes" && (
          <div className="space-y-6 animate-slide-right">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="font-headline-lg text-2xl text-primary font-bold">Manage Classrooms</h3>
                <p className="text-sm text-tertiary">Organize academic arms, departments, and class teachers.</p>
              </div>
              <Button
                onClick={() => setShowClassModal(true)}
                className="bg-primary text-on-primary rounded-full px-5 stitched-border hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus size={16} className="mr-1" /> Add New Class
              </Button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-4 border border-outline-variant/20 shadow-sm">
              <div className="recessed-well flex-1 min-w-[280px] bg-white rounded-full px-4 py-2 flex items-center gap-2 border border-outline-variant/40">
                <Search size={18} className="text-outline" />
                <input
                  value={classSearch}
                  onChange={(e) => setClassSearch(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 w-full text-sm"
                  placeholder="Filter by class name..."
                  type="text"
                />
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="bg-white rounded-full border-outline-variant/40 text-xs px-4 py-2 hover:border-primary focus:ring-primary transition-all"
                >
                  <option>All Grade Levels</option>
                  <option>Junior Secondary</option>
                  <option>Senior Secondary</option>
                </select>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="bg-white rounded-full border-outline-variant/40 text-xs px-4 py-2 hover:border-primary focus:ring-primary transition-all"
                >
                  <option>All Departments</option>
                  <option>Science</option>
                  <option>Arts</option>
                  <option>Commercial</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClassrooms.map((c: any) => (
                <div key={c.id} className="bg-white rounded-3xl p-6 border border-outline-variant/30 shadow-sm hover:shadow-md transition-all flex flex-col relative group">
                  <div className="absolute top-4 right-4">
                    <span className="bg-primary-container/20 text-on-primary-container text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full">
                      ACTIVE
                    </span>
                  </div>
                  <div className="mb-6">
                    <h3 className="font-headline-md text-xl text-on-surface font-bold">{c.name}</h3>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1 font-medium">
                      <Layers size={12} className="text-outline" />
                      Grade Level: {c.grade_level_name || "Senior Secondary"}
                    </p>
                  </div>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-primary/20 bg-secondary-container flex items-center justify-center font-bold text-primary shadow-inner">
                        {c.class_teacher_name ? c.class_teacher_name.substring(0, 2).toUpperCase() : "TR"}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-on-surface-variant/50 uppercase tracking-tighter">Class Teacher</p>
                        <p className="text-xs font-bold text-on-surface">{c.class_teacher_name || "Assigned Teacher"}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1 text-xs">
                        <span className="text-on-surface-variant font-medium">Enrolled Students</span>
                        <span className="font-bold text-on-surface">28 / 35</span>
                      </div>
                      <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden shadow-inner">
                        <div className="h-full bg-primary rounded-full" style={{ width: "80%" }}></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-outline-variant/20 flex gap-2">
                    <button className="flex-1 py-2 rounded-full text-xs font-bold bg-surface-container-low text-primary hover:bg-primary hover:text-on-primary transition-all flex items-center justify-center gap-1">
                      <Eye size={12} /> View Details
                    </button>
                    <button className="p-2 rounded-full text-outline hover:text-danger hover:bg-danger-light/10 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Subjects */}
        {activeTab === "subjects" && (
          <div className="space-y-6 animate-slide-right">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-headline-lg text-2xl text-primary font-bold">Academic Subjects</h3>
                <p className="text-sm text-tertiary">Group core subjects under their respective categories.</p>
              </div>
              <Button
                onClick={() => setShowSubjectModal(true)}
                className="bg-primary text-on-primary rounded-full px-5 stitched-border hover:brightness-110 active:scale-95 transition-all"
              >
                <Plus size={16} className="mr-1" /> Add New Subject
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category: Science */}
              <div className="space-y-4 bg-white/40 p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-3 mb-2">
                  <span className="material-symbols-outlined text-primary text-2xl">science</span>
                  <h3 className="font-headline-md text-lg text-on-surface font-bold">Sciences</h3>
                </div>
                <div className="space-y-3">
                  {subjects.filter(s => s.code?.toLowerCase().includes("sci") || ["chemistry", "physics", "biology", "mathematics"].includes(s.name.toLowerCase())).map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center gap-4 group hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary shadow-inner">
                        <BookOpen size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-on-surface">{s.name}</p>
                        <p className="text-[10px] text-outline font-semibold uppercase">{s.code || "Core Subject"}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-outline hover:text-primary">
                        <Sliders size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: Arts */}
              <div className="space-y-4 bg-white/40 p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-3 mb-2">
                  <span className="material-symbols-outlined text-secondary text-2xl">palette</span>
                  <h3 className="font-headline-md text-lg text-on-surface font-bold">Arts & Humanities</h3>
                </div>
                <div className="space-y-3">
                  {subjects.filter(s => s.code?.toLowerCase().includes("art") || ["english literature", "history", "geography"].includes(s.name.toLowerCase())).map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center gap-4 group hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-full bg-secondary-container/20 flex items-center justify-center text-secondary shadow-inner">
                        <BookOpen size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-on-surface">{s.name}</p>
                        <p className="text-[10px] text-outline font-semibold uppercase">{s.code || "Humanity"}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-outline hover:text-primary">
                        <Sliders size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Category: General / Commercial */}
              <div className="space-y-4 bg-white/40 p-6 rounded-3xl border border-outline-variant/20 shadow-sm">
                <div className="flex items-center gap-3 border-b border-outline-variant pb-3 mb-2">
                  <span className="material-symbols-outlined text-tertiary text-2xl">payments</span>
                  <h3 className="font-headline-md text-lg text-on-surface font-bold">Commercial & General</h3>
                </div>
                <div className="space-y-3">
                  {subjects.filter(s => !s.code?.toLowerCase().includes("sci") && !s.code?.toLowerCase().includes("art") && !["chemistry", "physics", "biology", "mathematics", "english literature", "history", "geography"].includes(s.name.toLowerCase())).map(s => (
                    <div key={s.id} className="bg-white p-4 rounded-2xl shadow-sm border border-outline-variant/10 flex items-center gap-4 group hover:shadow-md transition-all">
                      <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center text-tertiary shadow-inner">
                        <BookOpen size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-on-surface">{s.name}</p>
                        <p className="text-[10px] text-outline font-semibold uppercase">{s.code || "Elective"}</p>
                      </div>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-outline hover:text-primary">
                        <Sliders size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Grade Scales */}
        {activeTab === "grading" && (
          <div className="space-y-6 animate-slide-right">
            <div className="bg-white rounded-3xl shadow-sm border border-outline-variant/20 overflow-hidden">
              <div className="p-8 border-b border-outline-variant/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="font-headline-lg text-2xl text-primary font-bold">WAEC Standard Scale</h3>
                  <p className="text-sm text-tertiary">Current active grading policy for all senior classes.</p>
                </div>
                <Button className="rounded-full border border-primary text-primary bg-white hover:bg-primary-container px-6 text-xs font-semibold">
                  New Scale Definition
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container-low text-xs font-bold text-outline uppercase tracking-wider border-b border-outline-variant/10">
                    <tr>
                      <th className="px-8 py-4">Grade</th>
                      <th className="px-8 py-4">Score Range</th>
                      <th className="px-8 py-4">Remarks</th>
                      <th className="px-8 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {gradeScales.length > 0 ? (
                      gradeScales.map((g: any) => (
                        <tr key={g.id} className="hover:bg-surface-bright/50 transition-colors">
                          <td className="px-8 py-6">
                            <span className="w-10 h-10 bg-primary-container text-on-primary-container font-bold rounded-full flex items-center justify-center shadow-inner">
                              {g.grade}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-bold text-sm text-on-surface">
                            {g.min_score} &mdash; {g.max_score}
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-xs font-bold uppercase",
                              g.grade.startsWith("A") && "bg-success-light text-success",
                              g.grade.startsWith("B") && "bg-primary-container/10 text-primary",
                              g.grade.startsWith("C") && "bg-warning-light text-warning",
                              g.grade.startsWith("F") && "bg-danger-light text-danger"
                            )}>
                              {g.remark}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="text-outline hover:text-primary p-1">
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      // Mock fallback for WAEC standard scales
                      [
                        { grade: "A1", min: 75, max: 100, remark: "DISTINCTION" },
                        { grade: "B2", min: 70, max: 74, remark: "VERY GOOD" },
                        { grade: "B3", min: 65, max: 69, remark: "GOOD" },
                        { grade: "C4", min: 60, max: 64, remark: "CREDIT" },
                        { grade: "F9", min: 0, max: 39, remark: "FAIL" }
                      ].map((g, idx) => (
                        <tr key={idx} className="hover:bg-surface-bright/50 transition-colors">
                          <td className="px-8 py-6">
                            <span className="w-10 h-10 bg-secondary-container text-on-secondary-container font-bold rounded-full flex items-center justify-center shadow-sm">
                              {g.grade}
                            </span>
                          </td>
                          <td className="px-8 py-6 font-bold text-sm text-on-surface">
                            {g.min} &mdash; {g.max}
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                              g.remark === "DISTINCTION" && "bg-secondary-container text-on-secondary-container",
                              g.remark === "VERY GOOD" && "bg-primary-container/20 text-primary",
                              g.remark === "CREDIT" && "bg-tertiary-fixed text-on-tertiary-fixed",
                              g.remark === "FAIL" && "bg-error-container text-on-error-container"
                            )}>
                              {g.remark}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button className="text-outline hover:text-primary p-1">
                              <Edit2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Session */}
        {showSessionModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-outline-variant/30">
              <h3 className="font-headline-md text-2xl font-bold text-primary mb-4">Add Academic Session</h3>
              <form onSubmit={handleAddSession} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant">Session Name</label>
                  <input
                    value={sessionForm.name}
                    onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                    required
                    placeholder="e.g. 2026/2027"
                    className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant">Start Date</label>
                    <input
                      value={sessionForm.start_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, start_date: e.target.value })}
                      required
                      type="date"
                      className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-on-surface-variant">End Date</label>
                    <input
                      value={sessionForm.end_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, end_date: e.target.value })}
                      required
                      type="date"
                      className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2">
                  <input
                    checked={sessionForm.is_current}
                    onChange={(e) => setSessionForm({ ...sessionForm, is_current: e.target.checked })}
                    type="checkbox"
                    id="is_current"
                    className="rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="is_current" className="text-xs font-semibold text-on-surface-variant cursor-pointer">
                    Set as Current Academic Session
                  </label>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowSessionModal(false)}
                    className="rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest px-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-on-primary rounded-full px-6 stitched-border hover:brightness-110"
                  >
                    Save Session
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Class */}
        {showClassModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-outline-variant/30">
              <h3 className="font-headline-md text-2xl font-bold text-primary mb-4">Create Classroom</h3>
              <form onSubmit={handleAddClass} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant">Class Name</label>
                  <input
                    value={classForm.name}
                    onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                    required
                    placeholder="e.g. SS1 Alpha"
                    className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant">Select Grade Level (Optional ID)</label>
                  <input
                    value={classForm.grade_level}
                    onChange={(e) => setClassForm({ ...classForm, grade_level: e.target.value })}
                    placeholder="Defaults to standard grade level ID"
                    className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowClassModal(false)}
                    className="rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest px-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-on-primary rounded-full px-6 stitched-border hover:brightness-110"
                  >
                    Create Class
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Term */}
        {showTermModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-outline-variant/30">
              <h3 className="font-headline-md text-2xl font-bold text-primary mb-4">Add Academic Term</h3>
              <form onSubmit={handleAddTerm} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant">Term Name</label>
                  <input
                    value={termForm.name}
                    onChange={(e) => setTermForm({ ...termForm, name: e.target.value })}
                    required
                    placeholder="e.g. First Term"
                    className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant">Display Order</label>
                  <input
                    value={termForm.display_order}
                    onChange={(e) => setTermForm({ ...termForm, display_order: parseInt(e.target.value) || 1 })}
                    required
                    type="number"
                    min="1"
                    className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowTermModal(false)}
                    className="rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest px-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-on-primary rounded-full px-6 stitched-border hover:brightness-110"
                  >
                    Add Term
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Add Subject */}
        {showSubjectModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl relative border border-outline-variant/30">
              <h3 className="font-headline-md text-2xl font-bold text-primary mb-4">Add Subject</h3>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant">Subject Name</label>
                  <input
                    value={subjectForm.name}
                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    required
                    placeholder="e.g. Chemistry"
                    className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant">Subject Code</label>
                  <input
                    value={subjectForm.code}
                    onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                    required
                    placeholder="e.g. CHEM"
                    className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant">Description (Optional)</label>
                  <textarea
                    value={subjectForm.description}
                    onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                    placeholder="Brief description of course modules..."
                    className="w-full rounded-xl border border-outline-variant p-3 text-sm focus:ring-primary focus:border-primary mt-1"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button
                    type="button"
                    onClick={() => setShowSubjectModal(false)}
                    className="rounded-full bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest px-5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-primary text-on-primary rounded-full px-6 stitched-border hover:brightness-110"
                  >
                    Save Subject
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  )
}
