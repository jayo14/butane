"use client"

import { Clock, Percent } from "lucide-react"
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
    <div className="space-y-0">
      {/* Time Limit */}
      <div className="flex flex-col gap-4 pb-6 border-b" style={{ borderColor: "rgba(187,202,191,0.3)" }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold tracking-[0.02em]" style={{ color: "#121c2a" }}>
              Time Limit (minutes)
            </h3>
            <p className="text-sm" style={{ color: "#3c4a42" }}>
              Set the total duration for the exam session.
            </p>
          </div>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={480}
              value={settings.timeLimit}
              onChange={(e) => update("timeLimit", Number(e.target.value))}
              className="w-full md:w-32 rounded-full border py-2 px-4 text-sm font-semibold tracking-[0.02em] transition-all focus:outline-none"
              style={{
                borderColor: "#bbcabf",
                backgroundColor: "#eff3ff",
                color: "#121c2a",
                boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
              }}
            />
            <span
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold"
              style={{ color: "#3c4a42" }}
            >
              MIN
            </span>
          </div>
        </div>
      </div>

      {/* Shuffle Questions */}
      <div className="flex items-center justify-between gap-4 py-6 border-b" style={{ borderColor: "rgba(187,202,191,0.3)" }}>
        <div>
          <h3 className="text-sm font-semibold tracking-[0.02em]" style={{ color: "#121c2a" }}>
            Shuffle Questions
          </h3>
          <p className="text-sm" style={{ color: "#3c4a42" }}>
            Randomize question order for every participant.
          </p>
        </div>
        <ToggleSwitch checked={settings.shuffleQuestions} onChange={() => toggle("shuffleQuestions")} label="Shuffle Questions" />
      </div>

      {/* Shuffle Answers */}
      <div className="flex items-center justify-between gap-4 py-6 border-b" style={{ borderColor: "rgba(187,202,191,0.3)" }}>
        <div>
          <h3 className="text-sm font-semibold tracking-[0.02em]" style={{ color: "#121c2a" }}>
            Shuffle Answers
          </h3>
          <p className="text-sm" style={{ color: "#3c4a42" }}>
            Randomize answer option order for each question.
          </p>
        </div>
        <ToggleSwitch checked={settings.shuffleAnswers} onChange={() => toggle("shuffleAnswers")} label="Shuffle Answers" />
      </div>

      {/* Passing Score */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b" style={{ borderColor: "rgba(187,202,191,0.3)" }}>
        <div>
          <h3 className="text-sm font-semibold tracking-[0.02em]" style={{ color: "#121c2a" }}>
            Passing Score (%)
          </h3>
          <p className="text-sm" style={{ color: "#3c4a42" }}>
            Minimum percentage required to pass.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            value={settings.passMark}
            onChange={(e) => update("passMark", Number(e.target.value))}
            className="w-full md:w-32 accent-[#10b981] cursor-pointer"
          />
          <span className="text-sm font-semibold w-10 text-right" style={{ color: "#006c49" }}>
            {settings.passMark}%
          </span>
        </div>
      </div>

      {/* Availability */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-6 border-b" style={{ borderColor: "rgba(187,202,191,0.3)" }}>
        <div>
          <h3 className="text-sm font-semibold tracking-[0.02em]" style={{ color: "#121c2a" }}>
            Availability
          </h3>
          <p className="text-sm" style={{ color: "#3c4a42" }}>
            When can students take this exam?
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full md:w-auto">
          <select
            value={settings.availableFrom ? "scheduled" : "private"}
            onChange={(e) => {
              if (e.target.value === "private") {
                update("availableFrom", "")
                update("availableTo", "")
              }
            }}
            className="w-full md:w-48 rounded-full border py-2 px-4 text-sm font-semibold tracking-[0.02em] appearance-none cursor-pointer transition-all focus:outline-none"
            style={{
              borderColor: "#bbcabf",
              backgroundColor: "#eff3ff",
              color: "#121c2a",
              boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
            }}
          >
            <option value="public">Public</option>
            <option value="private">Private (Link only)</option>
            <option value="scheduled">Scheduled</option>
          </select>
          {settings.availableFrom && (
            <div className="grid gap-2 md:grid-cols-2">
              <input
                type="datetime-local"
                value={settings.availableFrom}
                onChange={(e) => update("availableFrom", e.target.value)}
                className="rounded-full border px-4 py-2 text-sm transition-all focus:outline-none"
                style={{
                  borderColor: "#bbcabf",
                  backgroundColor: "#eff3ff",
                  color: "#121c2a",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
                }}
              />
              <input
                type="datetime-local"
                value={settings.availableTo}
                onChange={(e) => update("availableTo", e.target.value)}
                className="rounded-full border px-4 py-2 text-sm transition-all focus:outline-none"
                style={{
                  borderColor: "#bbcabf",
                  backgroundColor: "#eff3ff",
                  color: "#121c2a",
                  boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.03)",
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Show Results */}
      <div className="flex items-center justify-between gap-4 py-6 border-b" style={{ borderColor: "rgba(187,202,191,0.3)" }}>
        <div>
          <h3 className="text-sm font-semibold tracking-[0.02em]" style={{ color: "#121c2a" }}>
            Show Results Immediately
          </h3>
          <p className="text-sm" style={{ color: "#3c4a42" }}>
            Students see their score right after submitting.
          </p>
        </div>
        <ToggleSwitch checked={settings.showResult} onChange={() => toggle("showResult")} label="Show Results" />
      </div>

      {/* Allow Review */}
      <div className="flex items-center justify-between gap-4 pt-6">
        <div>
          <h3 className="text-sm font-semibold tracking-[0.02em]" style={{ color: "#121c2a" }}>
            Allow Review
          </h3>
          <p className="text-sm" style={{ color: "#3c4a42" }}>
            Students can review answers and correct answers after submission.
          </p>
        </div>
        <ToggleSwitch checked={settings.allowReview} onChange={() => toggle("allowReview")} label="Allow Review" />
      </div>
    </div>
  )
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="relative inline-flex items-center cursor-pointer shrink-0">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only peer"
        aria-label={label}
      />
      <div
        className="w-11 h-6 rounded-full transition-all after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-focus:outline-none"
        style={{
          backgroundColor: checked ? "#10b981" : "#e4e2de",
          borderColor: checked ? "#10b981" : "#bbcabf",
          borderWidth: checked ? "2px" : "2px",
          transform: checked ? "translateX(0)" : "none",
        }}
      >
        <span
          className="absolute top-[2px] left-[2px] h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
        />
      </div>
    </label>
  )
}
