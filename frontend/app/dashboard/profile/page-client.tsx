"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Mail,
  Building2,
  Briefcase,
  Phone,
  BookOpen,
  Calendar,
  Shield,
  Edit3,
  Award,
  Lock,
  KeyRound,
  Loader2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Container } from "@/components/layout/container"
import { ChangePasswordModal } from "@/components/auth/change-password-modal"
import { api } from "@/lib/api"
import type { ApiTeacherProfile } from "@/lib/api"

const roleBadge: Record<string, { label: string; variant: "primary" | "success" | "info" }> = {
  admin: { label: "Administrator", variant: "primary" },
  teacher: { label: "Teacher", variant: "success" },
}

export function ProfilePageClient() {
  const [profile, setProfile] = useState<ApiTeacherProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showChangePassword, setShowChangePassword] = useState(false)

  useEffect(() => {
    api.auth.profile()
      .then(setProfile)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load profile"))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <Container>
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin" style={{ color: "#006c49" }} />
        </div>
      </Container>
    )
  }

  if (error || !profile) {
    return (
      <Container>
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-sm text-danger">{error || "Something went wrong"}</p>
          <button
            type="button"
            onClick={() => { setError(""); setLoading(true); api.auth.profile().then(setProfile).catch(() => setLoading(false)) }}
            className="mt-4 rounded-xl border border-border-primary px-4 py-2 text-sm font-medium transition-colors hover:bg-surface-secondary"
          >
            Retry
          </button>
        </div>
      </Container>
    )
  }

  const user = profile.user
  const role = roleBadge[user.role] || { label: user.role, variant: "info" as const }

  const details = [
    { label: "Email", value: user.email, icon: Mail },
    { label: "Phone", value: profile.phone || "Not set", icon: Phone },
    { label: "Department", value: profile.department || "Not set", icon: Building2 },
    { label: "Title", value: profile.title || "Not set", icon: Briefcase },
    { label: "Employee ID", value: profile.employee_id || "N/A", icon: Award },
    { label: "Role", value: role.label, icon: Shield },
    { label: "Member Since", value: new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" }), icon: Calendar },
  ]

  const initials = user.full_name
    ? user.full_name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : user.email[0].toUpperCase()

  return (
    <Container>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content-primary">Profile</h1>
          <p className="mt-1 text-content-secondary">Your personal information and account details</p>
        </div>
        <Link href="/dashboard/settings">
          <Button leftIcon={<Edit3 size={16} />} variant="outline">
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card padding="lg" className="text-center">
            <div className="mx-auto flex size-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-2xl font-bold text-white shadow-md shadow-primary/20">
              {initials}
            </div>
            <h2 className="mt-4 text-xl font-semibold text-content-primary">{user.full_name}</h2>
            <div className="mt-2">
              <Badge variant={role.variant}>{role.label}</Badge>
            </div>
            {profile.bio && (
              <p className="mt-4 text-sm text-content-secondary leading-relaxed">{profile.bio}</p>
            )}
            <div className="mt-6">
              <Link href="/dashboard/settings">
                <Button variant="outline" size="sm" leftIcon={<Edit3 size={14} />}>
                  Edit Profile
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card padding="lg">
            <Card.Header
              title="Account Information"
              description="Your personal details and contact information"
            />
            <div className="grid gap-4 sm:grid-cols-2">
              {details.map((detail) => (
                <div
                  key={detail.label}
                  className="flex items-start gap-3 rounded-xl bg-surface-secondary p-4"
                >
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <detail.icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-content-muted">{detail.label}</p>
                    <p className="mt-0.5 text-sm font-medium text-content-primary truncate">
                      {detail.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="lg">
            <Card.Header
              title="Quick Links"
              description="Manage your account settings and preferences"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                href="/dashboard/settings"
                className="flex items-center gap-3 rounded-xl border border-border-primary p-4 transition-all hover:border-primary/30 hover:shadow-card"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Edit3 size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-content-primary">Edit Profile</p>
                  <p className="text-xs text-content-muted">Update your personal information</p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-3 rounded-xl border border-border-primary p-4 text-left transition-all hover:border-primary/30 hover:shadow-card"
              >
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <KeyRound size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-content-primary">Change Password</p>
                  <p className="text-xs text-content-muted">Update your account password</p>
                </div>
              </button>
            </div>
          </Card>
        </div>
      </div>

      <ChangePasswordModal isOpen={showChangePassword} onClose={() => setShowChangePassword(false)} />
    </Container>
  )
}
