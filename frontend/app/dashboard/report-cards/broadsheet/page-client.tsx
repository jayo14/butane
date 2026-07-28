"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table } from "@/components/ui/table"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

export function BroadsheetPageClient() {
  const searchParams = useSearchParams()
  const classroomId = searchParams.get("classroom") || ""
  const termId = searchParams.get("term") || ""
  const toast = useToast()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function load() {
      if (!classroomId || !termId) return
      setLoading(true)
      setError("")
      try {
        const result = await api.academics.broadsheet(classroomId, termId)
        setData(result)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to load broadsheet"
        setError(msg)
        toast.addToast({
          message: "Load failed",
          description: msg,
          variant: "error",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [classroomId, termId, toast])

  const handlePrint = () => {
    window.print()
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

  if (error || !data) {
    return (
      <Container>
        <div className="py-10 text-center">
          <p className="text-sm text-content-muted">{error || "No broadsheet data available."}</p>
        </div>
      </Container>
    )
  }

  const { subjects, rows, class_averages, class_size } = data

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-content-primary md:text-2xl">Broadsheet</h1>
          <p className="mt-0.5 text-sm text-content-secondary">
            Class summary for {class_size} student{class_size === 1 ? "" : "s"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          Download Broadsheet
        </Button>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger-light p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Card padding="lg" className="mb-6">
        <div className="mb-4 overflow-x-auto">
          <Table
            columns={([
              { key: "student_name", header: "Student", sortable: true, render: (row: any) => row.student_name },
              ...subjects.map((s: any) => ({
                key: s.id,
                header: s.name,
                align: "center" as const,
                render: (row: any) => {
                  const scoreData = row.subjects?.[s.id] || {}
                  return (
                    <span className="text-sm text-content-primary">
                      {scoreData.score ?? 0} ({scoreData.grade || "-"})
                    </span>
                  )
                },
              })),
              { key: "total_score", header: "Total", align: "center", render: (row: any) => row.total_score ?? "-" },
              { key: "average_score", header: "Average", align: "center", render: (row: any) => row.average_score ?? "-" },
              { key: "position", header: "Position", align: "center", render: (row: any) => row.position ?? "-" },
              { key: "grade", header: "Grade", align: "center", render: (row: any) => row.grade || "-" },
            ]) as any}
            data={rows}
            keyExtractor={(row: any) => row.student_id}
            emptyState={<p className="py-6 text-center text-sm text-content-secondary">No data available</p>}
          />
        </div>
      </Card>

      <Card padding="lg">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-content-muted mb-4">Class Average</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {subjects.map((s: any) => (
            <div key={s.id} className="rounded-xl border border-border-primary bg-surface-secondary/40 p-3 text-center">
              <p className="text-xs text-content-muted">{s.name}</p>
              <p className="text-lg font-bold text-content-primary">{class_averages?.[s.id] ?? 0}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
