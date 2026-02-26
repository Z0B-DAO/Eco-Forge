"use client"

import { useEffect } from "react"

type ToastVariant = "success" | "error" | "info"

interface ToastProps {
  message: string
  variant?: ToastVariant
  onClose: () => void
  duration?: number
}

const VARIANT_STYLES: Record<ToastVariant, string> = {
  success: "border-green-500/30 bg-green-50 text-green-800 dark:bg-green-950/50 dark:text-green-300",
  error: "border-red-500/30 bg-red-50 text-red-800 dark:bg-red-950/50 dark:text-red-300",
  info: "border-zinc-300 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200",
}

export function Toast({ message, variant = "info", onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [onClose, duration])

  return (
    <div className={`fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${VARIANT_STYLES[variant]}`}>
      {message}
    </div>
  )
}
