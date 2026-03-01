"use client"

import { useState, useCallback, useRef } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useUserPortfolio } from "@/hooks/useUserPortfolio"
import { useTradeHistory } from "@/hooks/useTradeHistory"
import { useGovernanceToken } from "@/hooks/useGovernanceToken"
import { useMilestoneProgress } from "@/hooks/useMilestoneProgress"
import { CreditOriginBadge } from "@/components/credits/CreditOriginBadge"
import { LoadingBar } from "@/components/common/LoadingSpinner"
import { AvaxLogo } from "@/components/common/AvaxLogo"
import { formatAvax, formatCO2, percentage } from "@/lib/utils"

type Tab = "holdings" | "retired" | "history"

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const [tab, setTab] = useState<Tab>("holdings")
  const [copied, setCopied] = useState(false)

  const copyAddress = useCallback(() => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [address])

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="mt-1 text-zinc-400">Welcome back,{" "}
          <button
            onClick={copyAddress}
            className="relative font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Click to copy"
          >
            {address}
            {copied && (
              <span className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 text-white text-sm font-sans animate-fade-in">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </span>
            )}
          </button>
        </p>
      </div>

      <StatsRow />

      <div className="flex gap-1 border-b border-zinc-800">
        {(["holdings", "retired", "history"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
              tab === t
                ? "border-b-2 border-white text-white"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "holdings" && <HoldingsTab />}
      {tab === "retired" && <RetiredTab />}
      {tab === "history" && <HistoryTab address={address!} />}
    </div>
  )
}

