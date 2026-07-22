"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import {
  Save,
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Download,
  Printer,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Table } from "@/components/ui/table"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import { api } from "@/lib/api"

type ReportCardStatus = "draft" | "submitted" | "approved"

interface ScoreEntry {
  studentId: string
  studentName: string
  scores: Record<string, number>
}

function getScoreColor(score: number, max: number): string {
  if (!max) return "text-content-secondary"
  const pct = (score / max) * 100
  if (pct >= 80) return "text-success"
  if (pct >= 60) return "text-primary"
  if (pct >= 40) return "text-warning"
  return "text-danger"
}

export function ReportCardsPageClient() {
  const router = useRouter()
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([])
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([])
  const [components, setComponents] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [reportCards, setReportCards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedComponent, setSelectedComponent] = useState("")
  const [error, setError] = useState("")
  const [saveMessage, setSaveMessage] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const [classroomsRes, termsRes] = await Promise.all([
          api.academics.classrooms().catch(() => ({ results: [] })) as any,
          api.academics.sessions().catch(() => ({ results: [] })) as any,
        ])
        setClassrooms((classroomsRes.results || []).map((c: any) => ({ id: c.id, name: c.name })))
        setTerms((termsRes.results || []).map((t: any) => ({ id: t.id, name: t.name })))
      } catch {
        // leave empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedClassroom || !selectedTerm) return
    async function load() {
      try {
        const [componentsRes, studentsRes] = await Promise.all([
          api.academics.components({ classroom: selectedClassroom, term: selectedTerm }).catch(() => []),
          api.academics.enrollments(params => ({ ...params, classroom: selectedClassroom, session__is_current: "true" })).catch(() => ({ results: [] })),
        ])
        setComponents(componentsRes as any[])
        const studentsList = (studentsRes as any).results || studentsRes || []
        setStudents(studentsList)

        const scoresRes = await api.academics.scoresBulk({
          component_id: (componentsRes as any[])[0]?.id || "",
          scores: (studentsList as any[]).map((s: any) => ({ student_id: s.student || s.id, score: 0 })),
        }).catch(() => ({ created: 0, updated: 0 }))

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
      } catch {
        // leave empty
      }
    }
    load()
  }, [selectedClassroom, selectedTerm])

  const handleScoreChange = (studentId: string, componentId: string, value: string) => {
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
  }

  const handleSaveScores = async () => {
    if (!selectedComponent) return
    setSaving(true)
    setSaveMessage("")
    setError("")
    try {
      const payload = {
        component_id: selectedComponent,
        scores: scores.map((entry) => ({
          student_id: entry.studentId,
          score: entry.scores[selectedComponent] || 0,
        })),
      }
      const res = await api.academics.scoresBulk(payload)
      setSaveMessage(`Saved: ${res.created || 0} created, ${res.updated || 0} updated`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save scores")
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedClassroom || !selectedTerm) return
    setGenerating(true)
    setError("")
    try {
      const res = await api.academics.reportCardsGenerate({
        classroom_id: selectedClassroom,
        term_id: selectedTerm,
      })
      setReportCards(res as any[])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate report cards")
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (reportId: string) => {
    try {
      await api.academics.reportCardsSubmit(reportId)
      setReportCards((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "submitted" } : r)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit")
    }
  }

  const handleApprove = async (reportId: string) => {
    try {
      await api.academics.reportCardsApprove(reportId)
      setReportCards((prev) => prev.map((r) => (r.id === reportId ? { ...r, status: "approved" } : r)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve")
    }
  }

  const handleDownloadPdf = async (reportId: string) => {
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
  }

  const selectedClassroomName = useMemo(
    () => classrooms.find((c) => c.id === selectedClassroom)?.name || "",
    [classrooms, selectedClassroom],
  )

  const selectedTermName = useMemo(
    () => terms.find((t) => t.id === selectedTerm)?.name || "",
    [terms, selectedTerm],
  )

  const statusBadge = (status: ReportCardStatus) => {
    const map: Record<ReportCardStatus, { variant: any; label: string }> = {
      draft: { variant: "warning", label: "Draft" },
      submitted: { variant: "info", label: "Submitted" },
      approved: { variant: "success", label: "Approved" },
    }
    const { variant, label } = map[status]
    return <Badge variant={variant}>{label}</Badge>
  }

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
      {saveMessage && (
        <div className="mb-4 rounded-xl border border-success/40 bg-success-light p-4 text-sm text-success">
          {saveMessage}
        </div>
      )}

      <Card padding="lg" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Select
            label="Classroom"
            options={classrooms.map((c) => ({ label: c.name, value: c.id }))}
            value={selectedClassroom}
            onChange={setSelectedClassroom}
            placeholder="Select classroom"
          />
          <Select
            label="Term"
            options={terms.map((t) => ({ label: t.name, value: t.id }))}
            value={selectedTerm}
            onChange={setSelectedTerm}
            placeholder="Select term"
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

      {components.length > 0 && (
        <Card padding="lg" className="mb-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-content-primary">Score Entry</h2>
            <Select
              label=""
              options={components.map((c) => ({ label: `${c.subject.name} - ${c.name}`, value: c.id }))}
              value={selectedComponent}
              onChange={setSelectedComponent}
              placeholder="Select component"
              wrapperClassName="w-64"
            />
          </div>
          {selectedComponent && (
            <div className="mb-4 overflow-x-auto">
              <Table
                columns={([
                  { key: "studentName", header: "Student", sortable: true },
                  ...components.map((c) => ({
                    key: c.id,
                    header: c.name,
                    render: (row: ScoreEntry) => (
                      <input
                        type="number"
                        min="0"
                        max={c.max_score}
                        value={row.scores[c.id] ?? ""}
                        onChange={(e) => handleScoreChange(row.studentId, c.id, e.target.value)}
                        className="w-20 rounded-lg border border-border-primary px-2 py-1 text-sm text-content-primary"
                      />
                    ),
                  })),
                ]) as any}
                data={scores}
                keyExtractor={(s) => s.studentId}
                emptyState={<p className="py-6 text-center text-sm text-content-secondary">No students enrolled</p>}
              />
            </div>
          )}
          {selectedComponent && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleSaveScores} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Scores
              </Button>
            </div>
          )}
        </Card>
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
