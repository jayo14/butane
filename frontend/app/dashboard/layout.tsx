import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { AuthGuard } from "./auth-guard"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { SidebarProvider } from "@/lib/sidebar-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden">
          <a
            href="#main-content"
            className="fixed -top-full left-4 z-[100] rounded-b-xl bg-primary px-4 py-2 text-sm font-medium text-white shadow-lg transition-all focus:top-0 focus-visible:outline-2 focus-visible:outline-white"
          >
            Skip to main content
          </a>
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <Header />
            <main id="main-content" className="flex-1 overflow-y-auto bg-surface-secondary p-4 md:p-6 lg:p-8">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  )
}
