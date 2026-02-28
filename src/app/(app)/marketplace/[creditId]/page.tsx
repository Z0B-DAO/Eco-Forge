"use client"

import { use } from "react"
import { useCreditDetail } from "@/hooks/useCreditDetail"
import { useMarketplace } from "@/hooks/useMarketplace"
import { useAccount, useReadContract } from "wagmi"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI } from "@/services/web3/contracts"
import { CreditOriginBadge } from "@/components/credits/CreditOriginBadge"
import { CreditStatusBadge } from "@/components/credits/CreditStatusBadge"
import { ImpactScoreBadge } from "@/components/credits/ImpactScoreBadge"
import { TradePanel } from "@/components/credits/TradePanel"
import { ChallengeButton } from "@/components/credits/ChallengeButton"
import { RetireButton } from "@/components/credits/RetireButton"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { formatAvax, formatTimestamp, truncateAddress } from "@/lib/utils"

export default function CreditDetailPage({ params }: { params: Promise<{ creditId: string }> }) {
  const { creditId: creditIdStr } = use(params)
  const creditId = BigInt(creditIdStr)
  const { address } = useAccount()

  const { data: credit, isLoading } = useCreditDetail(creditId)
  const { data: listings } = useMarketplace()

  const { data: userBalance } = useReadContract({
    address: CONTRACT_ADDRESSES.carbonCredit,
    abi: CARBON_CREDIT_ABI,
    functionName: "balanceOf",
    args: address ? [address, creditId] : undefined,
    query: { enabled: !!address },
  })

  const listing = listings?.find((l) => l.creditId === creditId)

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!credit) {
    return <p className="py-20 text-center text-zinc-400">Credit not found.</p>
  }

  const balance = userBalance ? Number(userBalance as bigint) : 0

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
