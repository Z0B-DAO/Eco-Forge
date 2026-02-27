"use client"

import { useMemo } from "react"
import { useCredits } from "./useCredits"
import type { CreditType } from "@/types"

export function useSearchCredits(query: string) {
  const { data: credits, isLoading, error, refetch } = useCredits()

  const filtered = useMemo(() => {
    if (!credits || !query.trim()) return credits || []

    const q = query.toLowerCase()

    return credits.filter((credit: CreditType) =>
      credit.projectName.toLowerCase().includes(q) ||
      credit.projectType.toLowerCase().includes(q) ||
      credit.region.toLowerCase().includes(q) ||
      credit.id.toString() === q
    )
  }, [credits, query])

  return { data: filtered, isLoading, error, refetch }
}
