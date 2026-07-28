"use client"

import { useState, useEffect, useMemo } from "react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Table } from "@/components/ui/table"
import { EmptyState } from "@/components/ui/empty-state"
import { Skeleton, SkeletonGroup } from "@/components/ui/skeleton"
import { Container } from "@/components/layout/container"
import { api } from "@/lib/api"
import { useToast } from "@/components/ui/toast"

interface TraitOption {
  label: string
  value: string
}

interface RatingCell {
  studentId: string
  traitId: string
  value: number | null
}

export function BehaviouralRatingsPageClient() {
  const toast = useToast()
  const [sessions, setSessions] = useState<{ id: string; name: string }[]>([])
  const [terms, setTerms] = useState<{ id: string; name: string }[]>([])
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([])
  const [selectedSession, setSelectedSession] = useState("")
  const [selectedTerm, setSelectedTerm] = useState("")
  const [selectedClassroom, setSelectedClassroom] = useState("")
  const [domain, setDomain] = useState<string>("affective")
  const [traits, setTraits] = useState<any[]>([])
  const [students, setStudents] = useState<any[]>([])
  const [existingRatings, setExistingRatings] = useState<Record<string, Record<string, number | null>>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function load() {
      try {
        const [classroomsRes, sessionsRes] = await Promise.all([
          api.academics.classrooms().catch(() => ({ results: [] })) as any,
          api.academics.sessions().catch(() => ({ results: [] })) as any,
        ])
        setClassrooms((classroomsRes.results || []).map((c: any) => ({ id: c.id, name: c.name })))
        setSessions((sessionsRes.results || []).map((s: any) => ({ id: s.id, name: s.name })))
      } catch {
        // leave empty
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedSession) {
      setTerms([])
      setSelectedTerm("")
      return
    }
    api.terms.list({ session: selectedSession })
      .then((termsList) => setTerms((termsList || []).map((t: any) => ({ id: t.id, name: t.name }))))
      .catch(() => setTerms([]))
  }, [selectedSession])

  useEffect(() => {
    if (!selectedClassroom || !selectedTerm || !domain) return
    let cancelled = false
    async function load() {
      try {
        const [traitsRes, studentsRes] = await Promise.all([
          api.academics.behaviouralTraits({ domain }).catch(() => []),
          api.academics.enrollments({ classroom: selectedClassroom, session__is_current: "true" }).catch(() => ({ results: [] })),
        ])
        if (cancelled) return
        setTraits(traitsRes as any[] || [])
        const studentsList = (studentsRes as any).results || studentsRes || []
        setStudents(studentsList)
      } catch {
        if (!cancelled) {
          setTraits([])
          setStudents([])
        }
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedClassroom, selectedTerm, domain])

  useEffect(() => {
    if (!selectedClassroom || !selectedTerm) return
    let cancelled = false
    async function load() {
      try {
        const res = await api.academics.components({
          classroom: selectedClassroom,
          term: selectedTerm,
        }).catch(() => [])
        if (cancelled || !res?.length) return
        // Load existing behavioural ratings from components if needed.
      } catch {
        // ignore
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedClassroom, selectedTerm])

  const ratingOptions = useMemo<TraitOption[]>(() => {
    return [5, 4, 3, 2, 1].map((value) => ({ label: String(value), value: String(value) }))
  }, [])

  const getRating = useMemo(() => {
    const map: Record<string, Record<string, number>> = {}
    for (const s of students) {
      const sid = s.student || s.id
      if (!map[sid]) map[sid] = {}
    }
    return map
  }, [students])

  const handleRatingChange = (studentId: string, traitId: string, value: string) => {
    setExistingRatings((prev) => {
      const studentMap = prev[studentId] || {}
      return {
        ...prev,
        [studentId]: {
          ...studentMap,
          [traitId]: value === "" ? null : Number(value),
        },
      }
    })
  }

  const handleSaveRatings = async () => {
    if (!selectedClassroom || !selectedTerm) return
    setSaving(true)
    setError("")
    const errors: string[] = []
    let saved = 0
    for (const trait of traits) {
      const changedRatings = students
        .map((s: any) => s.student || s.id)
        .map((sid: string) => {
          const current = existingRatings[sid]?.[trait.id]
          return { student_id: sid, rating: current ?? 0 }
        })
      try {
        await api.academics.behaviouralRatingsBulk({
          trait_id: trait.id,
          classroom_id: selectedClassroom,
          term_id: selectedTerm,
          ratings: changedRatings,
        })
        saved += 1
      } catch {
        errors.push(trait.name || trait.id)
      }
    }
    if (saved > 0) {
      toast.addToast({
        message: "Saved ratings",
        description: `Saved ${saved} of ${traits.length} trait columns.`,
        variant: errors.length ? "warning" : "success",
      })
    }
    if (errors.length) {
      setError(`Failed to save: ${errors.join(", ")}`)
    }
    setSaving(false)
  }

  const statusBadge = () => {
    return <Badge variant="info">Entry</Badge>
  }

  if (loading) {
    return (
      <Container>
        <div className="mb-6">
          <Skeleton variant="text" width={200} height={32} className="mb-2" />
          <Skeleton variant="text" width={300} height={16} />
        </div>
        <Card padding="lg" className="mb-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
            <Skeleton variant="rectangular" height={40} />
          </div>
        </Card>
        <Card padding="lg">
          <Skeleton variant="text" width={150} height={24} className="mb-4" />
          <div className="space-y-3">
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={40} />
            <Skeleton variant="text" height={40} />
          </div>
        </Card>
      </Container>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content-primary md:text-2xl">Behavioural Ratings</h1>
        <p className="mt-0.5 text-sm text-content-secondary">
          Enter and save student behavioural ratings by trait domain
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-danger/40 bg-danger-light p-4 text-sm text-danger">
          {error}
        </div>
      )}

      <Card padding="lg" className="mb-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Session"
            options={sessions.map((s) => ({ label: s.name, value: s.id }))}
            value={selectedSession}
            onChange={setSelectedSession}
            placeholder="Select session"
          />
          <Select
            label="Term"
            options={terms.map((t) => ({ label: t.name, value: t.id }))}
            value={selectedTerm}
            onChange={setSelectedTerm}
            placeholder="Select term"
          />
          <Select
            label="Classroom"
            options={classrooms.map((c) => ({ label: c.name, value: c.id }))}
            value={selectedClassroom}
            onChange={setSelectedClassroom}
            placeholder="Select classroom"
          />
          <Select
            label="Domain"
            options={[
              { label: "Affective", value: "affective" },
              { label: "Psychomotor", value: "psychomotor" },
            ]}
            value={domain}
            onChange={(value) => setDomain(value || "affective")}
            placeholder="Select domain"
          />
        </div>
      </Card>

      {traits.length > 0 && students.length > 0 ? (
        <Card padding="lg">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-content-primary">
              {domain[0].toUpperCase() + domain.slice(1)} Ratings
            </h2>
            <div className="flex items-center gap-2">
              {statusBadge()}
              <Button
                variant="primary"
                onClick={handleSaveRatings}
                disabled={saving || traits.length === 0}
              >
                {saving ? "Saving..." : "Save Ratings"}
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table
              columns={([
                { key: "studentName", header: "Student", sortable: true },
                ...traits.map((trait) => ({
                  key: trait.id,
                  header: trait.name,
                  align: "center" as const,
                  render: (row: any) => {
                    const studentId = row.studentId || row.id
                    const value = existingRatings[studentId]?.[trait.id]
                    return (
                      <div className="mx-auto w-20">
                        <Select
                          value={value != null ? String(value) : ""}
                          onChange={(val) => handleRatingChange(studentId, trait.id, val)}
                          options={ratingOptions}
                          placeholder="-"
                          wrapperClassName="w-full"
                        />
                      </div>
                    )
                  },
                })),
              ]) as any}
              data={students.map((s: any) => {
                const sid = s.student || s.id
                return {
                  studentId: sid,
                  studentName: `${s.student?.user?.full_name || s.student_name || ""}`,
                }
              })}
              keyExtractor={(row: any) => row.studentId}
              emptyState={
                <EmptyState
                  title="No students enrolled"
                  description="Add students to this classroom to enter behavioural ratings."
                />
              }
            />
          </div>
        </Card>
      ) : selectedClassroom && selectedTerm ? (
        <Card padding="lg">
          <EmptyState
            title="No traits found"
            description="No behavioural traits are configured for the selected domain. Contact an administrator to set up traits."
          />
        </Card>
      ) : (
        <Card padding="lg">
          <EmptyState
            title="Select a classroom and term"
            description="Choose a session, term, classroom, and domain to begin entering ratings."
          />
        </Card>
      )}
    </div>
  )
}
