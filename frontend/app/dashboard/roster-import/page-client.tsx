"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  UserPlus,
  AlertTriangle,
} from "lucide-react"
import { api } from "@/lib/api"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CsvUploader } from "@/components/ui/csv-uploader"
import { RosterReviewTable } from "@/components/roster/roster-review-table"
import type { RosterRow, RosterImportResponse } from "@/types"

type ImportStep = "upload" | "review" | "promote" | "done"

interface PromotedStudent {
  roster_id: string
  student_id: string
  user_id: string
  email: string
  full_name: string
}

export function RosterImportPageClient() {
  const router = useRouter()
  const [step, setStep] = useState<ImportStep>("upload")
  const [classroomId, setClassroomId] = useState("")
  const [importResult, setImportResult] = useState<RosterImportResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptedRows, setAcceptedRows] = useState<RosterRow[]>([])
  const [skippedRows, setSkippedRows] = useState<RosterRow[]>([])
  const [promotedStudents, setPromotedStudents] = useState<PromotedStudent[]>([])
  const [promotingId, setPromotingId] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!classroomId) {
        setError("Please enter a classroom ID first")
        return
      }
      setLoading(true)
      setError(null)
      try {
        const result = await api.academics.rosterImport(file, classroomId)
        setImportResult(result)
        setStep("review")
      } catch (err: any) {
        setError(err.message || "Failed to import CSV")
      } finally {
        setLoading(false)
      }
    },
    [classroomId],
  )

  const handleAccept = useCallback((row: RosterRow) => {
    setAcceptedRows((prev) => [...prev, row])
  }, [])

  const handleSkip = useCallback((row: RosterRow) => {
    setSkippedRows((prev) => [...prev, row])
  }, [])

  const handleAcceptAll = useCallback(() => {
    if (!importResult) return
    const allPending = [...importResult.new_rows, ...importResult.duplicate_rows]
    setAcceptedRows(allPending)
    setSkippedRows([])
  }, [importResult])

  const handleConfirm = useCallback(async () => {
    if (!importResult || acceptedRows.length === 0) return
    setLoading(true)
    setError(null)
    try {
      await api.academics.rosterConfirm({
        rows: acceptedRows,
        classroom_id: classroomId,
      })
      setStep("promote")
    } catch (err: any) {
      setError(err.message || "Failed to confirm import")
    } finally {
      setLoading(false)
    }
  }, [importResult, acceptedRows, classroomId])

  const handlePromote = useCallback(async (rosterId: string, fullName: string) => {
    setPromotingId(rosterId)
    setError(null)
    try {
      const result = await api.academics.rosterPromote(rosterId)
      setPromotedStudents((prev) => [
        ...prev,
        {
          roster_id: rosterId,
          student_id: result.student_id,
          user_id: result.user_id,
          email: result.email,
          full_name: fullName,
        },
      ])
    } catch (err: any) {
      setError(err.message || "Failed to promote student")
    } finally {
      setPromotingId(null)
    }
  }, [])

  const handlePromoteAll = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Promote all accepted rows that haven't been promoted yet
      const entries = await api.academics.rosterEntries({ classroom: classroomId, status: "draft" })
      const results = entries.results || []
      for (const entry of results) {
        if (!promotedStudents.find((p) => p.roster_id === entry.id)) {
          try {
            const result = await api.academics.rosterPromote(entry.id)
            setPromotedStudents((prev) => [
              ...prev,
              {
                roster_id: entry.id,
                student_id: result.student_id,
                user_id: result.user_id,
                email: result.email,
                full_name: entry.full_name,
              },
            ])
          } catch {
            // Skip individual failures
          }
        }
      }
      setStep("done")
    } catch (err: any) {
      setError(err.message || "Failed to promote students")
    } finally {
      setLoading(false)
    }
  }, [classroomId, promotedStudents])

  const handleFinish = useCallback(() => {
    setStep("upload")
    setImportResult(null)
    setAcceptedRows([])
    setSkippedRows([])
    setPromotedStudents([])
    setClassroomId("")
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-content-muted hover:text-content-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Import Student Roster</h1>
          <p className="text-sm text-content-muted">
            Upload a CSV file to import students into a classroom
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {(["upload", "review", "promote", "done"] as const).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                step === s
                  ? "bg-green-600 text-white"
                  : i < ["upload", "review", "promote", "done"].indexOf(step)
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            <span className="text-sm font-medium text-content-primary capitalize">{s}</span>
            {i < 3 && <div className="mx-2 h-px w-8 bg-border-primary" />}
          </div>
        ))}
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {/* Step content */}
      {step === "upload" && (
        <Card>
          <div className="space-y-4 p-6">
            <div>
              <label className="block text-sm font-medium text-content-primary mb-1">
                Classroom ID
              </label>
              <input
                type="text"
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                placeholder="Enter classroom ID"
                className="w-full rounded-lg border border-border-primary px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <CsvUploader onFile={handleFile} disabled={loading || !classroomId} />
            {loading && (
              <div className="flex items-center justify-center gap-2 text-sm text-content-muted">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-green-600 border-t-transparent" />
                Processing CSV...
              </div>
            )}
          </div>
        </Card>
      )}

      {step === "review" && importResult && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <FileSpreadsheet size={16} className="text-content-muted" />
              <span className="text-content-secondary">
                {importResult.new_rows.length + importResult.duplicate_rows.length} rows found
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setStep("upload")
                  setImportResult(null)
                  setAcceptedRows([])
                  setSkippedRows([])
                }}
              >
                Start Over
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                disabled={acceptedRows.length === 0 || loading}
              >
                {loading ? "Confirming..." : `Confirm Import (${acceptedRows.length} rows)`}
              </Button>
            </div>
          </div>

          <RosterReviewTable
            newRows={importResult.new_rows}
            duplicateRows={importResult.duplicate_rows}
            onAccept={handleAccept}
            onSkip={handleSkip}
            onAcceptAll={handleAcceptAll}
            acceptedCount={acceptedRows.length}
            skippedCount={skippedRows.length}
          />
        </div>
      )}

      {step === "promote" && (
        <div className="space-y-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <UserPlus size={20} className="text-green-600" />
                <h2 className="text-lg font-semibold text-content-primary">
                  Promote to Student Account
                </h2>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 mb-4">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Score entry is blocked until promotion</p>
                  <p className="mt-1">
                    Students must be promoted to a full account before scores can be entered.
                    Promoting creates a User account and links it to the roster entry.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {acceptedRows.map((row) => {
                  const isPromoted = promotedStudents.some(
                    (p) => p.full_name === row.full_name,
                  )
                  return (
                    <div
                      key={row.index}
                      className="flex items-center justify-between rounded-lg border border-border-primary p-3"
                    >
                      <div>
                        <p className="font-medium text-content-primary">{row.full_name}</p>
                        <p className="text-sm text-content-muted">
                          {row.guardian_email || "No email provided"}
                        </p>
                      </div>
                      {isPromoted ? (
                        <span className="flex items-center gap-1 text-sm text-green-600">
                          <CheckCircle size={16} />
                          Promoted
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePromote(row.index.toString(), row.full_name)}
                          disabled={promotingId === row.index.toString()}
                        >
                          {promotingId === row.index.toString()
                            ? "Promoting..."
                            : "Promote"}
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" onClick={() => setStep("done")}>
                  Skip for Now
                </Button>
                <Button
                  variant="primary"
                  onClick={handlePromoteAll}
                  disabled={loading || promotedStudents.length === acceptedRows.length}
                >
                  {loading ? "Promoting..." : `Promote All (${acceptedRows.length - promotedStudents.length} remaining)`}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === "done" && (
        <Card>
          <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
            <CheckCircle size={48} className="text-green-600" />
            <h2 className="text-xl font-bold text-content-primary">Import Complete</h2>
            <p className="text-sm text-content-secondary">
              {acceptedRows.length} students have been added to the roster.
              {promotedStudents.length > 0 && (
                <> {promotedStudents.length} have been promoted to student accounts.</>
              )}
            </p>
            {promotedStudents.length < acceptedRows.length && (
              <p className="text-xs text-amber-600">
                Remember: Students must be promoted before scores can be entered.
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.back()}>
                Back to Dashboard
              </Button>
              <Button variant="primary" onClick={handleFinish}>
                Import More
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
