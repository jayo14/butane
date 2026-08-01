"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  Search,
  AlertTriangle,
  FileText,
  Users,
  Archive,
  Sparkles,
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

interface ReportCardApprovalClientProps {
  initialTerms: any[]
  initialClassrooms: any[]
}

export function ReportCardApprovalClient({
  initialTerms,
  initialClassrooms,
}: ReportCardApprovalClientProps) {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [reviewDrawer, setReviewDrawer] = useState<any | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReports = async (status?: string) => {
    setLoading(true)
    try {
      const params: any = { page_size: 100 }
      if (status) params.status = status
      const res = await api.academics.reportCardsList(params)
      const results = (res as any)?.results || res || []
      setReports(results)
    } catch {
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReports()
  }, [])

  const pendingReports = reports.filter((r: any) => r.status === "draft" || r.status === "submitted")
  const approvedReports = reports.filter((r: any) => r.status === "approved")
  const rejectedReports: any[] = []

  const currentReports = activeTab === "pending" ? pendingReports : activeTab === "approved" ? approvedReports : rejectedReports

  const handleApprove = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await api.academics.reportCardsApprove(reportId)
      addToast({ message: "Report card approved successfully!", variant: "success" })
      await fetchReports()
      setReviewDrawer(null)
    } catch (err) {
      addToast({ message: "Failed to approve report card.", variant: "error" })
    } finally {
      setActionLoading(null)
    }
  }

  const handleSubmit = async (reportId: string) => {
    setActionLoading(reportId)
    try {
      await api.academics.reportCardsSubmit(reportId)
      addToast({ message: "Report card submitted for approval!", variant: "success" })
      await fetchReports()
      setReviewDrawer(null)
    } catch (err) {
      addToast({ message: "Failed to submit report card.", variant: "error" })
    } finally {
      setActionLoading(null)
    }
  }

  const tabs = [
    { id: "pending" as const, label: "Pending", count: pendingReports.length, icon: Clock },
    { id: "approved" as const, label: "Approved", count: approvedReports.length, icon: CheckCircle },
    { id: "rejected" as const, label: "Rejected", count: rejectedReports.length, icon: XCircle },
  ]

  const previewUrl = reviewDrawer ? api.academics.reportCardPreviewUrl(reviewDrawer.id) : null

  return (
    <Container>
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-content-secondary mb-2">
          <Link href="/dashboard/report-cards" className="hover:text-primary">Report Cards</Link>
          <span>/</span>
          <span className="text-primary font-bold">Approval</span>
        </nav>
        <h1 className="text-4xl text-primary font-bold tracking-tight">Report Approval</h1>
        <p className="text-content-secondary mt-2 max-w-xl">
          Final review and authorization before reports are sent to parents.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-8 flex flex-col gap-6">
          <div className="flex items-center gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border",
                  activeTab === tab.id
                    ? tab.id === "pending"
                      ? "bg-warning/10 border-warning/30 text-warning"
                      : tab.id === "approved"
                      ? "bg-success/10 border-success/30 text-success"
                      : "bg-danger/10 border-danger/30 text-danger"
                    : "bg-white border-border-primary/40 text-content-secondary hover:border-primary/20"
                )}
              >
                <tab.icon size={16} />
                {tab.label}
                <span className={cn(
                  "ml-1 px-2 py-0.5 rounded-full text-xs",
                  activeTab === tab.id ? "bg-white/50" : "bg-surface-secondary"
                )}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Pending */}
          {activeTab === "pending" && (
            <div className="flex flex-col gap-3 animate-slide-up">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span className="ml-3 text-sm text-content-secondary">Loading pending reports...</span>
                </div>
              ) : currentReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-border-primary/20">
                  <CheckCircle size={32} className="text-success/40 mx-auto mb-3" />
                  <p className="text-sm text-content-secondary">No pending reports to review. Great job!</p>
                </div>
              ) : (
              currentReports.map((report: any) => (
                <div
                  key={report.id}
                  onClick={() => setReviewDrawer(report)}
                  className="bg-white p-5 rounded-2xl border border-border-primary/20 shadow-card hover:shadow-dropdown hover:scale-[1.01] transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-content-primary">{report.classroom_name || `Class ${report.classroom}`}</p>
                        <p className="text-xs text-content-secondary">
                          {report.position ? `Position: ${report.position}/${report.class_size}` : ""} &middot; {report.term_name || `Term ${report.term}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-surface-secondary text-content-secondary capitalize">{report.status}</span>
                      <ChevronRight size={16} className="text-content-secondary group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              ))
              )}
            </div>
          )}

          {/* Approved */}
          {activeTab === "approved" && (
            <div className="flex flex-col gap-3 animate-slide-up">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={24} className="animate-spin text-primary" />
                  <span className="ml-3 text-sm text-content-secondary">Loading approved reports...</span>
                </div>
              ) : currentReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-border-primary/20">
                  <Clock size={32} className="text-content-secondary/40 mx-auto mb-3" />
                  <p className="text-sm text-content-secondary">No approved reports yet.</p>
                </div>
              ) : (
              <>
              {currentReports.map((report: any) => (
                <div key={report.id} className="bg-white p-5 rounded-2xl border border-success/20 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-content-primary">{report.classroom_name || `Class ${report.classroom}`}</p>
                        <p className="text-xs text-content-secondary">
                          {report.position ? `Position: ${report.position}/${report.class_size}` : ""} &middot; {report.term_name || `Term ${report.term}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-success font-bold">Approved</p>
                      <p className="text-xs text-content-secondary">{report.approvedBy}</p>
                    </div>
                  </div>
                </div>
              ))}
              </>
              )}
            </div>
          )}

          {/* Rejected */}
          {activeTab === "rejected" && (
            <div className="flex flex-col gap-3 animate-slide-up">
              {reports.filter((r: any) => r.status === "rejected").map((report: any) => (
                <div key={report.id} className="bg-white p-5 rounded-2xl border border-danger/20 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                        <XCircle size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-content-primary">{report.classroom_name || `Class ${report.classroom}`}</p>
                        <p className="text-xs text-content-secondary">
                          {report.term_name || `Term ${report.term}`} &middot; Rejected
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-danger font-bold">Rejected</p>
                      <p className="text-xs text-content-secondary">{report.updated_at ? new Date(report.updated_at).toLocaleDateString() : ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Review Drawer */}
        <section className="lg:col-span-4 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden sticky top-24">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              {reviewDrawer ? (
                <>
                  <h3 className="text-xl text-content-primary font-bold mb-2">{reviewDrawer.classroom_name || `Class ${reviewDrawer.classroom}`}</h3>
                  <p className="text-sm text-content-secondary mb-6">{reviewDrawer.term_name || `Term ${reviewDrawer.term}`} &middot; Score: {reviewDrawer.total_score?.toFixed(1)}%</p>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-xl">
                      <span className="text-sm text-content-secondary">Average</span>
                      <span className="text-sm font-bold text-content-primary">{reviewDrawer.average_score?.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-xl">
                      <span className="text-sm text-content-secondary">Position</span>
                      <span className="text-sm font-bold text-content-primary">{reviewDrawer.position}/{reviewDrawer.class_size}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-xl">
                      <span className="text-sm text-content-secondary">Grade</span>
                      <span className="text-sm font-bold text-primary">{reviewDrawer.grade || "-"}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-xl">
                      <span className="text-sm text-content-secondary">Status</span>
                      <span className="text-sm font-bold capitalize">{reviewDrawer.status}</span>
                    </div>
                  </div>

                  {reviewDrawer.teacher_remark && (
                    <div className="mb-4 p-3 bg-surface-secondary/30 rounded-xl">
                      <p className="text-xs text-content-secondary mb-1">Teacher Remark</p>
                      <p className="text-sm text-content-primary">{reviewDrawer.teacher_remark}</p>
                    </div>
                  )}

                  {previewUrl && (
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border border-border-primary text-content-primary text-sm font-bold hover:bg-surface-secondary transition-all mb-4"
                    >
                      <Eye size={16} /> Preview Report Card
                    </a>
                  )}

                  <div className="flex flex-col gap-3">
                    {reviewDrawer.status === "draft" && (
                      <button
                        onClick={() => handleSubmit(reviewDrawer.id)}
                        disabled={actionLoading === reviewDrawer.id}
                        className="bg-primary text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50"
                      >
                        {actionLoading === reviewDrawer.id ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                        Submit for Approval
                      </button>
                    )}
                    {(reviewDrawer.status === "submitted" || reviewDrawer.status === "draft") && (
                      <button
                        onClick={() => handleApprove(reviewDrawer.id)}
                        disabled={actionLoading === reviewDrawer.id}
                        className="bg-success text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md disabled:opacity-50"
                      >
                        {actionLoading === reviewDrawer.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                        Approve Report
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText size={24} className="text-content-secondary" />
                  </div>
                  <p className="text-content-secondary text-sm">Select a pending report to review</p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Quick Navigation */}
      <div className="mt-8 bg-white p-6 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
        <div className="linen-texture absolute inset-0"></div>
        <div className="relative z-10">
          <p className="text-xs text-content-secondary uppercase tracking-widest font-bold mb-3">Related Pages</p>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/report-cards/generate" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all">
              <Sparkles size={14} /> Generate Reports
            </Link>
            <Link href="/dashboard/report-cards/archive" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all">
              <Archive size={14} /> View Archive
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
