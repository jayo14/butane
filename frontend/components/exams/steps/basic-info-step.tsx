"use client"

import { useFormContext } from "react-hook-form"
import { PenLine, ChevronDown } from "lucide-react"
import type { BasicInfoValues } from "../create-exam-wizard"

interface BasicInfoStepProps {
  subjects: { label: string; value: string }[]
  classes: { label: string; value: string }[]
  terms: { label: string; value: string }[]
}

export function BasicInfoStep({ subjects, classes }: BasicInfoStepProps) {
  const {
    register,
    formState: { errors },
  } = useFormContext<BasicInfoValues>()

  return (
    <div className="space-y-8">
      {/* Exam Title */}
      <div className="space-y-2">
        <label htmlFor="exam-title" className="ml-1 block text-sm font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
          Exam Title
        </label>
        <div className="relative group">
          <input
            {...register("title")}
            id="exam-title"
            placeholder="e.g. Midterm: Cellular Biology &amp; Genetics"
            className="form-well w-full rounded-xl border bg-white px-6 py-4 text-base text-[#121c2a] placeholder:text-[#6c7a71]/50 transition-all duration-200 focus:border-[#006c49] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
            style={{ borderColor: errors.title ? "#ba1a1a" : "#bbcabf" }}
          />
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#6c7a71]/30 transition-colors group-focus-within:text-[#006c49]">
            <PenLine size={20} />
          </div>
        </div>
        {errors.title && (
          <p className="ml-1 mt-1 text-xs" style={{ color: "#ba1a1a" }} role="alert">
            {errors.title.message}
          </p>
        )}
      </div>

      {/* Subject + Grade Level Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Subject */}
        <div className="space-y-2">
          <label htmlFor="subject" className="ml-1 block text-sm font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
            Subject
          </label>
          <div className="relative">
            <select
              {...register("subject")}
              id="subject"
              className="form-well w-full appearance-none rounded-xl border bg-white px-6 py-4 text-base text-[#121c2a] transition-all duration-200 focus:border-[#006c49] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              style={{ borderColor: errors.subject ? "#ba1a1a" : "#bbcabf" }}
            >
              <option value="">Select subject</option>
              {subjects.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#6c7a71]">
              <ChevronDown size={20} />
            </div>
          </div>
          {errors.subject && (
            <p className="ml-1 mt-1 text-xs" style={{ color: "#ba1a1a" }} role="alert">
              {errors.subject.message}
            </p>
          )}
        </div>

        {/* Grade Level (maps to "class") */}
        <div className="space-y-2">
          <label htmlFor="grade-level" className="ml-1 block text-sm font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
            Grade Level
          </label>
          <div className="relative">
            <select
              {...register("class")}
              id="grade-level"
              className="form-well w-full appearance-none rounded-xl border bg-white px-6 py-4 text-base text-[#121c2a] transition-all duration-200 focus:border-[#006c49] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              style={{ borderColor: errors.class ? "#ba1a1a" : "#bbcabf" }}
            >
              <option value="">Select grade level</option>
              {classes.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#6c7a71]">
              <ChevronDown size={20} />
            </div>
          </div>
          {errors.class && (
            <p className="ml-1 mt-1 text-xs" style={{ color: "#ba1a1a" }} role="alert">
              {errors.class.message}
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label htmlFor="description" className="ml-1 block text-sm font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
          Exam Description
        </label>
        <textarea
          {...register("instructions")}
          id="description"
          placeholder="Briefly describe the learning objectives or instructions for this assessment..."
          rows={4}
          className="form-well w-full resize-none rounded-xl border bg-white px-6 py-4 text-base text-[#121c2a] placeholder:text-[#6c7a71]/50 transition-all duration-200 focus:border-[#006c49] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
          style={{ borderColor: errors.instructions ? "#ba1a1a" : "#bbcabf" }}
        />
        {errors.instructions && (
          <p className="ml-1 mt-1 text-xs" style={{ color: "#ba1a1a" }} role="alert">
            {errors.instructions.message}
          </p>
        )}
      </div>

      {/* Visual Anchor (Image) */}
      <div className="relative h-40 overflow-hidden rounded-xl">
        <img
          className="size-full object-cover"
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDURkBFI0ZXnYvLf3AWy4RuiGltLMsGpEq6gPpRHx4fpXcSfEhpCiyvUPJEiImnd2LvhIclJBvL_fUTc9e0opk0JZgDOuD9OtHjI1J1ARcFki_lEXyKY-XIsaw9ShveLL_MGnvqPE7bZxhwgWhomwR3KdjECWG68zBrZhPNBd27npsyo1UGxiQRKzxiH9t2lFF4m7jHe2CJhwa2EjUQRsDVmaGnIWyFQQL-6x7SL-Yrrbso5oV7oFgiQQ"
          alt=""
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = "none"
            const parent = target.parentElement
            if (parent) {
              parent.style.background = "linear-gradient(135deg, #d9e3f7 0%, #82f5c1 50%, #fcfbf7 100%)"
            }
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(0,108,73,0.1)" }}>
          <span
            className="rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-widest"
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              borderColor: "rgba(0,108,73,0.2)",
              color: "#006c49",
            }}
          >
            STEP 1: IDENTITY
          </span>
        </div>
      </div>
    </div>
  )
}
