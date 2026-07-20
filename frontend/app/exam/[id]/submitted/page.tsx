"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle } from "lucide-react"

export default function SubmittedPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [id, setId] = useState("")

  useEffect(() => {
    params.then((p) => setId(p.id))
  }, [params])

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: "#f9f9ff" }}>
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full" style={{ backgroundColor: "#d1fae5" }}>
          <CheckCircle size={40} style={{ color: "#006c49" }} />
        </div>
        <h1
          className="text-2xl font-bold mb-2"
          style={{ color: "#121c2a", fontFamily: "'Source Serif 4', serif" }}
        >
          Assessment Submitted
        </h1>
        <p className="mb-8" style={{ color: "#3c4a42" }}>
          Your answers have been recorded successfully. You may now close this window.
        </p>
        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => router.push("/exam/portal")}
            className="px-8 py-3 rounded-full font-semibold text-sm transition-all hover:brightness-105"
            style={{ backgroundColor: "#006c49", color: "#ffffff" }}
          >
            Back to Exam Portal
          </button>
        </div>
      </div>
    </div>
  )
}
