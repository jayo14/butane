"use client"

import { useState, useRef } from "react"
import { ImagePlus, X, Loader2, Trash2 } from "lucide-react"
import { api } from "@/lib/api"

interface ImageUploaderProps {
  imageUrl?: string | null
  onUpload: (url: string) => void
  onRemove: () => void
}

export function ImageUploader({ imageUrl, onUpload, onRemove }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const result = await api.upload.image(file)
      onUpload(result.url)
    } catch (err: any) {
      setError(err.message || "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  return (
    <div>
      {imageUrl ? (
        <div className="relative inline-block rounded-lg overflow-hidden border" style={{ borderColor: "#bbcabf" }}>
          <img
            src={imageUrl}
            alt="Question image"
            className="max-h-48 w-auto object-contain"
          />
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 flex size-6 items-center justify-center rounded-full bg-white/80 hover:bg-white shadow-sm transition-colors"
          >
            <Trash2 size={12} style={{ color: "#ba1a1a" }} />
          </button>
        </div>
      ) : (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: "#bbcabf", color: "#3c4a42" }}
          >
            {uploading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <ImagePlus size={14} />
            )}
            {uploading ? "Uploading..." : "Add Image"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </div>
      )}
      {error && <p className="mt-1 text-[10px] font-medium" style={{ color: "#ba1a1a" }}>{error}</p>}
    </div>
  )
}
