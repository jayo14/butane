"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, School, Search, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

const registerSchema = z.object({
  name: z.string().min(2, "School name is required"),
  slug: z.string().regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens only"),
  adminEmail: z.string().email("Enter a valid email address"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
  adminFirstName: z.string().min(1, "First name is required"),
  adminLastName: z.string().min(1, "Last name is required"),
})

type RegisterSchema = z.infer<typeof registerSchema>

interface SchoolMatch {
  id: string
  name: string
  slug: string
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export default function RegisterSchoolPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [suggestions, setSuggestions] = useState<SchoolMatch[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  })

  const schoolName = watch("name")

  const searchSchools = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`${API}/api/schools/lookup/?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data: SchoolMatch[] = await res.json()
        setSuggestions(data)
        setShowSuggestions(data.length > 0)
      }
    } catch {
      // ignore
    } finally {
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => searchSchools(schoolName), 250)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [schoolName, searchSchools])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function selectSchool(school: SchoolMatch) {
    setValue("name", school.name)
    setValue("slug", school.slug)
    setSuggestions([])
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  async function onSubmit(data: RegisterSchema) {
    setError("")
    try {
      const res = await fetch(`${API}/api/schools/register/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          slug: data.slug,
          admin_email: data.adminEmail,
          admin_password: data.adminPassword,
          admin_first_name: data.adminFirstName,
          admin_last_name: data.adminLastName,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.detail || "Registration failed")
      }
      setSuccess(true)
      setTimeout(() => router.push("/login"), 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card padding="lg" className="w-full max-w-md text-center">
          <School className="mx-auto mb-4 text-primary" size={48} />
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="mt-2 text-sm text-content-secondary">
            We sent a verification link to your email. Please verify to activate your school.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card padding="lg" className="w-full max-w-md">
        <div className="mb-6 flex items-center gap-3">
          <School className="text-primary" size={32} />
          <div>
            <h1 className="text-2xl font-bold">Register Your School</h1>
            <p className="text-sm text-content-secondary">Create an admin account and get started</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-danger/40 bg-danger-light p-3 text-sm text-danger">{error}</div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div ref={wrapperRef} className="relative">
            <label className="block text-sm font-medium">School Name</label>
            <div className="relative mt-1">
              <input
                {...register("name")}
                ref={(e) => {
                  register("name").ref(e)
                  ;(inputRef as any).current = e
                }}
                className={cn("w-full rounded-lg border border-border-primary px-3 py-2 pr-10 text-sm", errors.name && "border-danger")}
                autoComplete="off"
              />
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                {searching ? (
                  <Loader2 size={16} className="animate-spin text-content-muted" />
                ) : (
                  <Search size={16} className="text-content-muted" />
                )}
              </div>
            </div>
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}

            {showSuggestions && (
              <div className="absolute z-50 mt-1 w-full rounded-lg border border-border-primary bg-white shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectSchool(s)}
                    className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-secondary first:rounded-t-lg last:rounded-b-lg"
                  >
                    <School size={16} className="shrink-0 text-primary" />
                    <span className="flex-1">{s.name}</span>
                    <ChevronRight size={14} className="text-content-muted" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">Slug</label>
            <input {...register("slug")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.slug && "border-danger")} placeholder="e.g. my-school" />
            {errors.slug && <p className="mt-1 text-xs text-danger">{errors.slug.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Admin First Name</label>
            <input {...register("adminFirstName")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.adminFirstName && "border-danger")} />
            {errors.adminFirstName && <p className="mt-1 text-xs text-danger">{errors.adminFirstName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Admin Last Name</label>
            <input {...register("adminLastName")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.adminLastName && "border-danger")} />
            {errors.adminLastName && <p className="mt-1 text-xs text-danger">{errors.adminLastName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Admin Email</label>
            <input type="email" {...register("adminEmail")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.adminEmail && "border-danger")} />
            {errors.adminEmail && <p className="mt-1 text-xs text-danger">{errors.adminEmail.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input type="password" {...register("adminPassword")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.adminPassword && "border-danger")} />
            {errors.adminPassword && <p className="mt-1 text-xs text-danger">{errors.adminPassword.message}</p>}
          </div>
          <Button type="submit" variant="primary" className="w-full" isLoading={isSubmitting}>
            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
            Register School
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-content-secondary">
          Already have an account? <Link href="/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </Card>
    </div>
  )
}
