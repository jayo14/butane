"use client"

import { useState, useRef, useCallback } from "react"
import { FileSpreadsheet, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CsvUploaderProps {
  onFile: (file: File) => void
  accept?: string
  disabled?: boolean
  className?: string
}

export function CsvUploader({
  onFile,
  accept = ".csv",
  disabled = false,
  className,
}: CsvUploaderProps) {
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) onFile(file)
      if (inputRef.current) inputRef.current.value = ""
    },
    [onFile],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files?.[0]
      if (file && (file.name.endsWith(".csv") || accept.split(",").some((ext) => file.name.endsWith(ext.trim())))) {
        onFile(file)
      }
    },
    [onFile, accept],
  )

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
        dragOver
          ? "border-green-500 bg-green-50"
          : "border-border-primary hover:border-content-muted",
        disabled && "opacity-50 pointer-events-none",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
    >
      <FileSpreadsheet size={32} className="text-content-muted" />
      <p className="text-sm font-medium text-content-primary">
        Drop a CSV file here or click to browse
      </p>
      <p className="text-xs text-content-muted">
        Supports .csv files with student roster data
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
        aria-label="Upload CSV file"
      />
    </div>
  )
}
