"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Save,
  FileText,
  Loader2,
  Download,
  Star,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Table } from "@/components/ui/table"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

type ReportCardStatus = "draft" | "submitted" | "approved"

interface ScoreEntry {
  studentId: string
  studentName: string
  scores: Record<string, number>
  [key: string]: unknown
}

export function ReportCardsPageClient() {
  const router = useRouter()
  const toast = useToast()
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([])
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([])
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([])
  const [components, setComponents] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [reportCards, setReportCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [selectedSession, setSelectedSession] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [error, setError] = useState("")
  const [studentSummary, setStudentSummary] = useState<any>({})

  const inputRefs = useRef<Array<Array<HTMLInputElement | null>>>([])

  useEffect(() => {
    async function load() {
      try {
        const [classroomsRes, sessionsRes] = await Promise.all([
          api.academics.classrooms().catch(() => ({ results: [] })) as any,
          api.academics.sessions().catch(() => ({ results: [] })) as any,
        ])
        setClassrooms((classroomsRes.results || []).map((c: any) => ({ id: c.id, name: c.name })))
        setSessions((sessionsRes.results || []).map((s: any) => ({ id: s.id, name: s.name })))
      } catch {
        // leave empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedSession) {
      setTerms([])
      setSelectedTerm("")
      return
    }
    api.terms.list({ session: selectedSession })
      .then((termsList) => setTerms((termsList || []).map((t: any) => ({ id: t.id, name: t.name }))))
      .catch(() => setTerms([]))
  }, [selectedSession])

  useEffect(() => {
    if (!selectedClassroom || !selectedTerm) return
    async function load() {
      try {
        const [componentsRes, studentsRes] = await Promise.all([
          api.academics.components({ classroom: selectedClassroom, term: selectedTerm }).catch(() => []),
          api.academics.enrollments({ classroom: selectedClassroom, session__is_current: "true" }).catch(() => ({ results: [] })),
        ])
        setComponents(componentsRes as any[])
        const studentsList = (studentsRes as any).results || studentsRes || []
        setStudents(studentsList)

        const scoreEntries: ScoreEntry[] = (studentsList as any[]).map((s: any) => ({
          studentId: s.student || s.id,
          studentName: `${s.student?.user?.full_name || s.student_name || ""}`,
          scores: {},
        }))
        setScores(scoreEntries)

        const reportRes = await api.academics.reportCardsGenerate({
          classroom_id: selectedClassroom,
          term_id: selectedTerm,
        }).catch(() => [])
        setReportCards(reportRes as any[])
        buildStudentSummary(reportRes as any[])
      } catch {
        // leave empty
      }
    }
    load()
  }, [selectedClassroom, selectedTerm])

  const buildStudentSummary = useCallback((cards: any[]) => {
    const map: Record<string, any> = {}
    for (const card of cards) {
      const sid = card.student || card.student_id || card.student?.id
      if (!sid) continue
      map[sid] = {
        average: card.average_score ?? card.average ?? null,
        grade: card.grade ?? null,
        position: card.position ?? null,
      }
    }
    setStudentSummary(map)
  }, [])

  const ensureRefs = useCallback((rowIndex: number, colIndex: number) => {
    if (!inputRefs.current[rowIndex]) {
      inputRefs.current[rowIndex] = []
    }
    if (!inputRefs.current[rowIndex][colIndex]) {
      inputRefs.current[rowIndex][colIndex] = null
    }
  }, [])

  const setRef = useCallback((rowIndex: number, colIndex: number) => (node: HTMLInputElement | null) => {
    ensureRefs(rowIndex, colIndex)
    inputRefs.current[rowIndex][colIndex] = node
  }, [ensureRefs])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    if (e.key === "Tab" || e.key === "Enter") {
      e.preventDefault()
      const nextCol = e.shiftKey ? colIndex - 1 : colIndex + 1
      if (nextCol >= 0 && nextCol < components.length) {
        const node = inputRefs.current[rowIndex]?.[nextCol] || null
        node?.focus()
      } else if (!e.shiftKey && rowIndex + 1 < students.length) {
        const node = inputRefs.current[rowIndex + 1]?.[0] || null
        node?.focus()
      } else if (e.shiftKey && rowIndex - 1 >= 0) {
        const node = inputRefs.current[rowIndex - 1]?.[components.length - 1] || null
        node?.focus()
      }
    }
  }, [components.length, students.length])

  const handleScoreChange = useCallback((studentId: string, componentId: string, value: string) => {
    setScores((prev) =>
      prev.map((entry) => {
        if (entry.studentId !== studentId) return entry
        return {
          ...entry,
          scores: {
            ...entry.scores,
            [componentId]: value === "" ? 0 : parseFloat(value),
          },
        }
      })
    )
  }, [])

  const handleSaveScores = useCallback(async (componentId: string) => {
    setSaving(componentId)
    setError("")
    try {
      const payload = {
        component_id: componentId,
        scores: scores.map((entry) => ({
          student_id: entry.studentId,
          score: entry.scores[componentId] || 0,
        })),
      }
      const res = await api.academics.scoresBulk(payload)
      toast.addToast({
        message: "Scores saved",
        description: `Created: ${res.created || 0}, Updated: ${res.updated || 0}`,
        variant: "success",
      })
      if (selectedClassroom && selectedTerm) {
        const reportRes = await api.academics.reportCardsGenerate({
          classroom_id: selectedClassroom,
          term_id: selectedTerm,
        })
        setReportCards(reportRes as any[])
        buildStudentSummary(reportRes as any[])
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save scores"
      setError(msg)
      toast.addToast({
        message: "Save failed",
        description: msg,
        variant: "error",
      })
    } finally {
      setSaving(null)
    }
  }, [scores, selectedClassroom, selectedTerm, toast, buildStudentSummary])

  const handleGenerate = useCallback(async () => {
    if (!selectedClassroom || !selectedTerm) return
    setGenerating(true)
    setError("")
    try {
      const res = await api.academics.reportCardsGenerate({
        classroom_id: selectedClassroom,
        term_id: selectedTerm,
      })
      setReportCards(res as any[])
      buildStudentSummary(res as any[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report cards")
    } finally {
      setGenerating(false)
    }
  }, [selectedClassroom, selectedTerm, buildStudentSummary])

  const handleSubmit = useCallback(async (reportId: string) => {
    try {
      await api.academics.reportCardsSubmit(reportId)
      setReportCards((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "submitted" } : r)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
    }
  }, [])

  const handleApprove = useCallback(async (reportId: string) => {
    try {
      await api.academics.reportCardsApprove(reportId)
      setReportCards((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "approved" } : r)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve")
    }
  }, [])

  const handleDownloadPdf = useCallback(async (reportId: string) => {
    try {
      const blob = await api.academics.reportCardPdf(reportId)
      const url = URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-card-${reportId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to download PDF")
    }
  }, [])

  const statusBadge = (status: ReportCardStatus) => {
    const map: Record<ReportCardStatus, { variant: any; label: string }> = {
      draft: { variant: "warning", label: "Draft" },
      submitted: { variant: "info", label: "Submitted" },
      approved: { variant: "success", label: "Approved" },
    }
    const { variant, label } = map[status]
    return <Badge variant={variant}>{label}</Badge>
  }

  const groupedComponents = useMemo(() => {
    const groups: Record<string, any[]> = {}
    for (const c of components) {
      const subject = c.subject?.name || c.subject_name || "Other"
      groups[subject] = groups[subject] || []
      groups[subject].push(c)
    }
    return groups
  }, [components])

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: "#006c49" }} />
        </div>
      </Container>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content-primary md:text-2xl">Report Cards</h1>
        <p className="mt-0.5 text-sm text-content-secondary">
          Generate, review, and approve student report cards
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger-light p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Card padding="lg" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Session"
            options={sessions.map((s) => ({ label: s.name, value: s.id }))}
            value={selectedSession}
            onChange={setSelectedSession}
            placeholder="Select session"
          />
          <Select
            label="Term"
            options={terms.map((t) => ({ label: t.name, value: t.id }))}
            value={selectedTerm}
            onChange={setSelectedTerm}
            placeholder="Select term"
          />
          <Select
            label="Classroom"
            options={classrooms.map((c) => ({ label: c.name, value: c.id }))}
            value={selectedClassroom}
            onChange={setSelectedClassroom}
            placeholder="Select classroom"
          />
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={!selectedClassroom || !selectedTerm || generating}
              className="w-full"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Generate
            </Button>
          </div>
        </div>
      </Card>

      {components.length > 0 && students.length > 0 && (
        <div className="mb-6 grid gap-6 lg:grid-cols-[1fr_280px]">
          <Card padding="lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-content-primary">Score Entry</h2>
            </div>
            <div className="mb-4 overflow-x-auto">
              <Table
                columns={([
                  { key: "studentName", header: "Student" },
                  ...components.map((c) => ({
                    key: c.id,
                    header: c.name,
                    align: "center" as const,
                    render: (row: any) => {
                      const rowIndex = students.findIndex((s: any) => (s.student || s.id) === row.studentId)
                      const colIndex = components.findIndex((comp) => comp.id === c.id)
                      return (
                        <input
                          ref={setRef(rowIndex, colIndex)}
                          type="number"
                          min="0"
                          max={c.max_score}
                          value={row.scores[c.id] ?? ""}
                          onChange={(e) => handleScoreChange(row.studentId, c.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          className="mx-auto w-20 rounded-lg border border-border-primary px-2 py-1.5 text-center text-sm text-content-primary"
                        />
                      )
                    },
                  })),
                ]) as any}
                data={scores}
                keyExtractor={(s: any) => s.studentId}
                emptyState={<p className="py-6 text-center text-sm text-content-secondary">No students enrolled</p>}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-content-muted">Tab or Enter to move across cells</p>
              <div className="flex flex-wrap items-center gap-2">
                {Object.entries(groupedComponents).map(([subject, cols]) => (
                  <Button
                    key={subject}
                    variant="secondary"
                    size="sm"
                    onClick={() => handleSaveScores(cols[0].id)}
                    disabled={saving === cols[0].id}
                  >
                    {saving === cols[0].id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save {subject}
                  </Button>
                ))}
              </div>
            </div>
          </Card>

          <Card padding="lg" className="h-fit">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-content-muted">Student Summary</h3>
            <div className="mt-4 space-y-3">
              {students.map((s: any) => {
                const sid = s.student || s.id
                const summary = studentSummary[sid] || {}
                return (
                  <div key={sid} className="flex items-center justify-between rounded-xl border border-border-primary bg-surface-secondary/40 p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-content-primary">{s.student?.user?.full_name || s.student_name || sid}</p>
                      <p className="text-xs text-content-muted">Avg {summary.average ?? "-"} · Pos {summary.position ?? "-"}</p>
                    </div>
                    <Badge variant={summary.grade ? "success" : "warning"}>{summary.grade || "Pending"}</Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {reportCards.length > 0 && (
        <Card padding="lg">
          <h2 className="mb-4 text-lg font-semibold text-content-primary">Generated Report Cards</h2>
          <Table
            columns={([
              { key: "student_name", header: "Student", sortable: true, render: (r: any) => r.student?.user?.full_name || r.student_name || "-" },
              { key: "classroom_name", header: "Classroom", render: (r: any) => r.classroom?.name || "-" },
              { key: "term_name", header: "Term", render: (r: any) => r.term?.name || "-" },
              { key: "total_score", header: "Total", align: "center", render: (r: any) => r.total_score },
              { key: "average_score", header: "Average", align: "center", render: (r: any) => r.average_score },
              { key: "position", header: "Position", align: "center", render: (r: any) => r.position || "-" },
              { key: "status", header: "Status", render: (r: any) => statusBadge(r.status) },
              { key: "actions", header: "", align: "center", render: (r: any) => (
                <div className="flex items-center justify-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => router.push(`/dashboard/report-cards/${r.id}`)}>
                    Review
                  </Button>
                  {r.status === "draft" && (
                    <Button size="sm" variant="secondary" onClick={() => handleSubmit(r.id)}>
                      Submit
                    </Button>
                  )}
                  {r.status === "submitted" && (
                    <Button size="sm" variant="secondary" onClick={() => handleApprove(r.id)}>
                      Approve
                    </Button>
                  )}
                  {r.status === "approved" && (
                    <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(r.id)}>
                      <Download size={14} />
                    </Button>
                  )}
                </div>
              )},
            ]) as any}
            data={reportCards}
            keyExtractor={(r: any) => r.id}
            emptyState={<p className="py-6 text-center text-sm text-content-secondary">No report cards generated yet</p>}
          />
        </Card>
      )}
    </div>
  )
}
