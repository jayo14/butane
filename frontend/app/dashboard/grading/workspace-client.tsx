"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Container } from "@/components/layout/container"
import { Tabs } from "@/components/ui/tabs"
import { GradingPageClient } from "./page-client"
import { SetupAssessmentPageClient } from "./setup-assessment/page-client"
import { ScoreEntryPageClient } from "../score-entry/page-client"

const GRADING_TABS = [
  { label: "Overview", value: "overview" },
  { label: "Assessment Setup", value: "assessment-setup" },
  { label: "Score Entry", value: "score-entry" },
] as const

type TabValue = (typeof GRADING_TABS)[number]["value"]

function OverviewTab() {
  return <GradingPageClient />
}

function AssessmentSetupTab() {
  return <SetupAssessmentPageClient />
}

function ScoreEntryTab() {
  return <ScoreEntryPageClient />
}

const TAB_COMPONENTS: Record<TabValue, React.ComponentType> = {
  overview: OverviewTab,
  "assessment-setup": AssessmentSetupTab,
  "score-entry": ScoreEntryTab,
}

export function GradingWorkspaceClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get("tab") as TabValue) || "overview"
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab)

  useEffect(() => {
    const tab = searchParams.get("tab") as TabValue | null
    if (tab && tab !== activeTab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleTabChange = useCallback((tab: string) => {
    const value = tab as TabValue
    setActiveTab(value)
    const params = new URLSearchParams(window.location.search)
    if (value === "overview") {
      params.delete("tab")
    } else {
      params.set("tab", value)
    }
    const qs = params.toString()
    router.replace(`/dashboard/grading${qs ? `?${qs}` : ""}`, { scroll: false })
  }, [router])

  const ActiveComponent = TAB_COMPONENTS[activeTab] || TAB_COMPONENTS.overview

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content-primary md:text-2xl">Grading</h1>
        <p className="mt-0.5 text-sm text-content-secondary">
          Academic setup, assessment configuration, and score entry
        </p>
      </div>

      <div className="mb-6">
        <Tabs
          tabs={GRADING_TABS.map((t) => ({ label: t.label, value: t.value }))}
          value={activeTab}
          onChange={handleTabChange}
        />
      </div>

      <ActiveComponent />
    </div>
  )
}
