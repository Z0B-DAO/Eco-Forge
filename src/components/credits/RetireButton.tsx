"use client"

import { useState } from "react"
import { useRetireCredit } from "@/hooks/useRetireCredit"

export function RetireButton({ creditId, maxAmount }: { creditId: bigint; maxAmount: number }) {
  const [amount, setAmount] = useState(1)
  const { retire, isPending, isConfirming, isConfirmed, error } = useRetireCredit()

  function handleRetire() {
    if (amount <= 0 || amount > maxAmount) return
    retire(creditId, BigInt(amount))
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="number"
        min={1}
        max={maxAmount}
        value={amount}
        onChange={(e) => setAmount(Math.min(Number(e.target.value), maxAmount))}
        className="w-20 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
      />
      <button
        onClick={handleRetire}
        disabled={isPending || isConfirming || amount <= 0}
        className="rounded-lg border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Confirm..." : isConfirming ? "Retiring..." : isConfirmed ? "Retired!" : "Retire (Offset CO2)"}
      </button>
      {error && <p className="text-xs text-red-400">{error.message}</p>}
    </div>
  )
}
