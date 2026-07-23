import Link from "next/link"
import { GraduationCap, BookOpen, ClipboardList, BarChart3, ArrowRight } from "lucide-react"

const features = [
  {
    icon: BookOpen,
    title: "Exam Management",
    description: "Create, schedule, and manage CBT exams with automated grading and instant results.",
  },
  {
    icon: ClipboardList,
    title: "Smart Assessments",
    description: "Built-in assessment components, score entry, and report card generation for comprehensive evaluation.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description: "Detailed analytics, performance distribution charts, and exportable PDF report cards.",
  },
]

const steps = [
  "Register your school",
  "Verify your email",
  "Set up your academic session",
  "Create classrooms and subjects",
  "Invite teachers and enroll students",
  "Start creating exams and assessments",
]

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b border-border-primary bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-sm shadow-primary/20">
            <GraduationCap size={20} />
          </div>
          <span className="text-lg font-semibold">Dee Soar School</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-lg px-4 py-2 text-sm font-medium text-content-primary transition-colors hover:bg-surface-secondary"
          >
            Sign In
          </Link>
          <Link
            href="/register-school"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Get Started
          </Link>
        </div>
      </header>

      <section className="flex flex-col items-center px-6 py-20 text-center md:py-28">
        <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
          School Management Platform
        </div>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-content-primary md:text-5xl lg:text-6xl">
          All-in-one school management for{" "}
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">modern education</span>
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-content-secondary">
          Manage exams, assessments, report cards, and analytics — all in one place.
          Built for teachers and school administrators.
        </p>
        <div className="mt-8 flex items-center gap-4">
          <Link
            href="/register-school"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Get Started Free
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-border-primary bg-white px-6 py-3 text-sm font-semibold text-content-primary transition-all hover:bg-surface-secondary"
          >
            Sign In
          </Link>
        </div>
      </section>

      <section className="border-t border-border-primary bg-surface-secondary px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-content-primary">Everything you need</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-border-primary bg-white p-8 transition-shadow hover:shadow-lg">
                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon size={24} />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-content-primary">{feature.title}</h3>
                <p className="text-sm text-content-secondary">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-content-primary">Get started in minutes</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {steps.map((step, i) => (
              <div key={step} className="flex items-start gap-3 rounded-xl border border-border-primary bg-white p-5">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <p className="pt-1 text-sm text-content-primary">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border-primary bg-primary px-6 py-16 text-center text-primary-foreground">
        <h2 className="text-3xl font-bold">Ready to transform your school?</h2>
        <p className="mt-2 text-primary-foreground/80">Join schools already using our platform.</p>
        <Link
          href="/register-school"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-lg transition-all hover:bg-white/90"
        >
          Get Started Free
          <ArrowRight size={18} />
        </Link>
      </section>

      <footer className="border-t border-border-primary bg-white px-6 py-8 text-center text-sm text-content-muted">
        &copy; {new Date().getFullYear()} Dee Soar School. All rights reserved.
      </footer>
    </div>
  )
}
