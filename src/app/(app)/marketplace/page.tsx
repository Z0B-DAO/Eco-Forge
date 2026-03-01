"use client"

import { useMemo } from "react"
import { useMarketStore } from "@/stores/useMarketStore"
import { CreditCard } from "@/components/credits/CreditCard"

import { CreditFilters } from "@/components/credits/CreditFilters"
import { EmptyState } from "@/components/common/EmptyState"
import { CreditOrigin, CreditStatus } from "@/types"
import type { CreditType, Listing } from "@/types"

const MOCK_CREDITS: CreditType[] = [
  {
    id: 1n,
    projectName: "Amazon Rainforest REDD+",
    projectType: "Forest Conservation",
    region: "Brazil",
    vintageYear: 2024n,
    tonnesCO2e: 5000n,
    totalSupply: 5000n,
    impactScore: 92n,
    metadataURI: "ipfs://QmMockHash1",
    origin: CreditOrigin.Certified,
    status: CreditStatus.Verified,
    issuer: "0x1234567890abcdef1234567890abcdef12345678",
    registrySource: "Verra",
    retirementProof: "VCS-2024-001",
  },
  {
    id: 2n,
    projectName: "Gujarat Solar Farm",
    projectType: "Renewable Energy",
    region: "India",
    vintageYear: 2024n,
    tonnesCO2e: 12000n,
    totalSupply: 12000n,
    impactScore: 87n,
    metadataURI: "ipfs://QmMockHash2",
    origin: CreditOrigin.Certified,
    status: CreditStatus.Verified,
    issuer: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
    registrySource: "Gold Standard",
    retirementProof: "GS-2024-042",
  },
  {
    id: 3n,
    projectName: "Mangrove Restoration Senegal",
    projectType: "Blue Carbon",
    region: "Senegal",
    vintageYear: 2025n,
    tonnesCO2e: 800n,
    totalSupply: 800n,
    impactScore: 78n,
    metadataURI: "ipfs://QmMockHash3",
    origin: CreditOrigin.CommunityVerified,
    status: CreditStatus.Pending,
    issuer: "0x9876543210fedcba9876543210fedcba98765432",
    registrySource: "",
    retirementProof: "",
  },
  {
    id: 4n,
    projectName: "Kenya Cookstoves Program",
    projectType: "Clean Cooking",
    region: "Kenya",
    vintageYear: 2024n,
    tonnesCO2e: 3200n,
    totalSupply: 3200n,
    impactScore: 95n,
    metadataURI: "ipfs://QmMockHash4",
    origin: CreditOrigin.Certified,
    status: CreditStatus.Verified,
    issuer: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef",
    registrySource: "Gold Standard",
    retirementProof: "GS-2024-108",
  },
  {
    id: 5n,
    projectName: "Borneo Peatland Protection",
    projectType: "Wetland Conservation",
    region: "Indonesia",
    vintageYear: 2025n,
    tonnesCO2e: 1500n,
    totalSupply: 1500n,
    impactScore: 64n,
    metadataURI: "ipfs://QmMockHash5",
    origin: CreditOrigin.CommunityVerified,
    status: CreditStatus.Verified,
    issuer: "0xcafebabecafebabecafebabecafebabecafebabe",
    registrySource: "",
    retirementProof: "",
  },
]

const MOCK_LISTINGS: Listing[] = [
  { listingId: 1n, creditId: 1n, seller: "0x1234567890abcdef1234567890abcdef12345678", amount: 500n, pricePerUnit: 2500000000000000n, active: true },
  { listingId: 2n, creditId: 2n, seller: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", amount: 2000n, pricePerUnit: 1800000000000000n, active: true },
  { listingId: 3n, creditId: 3n, seller: "0x9876543210fedcba9876543210fedcba98765432", amount: 800n, pricePerUnit: 4200000000000000n, active: true },
  { listingId: 4n, creditId: 4n, seller: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", amount: 1000n, pricePerUnit: 3100000000000000n, active: true },
  { listingId: 5n, creditId: 5n, seller: "0xcafebabecafebabecafebabecafebabecafebabe", amount: 1500n, pricePerUnit: 900000000000000n, active: true },
]

export default function MarketplacePage() {
  const credits = MOCK_CREDITS
  const listings = MOCK_LISTINGS
  const { query, origin, status, sortBy } = useMarketStore()

  const listingMap = useMemo(() => {
    const map = new Map<string, Listing>()
    for (const listing of listings) {
      map.set(listing.creditId.toString(), listing)
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
    <div className="space-y-6">
      <div className="sticky top-[80px] z-30 -mx-6 bg-background px-6 py-3">
        <div className="flex items-center gap-4">
          <div className="flex-1 overflow-hidden">
            <CreditFilters />
          </div>
          <span className="shrink-0 text-sm text-white/40">
            {filtered.length} credit{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No credits found"
          description={query ? `No results for "${query}". Try a different search.` : "No credits match your filters."}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((credit: CreditType) => (
              <CreditCard
                key={credit.id.toString()}
                credit={credit}
                listing={listingMap.get(credit.id.toString())}
              />
            ))}
          </div>
      )}
    </div>
  )
}
