import { GraduationCap, BookOpen, ClipboardCheck, Sparkles } from "lucide-react"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 via-surface-primary to-mint/20 p-12 lg:flex">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMwNTk2NjkiIGZpbGwtb3BhY2l0eT0iMC4wNCI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 mx-auto max-w-lg">
          <div className="mb-8 animate-float">
            <div className="relative mx-auto flex size-40 items-center justify-center">
              <div className="absolute inset-0 animate-pulse-slow rounded-[2.5rem] bg-primary/10" />
              <div className="relative flex size-28 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/70 text-white shadow-xl shadow-primary/30">
                <GraduationCap size={52} />
              </div>
            </div>
          </div>
          <h1 className="mb-2 text-center text-4xl font-bold text-content-primary">
            {APP_NAME}
          </h1>
          <p className="mb-10 text-center text-lg text-content-secondary">
            {APP_DESCRIPTION}
          </p>
          <div className="space-y-5">
            {[
              { icon: BookOpen, text: "Create and manage computer-based tests with ease" },
              { icon: ClipboardCheck, text: "Real-time grading and comprehensive analytics" },
              { icon: Sparkles, text: "Secure, scalable platform for modern education" },
            ].map((item, i) => (
              <div
                key={item.text}
                className="flex items-center gap-5 rounded-2xl bg-white/70 p-5 backdrop-blur-sm transition-all duration-300 hover:bg-white/90 hover:shadow-card hover:-translate-y-0.5"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="flex size-13 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-sm">
                  <item.icon size={26} />
                </div>
                <p className="text-sm leading-relaxed text-content-primary font-medium">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-sm text-content-muted">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-gradient-to-br from-surface-primary to-surface-secondary/50 px-6 lg:w-1/2">
        <div className="w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </div>
    </div>
  )
}