function StatsRow() {
  const { holdings, retired, isLoading: portfolioLoading } = useUserPortfolio()
  const { balance, totalSupply, isLoading: tokenLoading } = useGovernanceToken()
  const { progress, milestones, isLoading: milestoneLoading } = useMilestoneProgress()

  const hasLoadedOnce = useRef(false)
  if (!portfolioLoading && !tokenLoading && !milestoneLoading) {
    hasLoadedOnce.current = true
  }
  if (!hasLoadedOnce.current && (portfolioLoading || tokenLoading || milestoneLoading)) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
            <div className="h-4 w-24 rounded bg-zinc-800" />
            <div className="mt-3 h-8 w-20 rounded bg-zinc-800" />
          </div>
        ))}
      </div>
    )
  }

  const totalValue = holdings.reduce((sum, h) => sum + h.estimatedValue, 0n)
  const totalUnits = holdings.reduce((sum, h) => sum + Number(h.balance), 0)
  const totalCO2 = retired?.totalCO2 ?? 0n
  const bal = balance ?? 0n
  const supply = totalSupply ?? 0n
  const pct = percentage(bal, supply)

  const actions = progress ? Number(progress.actions) : 0
  const currentTier = progress ? Number(progress.currentMilestone) : 0
  const nextMilestone = milestones?.[currentTier]
  const prevActions = currentTier > 0 && milestones ? Number(milestones[currentTier - 1].actionsRequired) : 0
  const targetActions = nextMilestone ? Number(nextMilestone.actionsRequired) : actions
  const range = targetActions - prevActions
  const done = actions - prevActions
  const milestonePct = range > 0 ? Math.min(100, Math.round((done / range) * 100)) : 100

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">Portfolio Value</p>
        <p className="mt-2 flex items-center gap-2 text-2xl font-bold text-white">
          {formatAvax(totalValue)}
          <AvaxLogo size={20} />
        </p>
      </div>
      <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">Credits Held</p>
        <p className="mt-2 text-2xl font-bold text-zinc-100">{totalUnits} units</p>
      </div>
      <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">CO2 Offset</p>
        <p className="mt-2 text-2xl font-bold text-zinc-100">{formatCO2(totalCO2)}</p>
      </div>
      <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
        <p className="text-sm font-medium uppercase tracking-wider text-zinc-500">Governance Tokens</p>
        <p className="mt-2 text-2xl font-bold text-zinc-100">{Number(bal)}</p>
        <p className="mt-1 text-xs text-zinc-500">{pct}% of supply</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full rounded-full bg-white transition-all duration-500"
            style={{ width: `${milestonePct}%` }}
          />
        </div>
        {milestones && (
          <div className="mt-2 flex gap-1">
            {milestones.map((_, i) => (
              <div
                key={i}
                className={`flex-1 rounded py-0.5 text-center text-[10px] font-medium ${
                  i < currentTier
                    ? "bg-white/20 text-white"
                    : i === currentTier
                      ? "border border-white/40 text-white"
                      : "bg-zinc-800 text-zinc-500"
                }`}
              >
                T{i + 1}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function HoldingsTab() {
  const { holdings, isLoading } = useUserPortfolio()

  return (
    <LoadingBar isLoading={isLoading}>
      {holdings.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">
          No credits in your portfolio yet.{" "}
          <Link href="/marketplace" className="text-white hover:text-zinc-300">Browse marketplace →</Link>
        </p>
      ) : (
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
                    <span className="inline-flex items-center gap-1">{h.balance > 0n && h.estimatedValue > 0n ? formatAvax(h.estimatedValue / h.balance) : "—"} <AvaxLogo size={14} /></span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-white"><span className="inline-flex items-center gap-1">{formatAvax(h.estimatedValue)} <AvaxLogo size={14} /></span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </LoadingBar>
  )
}

function RetiredTab() {
  const { retired, isLoading } = useUserPortfolio()
  const events = retired?.events ?? []

  return (
    <LoadingBar isLoading={isLoading}>
      {events.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No retired credits yet. Retire credits to offset your carbon footprint.</p>
      ) : (
        <div className="space-y-2">
          {events.map((e, i) => {
            const credit = retired?.creditMap.get(e.creditId)
            return (
              <div key={i} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm">
                <div className="flex items-center gap-3">
                  <span className="rounded bg-zinc-700/50 px-2 py-0.5 text-xs font-medium text-zinc-300">Retired</span>
                  <span className="text-zinc-100">{credit?.projectName ?? `Credit #${Number(e.creditId)}`}</span>
                  <span className="text-zinc-500">{Number(e.amount)}</span>
                </div>
                {credit && (
                  <span className="text-zinc-400">{Number(credit.tonnesCO2e) * Number(e.amount)} tCO2e</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </LoadingBar>
  )
}

function HistoryTab({ address }: { address: `0x${string}` }) {
  const { data, isLoading } = useTradeHistory(address)
  const listed = data?.listed ?? []
  const sold = data?.sold ?? []

  const allTrades = [
    ...listed.map((l) => ({ type: "Listed" as const, creditId: l.creditId, amount: l.amount, value: l.price, key: `l-${l.listingId}` })),
    ...sold.map((s) => ({ type: "Bought" as const, creditId: s.creditId, amount: s.amount, value: s.totalPrice, key: `s-${s.listingId}` })),
  ]

  return (
    <LoadingBar isLoading={isLoading}>
      {allTrades.length === 0 ? (
        <p className="py-8 text-center text-sm text-zinc-500">No trade history yet.</p>
      ) : (
        <div className="space-y-2">
          {allTrades.map((t) => (
            <div key={t.key} className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-900/50 px-4 py-3 text-sm">
              <div className="flex items-center gap-3">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${
                  t.type === "Listed" ? "bg-blue-500/15 text-blue-400" : "bg-white/10 text-white"
                }`}>
                  {t.type}
                </span>
                <Link href={`/marketplace/${t.creditId}`} className="text-zinc-100 hover:text-white">
                  Credit #{Number(t.creditId)}
                </Link>
                <span className="text-zinc-500">{Number(t.amount)}</span>
              </div>
              <span className="font-medium text-zinc-100"><span className="inline-flex items-center gap-1">{formatAvax(t.value)} <AvaxLogo size={14} /></span></span>
            </div>
          ))}
        </div>
      )}
    </LoadingBar>
  )
}
