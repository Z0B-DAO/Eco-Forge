"use client"

import { useMemo } from "react"
import { useMarketStore } from "@/stores/useMarketStore"
import { CreditCard } from "@/components/credits/CreditCard"

import { CreditFilters } from "@/components/credits/CreditFilters"
import { EmptyState } from "@/components/common/EmptyState"
import { CreditOrigin, CreditStatus } from "@/types"
import type { CreditType, Listing } from "@/types"

const MOCK_CREDITS: CreditType[] = [
  { id: 1n, projectName: "Amazon Rainforest REDD+", projectType: "Forest Conservation", region: "Brazil", vintageYear: 2024n, tonnesCO2e: 5000n, totalSupply: 5000n, impactScore: 92n, metadataURI: "ipfs://QmMockHash1", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0x1234567890abcdef1234567890abcdef12345678", registrySource: "Verra", retirementProof: "VCS-2024-001" },
  { id: 2n, projectName: "Gujarat Solar Farm", projectType: "Renewable Energy", region: "India", vintageYear: 2024n, tonnesCO2e: 12000n, totalSupply: 12000n, impactScore: 87n, metadataURI: "ipfs://QmMockHash2", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", registrySource: "Gold Standard", retirementProof: "GS-2024-042" },
  { id: 3n, projectName: "Mangrove Restoration Senegal", projectType: "Blue Carbon", region: "Senegal", vintageYear: 2025n, tonnesCO2e: 800n, totalSupply: 800n, impactScore: 78n, metadataURI: "ipfs://QmMockHash3", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0x9876543210fedcba9876543210fedcba98765432", registrySource: "", retirementProof: "" },
  { id: 4n, projectName: "Kenya Cookstoves Program", projectType: "Clean Cooking", region: "Kenya", vintageYear: 2024n, tonnesCO2e: 3200n, totalSupply: 3200n, impactScore: 95n, metadataURI: "ipfs://QmMockHash4", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", registrySource: "Gold Standard", retirementProof: "GS-2024-108" },
  { id: 5n, projectName: "Borneo Peatland Protection", projectType: "Wetland Conservation", region: "Indonesia", vintageYear: 2025n, tonnesCO2e: 1500n, totalSupply: 1500n, impactScore: 64n, metadataURI: "ipfs://QmMockHash5", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Verified, issuer: "0xcafebabecafebabecafebabecafebabecafebabe", registrySource: "", retirementProof: "" },
  { id: 6n, projectName: "Patagonia Wind Farm", projectType: "Renewable Energy", region: "Argentina", vintageYear: 2025n, tonnesCO2e: 8500n, totalSupply: 8500n, impactScore: 89n, metadataURI: "ipfs://QmMockHash6", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xaabbccddaabbccddaabbccddaabbccddaabbccdd", registrySource: "Verra", retirementProof: "VCS-2025-012" },
  { id: 7n, projectName: "Congo Basin Agroforestry", projectType: "Agroforestry", region: "DR Congo", vintageYear: 2024n, tonnesCO2e: 2200n, totalSupply: 2200n, impactScore: 73n, metadataURI: "ipfs://QmMockHash7", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Verified, issuer: "0x1111222233334444555566667777888899990000", registrySource: "", retirementProof: "" },
  { id: 8n, projectName: "Norwegian Kelp Farming", projectType: "Blue Carbon", region: "Norway", vintageYear: 2025n, tonnesCO2e: 450n, totalSupply: 450n, impactScore: 81n, metadataURI: "ipfs://QmMockHash8", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0xffeeddccbbaa99887766554433221100ffeeddcc", registrySource: "", retirementProof: "" },
  { id: 9n, projectName: "Thai Biochar Initiative", projectType: "Biochar", region: "Thailand", vintageYear: 2024n, tonnesCO2e: 1800n, totalSupply: 1800n, impactScore: 91n, metadataURI: "ipfs://QmMockHash9", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555", registrySource: "Verra", retirementProof: "VCS-2024-089" },
  { id: 10n, projectName: "Sahel Great Green Wall", projectType: "Reforestation", region: "Niger", vintageYear: 2025n, tonnesCO2e: 6700n, totalSupply: 6700n, impactScore: 85n, metadataURI: "ipfs://QmMockHash10", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0x5555666677778888999900001111222233334444", registrySource: "Gold Standard", retirementProof: "GS-2025-003" },
  { id: 11n, projectName: "Chilean Lithium Wetland Offset", projectType: "Wetland Conservation", region: "Chile", vintageYear: 2024n, tonnesCO2e: 950n, totalSupply: 950n, impactScore: 58n, metadataURI: "ipfs://QmMockHash11", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Suspended, issuer: "0xbadbadbadbadbadbadbadbadbadbadbadbadbadba", registrySource: "", retirementProof: "" },
  { id: 12n, projectName: "Iceland Geothermal DAC", projectType: "Direct Air Capture", region: "Iceland", vintageYear: 2025n, tonnesCO2e: 200n, totalSupply: 200n, impactScore: 98n, metadataURI: "ipfs://QmMockHash12", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xdac0dac0dac0dac0dac0dac0dac0dac0dac0dac0", registrySource: "Verra", retirementProof: "VCS-2025-DAC-001" },
  { id: 13n, projectName: "Madagascar Vanilla Agroforestry", projectType: "Agroforestry", region: "Madagascar", vintageYear: 2024n, tonnesCO2e: 1100n, totalSupply: 1100n, impactScore: 76n, metadataURI: "ipfs://QmMockHash13", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Verified, issuer: "0x1234abcd5678ef901234abcd5678ef901234abcd", registrySource: "", retirementProof: "" },
  { id: 14n, projectName: "Australian Savanna Burning", projectType: "Fire Management", region: "Australia", vintageYear: 2024n, tonnesCO2e: 4300n, totalSupply: 4300n, impactScore: 83n, metadataURI: "ipfs://QmMockHash14", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xaussieaussieaussieaussieaussieaussieaussie00", registrySource: "Verra", retirementProof: "VCS-2024-AU-055" },
  { id: 15n, projectName: "Vietnam Mangrove Belt", projectType: "Blue Carbon", region: "Vietnam", vintageYear: 2025n, tonnesCO2e: 2800n, totalSupply: 2800n, impactScore: 88n, metadataURI: "ipfs://QmMockHash15", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvn", registrySource: "Gold Standard", retirementProof: "GS-2025-VN-011" },
  { id: 16n, projectName: "Peru Cloud Forest Protection", projectType: "Forest Conservation", region: "Peru", vintageYear: 2024n, tonnesCO2e: 3600n, totalSupply: 3600n, impactScore: 90n, metadataURI: "ipfs://QmMockHash16", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xperuperuperuperuperuperuperuperuperuperuperu", registrySource: "Verra", retirementProof: "VCS-2024-PE-023" },
  { id: 17n, projectName: "Bangladesh Solar Microgrid", projectType: "Renewable Energy", region: "Bangladesh", vintageYear: 2025n, tonnesCO2e: 750n, totalSupply: 750n, impactScore: 69n, metadataURI: "ipfs://QmMockHash17", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0xbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbd", registrySource: "", retirementProof: "" },
  { id: 18n, projectName: "Canadian Boreal Rewilding", projectType: "Reforestation", region: "Canada", vintageYear: 2025n, tonnesCO2e: 9200n, totalSupply: 9200n, impactScore: 94n, metadataURI: "ipfs://QmMockHash18", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xcacacacacacacacacacacacacacacacacacacaca00", registrySource: "Verra", retirementProof: "VCS-2025-CA-007" },
  { id: 19n, projectName: "Morocco Solar Desalination", projectType: "Renewable Energy", region: "Morocco", vintageYear: 2024n, tonnesCO2e: 1600n, totalSupply: 1600n, impactScore: 72n, metadataURI: "ipfs://QmMockHash19", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Verified, issuer: "0xma0cma0cma0cma0cma0cma0cma0cma0cma0cma0c", registrySource: "", retirementProof: "" },
  { id: 20n, projectName: "Philippines Coral Reef Restoration", projectType: "Blue Carbon", region: "Philippines", vintageYear: 2025n, tonnesCO2e: 380n, totalSupply: 380n, impactScore: 67n, metadataURI: "ipfs://QmMockHash20", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0xphphphphphphphphphphphphphphphphphphphph00", registrySource: "", retirementProof: "" },
  { id: 21n, projectName: "Ethiopia Clean Water Wells", projectType: "Clean Cooking", region: "Ethiopia", vintageYear: 2024n, tonnesCO2e: 4100n, totalSupply: 4100n, impactScore: 86n, metadataURI: "ipfs://QmMockHash21", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xethethethethethethethethethethethethetheth00", registrySource: "Gold Standard", retirementProof: "GS-2024-ET-019" },
  { id: 22n, projectName: "Costa Rica Cloud Forest Buffer", projectType: "Forest Conservation", region: "Costa Rica", vintageYear: 2025n, tonnesCO2e: 2100n, totalSupply: 2100n, impactScore: 93n, metadataURI: "ipfs://QmMockHash22", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcr0000", registrySource: "Verra", retirementProof: "VCS-2025-CR-002" },
  { id: 23n, projectName: "Siberian Permafrost Monitoring", projectType: "Wetland Conservation", region: "Russia", vintageYear: 2024n, tonnesCO2e: 550n, totalSupply: 550n, impactScore: 45n, metadataURI: "ipfs://QmMockHash23", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Suspended, issuer: "0xrurururururururururururururururururururu0000", registrySource: "", retirementProof: "" },
  { id: 24n, projectName: "Tanzania Bamboo Plantation", projectType: "Reforestation", region: "Tanzania", vintageYear: 2025n, tonnesCO2e: 3400n, totalSupply: 3400n, impactScore: 82n, metadataURI: "ipfs://QmMockHash24", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xtztztztztztztztztztztztztztztztztztztz0000", registrySource: "Gold Standard", retirementProof: "GS-2025-TZ-008" },
]

const MOCK_LISTINGS: Listing[] = [
  { listingId: 1n, creditId: 1n, seller: "0x1234567890abcdef1234567890abcdef12345678", amount: 500n, pricePerUnit: 2500000000000000n, active: true },
  { listingId: 2n, creditId: 2n, seller: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", amount: 2000n, pricePerUnit: 1800000000000000n, active: true },
  { listingId: 3n, creditId: 3n, seller: "0x9876543210fedcba9876543210fedcba98765432", amount: 800n, pricePerUnit: 4200000000000000n, active: true },
  { listingId: 4n, creditId: 4n, seller: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", amount: 1000n, pricePerUnit: 3100000000000000n, active: true },
  { listingId: 5n, creditId: 5n, seller: "0xcafebabecafebabecafebabecafebabecafebabe", amount: 1500n, pricePerUnit: 900000000000000n, active: true },
  { listingId: 6n, creditId: 6n, seller: "0xaabbccddaabbccddaabbccddaabbccddaabbccdd", amount: 3000n, pricePerUnit: 2100000000000000n, active: true },
  { listingId: 7n, creditId: 7n, seller: "0x1111222233334444555566667777888899990000", amount: 700n, pricePerUnit: 1500000000000000n, active: true },
  { listingId: 8n, creditId: 8n, seller: "0xffeeddccbbaa99887766554433221100ffeeddcc", amount: 450n, pricePerUnit: 5600000000000000n, active: true },
  { listingId: 9n, creditId: 9n, seller: "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555", amount: 900n, pricePerUnit: 2800000000000000n, active: true },
  { listingId: 10n, creditId: 10n, seller: "0x5555666677778888999900001111222233334444", amount: 4000n, pricePerUnit: 1900000000000000n, active: true },
  { listingId: 11n, creditId: 11n, seller: "0xbadbadbadbadbadbadbadbadbadbadbadbadbadba", amount: 950n, pricePerUnit: 800000000000000n, active: true },
  { listingId: 12n, creditId: 12n, seller: "0xdac0dac0dac0dac0dac0dac0dac0dac0dac0dac0", amount: 50n, pricePerUnit: 45000000000000000n, active: true },
  { listingId: 13n, creditId: 13n, seller: "0x1234abcd5678ef901234abcd5678ef901234abcd", amount: 600n, pricePerUnit: 1700000000000000n, active: true },
  { listingId: 14n, creditId: 14n, seller: "0xaussieaussieaussieaussieaussieaussieaussie00", amount: 2000n, pricePerUnit: 2300000000000000n, active: true },
  { listingId: 15n, creditId: 15n, seller: "0xvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvn", amount: 1200n, pricePerUnit: 3400000000000000n, active: true },
  { listingId: 16n, creditId: 16n, seller: "0xperuperuperuperuperuperuperuperuperuperuperu", amount: 1800n, pricePerUnit: 2900000000000000n, active: true },
  { listingId: 17n, creditId: 17n, seller: "0xbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbd", amount: 750n, pricePerUnit: 1200000000000000n, active: true },
  { listingId: 18n, creditId: 18n, seller: "0xcacacacacacacacacacacacacacacacacacacaca00", amount: 5000n, pricePerUnit: 2600000000000000n, active: true },
  { listingId: 19n, creditId: 19n, seller: "0xma0cma0cma0cma0cma0cma0cma0cma0cma0cma0c", amount: 800n, pricePerUnit: 1400000000000000n, active: true },
  { listingId: 20n, creditId: 20n, seller: "0xphphphphphphphphphphphphphphphphphphphph00", amount: 380n, pricePerUnit: 6100000000000000n, active: true },
  { listingId: 21n, creditId: 21n, seller: "0xethethethethethethethethethethethethetheth00", amount: 2500n, pricePerUnit: 2000000000000000n, active: true },
  { listingId: 22n, creditId: 22n, seller: "0xcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcr0000", amount: 1000n, pricePerUnit: 3800000000000000n, active: true },
  { listingId: 23n, creditId: 23n, seller: "0xrurururururururururururururururururururu0000", amount: 550n, pricePerUnit: 600000000000000n, active: true },
  { listingId: 24n, creditId: 24n, seller: "0xtztztztztztztztztztztztztztztztztztztz0000", amount: 1500n, pricePerUnit: 2200000000000000n, active: true },
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
      </div>
    </div>
  )
}
