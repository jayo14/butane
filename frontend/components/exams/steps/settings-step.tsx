"use client"

import { cn } from "@/lib/utils"
import { Shuffle, Percent, Calendar, Eye, Lock, Clock } from "lucide-react"
import type { ExamSettings } from "@/types/exam"

interface SettingsStepProps {
  settings: ExamSettings
  onChange: (settings: ExamSettings) => void
}

export function SettingsStep({ settings, onChange }: SettingsStepProps) {
  function update<K extends keyof ExamSettings>(key: K, value: ExamSettings[K]) {
    onChange({ ...settings, [key]: value })
  }

  function toggle(key: "shuffleQuestions" | "shuffleAnswers" | "showResult" | "allowReview") {
    update(key, !settings[key])
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-content-primary">Exam Settings</h2>
        <p className="mt-0.5 text-sm text-content-secondary">
          Configure how the exam behaves for students
        </p>
      </div>

      {/* Shuffle Settings */}
      <div className="space-y-4 rounded-xl border border-border-primary p-5">
        <h3 className="text-sm font-semibold text-content-primary">Question & Answer Order</h3>

        <ToggleRow
          icon={<Shuffle size={18} />}
          label="Shuffle Questions"
          description="Display questions in random order for each student"
          checked={settings.shuffleQuestions}
          onChange={() => toggle("shuffleQuestions")}
        />

        <ToggleRow
          icon={<Shuffle size={18} />}
          label="Shuffle Answers"
          description="Randomize answer option order for each question"
          checked={settings.shuffleAnswers}
          onChange={() => toggle("shuffleAnswers")}
        />
      </div>

      {/* Pass Mark */}
      <div className="rounded-xl border border-border-primary p-5">
        <h3 className="mb-3 text-sm font-semibold text-content-primary">Passing Score</h3>
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-content-muted">
              <Percent size={16} />
            </div>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.passMark}
              onChange={(e) => update("passMark", Math.min(100, Math.max(0, Number(e.target.value))))}
              className="block w-full rounded-xl border border-border-primary bg-white py-2.5 pl-11 pr-4 text-sm text-content-primary transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex-1 text-xs text-content-muted">
            <p>Students must score at least {settings.passMark}% to pass this exam.</p>
          </div>
        </div>
      </div>

      {/* Availability */}
      <div className="rounded-xl border border-border-primary p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content-primary">
          <Calendar size={16} />
          Exam Availability
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Available From</label>
            <input
              type="datetime-local"
              value={settings.availableFrom}
              onChange={(e) => update("availableFrom", e.target.value)}
              className="block w-full rounded-xl border border-border-primary bg-white px-4 py-2.5 text-sm text-content-primary transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-muted">Available Until</label>
            <input
              type="datetime-local"
              value={settings.availableTo}
              onChange={(e) => update("availableTo", e.target.value)}
              className="block w-full rounded-xl border border-border-primary bg-white px-4 py-2.5 text-sm text-content-primary transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* Time Limit */}
      <div className="rounded-xl border border-border-primary p-5">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-content-primary">
          <Clock size={16} />
          Time Limit
        </h3>
        <div className="flex items-center gap-4">
          <div className="relative w-40">
            <input
              type="number"
              min={1}
              max={480}
              value={settings.timeLimit}
              onChange={(e) => update("timeLimit", Number(e.target.value))}
              className="block w-full rounded-xl border border-border-primary bg-white py-2.5 pl-4 pr-12 text-sm text-content-primary transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20"
            />
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-sm text-content-muted">min</span>
          </div>
          <span className="text-xs text-content-muted">Maximum time students have to complete the exam</span>
        </div>
      </div>

      {/* Post-Exam Settings */}
      <div className="space-y-4 rounded-xl border border-border-primary p-5">
        <h3 className="text-sm font-semibold text-content-primary">After Submission</h3>

        <ToggleRow
          icon={<Eye size={18} />}
          label="Show Results Immediately"
          description="Students see their score right after submitting"
          checked={settings.showResult}
          onChange={() => toggle("showResult")}
        />

        <ToggleRow
          icon={<Lock size={18} />}
          label="Allow Review"
          description="Students can review their answers and the correct answers"
          checked={settings.allowReview}
          onChange={() => toggle("allowReview")}
        />
      </div>
    </div>
  )
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="flex cursor-pointer items-center gap-4 rounded-xl p-2 transition-colors hover:bg-surface-secondary">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/5 text-primary">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-content-primary">{label}</p>
        <p className="text-xs text-content-secondary">{description}</p>
      </div>
      <div
        className={cn(
          "relative flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-200",
          checked ? "border-primary bg-primary" : "border-border-primary bg-surface-secondary",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            checked && "translate-x-5",
          )}
        />
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" aria-label={label} />
      </div>
    </label>
  )
}
