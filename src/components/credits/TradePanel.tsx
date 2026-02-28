"use client"

import { useState } from "react"
import { useBuyCredit } from "@/hooks/useBuyCredit"
import { formatAvax, truncateAddress } from "@/lib/utils"
import type { Listing } from "@/types"

export function TradePanel({ listing }: { listing: Listing }) {
  const [amount, setAmount] = useState(1)
  const { buy, isPending, isConfirming, isConfirmed, hash, error } = useBuyCredit()

  const totalPrice = listing.pricePerUnit * BigInt(amount)
  const maxAmount = Number(listing.amount)

  function handleBuy() {
    if (amount <= 0 || amount > maxAmount) return
    buy(listing.listingId, BigInt(amount), totalPrice)
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Buy Credits</h3>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Price per unit</span>
          <span className="font-medium text-zinc-100">{formatAvax(listing.pricePerUnit)} AVAX</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Available</span>
          <span className="font-medium text-zinc-100">{maxAmount}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Seller</span>
          <span className="font-mono text-zinc-300">{truncateAddress(listing.seller)}</span>
        </div>
      </div>

      <div className="mt-5">
        <label className="text-sm text-zinc-400">Amount</label>
        <input
          type="number"
          min={1}
          max={maxAmount}
          value={amount}
          onChange={(e) => setAmount(Math.min(Number(e.target.value), maxAmount))}
          className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-zinc-400">Total</span>
        <span className="text-lg font-semibold text-emerald-400">{formatAvax(totalPrice)} AVAX</span>
      </div>

      <button
        onClick={handleBuy}
        disabled={isPending || isConfirming || amount <= 0}
        className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : isConfirmed ? "Purchased!" : "Buy Credits"}
      </button>

      {error && (
        <p className="mt-2 text-xs text-red-400">{error.message}</p>
      )}

      {hash && (
        <p className="mt-2 text-xs text-zinc-500">
          Tx: <span className="font-mono">{truncateAddress(hash)}</span>
        </p>
      )}
    </div>
  )
}
