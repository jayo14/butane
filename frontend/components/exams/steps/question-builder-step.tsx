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
import { Plus, AlertCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
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

    const hasErrors = questions.some(
      (q) => !q.text.trim() || !q.correctAnswerId || q.options.some((o) => !o.text.trim()),
    )

    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-content-primary">Questions</h2>
            <p className="mt-0.5 text-sm text-content-secondary">
              Add and arrange your exam questions
            </p>
          </div>
          {questions.length > 0 && (
            <Button onClick={addQuestion} variant="primary" leftIcon={<Plus size={18} />}>
              Add Question
            </Button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex size-16 items-center justify-center rounded-2xl bg-surface-secondary text-content-muted">
              <HelpCircle size={32} />
            </div>
            <h3 className="text-base font-semibold text-content-primary">No questions yet</h3>
            <p className="mt-1 max-w-xs text-sm text-content-secondary">
              Click below to start building your exam. Each question has four answer options.
            </p>
            <Button onClick={addQuestion} variant="primary" leftIcon={<Plus size={18} />} className="mt-6">
              Add Your First Question
            </Button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-4">
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

        {questions.length > 0 && (
          <div className="mt-4 flex items-center justify-between text-xs text-content-muted">
            <span>{questions.length} question{questions.length !== 1 ? "s" : ""}</span>
            {hasErrors && (
              <span className="flex items-center gap-1 text-warning">
                <AlertCircle size={12} />
                Some questions are incomplete
              </span>
            )}
          </div>
        )}

        {questions.length > 0 && (
          <div className="mt-4 flex justify-center">
            <Button onClick={addQuestion} variant="outline" leftIcon={<Plus size={18} />} size="sm">
              Add Another Question
            </Button>
          </div>
        )}
      </div>
    )
  },
)
