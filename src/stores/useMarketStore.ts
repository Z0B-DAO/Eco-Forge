import { create } from "zustand"

export type OriginFilter = "all" | "certified" | "community"
export type StatusFilter = "all" | "verified" | "pending" | "suspended"
export type SortOption = "newest" | "price_asc" | "price_desc" | "score_desc"

interface MarketState {
  query: string
  origin: OriginFilter
  status: StatusFilter
  sortBy: SortOption
  priceMin: number
  priceMax: number
  scoreMin: number
  scoreMax: number
  projectTypes: string[]
  regions: string[]

  setQuery: (query: string) => void
  setOrigin: (origin: OriginFilter) => void
  setStatus: (status: StatusFilter) => void
  setSortBy: (sortBy: SortOption) => void
  setPriceRange: (min: number, max: number) => void
  setScoreRange: (min: number, max: number) => void
  setProjectTypes: (types: string[]) => void
  setRegions: (regions: string[]) => void
  resetFilters: () => void
}

const initialFilters = {
  query: "",
  origin: "all" as OriginFilter,
  status: "all" as StatusFilter,
  sortBy: "newest" as SortOption,
  priceMin: 0,
  priceMax: 1_000_000,
  scoreMin: 0,
  scoreMax: 100,
  projectTypes: [] as string[],
  regions: [] as string[],
}

export const useMarketStore = create<MarketState>((set) => ({
  ...initialFilters,

  setQuery: (query) => set({ query: query.trim() }),
  setOrigin: (origin) => set({ origin }),
  setStatus: (status) => set({ status }),
  setSortBy: (sortBy) => set({ sortBy }),
  setPriceRange: (priceMin, priceMax) => set({ priceMin, priceMax }),
  setScoreRange: (scoreMin, scoreMax) => set({ scoreMin, scoreMax }),
  setProjectTypes: (projectTypes) => set({ projectTypes }),
  setRegions: (regions) => set({ regions }),
  resetFilters: () => set(initialFilters),
}))
