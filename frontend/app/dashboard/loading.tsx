import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLoading() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <Skeleton variant="text" className="h-8 w-48" />
        <Skeleton variant="text" className="mt-2 h-4 w-72" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-border-primary bg-white p-6">
            <div className="flex items-center justify-between">
              <Skeleton variant="circular" className="size-10" />
              <Skeleton variant="text" className="h-5 w-12 rounded-full" />
            </div>
            <Skeleton variant="text" className="mt-4 h-4 w-24" />
            <Skeleton variant="text" className="mt-1 h-8 w-16" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-xl border border-border-primary bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <Skeleton variant="text" className="h-6 w-36" />
              <Skeleton variant="text" className="h-8 w-20 rounded-lg" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-border-primary p-3">
                  <div className="flex-1">
                    <Skeleton variant="text" className="h-4 w-48" />
                    <Skeleton variant="text" className="mt-1 h-3 w-32" />
                  </div>
                  <Skeleton variant="text" className="h-5 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <div className="rounded-xl border border-border-primary bg-white p-6">
            <Skeleton variant="text" className="h-6 w-32" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton variant="circular" className="size-10" />
                  <div className="flex-1">
                    <Skeleton variant="text" className="h-4 w-36" />
                    <Skeleton variant="text" className="mt-1 h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
