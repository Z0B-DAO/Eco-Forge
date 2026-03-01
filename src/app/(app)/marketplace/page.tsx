"use client"

import { useMemo } from "react"
import { useMarketStore } from "@/stores/useMarketStore"
import { CreditCard } from "@/components/credits/CreditCard"
import { useCredits } from "@/hooks/useCredits"
import { useMarketplace } from "@/hooks/useMarketplace"
import { CreditFilters } from "@/components/credits/CreditFilters"
import { EmptyState } from "@/components/common/EmptyState"
import { LoadingBar } from "@/components/common/LoadingSpinner"
import { CreditOrigin, CreditStatus } from "@/types"
import type { CreditType, Listing } from "@/types"

export default function MarketplacePage() {
  const { data: credits, isLoading: creditsLoading } = useCredits()
  const { data: listings, isLoading: listingsLoading } = useMarketplace()
  const { query, origin, status, sortBy } = useMarketStore()

  const listingMap = useMemo(() => {
    const map = new Map<string, Listing>()
    if (listings) {
      for (const listing of listings) {
        map.set(listing.creditId.toString(), listing)
      }
    }
    return map
  }, [listings])

  const filtered = useMemo(() => {
    if (!credits) return []

    let result = credits.filter((c: CreditType) => {
      if (query) {
        const q = query.toLowerCase()
        const matches =
          c.projectName.toLowerCase().includes(q) ||
          c.projectType.toLowerCase().includes(q) ||
          c.region.toLowerCase().includes(q) ||
          c.id.toString() === q
        if (!matches) return false
      }

      if (origin === "certified" && c.origin !== CreditOrigin.Certified) return false
      if (origin === "community" && c.origin !== CreditOrigin.CommunityVerified) return false

      if (status === "verified" && c.status !== CreditStatus.Verified) return false
      if (status === "pending" && c.status !== CreditStatus.Pending) return false
      if (status === "suspended" && c.status !== CreditStatus.Suspended) return false

      return true
    })

    result.sort((a: CreditType, b: CreditType) => {
      switch (sortBy) {
        case "newest":
          return Number(b.id) - Number(a.id)
        case "score_desc":
          return Number(b.impactScore) - Number(a.impactScore)
        case "price_asc": {
          const priceA = listingMap.get(a.id.toString())?.pricePerUnit ?? 0n
          const priceB = listingMap.get(b.id.toString())?.pricePerUnit ?? 0n
          return Number(priceA - priceB)
        }
        case "price_desc": {
          const priceA = listingMap.get(a.id.toString())?.pricePerUnit ?? 0n
          const priceB = listingMap.get(b.id.toString())?.pricePerUnit ?? 0n
          return Number(priceB - priceA)
        }
        default:
          return 0
      }
    })

    return result
  }, [credits, query, origin, status, sortBy, listingMap])

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 overflow-hidden">
            <CreditFilters />
          </div>
          <span className="shrink-0 text-sm text-white/40">
            {filtered.length} credit{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <LoadingBar isLoading={creditsLoading || listingsLoading}>
          {filtered.length === 0 ? (
            <EmptyState
              title="No credits found"
              description={query ? `No results for "${query}". Try a different search.` : "No credits match your filters."}
            />
          ) : (
            <div className="grid gap-4 pb-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((credit: CreditType) => (
                <CreditCard
                  key={credit.id.toString()}
                  credit={credit}
                  listing={listingMap.get(credit.id.toString())}
                />
              ))}
            </div>
          )}
        </LoadingBar>
      </div>
    </div>
  )
}
