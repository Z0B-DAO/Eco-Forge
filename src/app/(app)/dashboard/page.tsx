"use client"

import Link from "next/link"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useUserPortfolio } from "@/hooks/useUserPortfolio"
import { useTradeHistory } from "@/hooks/useTradeHistory"
import { TokenBalance } from "@/components/rewards/TokenBalance"
import { MilestoneProgress } from "@/components/rewards/MilestoneProgress"
import { CreditOriginBadge } from "@/components/credits/CreditOriginBadge"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { formatAvax, formatCO2, truncateAddress } from "@/lib/utils"

export default function DashboardPage() {
  const { address, isConnected } = useAccount()

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <h1 className="text-2xl font-bold">Connect your wallet</h1>
        <p className="text-zinc-400">Connect to see your dashboard.</p>
        <ConnectButton />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-zinc-400">Welcome back, <span className="font-mono text-zinc-300">{truncateAddress(address!)}</span></p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <TokenBalance />
        <MilestoneProgress />
        <QuickStats address={address!} />
      </div>

      <HoldingsSection />
      <RecentActivity address={address!} />
    </div>
  )
}

function QuickStats({ address }: { address: `0x${string}` }) {
  const { holdings, retired } = useUserPortfolio()

  const totalValue = holdings.reduce((sum, h) => sum + h.estimatedValue, 0n)
  const totalCO2 = retired?.totalCO2 ?? 0n

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Overview</h3>
      <div className="mt-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Credits held</span>
          <span className="font-medium text-zinc-100">{holdings.length}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">Portfolio value</span>
          <span className="font-medium text-emerald-400">{formatAvax(totalValue)} AVAX</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-zinc-400">CO2 offset</span>
          <span className="font-medium text-zinc-100">{formatCO2(totalCO2)}</span>
        </div>
      </div>
    </div>
  )
}

function HoldingsSection() {
  const { holdings, isLoading } = useUserPortfolio()

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Credits</h2>
        <Link href="/marketplace" className="text-sm text-emerald-400 hover:text-emerald-300">
          Browse marketplace →
        </Link>
      </div>

      {holdings.length === 0 ? (
        <p className="mt-4 text-sm text-zinc-500">No credits yet. Head to the marketplace to get started.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead className="border-b border-zinc-800 bg-zinc-900">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Project</th>
                <th className="px-4 py-3 text-left font-medium text-zinc-400">Origin</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">Balance</th>
                <th className="px-4 py-3 text-right font-medium text-zinc-400">Est. Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {holdings.map((h) => (
                <tr key={h.credit.id.toString()} className="hover:bg-zinc-900/50">
                  <td className="px-4 py-3">
                    <Link href={`/marketplace/${h.credit.id}`} className="text-zinc-100 hover:text-white">
                      {h.credit.projectName}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <CreditOriginBadge origin={h.credit.origin} />
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-100">{Number(h.balance)}</td>
                  <td className="px-4 py-3 text-right text-emerald-400">{formatAvax(h.estimatedValue)} AVAX</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function RecentActivity({ address }: { address: `0x${string}` }) {
  const { data, isLoading } = useTradeHistory(address)

  if (isLoading) return null

  const allActivity = [
    ...(data?.listed.map((l) => ({ type: "Listed" as const, creditId: l.creditId, amount: l.amount, value: l.price, id: `list-${l.listingId}` })) ?? []),
    ...(data?.sold.map((s) => ({ type: "Bought" as const, creditId: s.creditId, amount: s.amount, value: s.totalPrice, id: `sold-${s.listingId}` })) ?? []),
  ].slice(0, 10)

  if (allActivity.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold">Recent Activity</h2>
      <div className="mt-4 space-y-2">
        {allActivity.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className={`rounded px-2 py-0.5 text-xs font-medium ${a.type === "Listed" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                {a.type}
              </span>
              <span className="text-zinc-300">Credit #{Number(a.creditId)}</span>
              <span className="text-zinc-500">×{Number(a.amount)}</span>
            </div>
            <span className="font-medium text-zinc-100">{formatAvax(a.value)} AVAX</span>
          </div>
        ))}
      </div>
    </div>
  )
}
