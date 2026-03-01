"use client"

import { use, useState } from "react"
import Link from "next/link"
import { CreditOriginBadge } from "@/components/credits/CreditOriginBadge"
import { CreditStatusBadge } from "@/components/credits/CreditStatusBadge"
import { ImpactScoreBadge } from "@/components/credits/ImpactScoreBadge"
import { TradePanel } from "@/components/credits/TradePanel"
import { ChallengeButton } from "@/components/credits/ChallengeButton"
import { RetireButton } from "@/components/credits/RetireButton"
import { truncateAddress } from "@/lib/utils"
import { AvaxLogo } from "@/components/common/AvaxLogo"
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
  const [copied, setCopied] = useState(false)

  let creditId: bigint | null = null
  try {
    const n = BigInt(creditIdStr)
    if (n > 0n) creditId = n
  } catch {
    creditId = null
  }

  if (creditId === null) {
    return <p className="py-20 text-center text-zinc-400">Invalid credit ID.</p>
  }

  const credit = MOCK_CREDITS.find((c) => c.id === creditId)
  const listing = MOCK_LISTINGS.find((l) => l.creditId === creditId)

  if (!credit) {
    return <p className="py-20 text-center text-zinc-400">Credit not found.</p>
  }

  const balance: number = 42

  return (
    <div className="grid gap-8 lg:grid-cols-3 lg:items-start">
      <div className="space-y-6 lg:col-span-2">
        <div className="pt-2">
          <Link href="/marketplace" className="inline-flex items-center gap-2 rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-4 py-2 text-base font-semibold text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
            Back
          </Link>
        </div>
        <div>
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">{credit.projectName}</h1>
            <div className="flex shrink-0 items-center gap-2">
              <CreditOriginBadge origin={credit.origin} />
              <CreditStatusBadge status={credit.status} />
            </div>
          </div>
          <p className="mt-1 text-zinc-400">{credit.projectType} · {credit.region}</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InfoRow label="Total Supply" value={Number(credit.totalSupply).toLocaleString()} />
          <InfoRow label="Tonnes CO2e" value={`${Number(credit.tonnesCO2e)} tCO2e`} />
          <InfoRow label="Credit ID" value={`#${credit.id}`} />
          <InfoRow label="Vintage Year" value={Number(credit.vintageYear).toString()} />
          <InfoRow label="Impact Score (AI Generated)" value={<ImpactScoreBadge score={Number(credit.impactScore)} />} />
          {credit.registrySource && (
            <InfoRow label="Registry" value={credit.registrySource} />
          )}
        </div>

        {balance > 0 && (
          <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-6 py-5">
            <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Your Holdings</span>
            <div className="mt-3 flex items-center justify-between">
              <p className="font-mono text-3xl font-bold text-white">{balance} <span className="text-base font-medium text-zinc-400">unit{balance !== 1 ? "s" : ""}</span></p>
              <RetireButton creditId={creditId} maxAmount={balance} />
            </div>
          </div>
        )}

      </div>

      <div className="flex flex-col gap-4 lg:self-stretch">
        <div className="flex justify-end pt-2">
          <ChallengeButton creditId={creditId} />
        </div>
        <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-4 py-3 overflow-hidden">
          <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">Issuer</span>
          <div className="mt-1">
            <button
              onClick={() => {
                navigator.clipboard.writeText(credit.issuer)
                setCopied(true)
                setTimeout(() => setCopied(false), 1500)
              }}
              className="relative font-mono text-xs text-zinc-100 hover:text-white transition-colors cursor-pointer break-all block w-full text-left"
            >
              {credit.issuer}
              {copied && (
                <span className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 text-white text-sm font-sans">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </span>
              )}
            </button>
          </div>
        </div>
        <div className="flex-1 flex flex-col">
          {listing ? (
            <TradePanel listing={listing} />
          ) : (
            <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5 text-center text-sm text-zinc-400">
              Not currently listed for sale.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-4 py-3">
      <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <div className="mt-1 text-sm text-zinc-100">{value}</div>
    </div>
  )
}
