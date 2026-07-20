"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useFormContext } from "react-hook-form"
import { PenLine, ChevronDown, ImagePlus, Search, Plus } from "lucide-react"
import type { BasicInfoValues } from "../create-exam-wizard"

export interface SubjectOption {
  label: string
  value: string
}

interface BasicInfoStepProps {
  subjects: SubjectOption[]
  classes: { label: string; value: string }[]
  terms: { label: string; value: string }[]
}

export function BasicInfoStep({ subjects, classes, terms }: BasicInfoStepProps) {
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext<BasicInfoValues>()
  const [showImage, setShowImage] = useState(true)

  const [subjectSearch, setSubjectSearch] = useState("")
  const [subjectOpen, setSubjectOpen] = useState(false)
  const subjectRef = useRef<HTMLDivElement>(null)
  const subjectInputRef = useRef<HTMLInputElement>(null)
  const subjectValue = watch("subject")

  const filteredSubjects = useMemo(
    () => subjects.filter((s) => s.label.toLowerCase().includes(subjectSearch.toLowerCase())),
    [subjects, subjectSearch],
  )

  useEffect(() => {
    if (subjectValue && !subjectSearch) {
      const match = subjects.find((s) => s.value === subjectValue)
      if (match) setSubjectSearch(match.label)
    }
  }, [subjectValue, subjects, subjectSearch])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (subjectRef.current && !subjectRef.current.contains(e.target as Node)) {
        setSubjectOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function selectSubject(value: string, label: string) {
    setValue("subject", value, { shouldValidate: true })
    setSubjectSearch(label)
    setSubjectOpen(false)
  }

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
        {/* Subject - Searchable Select */}
        <div className="space-y-2" ref={subjectRef}>
          <label htmlFor="subject-search" className="ml-1 block text-sm font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
            Subject
          </label>
          <div className="relative">
            <input
              ref={subjectInputRef}
              id="subject-search"
              type="text"
              value={subjectSearch}
              onChange={(e) => {
                setSubjectSearch(e.target.value)
                if (!subjectOpen) setSubjectOpen(true)
                if (!e.target.value) setValue("subject", "", { shouldValidate: true })
              }}
              onFocus={() => setSubjectOpen(true)}
              placeholder="Search subject..."
              className="form-well w-full rounded-xl border bg-white px-6 py-4 pr-20 text-base text-[#121c2a] placeholder:text-[#6c7a71]/50 transition-all duration-200 focus:border-[#006c49] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
              style={{ borderColor: errors.subject ? "#ba1a1a" : "#bbcabf" }}
            />
            <div className="absolute inset-y-0 right-4 flex items-center gap-1 text-[#6c7a71]">
              <Search size={18} />
              <ChevronDown size={18} className={`transition-transform ${subjectOpen ? "rotate-180" : ""}`} />
            </div>
            {subjectOpen && (
              <div
                className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-auto rounded-xl border bg-white shadow-lg"
                style={{ borderColor: "#bbcabf" }}
              >
                {filteredSubjects.length > 0 ? (
                  filteredSubjects.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => selectSubject(s.value, s.label)}
                      className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#eff3ff] ${
                        subjectValue === s.value ? "bg-[#eff3ff] font-semibold text-[#006c49]" : "text-[#121c2a]"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))
                ) : (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-[#6c7a71]">
                    <Plus size={14} />
                    <span>No subjects found. Create one in the Subjects page.</span>
                  </div>
                )}
              </div>
            )}
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

      {/* Hidden fields for schema-required but not visible inputs */}
      <input type="hidden" {...register("term")} />
      <input type="hidden" {...register("duration")} />
      <input type="hidden" {...register("questionCount")} />

      {/* Term selector */}
      <div className="space-y-2">
        <label htmlFor="term" className="ml-1 block text-sm font-semibold tracking-[0.02em]" style={{ color: "#3c4a42" }}>
          Term
        </label>
        <div className="relative max-w-xs">
          <select
            {...register("term")}
            id="term"
            className="form-well w-full appearance-none rounded-xl border bg-white px-6 py-4 text-base text-[#121c2a] transition-all duration-200 focus:border-[#006c49] focus:outline-none focus:ring-2 focus:ring-[#006c49]"
            style={{ borderColor: errors.term ? "#ba1a1a" : "#bbcabf" }}
          >
            {terms.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[#6c7a71]">
            <ChevronDown size={20} />
          </div>
        </div>
        {errors.term && (
          <p className="ml-1 mt-1 text-xs" style={{ color: "#ba1a1a" }} role="alert">
            {errors.term.message}
          </p>
        )}
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

      {/* Visual Anchor with toggle */}
      <div className="relative h-40 overflow-hidden rounded-xl" style={{ backgroundColor: "#d9e3f7" }}>
        {showImage && (
          <img
            className="size-full object-cover transition-opacity duration-300"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDURkBFI0ZXnYvLf3AWy4RuiGltLMsGpEq6gPpRHx4fpXcSfEhpCiyvUPJEiImnd2LvhIclJBvL_fUTc9e0opk0JZgDOuD9OtHjI1J1ARcFki_lEXyKY-XIsaw9ShveLL_MGnvqPE7bZxhwgWhomwR3KdjECWG68zBrZhPNBd27npsyo1UGxiQRKzxiH9t2lFF4m7jHe2CJhwa2EjUQRsDVmaGnIWyFQQL-6x7SL-Yrrbso5oV7oFgiQQ"
            alt=""
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = "none"
            }}
          />
        )}
        {!showImage && (
          <div className="size-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #d9e3f7 0%, #82f5c1 50%, #fcfbf7 100%)" }}>
            <span className="text-sm font-semibold" style={{ color: "#006c49" }}>Ready for your cover image</span>
          </div>
        )}
        <button
          type="button"
          onClick={() => setShowImage((v) => !v)}
          className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full border bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider shadow-sm transition-all hover:bg-white active:scale-95"
          style={{ borderColor: "#bbcabf", color: "#006c49" }}
        >
          <ImagePlus size={14} />
          {showImage ? "Hide Image" : "Show Image"}
        </button>
      </div>
    </div>
  )
}
