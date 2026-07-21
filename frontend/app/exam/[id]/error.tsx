"use client"

export default function ExamError({ reset }: { reset: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f9f9ff" }}>
      <div className="text-center max-w-md mx-auto px-6">
        <div className="size-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl" style={{ color: "#ba1a1a" }}>error_outline</span>
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}>
          Something went wrong
        </h1>
        <p className="text-sm mb-8" style={{ color: "#3c4a42" }}>
          We could not load this page. Please check your connection and try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold shadow-md transition-all hover:brightness-105"
          style={{ backgroundColor: "#006c49", color: "#ffffff" }}
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
