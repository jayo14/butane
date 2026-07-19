import { GraduationCap, BookOpen, ClipboardCheck, Sparkles } from "lucide-react"
import { APP_NAME, APP_DESCRIPTION } from "@/lib/constants"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-primary/5 via-surface-primary to-baby-pink/20 p-12 lg:flex">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 mx-auto max-w-lg">
          <div className="mb-8 animate-float">
            <div className="relative mx-auto flex size-32 items-center justify-center">
              <div className="absolute inset-0 animate-pulse-slow rounded-[2rem] bg-primary/10" />
              <div className="relative flex size-24 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/20">
                <GraduationCap size={48} />
              </div>
            </div>
          </div>
          <h1 className="mb-3 text-center text-3xl font-bold text-content-primary">
            {APP_NAME}
          </h1>
          <p className="mb-12 text-center text-lg text-content-secondary">
            {APP_DESCRIPTION}
          </p>
          <div className="space-y-6">
            {[
              { icon: BookOpen, text: "Create and manage computer-based tests with ease" },
              { icon: ClipboardCheck, text: "Real-time grading and comprehensive analytics" },
              { icon: Sparkles, text: "Secure, scalable platform for modern education" },
            ].map((item, i) => (
              <div
                key={item.text}
                className="flex items-center gap-4 rounded-2xl bg-white/60 p-4 backdrop-blur-sm transition-all hover:bg-white/80"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon size={24} />
                </div>
                <p className="text-sm leading-relaxed text-content-primary">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-12 text-center text-xs text-content-muted">
            &copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
        </div>
      </div>
      <div className="flex w-full items-center justify-center bg-surface-primary px-4 lg:w-1/2">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </div>
    </div>
  )
}
