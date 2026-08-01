"use client"

import { useState, useMemo } from "react"
import {
  BarChart2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Download,
  Search,
  Users,
  Sliders,
  BookOpen
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AnalyticsPageClientProps {
  classrooms: any[]
  subjects: any[]
  profile: any
}

export function AnalyticsPageClient({
  classrooms,
  subjects,
  profile
}: AnalyticsPageClientProps) {
  const [selectedClassroom, setSelectedClassroom] = useState(classrooms[0]?.id || "")
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]?.id || "")

  const classroomName = classrooms.find(c => c.id === selectedClassroom)?.name || "SS2A"
  const subjectName = subjects.find(s => s.id === selectedSubject)?.name || "Chemistry"

  // Mock analytics data based on selections
  const analyticsData = useMemo(() => {
    // Generate seeded mock results based on selection hash for stability
    const seed = (classroomName + subjectName).length
    const classSize = 25 + (seed % 15)
    const graded = classSize - (seed % 4)
    const completionPercent = Math.round((graded / classSize) * 100)
    const averageScore = 65 + (seed % 20)
    
    // Distribution
    const aCount = Math.round(graded * 0.25)
    const bCount = Math.round(graded * 0.35)
    const cCount = Math.round(graded * 0.30)
    const fCount = graded - (aCount + bCount + cCount)

    return {
      classSize,
      graded,
      completionPercent,
      averageScore,
      pendingCount: classSize - graded,
      distribution: { aCount, bCount, cCount, fCount }
    }
  }, [classroomName, subjectName])

  return (
    <div className="min-h-screen text-content-primary p-6 md:p-10">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl text-primary font-bold tracking-tight">Academic Analytics</h1>
          <p className="text-lg text-content-secondary">
            Performance analysis and grade distribution insights for {profile?.full_name || "Lead Teacher"}.
          </p>
        </div>
        <div className="flex gap-2">
          <Button className="bg-white hover:bg-surface-secondary text-primary border border-primary/20 rounded-full px-5 text-xs shadow-sm flex items-center gap-1.5 font-bold">
            <Download size={14} /> Export Report
          </Button>
        </div>
      </div>

      {/* Selection filters */}
      <div className="bg-white rounded-2xl p-4 flex flex-wrap items-center gap-4 border border-border-primary/20 shadow-sm mb-8">
        <div className="recessed-well rounded-xl border border-border-primary/40 px-4 py-2 flex items-center gap-2">
          <Sliders size={16} className="text-content-secondary" />
          <select
            value={selectedClassroom}
            onChange={(e) => setSelectedClassroom(e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 text-xs font-bold text-content-primary outline-none"
          >
            <option value="">Select Classroom...</option>
            {classrooms.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="recessed-well rounded-xl border border-border-primary/40 px-4 py-2 flex items-center gap-2">
          <BookOpen size={16} className="text-content-secondary" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="bg-transparent border-none p-0 focus:ring-0 text-xs font-bold text-content-primary outline-none"
          >
            <option value="">Select Subject...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-3xl p-6 border border-border-primary/20 shadow-sm relative overflow-hidden">
          <p className="text-xs font-bold text-content-secondary uppercase mb-4">Completion Status</p>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xl font-bold text-content-primary">
                {analyticsData.graded} / {analyticsData.classSize}
              </span>
              <p className="text-xs text-content-secondary mt-1 font-semibold">Students Graded</p>
            </div>
            <div className="relative w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm border border-primary/20 shadow-inner">
              {analyticsData.completionPercent}%
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border-primary/20 shadow-sm relative overflow-hidden">
          <p className="text-xs font-bold text-content-secondary uppercase mb-4">Missing Scores</p>
          <div className="flex items-center gap-4">
            <div className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center",
              analyticsData.pendingCount > 0 ? "bg-danger/10 text-danger" : "bg-primary/10 text-primary"
            )}>
              <AlertTriangle size={24} />
            </div>
            <div>
              <span className={cn("text-3xl font-bold", analyticsData.pendingCount > 0 ? "text-danger" : "text-primary")}>
                {analyticsData.pendingCount}
              </span>
              <p className="text-xs text-content-secondary mt-1 font-semibold">Students Pending</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border-primary/20 shadow-sm relative overflow-hidden">
          <p className="text-xs font-bold text-content-secondary uppercase mb-4">Validation Errors</p>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
              <CheckCircle size={24} />
            </div>
            <div>
              <span className="text-3xl font-bold text-primary">0</span>
              <p className="text-xs text-content-secondary mt-1 font-semibold">Errors Found</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-border-primary/20 shadow-sm relative overflow-hidden">
          <p className="text-xs font-bold text-content-secondary uppercase mb-4">Class Performance</p>
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-content-secondary">Average</span>
              <span className="text-primary">{analyticsData.averageScore}%</span>
            </div>
            <div className="flex justify-between text-[10px] text-content-secondary font-semibold">
              <span>Range</span>
              <span>45% &mdash; 98%</span>
            </div>
            <div className="w-full bg-surface-secondary h-1.5 rounded-full overflow-hidden mt-2">
              <div className="bg-primary h-full" style={{ width: `${analyticsData.averageScore}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Double Column Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-border-primary/30 shadow-sm relative overflow-hidden min-h-[360px]">
            <div className="relative z-10 space-y-6">
              <h3 className="text-xl text-primary font-bold flex items-center gap-2">
                <TrendingUp /> Grade Breakdown &mdash; {classroomName}
              </h3>
              <p className="text-sm text-content-secondary leading-relaxed">
                The current performance metrics indicate a healthy average of <span className="font-bold text-primary">{analyticsData.averageScore}%</span> for {subjectName} in class {classroomName}. Grading completion is at <span className="font-bold text-primary">{analyticsData.completionPercent}%</span>.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-surface-secondary border border-border-primary/20">
                  <p className="text-xs text-content-secondary font-semibold uppercase">Top Performing Student</p>
                  <p className="text-lg text-content-primary font-bold mt-1">Florence Otedola</p>
                  <span className="text-xs text-primary font-bold">Score: 98% (A1)</span>
                </div>
                <div className="p-5 rounded-2xl bg-surface-secondary border border-border-primary/20">
                  <p className="text-xs text-content-secondary font-semibold uppercase">Pending Reviews</p>
                  <p className="text-lg text-content-primary font-bold mt-1">
                    {analyticsData.pendingCount} students missing scores
                  </p>
                  <span className="text-xs text-content-secondary font-semibold">Action is required before lock date.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Score distribution bar chart */}
        <div className="space-y-6">
          <h3 className="text-xl text-primary font-bold flex items-center gap-2">
            <BarChart2 /> Score Distribution
          </h3>

          <div className="bg-white rounded-3xl p-6 border border-border-primary/30 shadow-sm relative overflow-hidden">
            <div className="flex flex-col gap-5 relative z-10">
              <div className="space-y-1">
                <div className="flex justify-between items-end text-xs font-semibold">
                  <span className="font-bold text-primary">Grade A (75-100)</span>
                  <span className="text-content-secondary">{analyticsData.distribution.aCount} Students</span>
                </div>
                <div className="h-6 w-full bg-surface-secondary rounded-lg overflow-hidden flex items-center px-1 shadow-inner">
                  <div className="h-4 bg-primary rounded-md shadow-sm transition-all duration-1000" style={{ width: `${(analyticsData.distribution.aCount / analyticsData.classSize) * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-end text-xs font-semibold">
                  <span className="font-bold text-primary">Grade B (65-74)</span>
                  <span className="text-content-secondary">{analyticsData.distribution.bCount} Students</span>
                </div>
                <div className="h-6 w-full bg-surface-secondary rounded-lg overflow-hidden flex items-center px-1 shadow-inner">
                  <div className="h-4 bg-primary rounded-md shadow-sm transition-all duration-1000" style={{ width: `${(analyticsData.distribution.bCount / analyticsData.classSize) * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-end text-xs font-semibold">
                  <span className="font-bold text-primary">Grade C (50-64)</span>
                  <span className="text-content-secondary">{analyticsData.distribution.cCount} Students</span>
                </div>
                <div className="h-6 w-full bg-surface-secondary rounded-lg overflow-hidden flex items-center px-1 shadow-inner">
                  <div className="h-4 bg-primary rounded-md shadow-sm transition-all duration-1000" style={{ width: `${(analyticsData.distribution.cCount / analyticsData.classSize) * 100}%` }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-end text-xs font-semibold">
                  <span className="font-bold text-danger">Grade F (Below 50)</span>
                  <span className="text-content-secondary">{analyticsData.distribution.fCount} Students</span>
                </div>
                <div className="h-6 w-full bg-surface-secondary rounded-lg overflow-hidden flex items-center px-1 shadow-inner">
                  <div className="h-4 bg-danger rounded-md shadow-sm transition-all duration-1000" style={{ width: `${(analyticsData.distribution.fCount / analyticsData.classSize) * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
