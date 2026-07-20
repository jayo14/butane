"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Key, ArrowRight, HelpCircle, Timer, School, Loader2, AlertCircle } from "lucide-react"
import { api, ApiError } from "@/lib/api"

export default function ExamPortalPage() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const link = document.createElement("link")
    link.href =
      "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;0,8..60,700;1,8..60,400&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)

    const handleMouseMove = (e: MouseEvent) => {
      if (!cardRef.current) return
      const x = (window.innerWidth / 2 - e.pageX) / 50
      const y = (window.innerHeight / 2 - e.pageY) / 50
      cardRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
    }

    document.addEventListener("mousemove", handleMouseMove)
    return () => {
      document.head.removeChild(link)
      document.removeEventListener("mousemove", handleMouseMove)
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = code.trim().toUpperCase()
    if (cleaned.length !== 8) {
      setError("Please enter an 8-character exam code.")
      return
    }
    setLoading(true)
    setError("")
    try {
      const exam = await api.public.codeLookup(cleaned)
      router.push(`/exam/${exam.id}?token=${encodeURIComponent(cleaned)}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError("No exam found with this code. Check the code and try again.")
      } else {
        setError("Failed to look up exam. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col overflow-x-hidden"
      style={{
        backgroundColor: "#f9f9ff",
        backgroundImage: "radial-gradient(#d0daef 0.5px, transparent 0.5px)",
        backgroundSize: "4px 4px",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{`
        .exam-portal-linen::before {
          content: "";
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background-image: url("https://www.transparenttextures.com/patterns/natural-paper.png");
          background-repeat: repeat;
          opacity: 0.04;
          pointer-events: none;
          z-index: 1;
        }
        .exam-portal-stitch::after {
          content: '';
          position: absolute;
          top: 4px; left: 4px; right: 4px; bottom: 4px;
          border: 2px dashed #005236;
          border-radius: calc(0.75rem - 5px);
          pointer-events: none;
          opacity: 0.45;
        }
        .exam-portal-recessed {
          box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.06);
        }
        .exam-portal-crease {
          height: 1px;
          background: linear-gradient(90deg, transparent, #bbcabf, transparent);
        }
      `}</style>

      <header className="flex w-full justify-center py-6 px-4 md:px-10">
        <div className="flex w-full max-w-[1200px] items-center gap-2">
          <School size={32} color="#006c49" />
          <h1
            style={{
              fontFamily: "'Source Serif 4', serif",
              fontSize: "24px",
              fontWeight: 700,
              color: "#006c49",
              letterSpacing: "-0.01em",
            }}
          >
            Dee Soar CBT
          </h1>
        </div>
      </header>

      <main className="flex flex-grow flex-col items-center justify-center px-4 md:px-10 py-12 relative">
        <div
          ref={cardRef}
          className="exam-portal-linen relative z-10 w-full max-w-[520px] overflow-hidden rounded-xl border border-[#bbcabf]/30 bg-white p-8 shadow-lg transition-all duration-75 md:p-12"
          style={{
            boxShadow:
              "0 10px 15px -3px rgba(55,65,81,0.08), 0 4px 6px -2px rgba(55,65,81,0.05), inset 0 1px 0 0 rgba(255,255,255,0.8)",
          }}
        >
          <div className="exam-portal-stitch relative" />

          <div className="relative z-20 flex flex-col items-center space-y-6 text-center">
            <div
              className="mb-2 flex size-16 items-center justify-center rounded-full"
              style={{ backgroundColor: "#82f5c1" }}
            >
              <Key size={28} color="#00714e" />
            </div>

            <div className="space-y-2">
              <h2
                style={{
                  fontFamily: "'Source Serif 4', serif",
                  fontSize: "32px",
                  lineHeight: "40px",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#121c2a",
                }}
              >
                Enter Exam Code
              </h2>
              <p
                style={{
                  color: "#3c4a42",
                  fontSize: "16px",
                  lineHeight: "24px",
                }}
              >
                Please enter the 8-character access code provided by your instructor to begin your assessment.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full space-y-6 pt-4">
              <div className="relative">
                <label
                  htmlFor="exam-code"
                  className="absolute -top-2.5 left-4 z-20 px-1"
                  style={{
                    backgroundColor: "white",
                    fontSize: "12px",
                    lineHeight: "16px",
                    letterSpacing: "0.05em",
                    fontWeight: 700,
                    color: "#6c7a71",
                  }}
                >
                  Access Code
                </label>
                <input
                  id="exam-code"
                  type="text"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))
                    setError("")
                  }}
                  placeholder="e.g. EX-9921"
                  maxLength={8}
                  autoComplete="off"
                  spellCheck={false}
                  autoFocus
                  className="exam-portal-recessed w-full h-16 text-center text-2xl font-bold tracking-widest rounded-lg border bg-white outline-none transition-all"
                  style={{
                    borderColor: error ? "#ba1a1a" : "#bbcabf",
                    color: "#121c2a",
                    caretColor: "#006c49",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "#006c49"
                    e.target.style.boxShadow = "0 0 0 2px rgba(0,108,73,0.2)"
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = error ? "#ba1a1a" : "#bbcabf"
                    e.target.style.boxShadow = "inset 0 2px 4px 0 rgba(0,0,0,0.06)"
                  }}
                />
                {error && (
                  <p className="mt-2 flex items-center justify-center gap-1.5 text-sm" style={{ color: "#ba1a1a" }} role="alert">
                    <AlertCircle size={14} />
                    {error}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || code.length !== 8}
                className="flex w-full h-16 items-center justify-center gap-2 rounded-lg text-base font-semibold transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "#10b981",
                  color: "#00422b",
                }}
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    Start Exam
                    <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="w-full pt-6">
              <div className="exam-portal-crease mb-6" />
              <div
                className="flex flex-col items-center justify-center gap-4 md:flex-row"
                style={{ color: "#3c4a42" }}
              >
                <a
                  href="#"
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:opacity-80"
                >
                  <HelpCircle size={16} />
                  Need help?
                </a>
                <span className="hidden opacity-30 md:block">|</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                  <Timer size={16} />
                  System active
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 select-none opacity-40">
          <div
            className="rounded-full border border-dashed px-4 py-1 text-xs font-semibold uppercase tracking-widest"
            style={{ borderColor: "#bbcabf", color: "#bbcabf" }}
          >
            Official Exam Portal
          </div>
        </div>
      </main>
    </div>
  )
}
