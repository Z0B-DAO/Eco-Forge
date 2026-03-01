"use client"

import {
  useMarketStore,
  type OriginFilter,
  type StatusFilter,
  type SortOption,
} from "@/stores/useMarketStore"

type FilterItem =
  | { type: "origin"; value: OriginFilter; label: string }
  | { type: "status"; value: StatusFilter; label: string }
  | { type: "sort"; value: SortOption; label: string }

const FILTERS: FilterItem[] = [
  { type: "origin", value: "all", label: "All" },
  { type: "origin", value: "certified", label: "Certified" },
  { type: "origin", value: "community", label: "Community" },
  { type: "status", value: "verified", label: "Verified" },
  { type: "status", value: "pending", label: "Pending" },
  { type: "status", value: "suspended", label: "Suspended" },
  { type: "sort", value: "newest", label: "Newest" },
  { type: "sort", value: "price_asc", label: "Price ↑" },
  { type: "sort", value: "price_desc", label: "Price ↓" },
  { type: "sort", value: "score_desc", label: "Score ↓" },
]

export function CreditFilters() {
  const { origin, status, sortBy, setOrigin, setStatus, setSortBy, resetFilters } =
    useMarketStore()

  const isActive = (item: FilterItem) => {
    if (item.type === "origin") return origin === item.value
    if (item.type === "status") return status === item.value
    return sortBy === item.value
  }

  const handleClick = (item: FilterItem) => {
    if (item.type === "origin") setOrigin(isActive(item) ? "all" : item.value)
    else if (item.type === "status") setStatus(isActive(item) ? "all" : item.value)
    else setSortBy(isActive(item) ? "newest" : item.value)
  }

  const hasActiveFilter = origin !== "all" || status !== "all" || sortBy !== "newest"

  const groups = [
    FILTERS.filter((f) => f.type === "origin"),
    FILTERS.filter((f) => f.type === "status"),
    FILTERS.filter((f) => f.type === "sort"),
  ]

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-2">
          {gi > 0 && <div className="h-6 w-px shrink-0 bg-white/40" />}
          {group.map((item) => (
            <button
              key={`${item.type}-${item.value}`}
              onClick={() => handleClick(item)}
              className={`shrink-0 cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                isActive(item)
                  ? "bg-white text-background"
                  : "bg-white/10 text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
      {hasActiveFilter && (
        <>
          <div className="h-6 w-px shrink-0 bg-white/40" />
          <button
            onClick={resetFilters}
            className="shrink-0 cursor-pointer px-2 text-sm text-white/40"
          >
            ✕
          </button>
        </>
      )}
    </div>
  )
}
