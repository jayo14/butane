"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

export function PromoteClassPageClient() {
  const params = useParams()
  const classroomId = typeof params?.id === "string" ? params.id : ""
  const toast = useToast()

  const [sourceClassroom, setSourceClassroom] = useState<any>(null)
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([])
  const [allClassrooms, setAllClassrooms] = useState<{ id: string; name: string; grade_level?: string }[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [selectedSession, setSelectedSession] = useState("")
  const [selectedTargetClassroom, setSelectedTargetClassroom] = useState("")
  const [selectedStudents, setSelectedStudents] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<"select" | "confirm">("select")
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      if (!classroomId) return
      try {
        const [classroomsRes, sessionsRes, studentsRes] = await Promise.all([
          api.academics.classrooms().catch(() => ({ results: [] })) as any,
          api.academics.sessions().catch(() => ({ results: [] })) as any,
          api.academics.enrollments({ classroom: classroomId }).catch(() => ({ results: [] })) as any,
        ])
        const classrooms = (classroomsRes.results || []).map((c: any) => ({ id: c.id, name: c.name, grade_level: c.grade_level }))
        setAllClassrooms(classrooms)
        const source = classrooms.find((c: any) => c.id === classroomId)
        setSourceClassroom(source || null)
        setSessions((sessionsRes.results || []).map((s: any) => ({ id: s.id, name: s.name })))
        const studentsList = (studentsRes.results || []).map((s: any) => ({
          id: s.student || s.id,
          name: s.student?.user?.full_name || s.student_name || "Unknown",
        }))
        setStudents(studentsList)
        setSelectedStudents(Object.fromEntries(studentsList.map((s: any) => [s.id, true])))
      } catch {
        // leave empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [classroomId])

  const targetClassrooms = useMemo(() => {
    if (!sourceClassroom?.grade_level) return []
    return allClassrooms.filter((c) => c.grade_level !== sourceClassroom.grade_level)
  }, [allClassrooms, sourceClassroom])

  const selectedCount = useMemo(() => Object.values(selectedStudents).filter(Boolean).length, [selectedStudents])

  const toggleStudent = (id: string) => {
    setSelectedStudents((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const toggleAll = () => {
    const allSelected = selectedCount === students.length
    const next: Record<string, boolean> = {}
    for (const s of students) next[s.id] = !allSelected
    setSelectedStudents(next)
  }

  const handlePromote = async () => {
    if (!selectedTargetClassroom || !selectedSession) return
    setSubmitting(true)
    setError("")
    try {
      const studentIds = students.filter((s: any) => selectedStudents[s.id]).map((s: any) => s.id)
      const res = await api.academics.promoteClass(classroomId, {
        target_classroom_id: selectedTargetClassroom,
        target_session_id: selectedSession,
        student_ids: studentIds,
      })
      toast.addToast({
        message: "Promotion completed",
        description: `Promoted: ${res.promoted || studentIds.length}, Skipped: ${res.skipped || 0}`,
        variant: "success",
      })
      setStep("select")
      setSelectedSession("")
      setSelectedTargetClassroom("")
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to promote class"
      setError(msg)
      toast.addToast({
        message: "Promotion failed",
        description: msg,
        variant: "error",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: "#006c49" }} />
        </div>
      </Container>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content-primary md:text-2xl">Promote Class</h1>
        <p className="mt-0.5 text-sm text-content-secondary">
          Move selected students from <span className="font-semibold">{sourceClassroom?.name || "-"}</span> to a new classroom for the next session.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger-light p-4 text-sm text-danger">
          {error}
        </div>
      )}

      {step === "select" ? (
        <Card padding="lg" className="mb-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Target Session"
              options={sessions.map((s) => ({ label: s.name, value: s.id }))}
              value={selectedSession}
              onChange={(value) => { setSelectedSession(value || ""); setStep("select") }}
              placeholder="Select session"
            />
            <Select
              label="Target Classroom"
              options={targetClassrooms.map((c) => ({ label: c.name, value: c.id }))}
              value={selectedTargetClassroom}
              onChange={(value) => { setSelectedTargetClassroom(value || ""); setStep("select") }}
              placeholder="Select classroom"
            />
          </div>
        </Card>
      ) : null}

      {step === "select" && selectedSession && selectedTargetClassroom ? (
        <Card padding="lg" className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-content-primary">Students</h2>
            <Button variant="ghost" size="sm" onClick={toggleAll}>
              {selectedCount === students.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          {students.length === 0 ? (
            <p className="py-6 text-center text-sm text-content-secondary">No students enrolled.</p>
          ) : (
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {students.map((s: any) => (
                <label
                  key={s.id}
                  className={cn("flex items-center gap-3 rounded-xl border border-border-primary p-3 cursor-pointer transition-colors", selectedStudents[s.id] ? "bg-primary/5 border-primary/30" : "hover:bg-surface-secondary/30")}
                >
                  <input
                    type="checkbox"
                    checked={selectedStudents[s.id] || false}
                    onChange={() => toggleStudent(s.id)}
                    className="size-4 rounded border-border-primary text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-content-primary">{s.name}</span>
                </label>
              ))}
            </div>
          )}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-content-muted">{selectedCount} student(s) selected</p>
            <Button variant="secondary" onClick={() => setStep("confirm")} disabled={selectedCount === 0}>
              Continue
            </Button>
          </div>
        </Card>
      ) : null}

      {step === "confirm" && (
        <Card padding="lg" className="mb-6">
          <h2 className="text-lg font-semibold text-content-primary">Confirm Promotion</h2>
          <div className="mt-4 rounded-xl border border-border-primary bg-surface-secondary/40 p-4">
            <p className="text-sm text-content-primary">
              You are about to promote{" "}
              <span className="font-semibold">{selectedCount}</span>{" "}
              student(s) from{" "}
              <span className="font-semibold">{sourceClassroom?.name || "-"}</span> to{" "}
              <span className="font-semibold">{targetClassrooms.find((c) => c.id === selectedTargetClassroom)?.name || "-"}</span> for{" "}
              <span className="font-semibold">{sessions.find((s) => s.id === selectedSession)?.name || "selected"}</span>.
            </p>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setStep("select")}>Back</Button>
            <Button variant="primary" onClick={handlePromote} disabled={submitting}>
              {submitting ? "Promoting..." : "Confirm Promotion"}
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
