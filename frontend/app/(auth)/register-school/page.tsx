"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Loader2, School } from "lucide-react"
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

export default function RegisterSchoolPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  })

  async function onSubmit(data: RegisterSchema) {
    setError("")
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/schools/register/`, {
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
          <div>
            <label className="block text-sm font-medium">School Name</label>
            <input {...register("name")} className={cn("mt-1 w-full rounded-lg border border-border-primary px-3 py-2 text-sm", errors.name && "border-danger")} />
            {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
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
