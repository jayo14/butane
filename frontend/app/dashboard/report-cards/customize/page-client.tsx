"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Palette,
  Check,
  Eye,
  EyeOff,
  Save,
  Upload,
  RotateCcw,
  Sparkles,
  Archive,
  ClipboardCheck,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { cn } from "@/lib/utils"

const GRADING_SCALES = [
  { id: "standard", name: "Standard", description: "A+ A B C D E F", ranges: "90+ 80-89 70-79 60-69 50-59 40-49 <40" },
  { id: "uk", name: "UK System", description: "A* A B C D E U", ranges: "90+ 80-89 70-79 60-69 50-59 40-49 <40" },
  { id: "nigerian", name: "Nigerian Standard", description: "A B C D E F", ranges: "70-100 60-69 50-59 40-49 30-39 0-29" },
  { id: "custom", name: "Custom Scale", description: "Define your own grade boundaries", ranges: "Custom ranges" },
]

const REPORT_SECTIONS = [
  { id: "student_info", label: "Student Information", description: "Name, photo, admission number", visible: true },
  { id: "school_header", label: "School Header", description: "Logo, name, address", visible: true },
  { id: "term_info", label: "Term / Session Info", description: "Academic period details", visible: true },
  { id: "subject_scores", label: "Subject Scores", description: "Per-subject CA, exam, total, grade", visible: true },
  { id: "overall_summary", label: "Overall Summary", description: "Total score, average, position, grade", visible: true },
  { id: "attendance", label: "Attendance Record", description: "Days present, absent, total school days", visible: true },
  { id: "teacher_remark", label: "Teacher Remark", description: "Class teacher's comment", visible: true },
  { id: "principal_remark", label: "Principal's Remark", description: "Head of school's comment", visible: true },
  { id: "position_history", label: "Position History", description: "Class position over terms", visible: false },
  { id: "psychomotor", label: "Psychomotor Skills", description: "Handwriting, fluency, etc.", visible: false },
  { id: "affective_domain", label: "Affective Domain", description: "Punctuality, neatness, etc.", visible: false },
]

export function ReportCardCustomizeClient() {
  const [gradingScale, setGradingScale] = useState("standard")
  const [sections, setSections] = useState(REPORT_SECTIONS)
  const [saved, setSaved] = useState(false)

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    )
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Container>
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-content-secondary mb-2">
          <Link href="/dashboard/report-cards" className="hover:text-primary">Report Cards</Link>
          <span>/</span>
          <span className="text-primary font-bold">Customization</span>
        </nav>
        <h1 className="text-4xl text-primary font-bold tracking-tight">Report Card Customization</h1>
        <p className="text-content-secondary mt-2 max-w-xl">
          Configure grading scales, section visibility, and report card branding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <section className="lg:col-span-5 flex flex-col gap-6">
          {/* Grading Scale */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Palette size={20} />
                </div>
                <h2 className="text-xl text-content-primary font-bold">Grading Scale</h2>
              </div>
              <div className="space-y-3">
                {GRADING_SCALES.map((scale) => (
                  <div
                    key={scale.id}
                    onClick={() => setGradingScale(scale.id)}
                    className={cn(
                      "p-4 rounded-2xl border cursor-pointer transition-all",
                      gradingScale === scale.id
                        ? "bg-primary/5 border-primary/30"
                        : "bg-surface-secondary/30 border-border-primary/20 hover:border-primary/20"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-content-primary">{scale.name}</p>
                        <p className="text-xs text-content-secondary">{scale.description}</p>
                      </div>
                      {gradingScale === scale.id && (
                        <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* School Branding */}
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <h2 className="text-xl text-content-primary font-bold mb-6">School Branding</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-content-secondary uppercase tracking-wider block mb-1.5 px-1">School Motto</label>
                  <div className="recessed-well bg-white border border-border-primary/40 rounded-2xl">
                    <input
                      type="text"
                      defaultValue="Knowledge is Power"
                      className="w-full bg-transparent border-none px-4 py-3 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-content-secondary uppercase tracking-wider block mb-1.5 px-1">School Logo</label>
                  <button className="w-full p-6 border-2 border-dashed border-border-primary/40 rounded-2xl text-content-secondary hover:border-primary/40 hover:text-primary transition-all flex flex-col items-center gap-2">
                    <Upload size={24} />
                    <span className="text-xs font-bold">Click to upload logo</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section Visibility */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white p-8 rounded-3xl shadow-card border border-border-primary/60 relative overflow-hidden">
            <div className="linen-texture absolute inset-0"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl text-content-primary font-bold">Report Sections</h2>
                <span className="text-sm text-content-secondary">{sections.filter((s) => s.visible).length} of {sections.length} visible</span>
              </div>

              <div className="space-y-3">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-surface-secondary/30 border border-border-primary/10 group hover:border-primary/20 transition-all"
                  >
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all shrink-0",
                        section.visible
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-secondary text-content-secondary"
                      )}
                    >
                      {section.visible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-content-primary">{section.label}</p>
                      <p className="text-xs text-content-secondary">{section.description}</p>
                    </div>
                    <button
                      onClick={() => toggleSection(section.id)}
                      className={cn(
                        "relative w-12 h-7 rounded-full transition-all shrink-0",
                        section.visible ? "bg-primary" : "bg-surface-secondary border border-border-primary/40"
                      )}
                    >
                      <div
                        className={cn(
                          "absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all",
                          section.visible ? "left-5" : "left-0.5"
                        )}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <button className="flex items-center gap-2 px-6 py-3 rounded-2xl border border-border-primary text-content-primary text-sm font-bold hover:bg-surface-secondary transition-all">
              <RotateCcw size={16} /> Reset Defaults
            </button>
            <button
              onClick={handleSave}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all",
                saved
                  ? "bg-success text-white"
                  : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95 shadow-md"
              )}
            >
              {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
            </button>
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
            <Link href="/dashboard/report-cards/approval" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all">
              <ClipboardCheck size={14} /> Approval Workflow
            </Link>
            <Link href="/dashboard/report-cards/archive" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/5 border border-primary/20 text-primary text-sm font-bold hover:bg-primary/10 transition-all">
              <Archive size={14} /> View Archive
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
