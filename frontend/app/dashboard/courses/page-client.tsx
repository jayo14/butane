"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  BookOpen,
  Users,
  Clock,
  MoreHorizontal,
  Edit3,
  Archive,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import { Dropdown } from "@/components/ui/dropdown"
import type { Course } from "@/types"

const ITEMS_PER_PAGE = 9

export function CoursesPageClient({ courses: initialCourses }: { courses: Course[] }) {
  const [courses, setCourses] = useState(initialCourses)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState(1)

  const filtered = useMemo(() => {
    let result = courses
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.teacher.toLowerCase().includes(q),
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter)
    }
    return result
  }, [courses, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginated = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE)

  function clearFilters() {
    setSearch("")
    setStatusFilter("all")
    setCurrentPage(1)
  }

  function handleArchive(id: string) {
    setCourses((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === "archived" ? "active" : "archived" } as Course : c)),
    )
  }

  function handleDelete(id: string) {
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }

  const hasActiveFilters = search || statusFilter !== "all"
  const isEmpty = filtered.length === 0 && hasActiveFilters

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Courses</h1>
          <p className="mt-1 text-content-secondary">
            Manage all your courses and subjects
          </p>
        </div>
        <Button leftIcon={<Plus size={18} />}>Add Course</Button>
      </div>

      <Card padding="md" className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search by name, code, or teacher..."
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
          <div className="relative w-full sm:w-44">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1) }}
              className="h-10 w-full appearance-none rounded-xl border border-border-primary bg-white pl-4 pr-10 text-sm text-content-primary transition-all duration-200 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-content-muted">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            </div>
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

      {courses.length === 0 && !hasActiveFilters && (
        <Card padding="lg">
          <EmptyState
            icon={<BookOpen size={40} />}
            title="No courses yet"
            description="Add your first course to get started."
            action={
              <Button leftIcon={<Plus size={18} />}>Add Course</Button>
            }
          />
        </Card>
      )}

      {isEmpty && (
        <Card padding="lg">
          <EmptyState
            icon={<GraduationCap size={40} />}
            title="No courses match your search"
            description="Try adjusting your filters or search terms."
            action={
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            }
          />
        </Card>
      )}

      {!isEmpty && courses.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {paginated.map((course, i) => (
              <div
                key={course.id}
                className="group rounded-xl border border-border-primary bg-white p-5 transition-all duration-200 hover:border-primary/20 hover:shadow-card"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary">
                    <BookOpen size={22} />
                  </div>
                  <Badge variant={course.status === "active" ? "success" : "warning"} size="sm">
                    {course.status}
                  </Badge>
                </div>
                <div className="mt-3">
                  <h3 className="text-base font-semibold text-content-primary">{course.name}</h3>
                  <p className="mt-0.5 text-xs text-content-muted">{course.code}</p>
                  <p className="mt-2 text-sm text-content-secondary line-clamp-2">{course.description}</p>
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-content-muted">
                  <span className="flex items-center gap-1">
                    <Users size={12} />
                    {course.students} students
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {course.schedule}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-primary pt-3">
                  <p className="text-xs text-content-muted">{course.teacher}</p>
                  <Dropdown
                    items={[
                      { key: "edit", label: "Edit", icon: <Edit3 size={14} /> },
                      { key: "toggle-archive", label: course.status === "archived" ? "Activate" : "Archive", icon: <Archive size={14} /> },
                      { key: "divider", label: "", divider: true },
                      { key: "delete", label: "Delete", icon: <Trash2 size={14} />, danger: true },
                    ]}
                    onAction={(key) => {
                      if (key === "toggle-archive") handleArchive(course.id)
                      if (key === "delete") handleDelete(course.id)
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
                        aria-label="Course actions"
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
                {Math.min(safePage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} courses
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
