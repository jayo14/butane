"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import {
  Save,
  Loader2,
  Download,
  Send,
  CheckCircle2,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table } from "@/components/ui/table"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import { useToast } from "@/components/ui/toast"

type ReportCardStatus = "draft" | "submitted" | "approved"

export function ReportCardReviewClient() {
  const router = useRouter()
  const params = useParams()
  const id = typeof params?.id === "string" ? params.id : ""
  const toast = useToast()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [reportCard, setReportCard] = useState<any>(null)

  const isAdmin = user?.role === "admin"

  useEffect(() => {
    async function load() {
      if (!id) return
      try {
        const data = await api.academics.reportCardFull(id)
        setReportCard(data)
      } catch {
        setError("Failed to load report card")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const updateField = (field: string, value: any) => {
    setReportCard((prev: any) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const payload: any = {}
      if (reportCard.attendance) {
        payload.attendance = reportCard.attendance
      }
      if (typeof reportCard.teacher_remark !== "undefined") {
        payload.teacher_remark = reportCard.teacher_remark
      }
      if (typeof reportCard.principal_remark !== "undefined") {
        payload.principal_remark = reportCard.principal_remark
      }
      if (typeof reportCard.subject_grade !== "undefined") {
        payload.grade = reportCard.grade
      }
      const data = await api.academics.reportCardUpdate(id, payload)
      setReportCard((prev: any) => ({ ...prev, ...data }))
      toast.addToast({ message: "Report card updated", variant: "success" })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to save changes"
      setError(msg)
      toast.addToast({ message: "Save failed", description: msg, variant: "error" })
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    try {
      await api.academics.reportCardsSubmit(id)
      setReportCard((prev: any) => ({ ...prev, status: "submitted" }))
      toast.addToast({ message: "Submitted for approval", variant: "success" })
    } catch {
      toast.addToast({ message: "Submit failed", variant: "error" })
    }
  }

  const handleApprove = async () => {
    try {
      await api.academics.reportCardsApprove(id)
      setReportCard((prev: any) => ({ ...prev, status: "approved" }))
      toast.addToast({ message: "Report card approved", variant: "success" })
    } catch {
      toast.addToast({ message: "Approval failed", variant: "error" })
    }
  }

  const handleDownloadPdf = async () => {
    try {
      const blob = await api.academics.reportCardPdf(id)
      const url = URL.createObjectURL(blob as Blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-card-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.addToast({ message: "PDF download failed", variant: "error" })
    }
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

  if (!reportCard && !error) {
    return (
      <Container>
        <p className="py-10 text-center text-sm text-content-muted">Report card not found.</p>
      </Container>
    )
  }

  const student = reportCard.student || {}
  const classroom = reportCard.classroom || {}
  const term = reportCard.term || {}
  const scores = reportCard.scores || []
  const attendance = reportCard.attendance || {}
  const behaviouralRatings = reportCard.behavioural_ratings || []

  const affective = behaviouralRatings.filter((r: any) => r.trait?.domain === "affective")
  const psychomotor = behaviouralRatings.filter((r: any) => r.trait?.domain === "psychomotor")

  const statusBadge = (status: ReportCardStatus) => {
    const map: Record<ReportCardStatus, { variant: any; label: string }> = {
      draft: { variant: "warning", label: "Draft" },
      submitted: { variant: "info", label: "Submitted" },
      approved: { variant: "success", label: "Approved" },
    }
    const { variant, label } = map[status || "draft"]
    return <Badge variant={variant}>{label}</Badge>
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary md:text-2xl">Report Card</h1>
          <p className="mt-0.5 text-sm text-content-secondary">
            {student.user?.full_name || student.full_name || "Student"} • {classroom.name || ""} • {term.name || ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge(reportCard.status)}
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            Back
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger-light p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <h2 className="mb-4 text-lg font-semibold text-content-primary">Subjects</h2>
            {scores.length === 0 ? (
              <p className="py-6 text-center text-sm text-content-secondary">No scores recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table
                  columns={([
                    { key: "subject_name", header: "Subject" },
                    { key: "ca", header: "CA", align: "center", render: (row: any) => row.ca_score ?? row.ca ?? "-" },
                    { key: "exam", header: "Exam", align: "center", render: (row: any) => row.exam_score ?? row.exam ?? "-" },
                    { key: "total", header: "Total", align: "center", render: (row: any) => row.total_score ?? row.total ?? "-" },
                    { key: "grade", header: "Grade", align: "center", render: (row: any) => row.subject_grade || row.grade || "-" },
                    { key: "remark", header: "Remark", render: (row: any) => row.subject_remark || row.remark || "-" },
                  ]) as any}
                  data={scores}
                  keyExtractor={(row: any) => row.id || `${row.subject}-${row.term}`}
                  emptyState={<p className="py-6 text-center text-sm text-content-secondary">No scores recorded.</p>}
                />
              </div>
            )}
          </Card>

          <Card padding="lg">
            <h2 className="mb-4 text-lg font-semibold text-content-primary">Remarks</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Teacher Remark"
                value={reportCard.teacher_remark ?? reportCard.remark_suggestion ?? ""}
                onChange={(e) => updateField("teacher_remark", e.target.value)}
                disabled={reportCard.status === "approved"}
                helperText={!reportCard.teacher_remark ? "Using suggested remark" : ""}
              />
              <Input
                label="Principal Remark"
                value={reportCard.principal_remark ?? ""}
                onChange={(e) => updateField("principal_remark", e.target.value)}
                disabled={reportCard.status === "approved"}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card padding="lg">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-content-muted">Summary</h3>
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-content-muted">Average</p>
                <p className="text-2xl font-bold text-content-primary">{reportCard.average_score ?? reportCard.average ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-content-muted">Grade</p>
                <p className="text-2xl font-bold text-content-primary">{reportCard.grade ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-content-muted">Position</p>
                <p className="text-2xl font-bold text-content-primary">{reportCard.position ?? "-"}</p>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-content-muted">Attendance</h3>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {reportCard.status === "draft" ? (
                <>
                  <Input
                    label="Present"
                    type="number"
                    value={attendance.times_present ?? ""}
                    onChange={(e) => updateField("attendance", { ...attendance, times_present: e.target.value === "" ? "" : Number(e.target.value) })}
                  />
                  <Input
                    label="Absent"
                    type="number"
                    value={attendance.times_absent ?? ""}
                    onChange={(e) => updateField("attendance", { ...attendance, times_absent: e.target.value === "" ? "" : Number(e.target.value) })}
                  />
                  <Input
                    label="School Days"
                    type="number"
                    value={attendance.school_days_open ?? attendance.total_days ?? ""}
                    onChange={(e) => updateField("attendance", { ...attendance, school_days_open: e.target.value === "" ? "" : Number(e.target.value), total_days: e.target.value === "" ? "" : Number(e.target.value) })}
                  />
                </>
              ) : (
                <div className="col-span-3 grid grid-cols-3 gap-3 rounded-xl border border-border-primary bg-surface-secondary/40 p-3">
                  <div className="text-center">
                    <p className="text-xs text-content-muted">Present</p>
                    <p className="text-lg font-bold text-content-primary">{attendance.times_present ?? "-"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-content-muted">Absent</p>
                    <p className="text-lg font-bold text-content-primary">{attendance.times_absent ?? "-"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-content-muted">School Days</p>
                    <p className="text-lg font-bold text-content-primary">{attendance.school_days_open ?? attendance.total_days ?? "-"}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <Card padding="lg">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-content-muted">Behavioural Traits</h3>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div>
                <p className="mb-2 text-xs font-semibold text-content-primary">Affective</p>
                {affective.length === 0 && <p className="text-xs text-content-secondary">No ratings.</p>}
                <div className="space-y-2">
                  {affective.map((rating: any) => (
                    <div key={rating.id || rating.trait_id} className="flex items-center justify-between rounded-lg border border-border-primary bg-white px-3 py-2">
                      <span className="text-xs text-content-primary">{rating.trait?.name || "Trait"}</span>
                      <Badge variant="info">{rating.rating ?? "-"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-content-primary">Psychomotor</p>
                {psychomotor.length === 0 && <p className="text-xs text-content-secondary">No ratings.</p>}
                <div className="space-y-2">
                  {psychomotor.map((rating: any) => (
                    <div key={rating.id || rating.trait_id} className="flex items-center justify-between rounded-lg border border-border-primary bg-white px-3 py-2">
                      <span className="text-xs text-content-primary">{rating.trait?.name || "Trait"}</span>
                      <Badge variant="info">{rating.rating ?? "-"}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card padding="lg">
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                onClick={handleSave}
                disabled={reportCard.status === "approved" || saving}
                className="w-full"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                Save Changes
              </Button>
              {reportCard.status === "draft" && (
                <Button
                  variant="secondary"
                  onClick={handleSubmit}
                  className="w-full"
                >
                  <Send size={16} />
                  Submit for Approval
                </Button>
              )}
              {reportCard.status === "submitted" && isAdmin && (
                <Button
                  variant="secondary"
                  onClick={handleApprove}
                  className="w-full"
                >
                  <CheckCircle2 size={16} />
                  Approve
                </Button>
              )}
              {reportCard.status === "approved" && (
                <Button
                  variant="outline"
                  onClick={handleDownloadPdf}
                  className="w-full"
                >
                  <Download size={16} />
                  Download PDF
                </Button>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
