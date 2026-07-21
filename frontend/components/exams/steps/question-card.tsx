"use client"

import { useState, useRef, useEffect } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, ChevronDown, ChevronRight, Plus, Trash2, Copy, ArrowUp, ArrowDown, MoreHorizontal } from "lucide-react"
import type { Question } from "@/types/exam"
import { LatexRenderer } from "@/components/ui/latex-renderer"
import { ImageUploader } from "@/components/ui/image-uploader"

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"]

interface QuestionCardProps {
  question: Question
  index: number
  total: number
  selected?: boolean
  errors: Partial<Record<string, string>>
  onChange: (question: Question) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onMoveUp?: (id: string) => void
  onMoveDown?: (id: string) => void
  onToggleSelect?: (id: string) => void
}

export function QuestionCard({
  question,
  index,
  total,
  selected,
  errors,
  onChange,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  onToggleSelect,
}: QuestionCardProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

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

  function addOption() {
    const nextLabel = OPTION_LABELS[question.options.length] || String.fromCharCode(65 + question.options.length)
    onChange({
      ...question,
      options: [
        ...question.options,
        { id: `opt-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, label: nextLabel, text: "" },
      ],
    })
  }

  function removeOption(optionId: string) {
    if (question.options.length <= 2) return
    const filtered = question.options.filter((o) => o.id !== optionId)
    const relabeled = filtered.map((o, i) => ({ ...o, label: OPTION_LABELS[i] || String.fromCharCode(65 + i) }))
    onChange({
      ...question,
      options: relabeled,
      correctAnswerId: question.correctAnswerId === optionId ? "" : question.correctAnswerId,
    })
  }

  const correctLabel = question.options.find((o) => o.id === question.correctAnswerId)?.label || ""

  if (collapsed) {
    return (
      <div
        ref={setNodeRef}
        style={{ ...sortableStyle, borderColor: selected ? "#006c49" : "#bbcabf" }}
        className={`group flex items-center gap-2 rounded-lg border bg-white px-4 py-2.5 text-sm transition-all hover:shadow-sm ${isDragging ? "opacity-50" : ""} ${selected ? "ring-2 ring-[#006c49]" : ""}`}
      >
        <div className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect?.(question.id)}
            className="size-3.5 rounded border-gray-300"
            style={{ accentColor: "#006c49" }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="flex cursor-grab items-center justify-center text-gray-400 hover:text-gray-600 active:cursor-grabbing"
          >
            <GripVertical size={14} />
          </button>
          <button type="button" onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-gray-600">
            <ChevronRight size={14} />
          </button>
        </div>
        <span className="flex size-5 items-center justify-center rounded bg-gray-100 text-[10px] font-bold shrink-0" style={{ backgroundColor: "#e6eeff", color: "#006c49" }}>
          {index + 1}
        </span>
        <span className="rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0" style={{ borderColor: "#bbcabf", color: "#6c7a71" }}>
          MC
        </span>
        <span className="flex-1 truncate font-medium" style={{ color: "#121c2a" }}>
          <LatexRenderer text={question.text || "Untitled question"} />
        </span>
        {question.image && (
          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#006c49" }}>
            📷
          </span>
        )}
        {correctLabel && (
          <span className="shrink-0 text-[10px] font-bold uppercase" style={{ color: "#006c49" }}>
            {correctLabel}
          </span>
        )}
        <span className="shrink-0 text-[10px] font-medium" style={{ color: "#6c7a71" }}>
          {question.points || 1}pt
        </span>
        <button type="button" onClick={() => setCollapsed(false)} className="text-gray-400 hover:text-gray-600">
          <ChevronDown size={14} />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={{ ...sortableStyle, borderColor: errors.text ? "#ba1a1a" : selected ? "#006c49" : "#bbcabf" }}
      className={`group relative rounded-lg border bg-white transition-all ${
        isDragging ? "opacity-50 shadow-lg" : "hover:shadow-sm"
      } ${selected ? "ring-2 ring-[#006c49]" : ""}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 border-b px-3 py-2" style={{ borderColor: "#e6eeff", backgroundColor: "#f9f9ff" }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(question.id)}
          className="size-3.5 rounded border-gray-300"
          style={{ accentColor: "#006c49" }}
        />
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="flex cursor-grab items-center justify-center text-gray-400 hover:text-gray-600 active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>
        <button type="button" onClick={() => setCollapsed(true)} className="text-gray-400 hover:text-gray-600">
          <ChevronDown size={14} />
        </button>
        <span className="flex size-5 items-center justify-center rounded text-[10px] font-bold" style={{ backgroundColor: "#e6eeff", color: "#006c49" }}>
          {index + 1}
        </span>
        <span className="rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider" style={{ borderColor: "#bbcabf", color: "#6c7a71" }}>
          Multiple Choice
        </span>
        <div className="flex-1" />

        {/* Points dropdown */}
        <select
          value={question.points || 1}
          onChange={(e) => onChange({ ...question, points: parseInt(e.target.value) })}
          className="rounded border bg-white px-1.5 py-0.5 text-[10px] font-medium outline-none"
          style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
        >
          {[1, 2, 3, 4, 5, 10, 20].map((p) => (
            <option key={p} value={p}>{p} {p === 1 ? "Point" : "Points"}</option>
          ))}
        </select>

        {/* Three-dot menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex size-6 items-center justify-center rounded hover:bg-gray-200 text-gray-500"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-full z-[9999] mt-1 w-44 rounded-lg border bg-white py-1 shadow-lg"
              style={{ borderColor: "#bbcabf" }}
            >
              <button type="button" onClick={() => { onDuplicate(question.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100" style={{ color: "#3c4a42" }}>
                <Copy size={12} /> Duplicate
              </button>
              <button type="button" onClick={() => { onDelete(question.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100" style={{ color: "#ba1a1a" }}>
                <Trash2 size={12} /> Delete
              </button>
              <div className="my-1 border-t" style={{ borderColor: "#e6eeff" }} />
              {onMoveUp && (
                <button type="button" onClick={() => { onMoveUp(question.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100" style={{ color: "#3c4a42" }}>
                  <ArrowUp size={12} /> Move Up
                </button>
              )}
              {onMoveDown && (
                <button type="button" onClick={() => { onMoveDown(question.id); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100" style={{ color: "#3c4a42" }}>
                  <ArrowDown size={12} /> Move Down
                </button>
              )}
              <div className="my-1 border-t" style={{ borderColor: "#e6eeff" }} />
              <button type="button" onClick={() => { setCollapsed(true); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100" style={{ color: "#3c4a42" }}>
                <ChevronRight size={12} /> Collapse
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        {/* Question textarea */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>Question</label>
          <textarea
            value={question.text}
            onChange={(e) => onChange({ ...question, text: e.target.value })}
            rows={2}
            placeholder="Type your question here..."
            className="w-full resize-none rounded-lg border bg-white px-3 py-2 text-sm outline-none transition-all focus:border-[#006c49]/50 focus:shadow-[0_0_0_2px_rgba(0,108,73,0.1)]"
            style={{ borderColor: errors.text ? "#ba1a1a" : "#bbcabf", color: "#121c2a" }}
          />
          {errors.text && <p className="mt-1 text-[10px] font-medium" style={{ color: "#ba1a1a" }}>{errors.text}</p>}
        </div>

        {/* Image */}
        <div>
          <label className="mb-1 block text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>Image (optional)</label>
          <ImageUploader
            imageUrl={question.image}
            onUpload={(url) => onChange({ ...question, image: url })}
            onRemove={() => onChange({ ...question, image: undefined })}
          />
        </div>

        {/* Options */}
        <div>
          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>Options</label>
          <div className="space-y-1.5">
            {question.options.map((option, oi) => {
              const isCorrect = question.correctAnswerId === option.id
              return (
                <div key={option.id} className="flex items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={isCorrect}
                      onChange={() => setCorrect(option.id)}
                      className="size-3.5"
                      style={{ accentColor: "#006c49" }}
                    />
                    <span className="flex size-5 shrink-0 items-center justify-center rounded text-[9px] font-bold" style={{ backgroundColor: isCorrect ? "#006c49" : "#e6eeff", color: isCorrect ? "#fff" : "#006c49" }}>
                      {option.label}
                    </span>
                  </label>
                  <div className="min-w-0 flex-1">
                    <input
                      value={option.text}
                      onChange={(e) => updateOption(option.id, e.target.value)}
                      placeholder={`Option ${option.label}...`}
                      className="w-full rounded border bg-white px-2 py-1.5 text-xs outline-none transition-all focus:border-[#006c49]/50"
                      style={{ borderColor: "#bbcabf", color: "#121c2a" }}
                    />
                    {option.text && (
                      <div className="mt-0.5 rounded bg-gray-50 px-2 py-1 text-xs leading-relaxed" style={{ color: "#6c7a71" }}>
                        <LatexRenderer text={option.text} />
                      </div>
                    )}
                  </div>
                  {isCorrect && (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider" style={{ color: "#006c49" }}>Correct</span>
                  )}
                  {question.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      className="shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={addOption}
            className="mt-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider transition-colors hover:brightness-105"
            style={{ color: "#006c49" }}
          >
            <Plus size={12} />
            Add Option
          </button>
        </div>

        {/* Footer: Difficulty & Tags */}
        {!collapsed && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t" style={{ borderColor: "#e6eeff" }}>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>Points</span>
              <select
                value={question.points || 1}
                onChange={(e) => onChange({ ...question, points: parseInt(e.target.value) })}
                className="rounded border bg-white px-1.5 py-1 text-[10px] font-medium outline-none"
                style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
              >
                {[1, 2, 3, 4, 5, 10, 20].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>Difficulty</span>
              <select
                value={question.difficulty || "medium"}
                onChange={(e) => onChange({ ...question, difficulty: e.target.value as "easy" | "medium" | "hard" })}
                className="rounded border bg-white px-1.5 py-1 text-[10px] font-medium outline-none"
                style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: "#6c7a71" }}>Tags</span>
              <input
                value={question.tags?.join(", ") || ""}
                onChange={(e) => onChange({ ...question, tags: e.target.value ? e.target.value.split(",").map((t) => t.trim()) : [] })}
                placeholder="e.g. Chemistry, Organic"
                className="min-w-[120px] flex-1 rounded border bg-white px-2 py-1 text-[10px] outline-none"
                style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
              />
            </div>
          </div>
        )}

        {!collapsed && !question.correctAnswerId && (
          <p className="text-[10px] font-semibold" style={{ color: "#ba1a1a" }}>
            Select the correct answer
          </p>
        )}
      </div>
    </div>
  )
}
