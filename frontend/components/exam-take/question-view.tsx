"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"
import { LatexRenderer } from "@/components/ui/latex-renderer"

interface QuestionViewProps {
  question: {
    id: string
    number: number
    text: string
    options: { id: string; label: string; text: string }[]
  }
  selectedAnswer: string | null
  onSelect: (optionId: string) => void
}

const OPTION_LABELS = ["A", "B", "C", "D"]

export function QuestionView({ question, selectedAnswer, onSelect }: QuestionViewProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-3 duration-300" role="group" aria-label={`Question ${question.number}`}>
      <div className="mb-8">
        <p className="text-lg font-semibold leading-relaxed text-content-primary md:text-xl" tabIndex={0}>
          <LatexRenderer text={question.text} />
        </p>
        {(question as any).image && (
          <div className="mt-3">
            <img
              src={(question as any).image}
              alt="Question illustration"
              className="max-h-48 w-auto rounded-lg border object-contain"
              style={{ borderColor: "#bbcabf" }}
            />
          </div>
        )}
      </div>

      <div className="space-y-3" role="radiogroup" aria-label="Answer options">
        {question.options.map((option, i) => {
          const isSelected = selectedAnswer === option.id
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(option.id)}
              className={cn(
                "group relative flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all duration-200 md:p-5",
                "hover:border-primary/40 hover:bg-primary/[0.02]",
                "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2",
                "active:scale-[0.99]",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border-primary bg-white",
              )}
            >
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-all duration-200 md:size-12 md:text-base",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-secondary text-content-muted group-hover:bg-primary/10 group-hover:text-primary",
                )}
              >
                {OPTION_LABELS[i]}
              </span>

                <span
                  className={cn(
                    "flex-1 text-sm font-medium leading-relaxed md:text-base",
                    isSelected ? "text-primary" : "text-content-primary",
                  )}
                >
                  <LatexRenderer text={option.text} />
                </span>

              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border-primary",
                )}
              >
                {isSelected && <Check size={14} />}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
