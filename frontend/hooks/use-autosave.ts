"use client"

import { useEffect, useRef, useState, useCallback } from "react"

export type AutosaveStatus = "idle" | "saving" | "saved" | "error"

interface UseAutosaveOptions<T> {
  data: T
  onSave: (data: T) => Promise<void>
  delay?: number
}

export function useAutosave<T>({ data, onSave, delay = 3000 }: UseAutosaveOptions<T>) {
  const [status, setStatus] = useState<AutosaveStatus>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const previousDataRef = useRef(data)
  const isFirstRender = useRef(true)

  const save = useCallback(async () => {
    setStatus("saving")
    try {
      await onSave(data)
      setStatus("saved")
    } catch {
      setStatus("error")
    }
  }, [data, onSave])

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      previousDataRef.current = data
      return
    }

    if (JSON.stringify(data) === JSON.stringify(previousDataRef.current)) return

    previousDataRef.current = data
    setStatus("idle")

    if (timeoutRef.current) clearTimeout(timeoutRef.current)

    timeoutRef.current = setTimeout(() => {
      save()
    }, delay)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [data, delay, save])

  function triggerSave() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    save()
  }

  return { status, triggerSave }
}
