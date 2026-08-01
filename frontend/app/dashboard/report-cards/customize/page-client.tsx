"use client"

import { useState, useEffect } from "react"
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
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

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
  const { addToast } = useToast()
  const [gradeScales, setGradeScales] = useState<any[]>([])
  const [selectedScaleId, setSelectedScaleId] = useState<string>("")
  const [schoolProfile, setSchoolProfile] = useState<any>(null)
  const [motto, setMotto] = useState("")
  const [sections, setSections] = useState(REPORT_SECTIONS)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api.academics.gradeScales().catch(() => []),
      api.academics.schoolProfile().catch(() => null),
    ]).then(([scales, profile]) => {
      setGradeScales(scales || [])
      if (profile) {
        setSchoolProfile(profile)
        setMotto(profile.motto || "")
      }
      if (scales && scales.length > 0) {
        setSelectedScaleId(scales[0].id)
      }
    }).finally(() => setLoading(false))
  }, [])

  const toggleSection = (id: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.academics.schoolProfileUpdate({ motto })
      setSaved(true)
      addToast({ message: "Settings saved successfully!", variant: "success" })
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      addToast({ message: "Failed to save settings.", variant: "error" })
    } finally {
      setSaving(false)
    }
  }

  const groupedScales = gradeScales.reduce((acc: any, scale: any) => {
    const key = `${scale.min_score}-${scale.max_score}`
    if (!acc[key]) acc[key] = { min: scale.min_score, max: scale.max_score, grades: [] }
    acc[key].grades.push(scale)
    return acc
  }, {})

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
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 size={20} className="animate-spin text-primary" />
                </div>
              ) : gradeScales.length === 0 ? (
                <p className="text-sm text-content-secondary text-center py-4">No grade scales configured yet.</p>
              ) : (
                <div className="space-y-2">
                  {gradeScales.map((scale: any) => (
                    <div
                      key={scale.id}
                      className={cn(
                        "p-3 rounded-xl border flex items-center justify-between transition-all",
                        selectedScaleId === scale.id
                          ? "bg-primary/5 border-primary/30"
                          : "bg-surface-secondary/30 border-border-primary/20"
                      )}
                    >
                      <div>
                        <p className="text-sm font-bold text-content-primary">{scale.grade} — {scale.remark}</p>
                        <p className="text-xs text-content-secondary">{scale.min_score}% – {scale.max_score}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      value={motto}
                      onChange={(e) => setMotto(e.target.value)}
                      placeholder="Enter school motto..."
                      className="w-full bg-transparent border-none px-4 py-3 text-sm font-semibold text-content-primary focus:ring-0 outline-none"
                    />
                  </div>
                </div>
                {schoolProfile?.name && (
                  <div className="p-3 bg-surface-secondary/30 rounded-xl">
                    <p className="text-xs text-content-secondary mb-1">School Name</p>
                    <p className="text-sm font-bold text-content-primary">{schoolProfile.name}</p>
                  </div>
                )}
                {schoolProfile?.address && (
                  <div className="p-3 bg-surface-secondary/30 rounded-xl">
                    <p className="text-xs text-content-secondary mb-1">Address</p>
                    <p className="text-sm font-bold text-content-primary">{schoolProfile.address}</p>
                  </div>
                )}
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
                    className="flex items-center gap-4 p-4 rounded-2xl bg-surface-secondary/30 border border-border-primary/10 group hover:border-primary/20 hover:shadow-sm transition-all"
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
              disabled={saving}
              className={cn(
                "flex items-center gap-2 px-8 py-3 rounded-2xl text-sm font-bold transition-all",
                saved
                  ? "bg-success text-white"
                  : "bg-primary text-primary-foreground hover:brightness-110 active:scale-95 shadow-md"
              )}
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <Check size={16} /> : <Save size={16} />}
              {saving ? "Saving..." : saved ? "Saved!" : "Save Changes"}
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
