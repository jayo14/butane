"use client"

import { useState, useMemo } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

const MOCK_REPORTS = [
  { id: 1, session: "2024/2025", term: "Second Term", classroom: "JSS 1A", count: 42, generated: "2025-03-15", status: "approved" },
  { id: 2, session: "2024/2025", term: "Second Term", classroom: "JSS 1B", count: 38, generated: "2025-03-15", status: "approved" },
  { id: 3, session: "2024/2025", term: "Second Term", classroom: "JSS 2A", count: 45, generated: "2025-03-14", status: "approved" },
  { id: 4, session: "2024/2025", term: "Second Term", classroom: "JSS 2B", count: 40, generated: "2025-03-14", status: "draft" },
  { id: 5, session: "2024/2025", term: "Second Term", classroom: "SS 1A", count: 36, generated: "2025-03-13", status: "approved" },
  { id: 6, session: "2024/2025", term: "Second Term", classroom: "SS 1B", count: 34, generated: "2025-03-13", status: "submitted" },
  { id: 7, session: "2024/2025", term: "First Term", classroom: "JSS 1A", count: 42, generated: "2024-12-20", status: "approved" },
  { id: 8, session: "2024/2025", term: "First Term", classroom: "JSS 1B", count: 38, generated: "2024-12-20", status: "approved" },
  { id: 9, session: "2024/2025", term: "First Term", classroom: "JSS 2A", count: 45, generated: "2024-12-19", status: "approved" },
  { id: 10, session: "2023/2024", term: "Third Term", classroom: "JSS 1A", count: 41, generated: "2024-07-18", status: "approved" },
  { id: 11, session: "2023/2024", term: "Third Term", classroom: "SS 1A", count: 35, generated: "2024-07-17", status: "approved" },
  { id: 12, session: "2023/2024", term: "Second Term", classroom: "JSS 2A", count: 44, generated: "2024-03-22", status: "approved" },
]

interface ReportCardArchiveClientProps {
  initialTerms: any[]
  initialClassrooms: any[]
}

export function ReportCardArchiveClient({
  initialTerms,
  initialClassrooms,
}: ReportCardArchiveClientProps) {
  const [search, setSearch] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const itemsPerPage = 6

  const filteredReports = useMemo(() => {
    let result = MOCK_REPORTS
    if (selectedTerm) result = result.filter((r) => r.term === selectedTerm)
    if (selectedClassroom) result = result.filter((r) => r.classroom === selectedClassroom)
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (r) =>
          r.classroom.toLowerCase().includes(q) ||
          r.session.toLowerCase().includes(q) ||
          r.term.toLowerCase().includes(q)
      )
    }
    return result
  }, [search, selectedTerm, selectedClassroom])

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage)
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const toggleSelect = (id: number) => {
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
      setSelected(new Set(paginatedReports.map((r) => r.id)))
    }
  }

  const statusIcon = (status: string) => {
    if (status === "approved") return <CheckCircle size={14} className="text-success" />
    if (status === "submitted") return <Clock size={14} className="text-warning" />
    return <Clock size={14} className="text-content-secondary" />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paginatedReports.map((report) => (
              <div
                key={report.id}
                className={cn(
                  "p-4 rounded-2xl border flex items-center gap-4 transition-all group",
                  selected.has(report.id)
                    ? "bg-primary/5 border-primary/30"
                    : "bg-surface-secondary/30 border-border-primary/20 hover:border-primary/20"
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
                    {report.classroom} &middot; {report.term}
                  </p>
                  <p className="text-xs text-content-secondary flex items-center gap-2">
                    <Calendar size={12} />
                    {report.generated}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {statusIcon(report.status)}
                  <button className="text-content-secondary hover:text-primary hover:bg-primary/10 p-2 rounded-xl transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

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
    </Container>
  )
}
