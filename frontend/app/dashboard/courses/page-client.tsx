"use client"

import { useState, useMemo, useEffect } from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  BookOpen,
  FileText,
  MoreHorizontal,
  Edit3,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import { Dropdown } from "@/components/ui/dropdown"
import { api } from "@/lib/api"
import type { ApiSubject } from "@/lib/api"

interface SubjectItem {
  id: string
  name: string
  code: string
  description: string
  examCount: number
  createdAt: string
}

const ITEMS_PER_PAGE = 9

export function CoursesPageClient() {
  const [subjects, setSubjects] = useState<SubjectItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [subjectList, examsRes] = await Promise.all([
          api.subjects.list(),
          api.exams.list(),
        ])
        if (cancelled) return

        const examCountBySubject = new Map<string, number>()
        for (const e of examsRes?.results || []) {
          const key = e.subject
          if (key) {
            examCountBySubject.set(key, (examCountBySubject.get(key) || 0) + 1)
          }
        }

        const items: SubjectItem[] = (subjectList || []).map((s: ApiSubject) => ({
          id: s.id,
          name: s.name,
          code: s.code,
          description: s.description,
          examCount: examCountBySubject.get(s.name) || 0,
          createdAt: s.created_at,
        }))

        setSubjects(items)
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    let result = subjects
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.code.toLowerCase().includes(q),
      )
    }
    return result
  }, [subjects, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  function clearFilters() {
    setSearch("")
    setCurrentPage(1)
  }

  function handleDelete(id: string) {
    setSubjects((prev) => prev.filter((s) => s.id !== id))
  }

  const hasActiveFilters = !!search
  const isEmpty = filtered.length === 0 && hasActiveFilters

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-content-muted" />
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Subjects</h1>
          <p className="mt-1 text-content-secondary">
            Manage all subjects used in exam creation
          </p>
        </div>
        <Link href="/dashboard/subjects/create">
          <Button leftIcon={<Plus size={18} />}>Add Subject</Button>
        </Link>
      </div>

      <Card padding="md" className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search by name or code..."
              className="h-10 w-full rounded-xl border border-border-primary bg-white pl-10 pr-4 text-sm text-content-primary placeholder:text-content-secondary transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </Card>

      {subjects.length === 0 && !hasActiveFilters && (
        <Card padding="lg">
          <EmptyState
            icon={<BookOpen size={40} />}
            title="No subjects yet"
            description="Add your first subject to get started."
            action={
              <Link href="/dashboard/subjects/create">
                <Button leftIcon={<Plus size={18} />}>Add Subject</Button>
              </Link>
            }
          />
        </Card>
      )}

      {isEmpty && (
        <Card padding="lg">
          <EmptyState
            icon={<GraduationCap size={40} />}
            title="No subjects match your search"
            description="Try adjusting your search terms."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            }
          />
        </Card>
      )}

      {!isEmpty && subjects.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((subject, i) => (
              <div
                key={subject.id}
                className="group rounded-xl border border-border-primary bg-white p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-card"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <BookOpen size={22} />
                  </div>
                  <Badge variant="primary" size="sm">
                    {subject.code || "—"}
                  </Badge>
                </div>
                <div className="mt-3">
                  <h3 className="text-base font-semibold text-content-primary">{subject.name}</h3>
                  <p className="mt-2 text-sm text-content-secondary line-clamp-2">
                    {subject.description || "No description"}
                  </p>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-content-muted">
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {subject.examCount} exam{subject.examCount !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-primary pt-3">
                  <p className="text-xs text-content-muted">
                    Created {new Date(subject.createdAt).toLocaleDateString()}
                  </p>
                  <Dropdown
                    items={[
                      { key: "edit", label: "Edit", icon: <Edit3 size={14} /> },
                      { key: "divider", label: "", divider: true },
                      { key: "delete", label: "Delete", icon: <Trash2 size={14} />, danger: true },
                    ]}
                    onAction={(key) => {
                      if (key === "delete") handleDelete(subject.id)
                    }}
                    variant="ghost"
                    size="sm"
                    label=""
                    trigger={
                      <span
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { const btn = e.currentTarget.closest('[data-trigger]'); if (btn) (btn as HTMLElement).click() } }}
                        className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary"
                        aria-label="Subject actions"
                      >
                        <MoreHorizontal size={18} />
                      </span>
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <p className="text-sm text-content-muted">
                Showing {(safePage - 1) * ITEMS_PER_PAGE + 1}–
                {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} subjects
              </p>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex size-9 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={18} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-xl text-sm font-medium transition-all",
                      page === safePage
                        ? "bg-primary text-primary-foreground"
                        : "text-content-muted hover:bg-surface-secondary hover:text-content-primary",
                    )}
                  >
                    {page}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex size-9 items-center justify-center rounded-xl text-content-muted transition-colors hover:bg-surface-secondary hover:text-content-primary disabled:pointer-events-none disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Container>
  )
}
