"use client"

import { useState, useCallback, forwardRef, useImperativeHandle } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { Plus, AlertCircle, FilePlus } from "lucide-react"
import { QuestionCard } from "./question-card"
import type { Question } from "@/types/exam"

const OPTION_LABELS = ["A", "B", "C", "D"]

function createQuestion(number: number): Question {
  return {
    id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    number,
    text: "",
    options: OPTION_LABELS.map((label) => ({
      id: `opt-${Math.random().toString(36).slice(2, 7)}`,
      label,
      text: "",
    })),
    correctAnswerId: "",
  }
}

export interface QuestionBuilderHandle {
  validate: () => boolean
}

interface QuestionBuilderStepProps {
  questions: Question[]
  onChange: (questions: Question[]) => void
}

export const QuestionBuilderStep = forwardRef<QuestionBuilderHandle, QuestionBuilderStepProps>(
  function QuestionBuilderStep({ questions, onChange }, ref) {
    const [errors, setErrors] = useState<Record<string, Partial<Record<string, string>>>>({})

    const sensors = useSensors(
      useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
    )

    useImperativeHandle(ref, () => ({
      validate() {
        if (questions.length === 0) return false
        const newErrors: Record<string, Partial<Record<string, string>>> = {}
        for (const q of questions) {
          const errs: Partial<Record<string, string>> = {}
          if (!q.text.trim()) errs.text = "Question text is required"
          if (!q.correctAnswerId) errs.correctAnswer = "Select the correct answer"
          for (const o of q.options) {
            if (!o.text.trim()) errs[o.id] = "Option text is required"
          }
          if (Object.keys(errs).length > 0) newErrors[q.id] = errs
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
      },
    }))

    function addQuestion() {
      const updated = [...questions, createQuestion(questions.length + 1)]
      onChange(updated)
    }

    function updateQuestion(questionId: string, updated: Question) {
      onChange(questions.map((q) => (q.id === questionId ? { ...updated, number: q.number } : q)))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }

    function duplicateQuestion(questionId: string) {
      const source = questions.find((q) => q.id === questionId)
      if (!source) return
      const dupe: Question = {
        ...source,
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        number: questions.length + 1,
      }
      onChange([...questions, dupe])
    }

    function deleteQuestion(questionId: string) {
      onChange(questions.filter((q) => q.id !== questionId).map((q, i) => ({ ...q, number: i + 1 })))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
    }

    const handleDragEnd = useCallback(
      (event: DragEndEvent) => {
        const { active, over } = event
        if (!over || active.id === over.id) return
        const oldIndex = questions.findIndex((q) => q.id === active.id)
        const newIndex = questions.findIndex((q) => q.id === over.id)
        if (oldIndex === -1 || newIndex === -1) return
        const reordered = [...questions]
        const [removed] = reordered.splice(oldIndex, 1)
        reordered.splice(newIndex, 0, removed)
        onChange(reordered.map((q, i) => ({ ...q, number: i + 1 })))
      },
      [questions, onChange],
    )

    const hasErrors = questions.length === 0 || questions.some(
      (q) => !q.text.trim() || !q.correctAnswerId || q.options.some((o) => !o.text.trim()),
    )

    return (
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-[32px] font-bold leading-10 tracking-[-0.01em]"
              style={{ fontFamily: "'Source Serif 4', serif", color: "#121c2a" }}
            >
              Curate Your Questions
            </h1>
            <p className="mt-1 text-base leading-6" style={{ color: "#3c4a42" }}>
              Build your assessment by adding multiple-choice or open-ended questions.
            </p>
          </div>
          <button
            type="button"
            onClick={addQuestion}
            className="group relative overflow-hidden rounded-[1.5rem] p-px transition-all active:scale-95 hover:brightness-105"
            style={{ backgroundColor: "#10b981" }}
          >
            <div
              className="flex items-center gap-2 rounded-[1.5rem] px-6 py-3 text-sm font-semibold tracking-[0.02em]"
              style={{ backgroundColor: "#10b981", color: "#00422b" }}
            >
              <Plus size={20} />
              Add Question
              <div
                className="pointer-events-none absolute inset-2 rounded-xl border-2 border-dashed opacity-20"
                style={{ borderColor: "#005137" }}
              />
            </div>
          </button>
        </div>

        {/* Question List or Empty State */}
        {questions.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12"
            style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
          >
            <span className="mb-2 text-4xl opacity-60" style={{ color: "#6c7a71" }}>
              <FilePlus size={40} />
            </span>
            <p className="text-sm font-semibold tracking-[0.02em] opacity-60" style={{ color: "#3c4a42" }}>
              Ready for more? Drop your next question here.
            </p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-6">
                {questions.map((q, i) => (
                  <QuestionCard
                    key={q.id}
                    question={q}
                    index={i}
                    errors={errors[q.id] ?? {}}
                    onChange={(updated) => updateQuestion(q.id, updated)}
                    onDuplicate={duplicateQuestion}
                    onDelete={deleteQuestion}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Bottom area */}
        {questions.length > 0 && (
          <div className="flex flex-col gap-4">
            <div
              className="flex items-center justify-between rounded-xl border-2 border-dashed p-6 transition-colors hover:border-primary/30"
              style={{ borderColor: "#bbcabf" }}
            >
              <div className="flex items-center gap-2 text-sm" style={{ color: "#3c4a42" }}>
                <span className="opacity-60 text-lg">+</span>
                <span className="opacity-70 font-semibold tracking-[0.02em]">
                  Ready for more? Drop your next question here.
                </span>
              </div>
              <button
                type="button"
                onClick={addQuestion}
                className="rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:brightness-105 active:scale-95"
                style={{ backgroundColor: "#10b981", color: "#00422b" }}
              >
                Add Question
              </button>
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold tracking-[0.02em]" style={{ color: "#6c7a71" }}>
                {questions.length} question{questions.length !== 1 ? "s" : ""}
              </span>
              {hasErrors && (
                <span className="flex items-center gap-1 text-xs font-semibold" style={{ color: "#ba1a1a" }}>
                  <AlertCircle size={12} />
                  Some questions are incomplete
                </span>
              )}
            </div>
          </div>
        )}

        {/* Add first question button when empty */}
        {questions.length === 0 && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={addQuestion}
              className="group relative overflow-hidden rounded-[1.5rem] p-px transition-all active:scale-95 hover:brightness-105"
              style={{ backgroundColor: "#10b981" }}
            >
              <div
                className="flex items-center gap-2 rounded-[1.5rem] px-8 py-4 text-base font-semibold tracking-[0.02em]"
                style={{ backgroundColor: "#10b981", color: "#00422b" }}
              >
                <Plus size={22} />
                Add Your First Question
                <div
                  className="pointer-events-none absolute inset-2 rounded-xl border-2 border-dashed opacity-20"
                  style={{ borderColor: "#005137" }}
                />
              </div>
            </button>
          </div>
        )}
      </div>
    )
  },
)
