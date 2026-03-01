"use client"

import { use } from "react"
import { CreditOriginBadge } from "@/components/credits/CreditOriginBadge"
import { CreditStatusBadge } from "@/components/credits/CreditStatusBadge"
import { ImpactScoreBadge } from "@/components/credits/ImpactScoreBadge"
import { TradePanel } from "@/components/credits/TradePanel"
import { ChallengeButton } from "@/components/credits/ChallengeButton"
import { RetireButton } from "@/components/credits/RetireButton"
import { truncateAddress } from "@/lib/utils"
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

export default function CreditDetailPage({ params }: { params: Promise<{ creditId: string }> }) {
  const { creditId: creditIdStr } = use(params)
  const creditId = BigInt(creditIdStr)

  const credit = MOCK_CREDITS.find((c) => c.id === creditId)
  const listing = MOCK_LISTINGS.find((l) => l.creditId === creditId)

  if (!credit) {
    return <p className="py-20 text-center text-zinc-400">Credit not found.</p>
  }

  const balance = 42

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <CreditOriginBadge origin={credit.origin} />
            <CreditStatusBadge status={credit.status} />
          </div>
          <h1 className="mt-3 text-2xl font-bold">{credit.projectName}</h1>
          <p className="mt-1 text-zinc-400">{credit.projectType} · {credit.region}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Impact Score" value={<ImpactScoreBadge score={Number(credit.impactScore)} />} />
          <InfoRow label="Tonnes CO2e" value={`${Number(credit.tonnesCO2e)} tCO2e`} />
          <InfoRow label="Total Supply" value={Number(credit.totalSupply).toLocaleString()} />
          <InfoRow label="Vintage Year" value={Number(credit.vintageYear).toString()} />
          <InfoRow label="Issuer" value={<span className="font-mono">{truncateAddress(credit.issuer)}</span>} />
          <InfoRow label="Credit ID" value={`#${credit.id}`} />
          {credit.registrySource && (
            <InfoRow label="Registry" value={credit.registrySource} />
          )}
        </div>

        {balance > 0 && (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Your Holdings</h3>
            <p className="mt-2 text-lg font-semibold text-zinc-100">{balance} unit{balance !== 1 ? "s" : ""}</p>
            <div className="mt-4">
              <RetireButton creditId={creditId} maxAmount={balance} />
            </div>
          </div>
        )}

        <ChallengeButton creditId={creditId} />
      </div>

      <div>
        {listing ? (
          <TradePanel listing={listing} />
        ) : (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 text-center text-sm text-zinc-400">
            Not currently listed for sale.
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="mt-1 text-sm text-zinc-100">{value}</div>
    </div>
  )
}
