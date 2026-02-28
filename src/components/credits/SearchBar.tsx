"use client"

import { useMarketStore } from "@/stores/useMarketStore"

export function SearchBar() {
  const { query, setQuery } = useMarketStore()

  return (
    <input
      type="text"
      placeholder="Search by project name, type, region, or ID..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600"
    />
  )
}
