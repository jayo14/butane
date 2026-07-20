"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Copy, Trash2, AlertCircle, GripVertical, AlertTriangle } from "lucide-react"
import type { Question } from "@/types/exam"

const OPTION_LABELS = ["A", "B", "C", "D"]

interface QuestionCardProps {
  question: Question
  index: number
  errors: Partial<Record<string, string>>
  onChange: (question: Question) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
}

export function QuestionCard({ question, index, errors, onChange, onDuplicate, onDelete }: QuestionCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  })

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  function updateOption(optionId: string, text: string) {
    onChange({
      ...question,
      options: question.options.map((o) =>
        o.id === optionId ? { ...o, text } : o
      ),
    })
  }

  function setCorrect(id: string) {
    onChange({ ...question, correctAnswerId: id })
  }

  return (
    <div
      ref={setNodeRef}
      data-question-card
      style={{
        ...sortableStyle,
        borderColor: errors.text ? "#ba1a1a" : undefined,
      }}
      className={`group relative overflow-hidden rounded-2xl border bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isDragging ? "z-10 opacity-90 shadow-xl" : ""
      }`}
    >
      {question.needsReview && (
        <div
          className="flex items-center gap-2 border-b px-6 py-2.5 text-sm font-semibold"
          style={{ backgroundColor: "rgba(255, 218, 214, 0.3)", color: "#ba1a1a", borderColor: "rgba(186,26,26,0.1)" }}
        >
          <AlertTriangle size={16} />
          <span className="flex-1">{question.reviewReason || "Needs review — check formatting"}</span>
        </div>
      )}

      <div className="flex items-start gap-3 p-5">
        {/* Drag handle + number */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <button
            type="button"
            className="flex size-7 cursor-grab items-center justify-center rounded-lg transition-colors hover:bg-[#e6eeff] active:cursor-grabbing"
            style={{ color: "#6c7a71" }}
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
          <span
            className="flex size-6 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: "#006c49", color: "white" }}
          >
            {index + 1}
          </span>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-4">
          {/* Header row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: "#e6eeff",
                  borderColor: "#bbcabf",
                  color: "#006c49",
                }}
              >
                Multiple Choice
              </span>
              <div className="flex items-center gap-1 text-xs" style={{ color: "#3c4a42" }}>
                <span>Q{index + 1}</span>
                <span className="opacity-40">&middot;</span>
                <input
                  type="number"
                  value={question.points}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    if (!isNaN(v) && v > 0) onChange({ ...question, points: v })
                  }}
                  className="w-10 bg-transparent text-center outline-none font-semibold"
                  style={{ color: "#3c4a42" }}
                  min={1}
                  aria-label="Points"
                />
                <span>{question.points === 1 ? "Point" : "Points"}</span>
              </div>
            </div>
            <div className="flex gap-0.5">
              <button
                type="button"
                onClick={() => onDuplicate(question.id)}
                className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-[#e6eeff]"
                style={{ color: "#3c4a42" }}
                aria-label="Duplicate question"
              >
                <Copy size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(question.id)}
                className="flex size-8 items-center justify-center rounded-lg transition-colors"
                style={{ color: "#3c4a42" }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(186,26,26,0.1)"; e.currentTarget.style.color = "#ba1a1a" }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#3c4a42" }}
                aria-label="Delete question"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          {/* Question text */}
          <textarea
            value={question.text}
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            rows={2}
            placeholder="Type your question here..."
            className="w-full resize-none bg-transparent text-lg font-semibold leading-snug outline-none placeholder:opacity-40"
            style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
          />
          {errors.text && (
            <p className="flex items-center gap-1 text-xs" style={{ color: "#ba1a1a" }}>
              <AlertCircle size={12} />
              {errors.text}
            </p>
          )}

          {/* Options grid */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {question.options.map((option, oi) => {
              const isCorrect = question.correctAnswerId === option.id
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 transition-all ${
                    isCorrect
                      ? "border-[#006c49]/30 bg-[#006c49]/5"
                      : "border-[#bbcabf]/30 bg-[#eff3ff] hover:border-[#006c49]/20"
                  }`}
                >
                  <input
                    type="radio"
                    name={`correct-${question.id}`}
                    checked={isCorrect}
                    onChange={() => setCorrect(option.id)}
                    className="sr-only"
                    tabIndex={-1}
                    aria-label={`Mark option ${OPTION_LABELS[oi]} as correct answer`}
                  />
                  <span
                    className={`flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      isCorrect
                        ? "bg-[#006c49] text-white"
                        : "border-2 text-[#006c49]"
                    }`}
                    style={isCorrect ? {} : { borderColor: "#006c49" }}
                  >
                    {OPTION_LABELS[oi]}
                  </span>
                  <input
                    value={option.text}
                    onChange={(e) => updateOption(option.id, e.target.value)}
                    placeholder={`Option ${OPTION_LABELS[oi]}...`}
                    className="min-w-0 flex-1 bg-transparent text-sm font-medium outline-none placeholder:opacity-40"
                    style={{ color: "#121c2a" }}
                  />
                  {isCorrect && (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#006c49" }}>
                      Correct
                    </span>
                  )}
                </label>
              )
            })}
          </div>

          {!question.correctAnswerId && (
            <p className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#ba1a1a" }}>
              <AlertCircle size={12} />
              Select the correct answer
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
