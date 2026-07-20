"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Loader2, X, GraduationCap, Trash2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { EmptyState } from "@/components/ui/empty-state"
import { api, ApiError } from "@/lib/api"
import type { ApiGradeLevel } from "@/lib/api"

export default function GradeLevelsPage() {
  const [items, setItems] = useState<ApiGradeLevel[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    api.gradeLevels.list().then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [])

  async function handleAdd() {
    if (!newName.trim()) return
    setSaving(true)
    setError("")
    try {
      const created = await api.gradeLevels.create({ name: newName.trim() })
      setItems((prev) => [...prev, created])
      setNewName("")
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.gradeLevels.delete(id)
      setItems((prev) => prev.filter((g) => g.id !== id))
    } catch {}
  }

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
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-content-primary">Grade Levels</h1>
        <p className="mt-1 text-content-secondary">Manage grade levels from JSS1 to SSS3</p>
      </div>

      <Card padding="md" className="mb-6">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
            placeholder="e.g. JSS1"
            className="h-10 flex-1 rounded-xl border border-border-primary bg-white px-4 text-sm text-content-primary placeholder:text-content-secondary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <Button onClick={handleAdd} disabled={saving || !newName.trim()} leftIcon={saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}>
            {saving ? "Adding..." : "Add"}
          </Button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </Card>

      {items.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<GraduationCap size={40} />}
            title="No grade levels"
            description="Add grade levels to use in exam creation."
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((g) => (
            <div key={g.id} className="flex items-center justify-between rounded-xl border border-border-primary bg-white px-5 py-3">
              <div>
                <span className="font-medium text-content-primary">{g.name}</span>
                <span className="ml-3 text-xs text-content-muted">Order: {g.display_order}</span>
              </div>
              <button onClick={() => handleDelete(g.id)} className="text-content-muted hover:text-red-600 transition-colors">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </Container>
  )
}
