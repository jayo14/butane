"use client"

import { useState, useEffect, useMemo } from "react"
import {
  UserPlus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Loader2,
  GraduationCap,
  UserCheck,
  BookOpen,
  School,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"

export function TeachingAssignmentsClient() {
  const { hasRole } = useAuth()
  const isAdmin = hasRole("admin")

  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([])
  const [classrooms, setClassrooms] = useState<{ id: string; name: string; class_teacher: string | null }[]>([])
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([])
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [form, setForm] = useState({ teacher: "", classroom: "", subject: "", session: "" })

  const [expandedClassrooms, setExpandedClassrooms] = useState<Set<string>>(new Set())

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <School size={48} className="text-content-muted mb-4" />
        <h2 className="text-xl font-bold text-content-primary">Admin Only</h2>
        <p className="mt-2 text-sm text-content-secondary">This section is only available to school administrators.</p>
      </div>
    )
  }

  useEffect(() => {
    async function load() {
      setLoading(true)
      try {
        const [teachersRes, classroomsRes, subjectsRes, sessionsRes, assignmentsRes] = await Promise.all([
          api.teachers.list().catch(() => []),
          api.academics.classrooms({ page: 1, page_size: 1000 }).catch(() => ({ results: [] })),
          api.subjects.list().catch(() => []),
          api.academics.sessions().catch(() => []),
          api.academics.teachingAssignments().catch(() => []),
        ])
        const teacherList = Array.isArray(teachersRes) ? teachersRes : (teachersRes as any)?.results || []
        setTeachers(teacherList.map((t: any) => ({ id: String(t.id), full_name: t.full_name || t.user?.full_name || `Teacher ${t.id}` })))

        const classroomsList = ((classroomsRes as any)?.results || classroomsRes || [])
        setClassrooms(classroomsList.map((c: any) => ({ id: String(c.id), name: c.name, class_teacher: c.class_teacher ? String(c.class_teacher) : null })))

        setSubjects((subjectsRes as any[]).map((s: any) => ({ id: String(s.id), name: s.name })))
        setSessions(((sessionsRes as any)?.results || sessionsRes || []).map((s: any) => ({ id: String(s.id), name: s.name })))

        const assignData = Array.isArray(assignmentsRes) ? assignmentsRes : (assignmentsRes as any)?.results || []
        setAssignments(assignData)
      } catch {
        // leave empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")
    if (!form.teacher || !form.classroom || !form.subject || !form.session) {
      setError("Please fill all fields")
      return
    }
    setSaving(true)
    try {
      await api.academics.teachingAssignmentsCreate({
        teacher: form.teacher,
        classroom: form.classroom,
        subject: form.subject,
        session: form.session,
      })
      setSuccess("Assignment added")
      setForm({ teacher: "", classroom: "", subject: "", session: "" })
      const res = await api.academics.teachingAssignments().catch(() => [])
      setAssignments(Array.isArray(res) ? res : (res as any)?.results || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assignment")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setError("")
    setSuccess("")
    try {
      await api.academics.teachingAssignmentsDelete(id)
      setSuccess("Assignment removed")
      setAssignments((prev) => prev.filter((a) => String(a.id) !== String(id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove assignment")
    }
  }

  const handleClassTeacherChange = async (classroomId: string, teacherId: string | null) => {
    setError("")
    setSuccess("")
    try {
      await api.academics.classroomsUpdate(classroomId, { class_teacher: teacherId || null })
      setSuccess("Class teacher updated")
      setClassrooms((prev) =>
        prev.map((c) => (c.id === classroomId ? { ...c, class_teacher: teacherId } : c))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update class teacher")
    }
  }

  const grouped = useMemo(() => {
    const map: Record<string, any[]> = {}
    for (const a of assignments) {
      const key = String(a.classroom)
      map[key] = map[key] || []
      map[key].push(a)
    }
    return map
  }, [assignments])

  const teacherName = (id: string) => {
    const t = teachers.find((t) => t.id === String(id))
    return t ? t.full_name : `Teacher ${id}`
  }
  const subjectName = (id: string) => {
    const s = subjects.find((s) => String(s.id) === String(id))
    return s ? s.name : `Subject ${id}`
  }
  const classroomName = (id: string) => {
    const c = classrooms.find((c) => String(c.id) === String(id))
    return c ? c.name : `Classroom ${id}`
  }
  const sessionName = (id: string) => {
    const s = sessions.find((s) => String(s.id) === String(id))
    return s ? s.name : `Session ${id}`
  }

  const toggleClassroom = (id: string) => {
    setExpandedClassrooms((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content-primary md:text-2xl">Teaching Assignments</h1>
        <p className="mt-0.5 text-sm text-content-secondary">Assign subject teachers and class teachers</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger-light p-4 text-sm text-danger">{error}</div>
      )}
      {success && (
        <div className="mb-4 rounded-xl border border-success/40 bg-success-light p-4 text-sm text-success">{success}</div>
      )}

      {/* Subject Teachers */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Add Subject Teacher Form */}
        <Card padding="lg" className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Add Subject Teacher</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-content-primary">Teacher</label>
              <Select
                options={teachers.map((t) => ({ label: t.full_name, value: t.id }))}
                value={form.teacher}
                onChange={(val) => setForm((f) => ({ ...f, teacher: val }))}
                placeholder="Select teacher"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-content-primary">Classroom</label>
              <Select
                options={classrooms.map((c) => ({ label: c.name, value: c.id }))}
                value={form.classroom}
                onChange={(val) => setForm((f) => ({ ...f, classroom: val }))}
                placeholder="Select classroom"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-content-primary">Subject</label>
              <Select
                options={subjects.map((s) => ({ label: s.name, value: s.id }))}
                value={form.subject}
                onChange={(val) => setForm((f) => ({ ...f, subject: val }))}
                placeholder="Select subject"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-content-primary">Session</label>
              <Select
                options={sessions.map((s) => ({ label: s.name, value: s.id }))}
                value={form.session}
                onChange={(val) => setForm((f) => ({ ...f, session: val }))}
                placeholder="Select session"
              />
            </div>
            <Button type="submit" variant="primary" className="w-full" isLoading={saving} leftIcon={<UserPlus size={18} />}>
              Add Assignment
            </Button>
          </form>
        </Card>

        {/* Subject teachers list grouped by classroom */}
        <Card padding="lg" className="lg:col-span-3">
          <h2 className="text-lg font-semibold text-content-primary mb-4">Subject Teachers</h2>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : Object.keys(grouped).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen size={32} className="text-content-muted mb-3" />
              <p className="text-sm font-medium text-content-primary">No subject teachers assigned yet</p>
              <p className="mt-1 text-sm text-content-secondary">Use the form to assign teachers to classrooms and subjects.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(grouped).map(([classroomId, items]) => {
                const isExpanded = expandedClassrooms.has(classroomId)
                return (
                  <div key={classroomId} className="rounded-2xl border border-border-primary bg-surface-secondary/40">
                    <button
                      type="button"
                      onClick={() => toggleClassroom(classroomId)}
                      className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors hover:bg-surface-secondary"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown size={18} className="text-content-muted" /> : <ChevronRight size={18} className="text-content-muted" />}
                        <div>
                          <p className="text-sm font-semibold text-content-primary">{classroomName(classroomId)}</p>
                          <p className="text-xs text-content-muted">{items.length} subject teacher{items.length === 1 ? "" : "s"}</p>
                        </div>
                      </div>
                      <Badge variant="primary" size="sm">{classroomName(classroomId)}</Badge>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-border-primary/60">
                        {items.map((a) => (
                          <div key={a.id} className="flex items-center justify-between px-5 py-3">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-content-primary">{subjectName(a.subject)}</span>
                              <span className="text-xs text-content-muted">Session: {sessionName(a.session)}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-content-secondary">{teacherName(a.teacher)}</span>
                              <button
                                type="button"
                                onClick={() => handleDelete(a.id)}
                                className="rounded-lg p-2 text-content-muted transition-colors hover:text-danger hover:bg-danger/10"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Class Teachers - visually separated */}
      <Card padding="lg" className="mt-8 border-primary/20">
        <div className="mb-4 flex items-center gap-3">
          <UserCheck size={20} className="text-primary" />
          <div>
            <h2 className="text-lg font-semibold text-content-primary">Class Teachers</h2>
            <p className="text-xs text-content-secondary">Set one class teacher per classroom for report-card control. This is a different role from subject teachers above — a class teacher can submit behavioural ratings and review report cards for their homeroom.</p>
          </div>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-primary" />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <GraduationCap size={32} className="text-content-muted mb-3" />
            <p className="text-sm font-medium text-content-primary">No classrooms yet</p>
            <p className="mt-1 text-sm text-content-secondary">Create classrooms before assigning class teachers.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {classrooms.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border-primary bg-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={18} className="text-primary" />
                    <p className="text-sm font-semibold text-content-primary">{c.name}</p>
                  </div>
                </div>
                <div className="mt-3">
                  <Select
                    options={[
                      { label: "Unassigned", value: "__unassigned__" },
                      ...teachers.map((t) => ({ label: t.full_name, value: t.id })),
                    ]}
                    value={c.class_teacher || "__unassigned__"}
                    onChange={(val) => handleClassTeacherChange(c.id, val === "__unassigned__" ? null : val)}
                    className="w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
