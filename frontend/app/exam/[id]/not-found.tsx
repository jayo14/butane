import Link from "next/link"

export default function ExamNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f9f9ff" }}>
      <div className="text-center max-w-md mx-auto px-6">
        <div className="size-20 rounded-full bg-[#006c49]/10 flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-4xl" style={{ color: "#006c49" }}>school</span>
        </div>
        <h1 className="text-2xl font-bold mb-3" style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}>
          Exam Not Found
        </h1>
        <p className="text-sm mb-8" style={{ color: "#3c4a42" }}>
          This exam could not be found. The link may be invalid or the exam may have been removed.
        </p>
        <Link
          href="/exam/portal"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-full text-sm font-semibold shadow-md transition-all hover:brightness-105"
          style={{ backgroundColor: "#006c49", color: "#ffffff" }}
        >
          Go to Exam Portal
        </Link>
      </div>
    </div>
  )
}
