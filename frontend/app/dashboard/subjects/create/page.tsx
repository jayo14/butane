"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Check, X } from "lucide-react"
import { api, ApiError } from "@/lib/api"

export default function CreateSubjectPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError("Subject name is required")
      return
    }
    setSaving(true)
    setError("")
    try {
      await api.subjects.create({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim(),
      })
      router.push("/dashboard/courses")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create subject")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/dashboard/courses"
          className="mb-4 flex items-center gap-1.5 text-sm text-content-muted hover:text-content-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Subjects
        </Link>
        <h1 className="text-2xl font-bold text-content-primary">Add Subject</h1>
        <p className="mt-1 text-content-secondary">
          Create a new subject that will appear in the exam creation wizard.
        </p>
      </div>

      <div className="rounded-xl border border-border-primary bg-white p-6">
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            <X size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-content-primary">
              Subject Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics"
              className="h-10 w-full rounded-xl border border-border-primary bg-white px-4 text-sm text-content-primary placeholder:text-content-secondary transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="code" className="mb-1.5 block text-sm font-medium text-content-primary">
              Subject Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MATH"
              className="h-10 w-full rounded-xl border border-border-primary bg-white px-4 text-sm text-content-primary placeholder:text-content-secondary transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-content-primary">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              className="h-24 w-full rounded-xl border border-border-primary bg-white px-4 py-3 text-sm text-content-primary placeholder:text-content-secondary transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Link href="/dashboard/courses">
              <button
                type="button"
                className="rounded-xl border border-border-primary px-6 py-2.5 text-sm font-medium text-content-muted transition-colors hover:bg-surface-secondary"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:brightness-105 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Create Subject
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
