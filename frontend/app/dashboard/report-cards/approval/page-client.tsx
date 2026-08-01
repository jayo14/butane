"use client"

import { useState } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

const MOCK_PENDING = [
  { id: 1, session: "2024/2025", term: "Second Term", classroom: "JSS 1A", count: 42, generated: "2025-03-15", submittedBy: "Mr. Adebayo" },
  { id: 2, session: "2024/2025", term: "Second Term", classroom: "JSS 2A", count: 45, generated: "2025-03-14", submittedBy: "Mrs. Okonkwo" },
  { id: 3, session: "2024/2025", term: "Second Term", classroom: "SS 1B", count: 34, generated: "2025-03-13", submittedBy: "Mr. Ibrahim" },
]

const MOCK_APPROVED = [
  { id: 4, session: "2024/2025", term: "Second Term", classroom: "JSS 1B", count: 38, approvedBy: "VP Admin", approvedDate: "2025-03-16" },
  { id: 5, session: "2024/2025", term: "Second Term", classroom: "SS 1A", count: 36, approvedBy: "VP Admin", approvedDate: "2025-03-15" },
]

const MOCK_REJECTED = [
  { id: 6, session: "2024/2025", term: "Second Term", classroom: "JSS 2B", count: 40, rejectedBy: "VP Admin", rejectedDate: "2025-03-14", reason: "Missing continuous assessment scores for 3 students" },
]

interface ReportCardApprovalClientProps {
  initialTerms: any[]
  initialClassrooms: any[]
}

export function ReportCardApprovalClient({
  initialTerms,
  initialClassrooms,
}: ReportCardApprovalClientProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending")
  const [reviewDrawer, setReviewDrawer] = useState<any | null>(null)

  const tabs = [
    { id: "pending" as const, label: "Pending", count: MOCK_PENDING.length, icon: Clock },
    { id: "approved" as const, label: "Approved", count: MOCK_APPROVED.length, icon: CheckCircle },
    { id: "rejected" as const, label: "Rejected", count: MOCK_REJECTED.length, icon: XCircle },
  ]

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
              {MOCK_PENDING.map((report) => (
                <div
                  key={report.id}
                  onClick={() => setReviewDrawer(report)}
                  className="bg-white p-5 rounded-2xl border border-border-primary/20 shadow-card hover:shadow-dropdown transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-content-primary">{report.classroom}</p>
                        <p className="text-xs text-content-secondary">
                          {report.count} students &middot; {report.term}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-content-secondary">{report.submittedBy}</span>
                      <ChevronRight size={16} className="text-content-secondary group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Approved */}
          {activeTab === "approved" && (
            <div className="flex flex-col gap-3 animate-slide-up">
              {MOCK_APPROVED.map((report) => (
                <div key={report.id} className="bg-white p-5 rounded-2xl border border-success/20 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center text-success">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-content-primary">{report.classroom}</p>
                        <p className="text-xs text-content-secondary">
                          {report.count} students &middot; {report.term}
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
            </div>
          )}

          {/* Rejected */}
          {activeTab === "rejected" && (
            <div className="flex flex-col gap-3 animate-slide-up">
              {MOCK_REJECTED.map((report) => (
                <div key={report.id} className="bg-white p-5 rounded-2xl border border-danger/20 shadow-card">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-danger/10 flex items-center justify-center text-danger">
                        <XCircle size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-content-primary">{report.classroom}</p>
                        <p className="text-xs text-content-secondary">
                          {report.count} students &middot; {report.term}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-danger font-bold">Rejected</p>
                      <p className="text-xs text-content-secondary">{report.rejectedDate}</p>
                    </div>
                  </div>
                  <div className="mt-3 p-3 bg-danger/5 rounded-xl border border-danger/10 flex items-start gap-2">
                    <AlertTriangle size={14} className="text-danger mt-0.5 shrink-0" />
                    <p className="text-xs text-danger">{report.reason}</p>
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
                  <h3 className="text-xl text-content-primary font-bold mb-2">{reviewDrawer.classroom}</h3>
                  <p className="text-sm text-content-secondary mb-6">{reviewDrawer.term} &middot; {reviewDrawer.count} students</p>

                  <div className="space-y-4 mb-6">
                    <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-xl">
                      <span className="text-sm text-content-secondary">Generated</span>
                      <span className="text-sm font-bold text-content-primary">{reviewDrawer.generated}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-surface-secondary/50 rounded-xl">
                      <span className="text-sm text-content-secondary">Submitted by</span>
                      <span className="text-sm font-bold text-content-primary">{reviewDrawer.submittedBy}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button className="bg-success text-white font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-md">
                      <CheckCircle size={16} /> Approve Report
                    </button>
                    <button className="bg-danger/10 text-danger font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-danger/20 transition-all">
                      <XCircle size={16} /> Reject Report
                    </button>
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
    </Container>
  )
}
