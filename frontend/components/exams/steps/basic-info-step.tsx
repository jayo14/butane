"use client"

import { useFormContext } from "react-hook-form"
import { cn } from "@/lib/utils"
import { AlertCircle, Clock, FileText, HelpCircle, BookOpen, Users, Hash } from "lucide-react"
import type { BasicInfoValues } from "../create-exam-wizard"

interface BasicInfoStepProps {
  subjects: { label: string; value: string }[]
  classes: { label: string; value: string }[]
  terms: { label: string; value: string }[]
}

export function BasicInfoStep({ subjects, classes, terms }: BasicInfoStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<BasicInfoValues>()

  function inputClass(error?: string) {
    return cn(
      "block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary",
      "transition-all duration-200",
      "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
      error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
    )
  }

  function selectClass(error?: string) {
    return cn(
      "block w-full appearance-none rounded-xl border bg-white px-4 py-2.5 pr-10 text-sm text-content-primary",
      "transition-all duration-200",
      "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
      error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
    )
  }

  function textareaClass(error?: string) {
    return cn(
      "block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary",
      "transition-all duration-200 resize-y min-h-[100px]",
      "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
      error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-border-primary",
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-content-primary">Basic Information</h2>
        <p className="mt-0.5 text-sm text-content-secondary">
          Enter the core details for this exam
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {/* Exam Title */}
        <div className="sm:col-span-2">
          <label htmlFor="title" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-primary">
            <FileText size={16} className="text-content-muted" />
            Exam Title
          </label>
          <input
            {...register("title")}
            id="title"
            placeholder="e.g. Algebra I - Midterm Examination"
            className={inputClass(errors.title?.message)}
            aria-invalid={!!errors.title}
          />
          {errors.title && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.title.message}
            </p>
          )}
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="subject" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-primary">
            <BookOpen size={16} className="text-content-muted" />
            Subject
          </label>
          <div className="relative">
            <select
              {...register("subject")}
              id="subject"
              className={selectClass(errors.subject?.message)}
              aria-invalid={!!errors.subject}
              defaultValue=""
            >
              <option value="" disabled>Select subject</option>
              {subjects.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          {errors.subject && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.subject.message}
            </p>
          )}
        </div>

        {/* Class */}
        <div>
          <label htmlFor="class" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-primary">
            <Users size={16} className="text-content-muted" />
            Class
          </label>
          <div className="relative">
            <select
              {...register("class")}
              id="class"
              className={selectClass(errors.class?.message)}
              aria-invalid={!!errors.class}
              defaultValue=""
            >
              <option value="" disabled>Select class</option>
              {classes.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          {errors.class && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.class.message}
            </p>
          )}
        </div>

        {/* Term */}
        <div>
          <label htmlFor="term" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-primary">
            <BookOpen size={16} className="text-content-muted" />
            Term
          </label>
          <div className="relative">
            <select
              {...register("term")}
              id="term"
              className={selectClass(errors.term?.message)}
              aria-invalid={!!errors.term}
              defaultValue=""
            >
              <option value="" disabled>Select term</option>
              {terms.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
          </div>
          {errors.term && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.term.message}
            </p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label htmlFor="duration" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-primary">
            <Clock size={16} className="text-content-muted" />
            Duration (minutes)
          </label>
          <input
            {...register("duration")}
            id="duration"
            type="number"
            min={1}
            max={480}
            className={inputClass(errors.duration?.message)}
            aria-invalid={!!errors.duration}
          />
          {errors.duration ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.duration.message}
            </p>
          ) : (
            <p className="mt-1 text-xs text-content-muted">Max 480 minutes (8 hours)</p>
          )}
        </div>

        {/* Question Count */}
        <div>
          <label htmlFor="questionCount" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-primary">
            <Hash size={16} className="text-content-muted" />
            Number of Questions
          </label>
          <input
            {...register("questionCount")}
            id="questionCount"
            type="number"
            min={1}
            max={200}
            className={inputClass(errors.questionCount?.message)}
            aria-invalid={!!errors.questionCount}
          />
          {errors.questionCount ? (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
              <AlertCircle size={12} />
              {errors.questionCount.message}
            </p>
          ) : (
            <p className="mt-1 text-xs text-content-muted">Maximum 200 questions</p>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div>
        <label htmlFor="instructions" className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-primary">
          <HelpCircle size={16} className="text-content-muted" />
          Instructions for Students
        </label>
        <textarea
          {...register("instructions")}
          id="instructions"
          rows={4}
          placeholder="e.g. Read each question carefully. You have 60 minutes to complete this exam. Each question carries equal marks."
          className={textareaClass(errors.instructions?.message)}
          aria-invalid={!!errors.instructions}
        />
        {errors.instructions && (
          <p className="mt-1.5 flex items-center gap-1 text-xs text-danger" role="alert">
            <AlertCircle size={12} />
            {errors.instructions.message}
          </p>
        )}
      </div>
    </div>
  )
}
