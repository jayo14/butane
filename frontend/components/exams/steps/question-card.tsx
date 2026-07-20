"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Copy, Trash2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Question, QuestionOption } from "@/types/exam"

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

  const style = {
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
      style={style}
      className={cn(
        "rounded-xl border bg-white p-5 transition-all duration-200",
        isDragging ? "border-primary/50 shadow-dropdown opacity-90 z-10" : "border-border-primary",
        errors.text && "border-danger/50",
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          className="flex size-8 cursor-grab items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {index + 1}
        </span>
        <span className="text-sm font-medium text-content-primary">Question {index + 1}</span>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(question.id)}
            className="flex size-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
            aria-label="Duplicate question"
          >
            <Copy size={16} />
          </button>
          <button
            type="button"
            onClick={() => onDelete(question.id)}
            className="flex size-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-danger-light hover:text-danger"
            aria-label="Delete question"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Question Text */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-content-muted">
          Question Text
        </label>
        <textarea
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          rows={2}
          placeholder="Type your question here..."
          className={cn(
            "block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary resize-none",
            "transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
            errors.text ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
          )}
        />
        {errors.text && (
          <p className="mt-1 flex items-center gap-1 text-xs text-danger">
            <AlertCircle size={12} />
            {errors.text}
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        <label className="text-xs font-medium text-content-muted">Answer Options</label>
        {question.options.map((option, oi) => {
          const isCorrect = question.correctAnswerId === option.id
          return (
            <div key={option.id} className="flex items-center gap-3">
              <label
                className={cn(
                  "flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border text-sm font-medium transition-all duration-200",
                  isCorrect
                    ? "border-success bg-success-light text-success"
                    : "border-border-primary bg-surface-secondary text-content-muted hover:border-content-muted/40",
                )}
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
                {OPTION_LABELS[oi]}
              </label>
              <input
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder={`Option ${OPTION_LABELS[oi]}...`}
                className={cn(
                  "block flex-1 rounded-xl border bg-white px-4 py-2 text-sm text-content-primary placeholder:text-content-secondary",
                  "transition-all duration-200 focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
                  option.text.trim() === "" ? "border-border-primary" : "border-border-primary",
                )}
              />
              {isCorrect && (
                <span className="shrink-0 text-[10px] font-medium text-success">Correct</span>
              )}
            </div>
          )
        })}
      </div>

      {/* Validation - no correct answer */}
      {!question.correctAnswerId && (
        <p className="mt-3 flex items-center gap-1 text-xs text-warning">
          <AlertCircle size={12} />
          Select the correct answer
        </p>
      )}
    </div>
  )
}
