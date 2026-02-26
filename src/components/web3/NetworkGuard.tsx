"use client"

import { useAccount, useSwitchChain } from "wagmi"
import { avalancheFuji } from "wagmi/chains"

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { chain, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  if (!isConnected || chain?.id === avalancheFuji.id) {
    return <>{children}</>
  }

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-xl font-semibold">Wrong Network</h2>
      <p className="text-sm text-zinc-500">
        Please switch to Avalanche Fuji Testnet to use EcoForge.
      </p>
      <button
        onClick={() => switchChain({ chainId: avalancheFuji.id })}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Switch to Fuji
      </button>
    </div>
  )
}
