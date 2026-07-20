"use client"

import { useState, useCallback, forwardRef, useImperativeHandle, useRef } from "react"
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
import { Plus, AlertCircle, FilePlus, Upload, Check, X, Loader2, Trash2, Copy, BarChart3 } from "lucide-react"
import { QuestionCard } from "./question-card"
import { parseBulkInput } from "./bulk-import-parser"
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
    points: 1,
    difficulty: "medium",
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
    const [showBulkImport, setShowBulkImport] = useState(false)
    const [bulkInput, setBulkInput] = useState("")
    const [bulkParsedText, setBulkParsedText] = useState("")
    const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null)
    const [bulkLoading, setBulkLoading] = useState(false)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [selectAll, setSelectAll] = useState(false)
    const bulkTextareaRef = useRef<HTMLTextAreaElement>(null)
    const importedStartRef = useRef<number | null>(null)
    const listRef = useRef<HTMLDivElement>(null)

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

    function duplicateSelected() {
      const selected = questions.filter((q) => selectedIds.has(q.id))
      const dupes = selected.map((s) => ({
        ...s,
        id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        number: questions.length + 1,
      }))
      onChange([...questions, ...dupes])
    }

    function deleteQuestion(questionId: string) {
      onChange(questions.filter((q) => q.id !== questionId).map((q, i) => ({ ...q, number: i + 1 })))
      setErrors((prev) => {
        const next = { ...prev }
        delete next[questionId]
        return next
      })
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(questionId); return next })
    }

    function deleteSelected() {
      const remaining = questions.filter((q) => !selectedIds.has(q.id)).map((q, i) => ({ ...q, number: i + 1 }))
      onChange(remaining)
      setSelectedIds(new Set())
    }

    function moveUp(questionId: string) {
      const idx = questions.findIndex((q) => q.id === questionId)
      if (idx <= 0) return
      const reordered = [...questions];
      [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]]
      onChange(reordered.map((q, i) => ({ ...q, number: i + 1 })))
    }

    function moveDown(questionId: string) {
      const idx = questions.findIndex((q) => q.id === questionId)
      if (idx === -1 || idx >= questions.length - 1) return
      const reordered = [...questions];
      [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]]
      onChange(reordered.map((q, i) => ({ ...q, number: i + 1 })))
    }

    function toggleSelect(questionId: string) {
      setSelectedIds((prev) => {
        const next = new Set(prev)
        if (next.has(questionId)) next.delete(questionId)
        else next.add(questionId)
        return next
      })
    }

    function toggleSelectAll() {
      if (selectAll) {
        setSelectedIds(new Set())
        setSelectAll(false)
      } else {
        setSelectedIds(new Set(questions.map((q) => q.id)))
        setSelectAll(true)
      }
    }

    function handleBulkParse() {
      const trimmed = bulkInput.trim()
      if (!trimmed) return

      if (trimmed === bulkParsedText) {
        setBulkSuccessMsg("These questions were already imported.")
        return
      }

      setBulkLoading(true)
      // Simulate brief loading for UX
      setTimeout(() => {
        const parsed = parseBulkInput(trimmed)
        setBulkLoading(false)

        if (parsed.length === 0) {
          setBulkSuccessMsg("Could not parse any questions. Check the format and try again.")
          return
        }

        const needsReviewCount = parsed.filter((p) => p.needsReview).length
        const startIndex = questions.length

        const newQuestions: Question[] = parsed.map((p, i) => {
          const newOptions = p.options.map((o) => ({
            id: `opt-${Math.random().toString(36).slice(2, 7)}`,
            label: o.label,
            text: o.text,
          }))
          const correctId =
            newOptions.find((o) => o.label === p.correctAnswerLabel)?.id ?? ""
          return {
            id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            number: startIndex + i + 1,
            text: p.text,
            options: newOptions,
            correctAnswerId: correctId,
            points: 1,
            needsReview: p.needsReview,
            reviewReason: p.reviewReason,
            difficulty: "medium" as const,
          }
        })

        onChange([...questions, ...newQuestions])
        setBulkParsedText(trimmed)

        if (needsReviewCount > 0) {
          setBulkSuccessMsg(
            `Imported ${parsed.length} questions (${parsed.length - needsReviewCount} parsed successfully, ${needsReviewCount} need review).`
          )
        } else {
          setBulkSuccessMsg(
            `Imported ${parsed.length} question${parsed.length !== 1 ? "s" : ""} — all parsed successfully.`
          )
        }

        importedStartRef.current = startIndex

        setTimeout(() => {
          if (listRef.current) {
            const cards = listRef.current.querySelectorAll("[data-question-card]")
            // Scroll to first need-review card, or first imported card
            const firstNeedsReview = Array.from(cards).findIndex(
              (c) => c.querySelector("[data-needs-review]")
            )
            const target = firstNeedsReview >= 0 ? firstNeedsReview : startIndex
            if (cards[target]) {
              cards[target].scrollIntoView({ behavior: "smooth", block: "center" })
            }
          }
        }, 100)
      }, 400)
    }

    function handleBulkCancel() {
      setShowBulkImport(false)
      setBulkInput("")
      setBulkSuccessMsg(null)
      setBulkParsedText("")
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
      <div className="flex flex-col gap-6">
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
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                setShowBulkImport(!showBulkImport)
                setBulkSuccessMsg(null)
                if (!showBulkImport) {
                  setTimeout(() => bulkTextareaRef.current?.focus(), 100)
                }
              }}
              className="flex items-center gap-2 rounded-full border-2 px-5 py-3 text-sm font-semibold tracking-[0.02em] transition-all active:scale-95"
              style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
            >
              <Upload size={18} />
              Bulk Import
            </button>
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
        </div>

        {/* Bulk Import */}
        {showBulkImport ? (
          <div
            className="rounded-2xl border p-6"
            style={{ borderColor: "#bbcabf", backgroundColor: "#eff3ff" }}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3
                  className="text-lg font-semibold"
                  style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
                >
                  Bulk Import Questions
                </h3>
                <p className="mt-0.5 text-sm" style={{ color: "#3c4a42" }}>
                  Paste exam questions in any common format. Supports [a] (A) A. A) option styles.
                </p>
              </div>
              <button
                type="button"
                onClick={handleBulkCancel}
                className="flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-white/60"
                style={{ color: "#6c7a71" }}
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              ref={bulkTextareaRef}
              value={bulkInput}
              onChange={(e) => {
                setBulkInput(e.target.value)
                if (e.target.value !== bulkParsedText) {
                  setBulkSuccessMsg(null)
                }
              }}
              rows={10}
              placeholder={`Paste your questions here...\n\nExample:\nWhich of the following substances is responsible for hardness in water?\n[a] Sodium chloride\n[b] Calcium hydrogen trioxocarbonate(IV)\n[c] Potassium nitrate\n[d] Ammonium sulphate\nAnswer: B`}
              className="mb-4 w-full resize-none rounded-xl border p-4 text-sm leading-relaxed outline-none transition-colors focus:border-[#006c49]/50"
              style={{
                borderColor: "#bbcabf",
                backgroundColor: "#ffffff",
                color: "#121c2a",
              }}
            />

            <div className="flex items-center justify-between">
              <div className="flex-1">
                {bulkSuccessMsg ? (
                  <div
                    className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
                      bulkSuccessMsg.includes("need review")
                        ? "border-amber-200 bg-amber-50"
                        : bulkSuccessMsg.includes("already") || bulkSuccessMsg.includes("Could not")
                          ? "border-red-200 bg-red-50"
                          : "border-green-200 bg-green-50"
                    }`}
                  >
                    {bulkSuccessMsg.includes("need review") ? (
                      <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "#D97706" }} />
                    ) : bulkSuccessMsg.includes("already") || bulkSuccessMsg.includes("Could not") ? (
                      <AlertCircle size={16} className="shrink-0 mt-0.5" style={{ color: "#ba1a1a" }} />
                    ) : (
                      <Check size={16} className="shrink-0 mt-0.5" style={{ color: "#006c49" }} />
                    )}
                    <span style={{ color: "#3c4a42" }}>{bulkSuccessMsg}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleBulkCancel}
                  className="rounded-xl border px-6 py-3 text-sm font-semibold transition-all active:scale-95"
                  style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkParse}
                  disabled={!bulkInput.trim() || bulkLoading}
                  className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition-all hover:brightness-105 active:scale-95 disabled:opacity-40"
                  style={{ backgroundColor: "#10b981", color: "#00422b" }}
                >
                  {bulkLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Upload size={18} />
                  )}
                  {bulkLoading ? "Parsing..." : "Parse Questions"}
                </button>
              </div>
            </div>

            <div
              className="mt-4 rounded-xl border p-4 text-xs leading-relaxed"
              style={{ borderColor: "rgba(187, 202, 191, 0.5)", backgroundColor: "rgba(239, 243, 255, 0.5)", color: "#6c7a71" }}
            >
              <p className="mb-1 font-semibold uppercase tracking-wider">Supported formats:</p>
              <p>
                Question numbering optional (1., 1), Q1., Question 1). Options in any of these
                formats: <code>[a]</code> <code>(A)</code> <code>A.</code> <code>A)</code>. Answer
                line: <code>Answer: B</code> <code>Correct Answer: C</code> <code>ANS: D</code>{" "}
                <code>Correct: Option A</code>. Unicode characters (&rarr; &deg;C &sup3;) are preserved.
              </p>
            </div>
          </div>
        ) : null}

        {/* Bulk toolbar */}
        {selectedIds.size > 0 && (
          <div
            className="flex items-center gap-3 rounded-lg border px-4 py-2.5"
            style={{ borderColor: "#006c49", backgroundColor: "rgba(0,108,73,0.05)" }}
          >
            <span className="text-xs font-semibold" style={{ color: "#006c49" }}>
              {selectedIds.size} selected
            </span>
            <div className="h-4 w-px" style={{ backgroundColor: "#bbcabf" }} />
            <button
              type="button"
              onClick={deleteSelected}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-red-50"
              style={{ color: "#ba1a1a" }}
            >
              <Trash2 size={12} /> Delete Selected
            </button>
            <button
              type="button"
              onClick={duplicateSelected}
              className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-gray-100"
              style={{ color: "#3c4a42" }}
            >
              <Copy size={12} /> Duplicate Selected
            </button>
            <div className="flex-1" />
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[10px] font-semibold uppercase tracking-wider underline"
              style={{ color: "#6c7a71" }}
            >
              Clear Selection
            </button>
          </div>
        )}

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
          <div ref={listRef}>
            {/* Select all toggle */}
            <div className="mb-3 flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium" style={{ color: "#6c7a71" }}>
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={toggleSelectAll}
                  className="size-3.5 rounded"
                  style={{ accentColor: "#006c49" }}
                />
                Select all {questions.length} questions
              </label>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={questions.map((q) => q.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {questions.map((q, i) => (
                    <QuestionCard
                      key={q.id}
                      question={q}
                      index={i}
                      total={questions.length}
                      selected={selectedIds.has(q.id)}
                      errors={errors[q.id] ?? {}}
                      onChange={(updated) => updateQuestion(q.id, updated)}
                      onDuplicate={duplicateQuestion}
                      onDelete={deleteQuestion}
                      onMoveUp={moveUp}
                      onMoveDown={moveDown}
                      onToggleSelect={toggleSelect}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
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
