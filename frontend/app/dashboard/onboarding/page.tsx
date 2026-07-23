"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { Loader2, CheckCircle2, ArrowRight, ArrowLeft, School, Calendar, Layers, GraduationCap, Users, UserPlus, BookOpen, ClipboardList } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"

const profileSchema = z.object({
  school_name: z.string().min(1, "School name is required"),
  school_address: z.string().optional(),
  school_phone: z.string().optional(),
  school_email: z.string().email().optional().or(z.literal("")),
})

const sessionSchema = z.object({
  session_name: z.string().min(1, "Session name is required"),
  start_date: z.string().min(1, "Start date is required"),
  end_date: z.string().min(1, "End date is required"),
})

const classroomSchema = z.object({
  grade_name: z.string().min(1, "Grade name is required"),
  classroom_name: z.string().min(1, "Classroom name is required"),
})

type Step = "profile" | "session" | "classrooms" | "terms" | "done"

interface GradeEntry {
  name: string
  classrooms: string[]
}

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("profile")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [grades, setGrades] = useState<GradeEntry[]>([])
  const [newGrade, setNewGrade] = useState({ name: "", classroom: "" })
  const [termNames] = useState(["First Term", "Second Term", "Third Term"])

  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
  })

  const sessionForm = useForm<z.infer<typeof sessionSchema>>({
    resolver: zodResolver(sessionSchema),
  })

  async function saveProfile(data: z.infer<typeof profileSchema>) {
    setLoading(true)
    setError("")
    try {
      const payload: Record<string, any> = { name: data.school_name }
      if (data.school_address) payload.address = data.school_address
      if (data.school_phone) payload.phone = data.school_phone
      if (data.school_email) payload.email = data.school_email
      await api.academics.schoolProfileUpdate(payload)
      setStep("session")
    } catch (err: any) {
      setError(err.message || "Failed to save school profile")
    } finally {
      setLoading(false)
    }
  }

  async function saveSession(data: z.infer<typeof sessionSchema>) {
    setLoading(true)
    setError("")
    try {
      const session = await api.academics.sessionsCreate({
        name: data.session_name,
        start_date: data.start_date,
        end_date: data.end_date,
        is_current: true,
      })
      setSessionId(session.id)
      setStep("classrooms")
    } catch (err: any) {
      setError(err.message || "Failed to create session")
    } finally {
      setLoading(false)
    }
  }

  function addGrade() {
    if (!newGrade.name.trim()) return
    const existing = grades.find((g) => g.name === newGrade.name.trim())
    if (existing) {
      if (newGrade.classroom.trim() && !existing.classrooms.includes(newGrade.classroom.trim())) {
        existing.classrooms.push(newGrade.classroom.trim())
      }
    } else {
      setGrades([...grades, { name: newGrade.name.trim(), classrooms: newGrade.classroom.trim() ? [newGrade.classroom.trim()] : [] }])
    }
    setNewGrade({ name: "", classroom: "" })
  }

  function removeGrade(index: number) {
    setGrades(grades.filter((_, i) => i !== index))
  }

  function removeClassroom(gradeIndex: number, classroomIndex: number) {
    const updated = [...grades]
    updated[gradeIndex].classrooms.splice(classroomIndex, 1)
    setGrades(updated)
  }

  async function saveClassrooms() {
    setLoading(true)
    setError("")
    try {
      for (const grade of grades) {
        const gradeRes = await api.gradeLevels.create({ name: grade.name })
        const names = grade.classrooms.length > 0 ? grade.classrooms : [grade.name]
        for (const name of names) {
          await api.academics.classroomsCreate({ name, grade_level: gradeRes.id })
        }
      }
      setStep("terms")
    } catch (err: any) {
      setError(err.message || "Failed to save classrooms")
    } finally {
      setLoading(false)
    }
  }

  async function createTerms() {
    setLoading(true)
    setError("")
    try {
      for (let i = 0; i < termNames.length; i++) {
        await api.terms.create({ name: termNames[i], display_order: i + 1, session: sessionId || undefined })
      }
      setStep("done")
    } catch (err: any) {
      setError(err.message || "Failed to create terms")
    } finally {
      setLoading(false)
    }
  }

  const stepIndicator = (s: Step, label: string, icon: React.ReactNode) => {
    const isActive = step === s
    const isDone = ["profile", "session", "classrooms", "terms", "done"].indexOf(step) > ["profile", "session", "classrooms", "terms", "done"].indexOf(s)
    return (
      <div className={`flex items-center gap-2 ${isActive ? "text-primary" : isDone ? "text-success" : "text-content-muted"}`}>
        <div className={`flex size-8 items-center justify-center rounded-full text-sm font-semibold ${isActive ? "bg-primary/10 text-primary" : isDone ? "bg-success/10 text-success" : "bg-surface-secondary text-content-muted"}`}>
          {isDone ? <CheckCircle2 size={16} /> : icon}
        </div>
        <span className="text-sm font-medium max-md:hidden">{label}</span>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl py-8">
      <div className="mb-8 flex items-center justify-center gap-4">
        {stepIndicator("profile", "Profile", <School size={16} />)}
        <div className="h-px w-12 bg-border-primary" />
        {stepIndicator("session", "Session", <Calendar size={16} />)}
        <div className="h-px w-12 bg-border-primary" />
        {stepIndicator("classrooms", "Classes", <Layers size={16} />)}
        <div className="h-px w-12 bg-border-primary" />
        {stepIndicator("terms", "Terms", <GraduationCap size={16} />)}
      </div>

      <Card padding="lg">
        {error && (
          <div className="mb-4 rounded-lg border border-danger/40 bg-danger-light p-3 text-sm text-danger">{error}</div>
        )}

        {step === "profile" && (
          <form onSubmit={profileForm.handleSubmit(saveProfile)} className="space-y-4">
            <h2 className="text-xl font-bold">School Profile</h2>
            <p className="text-sm text-content-secondary">Tell us about your school.</p>
            <Input label="School Name" {...profileForm.register("school_name")} error={profileForm.formState.errors.school_name?.message} />
            <Input label="School Address (optional)" {...profileForm.register("school_address")} />
            <Input label="Phone (optional)" {...profileForm.register("school_phone")} />
            <Input label="Email (optional)" type="email" {...profileForm.register("school_email")} />
            <div className="flex justify-end pt-2">
              <Button type="submit" variant="primary" isLoading={loading}>
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {step === "session" && (
          <form onSubmit={sessionForm.handleSubmit(saveSession)} className="space-y-4">
            <h2 className="text-xl font-bold">Academic Session</h2>
            <p className="text-sm text-content-secondary">Create your first academic session (e.g. 2025/2026).</p>
            <Input label="Session Name" placeholder="e.g. 2025/2026" {...sessionForm.register("session_name")} error={sessionForm.formState.errors.session_name?.message} />
            <Input label="Start Date" type="date" {...sessionForm.register("start_date")} error={sessionForm.formState.errors.start_date?.message} />
            <Input label="End Date" type="date" {...sessionForm.register("end_date")} error={sessionForm.formState.errors.end_date?.message} />
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("profile")}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button type="submit" variant="primary" isLoading={loading}>
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </form>
        )}

        {step === "classrooms" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Grades & Classrooms</h2>
            <p className="text-sm text-content-secondary">Add grade levels (e.g. JSS1, SSS2) and their classrooms (e.g. JSS1A, JSS1B).</p>

            <div className="flex gap-2">
              <Input
                label="Grade"
                placeholder="e.g. JSS1"
                value={newGrade.name}
                onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                wrapperClassName="flex-1"
              />
              <Input
                label="Classroom"
                placeholder="e.g. JSS1A"
                value={newGrade.classroom}
                onChange={(e) => setNewGrade({ ...newGrade, classroom: e.target.value })}
                wrapperClassName="flex-1"
              />
              <Button variant="secondary" className="mt-6" onClick={addGrade}>
                Add
              </Button>
            </div>

            {grades.length > 0 && (
              <div className="space-y-2">
                {grades.map((grade, gi) => (
                  <div key={gi} className="rounded-lg border border-border-primary p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{grade.name}</span>
                      <button onClick={() => removeGrade(gi)} className="text-xs text-danger hover:underline">Remove</button>
                    </div>
                    {grade.classrooms.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {grade.classrooms.map((c, ci) => (
                          <span key={ci} className="inline-flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-xs">
                            {c}
                            <button onClick={() => removeClassroom(gi, ci)} className="text-content-muted hover:text-danger">&times;</button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("session")}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button variant="primary" onClick={saveClassrooms} isLoading={loading}>
                Continue <ArrowRight size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === "terms" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Academic Terms</h2>
            <p className="text-sm text-content-secondary">Create the terms for this session.</p>
            <div className="space-y-2">
              {termNames.map((name, i) => (
                <div key={name} className="flex items-center gap-3 rounded-lg border border-border-primary p-3">
                  <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{i + 1}</div>
                  <span className="text-sm font-medium">{name}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between pt-2">
              <Button type="button" variant="outline" onClick={() => setStep("classrooms")}>
                <ArrowLeft size={16} /> Back
              </Button>
              <Button variant="primary" onClick={createTerms} isLoading={loading}>
                Finish Setup <CheckCircle2 size={16} />
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-4 text-success" size={64} />
            <h2 className="text-2xl font-bold">All Set!</h2>
            <p className="mt-2 text-sm text-content-secondary">Your school is fully set up. Here are some next steps:</p>
            <div className="mx-auto mt-6 grid max-w-sm gap-3 text-left">
              <Link href="/dashboard/students" className="flex items-center gap-3 rounded-lg border border-border-primary p-3 text-sm transition-colors hover:bg-surface-secondary">
                <Users size={18} className="text-primary" />
                <span>Add students</span>
              </Link>
              <Link href="/dashboard/settings" className="flex items-center gap-3 rounded-lg border border-border-primary p-3 text-sm transition-colors hover:bg-surface-secondary">
                <UserPlus size={18} className="text-primary" />
                <span>Invite teachers</span>
              </Link>
              <Link href="/dashboard/courses" className="flex items-center gap-3 rounded-lg border border-border-primary p-3 text-sm transition-colors hover:bg-surface-secondary">
                <BookOpen size={18} className="text-primary" />
                <span>Create subjects</span>
              </Link>
              <Link href="/dashboard/exams" className="flex items-center gap-3 rounded-lg border border-border-primary p-3 text-sm transition-colors hover:bg-surface-secondary">
                <ClipboardList size={18} className="text-primary" />
                <span>Create exams</span>
              </Link>
            </div>
            <Button variant="primary" className="mt-6" onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
