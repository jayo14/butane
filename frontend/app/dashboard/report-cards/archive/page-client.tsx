"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  Archive,
  Search,
  Download,
  Trash2,
  Calendar,
  Users,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Sparkles,
  ClipboardCheck,
  Settings,
  MessageSquare,
  Loader2,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

interface ReportCardArchiveClientProps {
  initialTerms: any[]
  initialClassrooms: any[]
}

export function ReportCardArchiveClient({
  initialTerms,
  initialClassrooms,
}: ReportCardArchiveClientProps) {
  const { addToast } = useToast()
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [downloading, setDownloading] = useState<string | null>(null)
  const itemsPerPage = 6

  useEffect(() => {
    setLoading(true)
    const params: any = { page_size: 100 }
    if (selectedClassroom) params.classroom = selectedClassroom
    if (selectedTerm) params.term = selectedTerm
    api.academics.reportCardsList(params)
      .then((res) => {
        const results = (res as any)?.results || res || []
        setReports(results)
      })
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [selectedClassroom, selectedTerm])

  const filteredReports = useMemo(() => {
    let result = reports
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r: any) =>
          r.classroom_name?.toLowerCase().includes(q) ||
          r.student_name?.toLowerCase().includes(q) ||
          r.term_name?.toLowerCase().includes(q)
      )
    }
    return result
  }, [reports, search, selectedTerm, selectedClassroom])

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAll = () => {
    if (selected.size === paginatedReports.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(paginatedReports.map((r: any) => r.id)))
    }
  }

  const handleDownloadPdf = async (reportId: string) => {
    setDownloading(reportId)
    try {
      const blob = await api.academics.reportCardPdf(reportId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `report-card-${reportId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      addToast({ message: "PDF downloaded successfully", variant: "success" })
    } catch {
      addToast({ message: "Failed to download PDF", variant: "error" })
    } finally {
      setDownloading(null)
    }
  }

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle size={14} className="text-success" />
    if (status === "submitted") return <Clock size={14} className="text-warning" />
    return <Clock size={14} className="text-content-secondary" />
  }

  const statusLabel = (status: string) => {
    if (status === "approved") return "Approved"
    if (status === "submitted") return "Pending"
    return "Draft"
  }

  return (
    <Container>
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-content-secondary mb-2">
          <Link href="/dashboard/report-cards" className="hover:text-primary">Report Cards</Link>
          <span>/</span>
          <span className="text-primary font-bold">Archive</span>
        </nav>
        <h1 className="text-4xl text-primary font-bold tracking-tight">Reports Archive</h1>
        <p className="text-content-secondary mt-2 max-w-xl">
          Historical record of all generated report cards with search, preview, and bulk download.
        </p>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
        <div className="linen-texture absolute inset-0"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-8">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-content-secondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
                placeholder="Search reports by class, session, or term..."
                className="recessed-well w-full pl-11 pr-4 py-3 rounded-2xl border border-border-primary/40 text-sm font-semibold text-content-primary focus:border-primary/40 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="recessed-well bg-white border border-border-primary/40 rounded-xl">
                <select
                  value={selectedTerm}
                  onChange={(e) => { setSelectedTerm(e.target.value); setCurrentPage(1) }}
                  className="bg-transparent border-none px-4 py-2 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
                >
                  <option value="">All Terms</option>
                  <option value="First Term">First Term</option>
                  <option value="Second Term">Second Term</option>
                  <option value="Third Term">Third Term</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.size === paginatedReports.length && paginatedReports.length > 0}
                onChange={toggleAll}
                className="w-4 h-4 rounded border-border-primary accent-primary"
              />
              <span className="text-sm text-content-secondary">
                {selected.size > 0 ? `${selected.size} selected` : `${filteredReports.length} reports`}
              </span>
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 animate-slide-up">
                <button className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-sm">
                  <Download size={14} /> Download All ({selected.size})
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-primary" />
              <span className="ml-3 text-sm text-content-secondary">Loading report cards...</span>
            </div>
          ) : paginatedReports.length === 0 ? (
            <div className="text-center py-12">
              <Archive size={32} className="text-content-secondary/40 mx-auto mb-3" />
              <p className="text-sm text-content-secondary">No report cards found. Generate some reports first.</p>
            </div>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paginatedReports.map((report: any) => {
              const studentName = report.student_name || `${report.student_first_name || ""} ${report.student_last_name || ""}`.trim()
              return (
              <div
                key={report.id}
                className={cn(
                  "p-4 rounded-2xl border flex items-center gap-4 transition-all group hover:scale-[1.01]",
                  selected.has(report.id)
                    ? "bg-primary/5 border-primary/30 shadow-md"
                    : "bg-surface-secondary/30 border-border-primary/20 hover:border-primary/20 hover:shadow-sm"
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(report.id)}
                  onChange={() => toggleSelect(report.id)}
                  className="w-5 h-5 rounded border-border-primary accent-primary"
                />
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Archive size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-content-primary truncate">
                    {report.classroom_name || report.classroom} &middot; {studentName || "Class Report"}
                  </p>
                  <p className="text-xs text-content-secondary flex items-center gap-2">
                    <Calendar size={12} />
                    {report.created_at ? new Date(report.created_at).toLocaleDateString() : ""}
                    {report.position ? ` • Position: ${report.position}/${report.class_size}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(report.status)}
                  <button
                    onClick={() => handleDownloadPdf(report.id)}
                    disabled={downloading === report.id}
                    className="text-content-secondary hover:text-primary hover:bg-primary/10 p-2 rounded-xl transition-colors"
                  >
                    {downloading === report.id ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  </button>
                </div>
              </div>
              )
            })}
          </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={cn(
                  "flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all",
                  currentPage === 1
                    ? "text-content-secondary/40 cursor-not-allowed"
                    : "text-primary hover:bg-primary/5"
                )}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span className="text-sm text-content-secondary">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={cn(
                  "flex items-center gap-2 text-sm font-bold px-4 py-2 rounded-xl transition-all",
                  currentPage === totalPages
                    ? "text-content-secondary/40 cursor-not-allowed"
                    : "text-primary hover:bg-primary/5"
                )}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation */}
      <div className="mt-8 bg-white p-6 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
        <div className="linen-texture absolute inset-0"></div>
        <div className="relative z-10">
          <p className="text-xs text-content-secondary uppercase tracking-widest font-bold mb-3">Related Pages</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/report-cards/generate" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all">
              <Sparkles size={14} /> Generate New
            </Link>
            <Link href="/dashboard/report-cards/approval" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all">
              <ClipboardCheck size={14} /> Approval Workflow
            </Link>
            <Link href="/dashboard/report-cards/customize" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all">
              <Settings size={14} /> Customize
            </Link>
            <Link href="/dashboard/report-cards/remarks" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all">
              <MessageSquare size={14} /> Remarks
            </Link>
          </div>
        </div>
      </div>
    </Container>
  )
}
