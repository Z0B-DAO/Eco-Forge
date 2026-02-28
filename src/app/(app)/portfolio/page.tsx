"use client"

import { useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useUserPortfolio } from "@/hooks/useUserPortfolio"
import { useTradeHistory } from "@/hooks/useTradeHistory"
import { CreditOriginBadge } from "@/components/credits/CreditOriginBadge"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { formatAvax, formatCO2, truncateAddress } from "@/lib/utils"

type Tab = "holdings" | "retired" | "history"

export default function PortfolioPage() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<Tab>("holdings")

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <h1 className="text-2xl font-bold">Connect your wallet</h1>
        <p className="text-zinc-400">Connect to see your portfolio.</p>
        <ConnectButton />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <p className="mt-1 text-zinc-400">Track your carbon credit holdings and impact.</p>
      </div>

      <SummaryCards address={address!} />

      <div className="flex gap-1 border-b border-zinc-800">
        {(["holdings", "retired", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-emerald-500 text-emerald-400"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "holdings" && <HoldingsTab />}
      {tab === "retired" && <RetiredTab address={address!} />}
      {tab === "history" && <HistoryTab address={address!} />}
    </div>
  )
}

function SummaryCards({ address }: { address: `0x${string}` }) {
  const { holdings, retired, isLoading } = useUserPortfolio()

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="h-4 w-24 rounded bg-zinc-800" />
            <div className="mt-3 h-8 w-20 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    )
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.estimatedValue, 0n)
  const totalCO2 = retired?.totalCO2 ?? 0n
  const totalUnits = holdings.reduce((sum, h) => sum + Number(h.balance), 0)

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard label="Portfolio Value" value={`${formatAvax(totalValue)} AVAX`} accent />
      <StatCard label="Credits Held" value={`${totalUnits} units`} />
      <StatCard label="CO2 Offset" value={formatCO2(totalCO2)} />
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent ? "text-emerald-400" : "text-zinc-100"}`}>{value}</p>
    </div>
  )
}

function HoldingsTab() {
  const { holdings, isLoading } = useUserPortfolio()

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>

  if (holdings.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No credits in your portfolio yet.</p>
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="border-b border-zinc-800 bg-zinc-900">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Project</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Type</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Origin</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-400">Balance</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-400">Unit Price</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-400">Total Value</th>
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
              <td className="px-4 py-3 text-zinc-400">{h.credit.projectType}</td>
              <td className="px-4 py-3"><CreditOriginBadge origin={h.credit.origin} /></td>
              <td className="px-4 py-3 text-right font-mono text-zinc-100">{Number(h.balance)}</td>
              <td className="px-4 py-3 text-right text-zinc-400">
                {h.balance > 0n && h.estimatedValue > 0n ? formatAvax(h.estimatedValue / h.balance) : "—"} AVAX
              </td>
              <td className="px-4 py-3 text-right font-medium text-emerald-400">{formatAvax(h.estimatedValue)} AVAX</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function RetiredTab({ address }: { address: `0x${string}` }) {
  const { retired, isLoading } = useUserPortfolio()

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>

  const events = retired?.events ?? []

  if (events.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No retired credits yet. Retire credits to offset your carbon footprint.</p>
  }

  return (
    <div className="space-y-2">
      {events.map((e, i) => {
        const credit = retired?.creditMap.get(e.creditId)
        return (
          <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="rounded bg-zinc-700/50 px-2 py-0.5 text-xs font-medium text-zinc-300">Retired</span>
              <span className="text-zinc-100">{credit?.projectName ?? `Credit #${Number(e.creditId)}`}</span>
              <span className="text-zinc-500">×{Number(e.amount)}</span>
            </div>
            {credit && (
              <span className="text-zinc-400">{Number(credit.tonnesCO2e) * Number(e.amount)} tCO2e</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HistoryTab({ address }: { address: `0x${string}` }) {
  const { data, isLoading } = useTradeHistory(address)

  if (isLoading) return <div className="flex justify-center py-8"><LoadingSpinner /></div>

  const listed = data?.listed ?? []
  const sold = data?.sold ?? []

  const allTrades = [
    ...listed.map((l) => ({ type: "Listed" as const, creditId: l.creditId, amount: l.amount, value: l.price, key: `l-${l.listingId}` })),
    ...sold.map((s) => ({ type: "Bought" as const, creditId: s.creditId, amount: s.amount, value: s.totalPrice, key: `s-${s.listingId}` })),
  ]

  if (allTrades.length === 0) {
    return <p className="py-8 text-center text-sm text-zinc-500">No trade history yet.</p>
  }

  return (
    <div className="space-y-2">
      {allTrades.map((t) => (
        <div key={t.key} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm">
          <div className="flex items-center gap-3">
            <span className={`rounded px-2 py-0.5 text-xs font-medium ${
              t.type === "Listed" ? "bg-blue-500/15 text-blue-400" : "bg-emerald-500/15 text-emerald-400"
            }`}>
              {t.type}
            </span>
            <Link href={`/marketplace/${t.creditId}`} className="text-zinc-100 hover:text-white">
              Credit #{Number(t.creditId)}
            </Link>
            <span className="text-zinc-500">×{Number(t.amount)}</span>
          </div>
          <span className="font-medium text-zinc-100">{formatAvax(t.value)} AVAX</span>
        </div>
      ))}
    </div>
  )
}
