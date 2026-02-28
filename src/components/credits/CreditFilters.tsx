"use client"

import {
  useMarketStore,
  type OriginFilter,
  type StatusFilter,
  type SortOption,
} from "@/stores/useMarketStore"

const ORIGINS: { value: OriginFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "certified", label: "Certified" },
  { value: "community", label: "Community" },
]

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "verified", label: "Verified" },
  { value: "pending", label: "Pending" },
  { value: "suspended", label: "Suspended" },
]

const SORTS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
  { value: "score_desc", label: "Score ↓" },
]

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
          : "bg-zinc-800 text-zinc-400 border border-zinc-700 hover:text-zinc-200"
      }`}
    >
      {label}
    </button>
  )
}

export function CreditFilters() {
  const { origin, status, sortBy, setOrigin, setStatus, setSortBy, resetFilters } =
    useMarketStore()

  return (
    <div className="flex flex-wrap items-end gap-6">
      <FilterGroup label="Origin">
        {ORIGINS.map((o) => (
          <Chip key={o.value} label={o.label} active={origin === o.value} onClick={() => setOrigin(o.value)} />
        ))}
      </FilterGroup>

      <FilterGroup label="Status">
        {STATUSES.map((s) => (
          <Chip key={s.value} label={s.label} active={status === s.value} onClick={() => setStatus(s.value)} />
        ))}
      </FilterGroup>

      <FilterGroup label="Sort">
        {SORTS.map((s) => (
          <Chip key={s.value} label={s.label} active={sortBy === s.value} onClick={() => setSortBy(s.value)} />
        ))}
      </FilterGroup>

      <button
        onClick={resetFilters}
        className="ml-auto text-xs text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Reset filters
      </button>
    </div>
  )
}
