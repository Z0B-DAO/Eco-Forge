"use client"

import { useState } from "react"
import { useBuyCredit } from "@/hooks/useBuyCredit"
import { formatAvax, truncateAddress } from "@/lib/utils"
import { AvaxLogo } from "@/components/common/AvaxLogo"
import type { Listing } from "@/types"

export function TradePanel({ listing }: { listing: Listing }) {
  const [amount, setAmount] = useState(1)
  const [copied, setCopied] = useState(false)
  const { buy, isPending, isConfirming, isConfirmed, hash, error } = useBuyCredit()

  const totalPrice = listing.pricePerUnit * BigInt(amount)
  const maxAmount = Number(listing.amount)

  function handleBuy() {
    if (amount <= 0 || amount > maxAmount) return
    buy(listing.listingId, BigInt(amount), totalPrice)
  }

  return (
    <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Buy Credits</h3>

      <div className="mt-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Price per unit</span>
          <span className="flex items-center gap-1 font-mono font-medium text-zinc-100">{formatAvax(listing.pricePerUnit)} <AvaxLogo size={14} /></span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-400">Available</span>
          <span className="font-mono font-medium text-zinc-100">{maxAmount}</span>
        </div>
        <div className="text-sm">
          <span className="text-zinc-400">Seller</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(listing.seller)
              setCopied(true)
              setTimeout(() => setCopied(false), 1500)
            }}
            className="relative mt-1 font-mono text-xs text-zinc-100 cursor-pointer break-all block w-full text-left"
          >
            {listing.seller}
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

      <div className="mt-5">
        <label className="text-sm text-zinc-400">Amount</label>
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={() => setAmount(Math.max(1, amount - 1))}
            disabled={amount <= 1}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-white/60 bg-[#111111] text-lg text-white disabled:opacity-30"
          >
            &minus;
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={amount}
            onChange={(e) => {
              const v = parseInt(e.target.value)
              if (!isNaN(v)) setAmount(Math.min(Math.max(1, v), maxAmount))
              else if (e.target.value === "") setAmount(1)
            }}
            className="h-9 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 text-center font-mono text-sm text-zinc-100 outline-none focus:border-zinc-500"
          />
          <button
            onClick={() => setAmount(Math.min(maxAmount, amount + 1))}
            disabled={amount >= maxAmount}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[0.5px] border-white/60 bg-[#111111] text-lg text-white disabled:opacity-30"
          >
            +
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-zinc-400">Est. gas fee</span>
        <span className="flex items-center gap-1 font-mono text-zinc-400">~0.001 <AvaxLogo size={12} /></span>
      </div>
      <div className="mt-2 flex items-center justify-between text-sm border-t border-zinc-800 pt-2">
        <span className="text-zinc-400">Total</span>
        <span className="flex items-center gap-1 font-mono text-lg font-semibold text-white">{formatAvax(totalPrice)} <AvaxLogo size={16} /></span>
      </div>

      <button
        onClick={handleBuy}
        disabled={isPending || isConfirming || amount <= 0}
        className="mt-4 w-full rounded-lg border border-white/80 bg-white/5 backdrop-blur-sm py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
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
