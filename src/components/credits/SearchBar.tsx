"use client"

import { useMarketStore } from "@/stores/useMarketStore"

export function SearchBar() {
  const { query, setQuery } = useMarketStore()

  return (
    <input
      type="text"
      placeholder="Search..."
      value={query}
      onChange={(e) => setQuery(e.target.value)}
      className="rounded-full border-[1.5px] border-white bg-transparent px-5 py-2 text-sm text-white placeholder-white/40 outline-none transition-all duration-200 focus:border-white focus:ring-0 w-64"
    />
  )
}
