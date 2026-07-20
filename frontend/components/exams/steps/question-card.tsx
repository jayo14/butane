"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Copy, Trash2, AlertCircle, GripVertical } from "lucide-react"
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
      style={{
        ...sortableStyle,
        borderColor: errors.text ? "#ba1a1a" : undefined,
      }}
      className={`group relative overflow-hidden rounded-[1.5rem] border bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
        isDragging ? "z-10 opacity-90 shadow-xl" : ""
      }`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "url('https://www.transparenttextures.com/patterns/linen.png')",
        }}
      />

      <div className="relative z-10 flex items-start gap-4">
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            className="flex size-8 cursor-grab items-center justify-center rounded-lg transition-colors hover:bg-[#e6eeff] active:cursor-grabbing"
            style={{ color: "#6c7a71" }}
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder"
          >
            <GripVertical size={18} />
          </button>
          <span
            className="flex size-7 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: "#006c49", color: "white" }}
          >
            {index + 1}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-3">
            <span
              className="rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider"
              style={{
                backgroundColor: "#e6eeff",
                borderColor: "#bbcabf",
                color: "#006c49",
              }}
            >
              Multiple Choice
            </span>
            <span className="text-xs font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
              Q{index + 1} &middot; 1 Point
            </span>
          </div>

          <textarea
            value={question.text}
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            rows={2}
            placeholder="Type your question here..."
            className="mb-4 w-full resize-none bg-transparent text-xl font-semibold leading-tight outline-none placeholder:opacity-40"
            style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
          />
          {errors.text && (
            <p className="mb-3 flex items-center gap-1 text-xs" style={{ color: "#ba1a1a" }}>
              <AlertCircle size={12} />
              {errors.text}
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {question.options.map((option, oi) => {
              const isCorrect = question.correctAnswerId === option.id
              return (
                <label
                  key={option.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
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
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
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
                    <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider" style={{ color: "#006c49" }}>
                      Correct
                    </span>
                  )}
                </label>
              )
            })}
          </div>

          {!question.correctAnswerId && (
            <p className="mt-3 flex items-center gap-1 text-xs font-semibold" style={{ color: "#ba1a1a" }}>
              <AlertCircle size={12} />
              Select the correct answer
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(question.id)}
            className="flex size-9 items-center justify-center rounded-lg transition-colors hover:bg-[#e6eeff]"
            style={{ color: "#3c4a42" }}
            aria-label="Duplicate question"
          >
            <Copy size={18} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(question.id)}
            className="flex size-9 items-center justify-center rounded-lg transition-colors"
            style={{ color: "#3c4a42" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(186,26,26,0.1)"; e.currentTarget.style.color = "#ba1a1a" }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#3c4a42" }}
            aria-label="Delete question"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
