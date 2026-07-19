"use client"

import { useState } from "react"
import {
  User,
  School,
  Lock,
  Settings,
  Bell,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  Upload,
  Save,
  Trash2,
  LogOut,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type SettingsTab = "profile" | "school" | "password" | "preferences" | "notifications" | "danger"

const tabs: { id: SettingsTab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Teacher Profile", icon: User },
  { id: "school", label: "School Profile", icon: School },
  { id: "password", label: "Password", icon: Lock },
  { id: "preferences", label: "Preferences", icon: Settings },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "danger", label: "Danger Zone", icon: AlertTriangle },
]

function SectionCard({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card padding="lg" className={cn("mb-6", className)}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-content-primary">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-content-secondary">{description}</p>}
      </div>
      {children}
    </Card>
  )
}

function FormField({
  label,
  error,
  hint,
  children,
}: {
  label: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-content-primary">{label}</label>
      {children}
      {error && <p className="text-xs text-danger" role="alert">{error}</p>}
      {hint && !error && <p className="text-xs text-content-muted">{hint}</p>}
    </div>
  )
}

const inputClass = cn(
  "block w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-content-primary placeholder:text-content-secondary",
  "transition-all duration-150",
  "focus:border-primary focus:outline-none focus-visible:rounded-xl focus:ring-2 focus:ring-primary/20",
  "border-border-primary",
)

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState("")
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  // Form state
  const [profile, setProfile] = useState({
    firstName: "Admin",
    lastName: "User",
    email: "admin@deesoar.edu",
    phone: "+1 (555) 000-0000",
    department: "Mathematics",
    bio: "",
  })

  const [school, setSchool] = useState({
    name: "Dee Soar School",
    address: "123 Education Lane, Learning City",
    phone: "+1 (555) 123-4567",
    email: "info@deesoar.edu",
    website: "https://deesoar.edu",
  })

  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "UTC",
    dateFormat: "MMM DD, YYYY",
    itemsPerPage: "10",
    reducedMotion: false,
  })

  const [notifications, setNotifications] = useState({
    emailDigest: "daily",
    examReminders: true,
    newEnrollments: true,
    resultPublished: true,
    pushNewMessage: false,
    pushDeadlineAlert: true,
  })

  function handleSave() {
    setSaving(true)
    setSaved(false)
    setTimeout(() => {
      setSaving(false)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }, 800)
  }

  function checkPasswordStrength(val: string) {
    let score = 0
    if (val.length >= 8) score++
    if (val.length >= 12) score++
    if (/[A-Z]/.test(val)) score++
    if (/[a-z]/.test(val)) score++
    if (/[0-9]/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++
    setPasswordStrength(score)
  }

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong", "Very Strong"]
  const strengthColor = ["", "bg-danger", "bg-warning", "bg-primary", "bg-info", "bg-success"]

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => setLogoPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const tabContent = (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex gap-1 min-w-max border-b border-border-primary">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          const isDanger = tab.id === "danger"
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap",
                isActive
                  ? isDanger
                    ? "border-danger text-danger"
                    : "border-primary text-primary"
                  : "border-transparent text-content-muted hover:text-content-primary hover:border-border-primary",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>
    </div>
  )

  const mobileTabNav = (
    <div className="grid grid-cols-3 gap-2 mb-6 lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        const isDanger = tab.id === "danger"
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-xl p-3 text-xs font-medium transition-all",
              isActive
                ? isDanger
                  ? "bg-danger/10 text-danger"
                  : "bg-primary/10 text-primary"
                : "text-content-muted hover:bg-surface-secondary",
            )}
          >
            <Icon size={20} />
            <span className="text-[10px] leading-tight text-center">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-content-primary md:text-2xl">Settings</h1>
        <p className="mt-0.5 text-sm text-content-secondary">Manage your account and application preferences</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Desktop Sidebar */}
        <nav className="hidden lg:block lg:col-span-1" aria-label="Settings sections">
          <Card padding="none" className="sticky top-24 overflow-hidden">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isDanger = tab.id === "danger"
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex w-full items-center gap-3 px-5 py-3 text-sm font-medium transition-all text-left",
                    "border-l-2",
                    isActive
                      ? isDanger
                        ? "border-danger bg-danger/5 text-danger"
                        : "border-primary bg-primary/5 text-primary"
                      : "border-transparent text-content-muted hover:bg-surface-secondary hover:text-content-primary",
                  )}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </Card>
        </nav>

        {/* Content */}
        <div className="lg:col-span-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Desktop tabs */}
          <div className="hidden lg:block mb-6">{tabContent}</div>
          {/* Mobile grid */}
          {mobileTabNav}

          {/* Save indicator */}
          <div className="mb-4 flex items-center justify-end gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-success animate-in fade-in">
                <Check size={14} />
                Saved
              </span>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={saving}
              leftIcon={!saving ? <Save size={16} /> : undefined}
            >
              Save Changes
            </Button>
          </div>

          {activeTab === "profile" && (
            <SectionCard title="Teacher Profile" description="Update your personal information and bio">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-3">
                  <div className="flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-3xl font-bold text-white shadow-md shadow-primary/20">
                    AU
                  </div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-primary bg-white px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:bg-surface-secondary">
                      <Upload size={14} />
                      Change Photo
                    </span>
                    <input type="file" accept="image/*" className="sr-only" onChange={() => {}} />
                  </label>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="First Name">
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className={inputClass}
                      />
                    </FormField>
                    <FormField label="Last Name">
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                  <FormField label="Email address" hint="Used for notifications and login">
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Phone number">
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Department">
                    <select
                      value={profile.department}
                      onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                      className={inputClass}
                    >
                      <option value="Mathematics">Mathematics</option>
                      <option value="English">English</option>
                      <option value="Science">Science</option>
                      <option value="History">History</option>
                      <option value="Computer Science">Computer Science</option>
                    </select>
                  </FormField>
                  <FormField label="Bio" hint="Brief description about yourself">
                    <textarea
                      rows={3}
                      value={profile.bio}
                      onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                      className={cn(inputClass, "resize-none")}
                      placeholder="Tell us about yourself..."
                    />
                  </FormField>
                </div>
              </div>
            </SectionCard>
          )}

          {/* School Section */}
          {activeTab === "school" && (
            <SectionCard title="School Profile" description="Information about your educational institution">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <div className="flex flex-col items-center gap-3">
                  <div className={cn(
                    "flex size-24 items-center justify-center rounded-2xl border-2 border-dashed transition-colors",
                    logoPreview ? "border-primary" : "border-border-primary bg-surface-secondary",
                  )}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="School logo" className="size-full rounded-xl object-cover" />
                    ) : (
                      <School size={32} className="text-content-muted" />
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-border-primary bg-white px-3 py-1.5 text-xs font-medium text-content-primary transition-colors hover:bg-surface-secondary">
                      <Upload size={14} />
                      Upload Logo
                    </span>
                    <input type="file" accept="image/*" className="sr-only" onChange={handleLogoUpload} />
                  </label>
                </div>
                <div className="flex-1 space-y-4">
                  <FormField label="School Name">
                    <input
                      type="text"
                      value={school.name}
                      onChange={(e) => setSchool({ ...school, name: e.target.value })}
                      className={inputClass}
                    />
                  </FormField>
                  <FormField label="Address">
                    <input
                      type="text"
                      value={school.address}
                      onChange={(e) => setSchool({ ...school, address: e.target.value })}
                      className={inputClass}
                    />
                  </FormField>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField label="Phone">
                      <input
                        type="tel"
                        value={school.phone}
                        onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                        className={inputClass}
                      />
                    </FormField>
                    <FormField label="Email">
                      <input
                        type="email"
                        value={school.email}
                        onChange={(e) => setSchool({ ...school, email: e.target.value })}
                        className={inputClass}
                      />
                    </FormField>
                  </div>
                  <FormField label="Website">
                    <input
                      type="url"
                      value={school.website}
                      onChange={(e) => setSchool({ ...school, website: e.target.value })}
                      className={inputClass}
                    />
                  </FormField>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Password Section */}
          {activeTab === "password" && (
            <SectionCard
              title="Change Password"
              description="Update your account password. Choose a strong password you haven't used before."
            >
              <div className="space-y-4 max-w-md">
                <FormField label="Current Password">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwords.current}
                      onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                      className={cn(inputClass, "pr-10")}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-content-muted hover:text-content-primary"
                      tabIndex={-1}
                      aria-label={showPassword ? "Hide passwords" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormField>
                <FormField label="New Password">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwords.new}
                    onChange={(e) => {
                      setPasswords({ ...passwords, new: e.target.value })
                      checkPasswordStrength(e.target.value)
                    }}
                    className={inputClass}
                    autoComplete="new-password"
                  />
                </FormField>
                {passwords.new && (
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-all duration-300",
                            i < passwordStrength ? strengthColor[passwordStrength] : "bg-surface-secondary",
                          )}
                        />
                      ))}
                    </div>
                    <p className={cn("text-xs", passwordStrength >= 3 ? "text-success" : "text-content-muted")}>
                      {strengthLabel[passwordStrength]}
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-content-muted">
                      <li className={cn("flex items-center gap-1.5", passwords.new.length >= 8 && "text-success")}>
                        <span className={cn("size-1.5 rounded-full", passwords.new.length >= 8 ? "bg-success" : "bg-content-muted")} />
                        At least 8 characters
                      </li>
                      <li className={cn("flex items-center gap-1.5", /[A-Z]/.test(passwords.new) && "text-success")}>
                        <span className={cn("size-1.5 rounded-full", /[A-Z]/.test(passwords.new) ? "bg-success" : "bg-content-muted")} />
                        One uppercase letter
                      </li>
                      <li className={cn("flex items-center gap-1.5", /[0-9]/.test(passwords.new) && "text-success")}>
                        <span className={cn("size-1.5 rounded-full", /[0-9]/.test(passwords.new) ? "bg-success" : "bg-content-muted")} />
                        One number
                      </li>
                    </ul>
                  </div>
                )}
                <FormField
                  label="Confirm New Password"
                  error={
                    passwords.confirm && passwords.new !== passwords.confirm
                      ? "Passwords do not match"
                      : undefined
                  }
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                    className={cn(
                      inputClass,
                      passwords.confirm && passwords.new !== passwords.confirm && "border-danger",
                    )}
                    autoComplete="new-password"
                  />
                </FormField>
              </div>
            </SectionCard>
          )}

          {/* Preferences Section */}
          {activeTab === "preferences" && (
            <SectionCard title="Preferences" description="Customize your experience">
              <div className="space-y-4 max-w-lg">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Language">
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                      className={inputClass}
                    >
                      <option value="en">English</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </FormField>
                  <FormField label="Timezone">
                    <select
                      value={preferences.timezone}
                      onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                      className={inputClass}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">Eastern (EST)</option>
                      <option value="PST">Pacific (PST)</option>
                      <option value="GMT">GMT</option>
                    </select>
                  </FormField>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Date Format">
                    <select
                      value={preferences.dateFormat}
                      onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
                      className={inputClass}
                    >
                      <option value="MMM DD, YYYY">Jan 15, 2026</option>
                      <option value="DD/MM/YYYY">15/01/2026</option>
                      <option value="YYYY-MM-DD">2026-01-15</option>
                    </select>
                  </FormField>
                  <FormField label="Items Per Page">
                    <select
                      value={preferences.itemsPerPage}
                      onChange={(e) => setPreferences({ ...preferences, itemsPerPage: e.target.value })}
                      className={inputClass}
                    >
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </FormField>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-border-primary bg-surface-secondary p-4">
                  <div>
                    <p className="text-sm font-medium text-content-primary">Reduced Motion</p>
                    <p className="text-xs text-content-muted">Minimize animations for accessibility</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={preferences.reducedMotion}
                    onClick={() => setPreferences({ ...preferences, reducedMotion: !preferences.reducedMotion })}
                    className={cn(
                      "relative h-6 w-11 rounded-full transition-colors",
                      preferences.reducedMotion ? "bg-primary" : "bg-border-primary",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                        preferences.reducedMotion && "translate-x-5",
                      )}
                    />
                  </button>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Notifications Section */}
          {activeTab === "notifications" && (
            <SectionCard title="Notifications" description="Choose what notifications you receive">
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-content-primary">Email Notifications</h3>
                  <div className="space-y-2">
                    {[
                      { key: "emailDigest", label: "Email Digest", description: "Receive a daily/weekly summary of activity", control: (
                        <select
                          value={notifications.emailDigest}
                          onChange={(e) => setNotifications({ ...notifications, emailDigest: e.target.value })}
                          className="h-9 rounded-lg border border-border-primary bg-white px-3 text-sm text-content-primary"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="never">Never</option>
                        </select>
                      )},
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between rounded-xl border border-border-primary p-4">
                        <div>
                          <p className="text-sm font-medium text-content-primary">{item.label}</p>
                          <p className="text-xs text-content-muted">{item.description}</p>
                        </div>
                        {item.control}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-content-primary">Push Notifications</h3>
                  <div className="space-y-2">
                    {[
                      { key: "examReminders", label: "Exam Reminders", description: "Get reminded about upcoming exams" },
                      { key: "newEnrollments", label: "New Enrollments", description: "When a student enrolls in your course" },
                      { key: "resultPublished", label: "Results Published", description: "When exam results are published" },
                    ].map((item) => {
                      const value = notifications[item.key as keyof typeof notifications] as boolean
                      return (
                        <div key={item.key} className="flex items-center justify-between rounded-xl border border-border-primary p-4">
                          <div>
                            <p className="text-sm font-medium text-content-primary">{item.label}</p>
                            <p className="text-xs text-content-muted">{item.description}</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={value}
                            onClick={() => setNotifications({ ...notifications, [item.key]: !value })}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors shrink-0",
                              value ? "bg-primary" : "bg-border-primary",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                                value && "translate-x-5",
                              )}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-sm font-semibold text-content-primary">Mobile Push</h3>
                  <div className="space-y-2">
                    {[
                      { key: "pushNewMessage", label: "New Messages", description: "When you receive a new message" },
                      { key: "pushDeadlineAlert", label: "Deadline Alerts", description: "When exam deadlines are approaching" },
                    ].map((item) => {
                      const value = notifications[item.key as keyof typeof notifications] as boolean
                      return (
                        <div key={item.key} className="flex items-center justify-between rounded-xl border border-border-primary p-4">
                          <div>
                            <p className="text-sm font-medium text-content-primary">{item.label}</p>
                            <p className="text-xs text-content-muted">{item.description}</p>
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={value}
                            onClick={() => setNotifications({ ...notifications, [item.key]: !value })}
                            className={cn(
                              "relative h-6 w-11 rounded-full transition-colors shrink-0",
                              value ? "bg-primary" : "bg-border-primary",
                            )}
                          >
                            <span
                              className={cn(
                                "absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform",
                                value && "translate-x-5",
                              )}
                            />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Danger Zone */}
          {activeTab === "danger" && (
            <SectionCard title="Danger Zone" description="Irreversible and destructive actions">
              <div className="space-y-4">
                <div className="rounded-xl border border-danger/20 bg-danger-light/20 p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-danger text-white">
                      <Trash2 size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-content-primary">Delete Account</h3>
                      <p className="mt-0.5 text-sm text-content-muted">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <div className="mt-4 space-y-3">
                        <input
                          type="text"
                          value={deleteConfirm}
                          onChange={(e) => setDeleteConfirm(e.target.value)}
                          placeholder='Type "DELETE" to confirm'
                          className={cn(inputClass, "max-w-xs border-danger/50 focus:border-danger focus:ring-danger/20")}
                        />
                        <div>
                          <Button
                            variant="danger"
                            size="sm"
                            disabled={deleteConfirm !== "DELETE"}
                            leftIcon={<Trash2 size={16} />}
                          >
                            Delete Account
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border-primary p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-content-muted">
                      <RefreshCw size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-content-primary">Reset All Data</h3>
                      <p className="mt-0.5 text-sm text-content-muted">
                        Remove all exams, results, and student data. Your account settings will be preserved.
                      </p>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" leftIcon={<RefreshCw size={16} />}>
                          Reset Data
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-border-primary p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-content-muted">
                      <LogOut size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-content-primary">Sign Out</h3>
                      <p className="mt-0.5 text-sm text-content-muted">
                        Sign out of your account on this device.
                      </p>
                      <div className="mt-3">
                        <Button variant="outline" size="sm" leftIcon={<LogOut size={16} />}>
                          Sign Out
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Bottom save bar */}
          <div className="flex items-center justify-end gap-2 border-t border-border-primary pt-4">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-success animate-in fade-in">
                <Check size={14} />
                Changes saved successfully
              </span>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              isLoading={saving}
              leftIcon={!saving ? <Save size={16} /> : undefined}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
