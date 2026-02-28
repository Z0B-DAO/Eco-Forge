"use client"

import { useGovernanceToken } from "@/hooks/useGovernanceToken"
import { percentage } from "@/lib/utils"

export function TokenBalance() {
  const { balance, totalSupply, isLoading } = useGovernanceToken()

  if (isLoading) return <Skeleton />

  const bal = balance ?? 0n
  const supply = totalSupply ?? 0n
  const pct = percentage(bal, supply)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Governance Tokens</h3>
      <p className="mt-2 text-3xl font-bold text-zinc-100">{Number(bal)}</p>
      <p className="mt-1 text-sm text-zinc-400">
        {pct}% of total supply ({Number(supply)})
      </p>
      <p className="mt-0.5 text-xs text-zinc-500">1 token = 1 vote · Non-transferable</p>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="h-4 w-32 rounded bg-zinc-800" />
      <div className="mt-3 h-8 w-16 rounded bg-zinc-800" />
      <div className="mt-2 h-3 w-48 rounded bg-zinc-800" />
    </div>
  )
}
