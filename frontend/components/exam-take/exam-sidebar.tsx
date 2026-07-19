"use client"

import { X, Clock, Flag, CheckCircle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface ExamSidebarProps {
  questions: { id: string; number: number }[]
  answers: Record<string, string>
  flagged: Set<string>
  currentIndex: number
  timeLeft: number
  onGoTo: (index: number) => void
  onSubmit: () => void
  isOpen: boolean
  onClose: () => void
}

export function ExamSidebar({
  questions,
  answers,
  flagged,
  currentIndex,
  timeLeft,
  onGoTo,
  onSubmit,
  isOpen,
  onClose,
}: ExamSidebarProps) {
  const answeredCount = questions.filter((q) => answers[q.id]).length
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const timeLow = timeLeft < 300

  const content = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-primary px-5 py-4">
        <h2 className="text-sm font-semibold text-content-primary">Question Navigator</h2>
        <button
          type="button"
          onClick={onClose}
          className="flex size-8 items-center justify-center rounded-lg text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
          aria-label="Close navigator"
        >
          <X size={18} />
        </button>
      </div>

      {/* Stats */}
      <div className="border-b border-border-primary px-5 py-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-surface-secondary p-2">
            <p className="text-lg font-bold text-content-primary">{questions.length}</p>
            <p className="text-[10px] text-content-muted">Total</p>
          </div>
          <div className="rounded-lg bg-primary/5 p-2">
            <p className="text-lg font-bold text-primary">{answeredCount}</p>
            <p className="text-[10px] text-content-muted">Answered</p>
          </div>
          <div className="rounded-lg bg-warning/5 p-2">
            <p className="text-lg font-bold text-warning">{questions.length - answeredCount}</p>
            <p className="text-[10px] text-content-muted">Remaining</p>
          </div>
        </div>

        <div className={cn(
          "mt-3 flex items-center justify-center gap-2 rounded-lg p-2 text-sm font-medium",
          timeLow ? "bg-danger-light text-danger" : "bg-surface-secondary text-content-primary",
        )}>
          <Clock size={16} className={cn(timeLow && "animate-pulse")} />
          <span>{String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Question Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-5 gap-2">
          {questions.map((q, i) => {
            const isAnswered = !!answers[q.id]
            const isFlagged = flagged.has(q.id)
            const isCurrent = i === currentIndex
            return (
              <button
                key={q.id}
                onClick={() => onGoTo(i)}
                onKeyDown={(e) => { if (e.key === "Enter") onGoTo(i) }}
                className={cn(
                  "relative flex h-10 items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                  isCurrent && "ring-2 ring-primary ring-offset-1",
                  isAnswered && !isCurrent && "bg-primary/15 text-primary",
                  !isAnswered && !isCurrent && "bg-surface-secondary text-content-muted hover:bg-primary/10 hover:text-primary",
                )}
                aria-label={`Go to question ${i + 1}${isAnswered ? " (answered)" : ""}${isFlagged ? " (flagged)" : ""}`}
              >
                {i + 1}
                {isAnswered && (
                  <span className="absolute -right-0.5 -top-0.5">
                    <CheckCircle size={10} className="text-primary" />
                  </span>
                )}
                {isFlagged && !isAnswered && (
                  <span className="absolute -right-0.5 -top-0.5">
                    <Flag size={10} className="text-warning" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 space-y-1.5 text-xs text-content-muted">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded bg-primary/15" />
            Answered
          </div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded bg-surface-secondary" />
            Unanswered
          </div>
          <div className="flex items-center gap-2">
            <Flag size={12} className="text-warning" />
            Flagged
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="border-t border-border-primary p-4">
        <Button
          variant="primary"
          className="w-full"
          onClick={onSubmit}
        >
          Submit Exam
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar - mobile drawer */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 border-r border-border-primary bg-white transform transition-all duration-300 md:relative md:translate-x-0 md:w-72 md:z-auto",
          isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full md:translate-x-0",
        )}
      >
        {content}
      </aside>
    </>
  )
}
