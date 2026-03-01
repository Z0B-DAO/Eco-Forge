"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useAccount, useDisconnect } from "wagmi"
import { useMarketStore } from "@/stores/useMarketStore"

function CustomConnectButton() {
  const [expanded, setExpanded] = useState(false)
  const [wasConnected, setWasConnected] = useState(false)
  const { connector, isConnected } = useAccount()
  const { disconnect } = useDisconnect({
    mutation: { onSuccess: () => window.dispatchEvent(new Event("ecoforge:exit")) }
  })
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  useEffect(() => {
    if (isConnected && !wasConnected) {
      setExpanded(true)
      timerRef.current = setTimeout(() => setExpanded(false), 2500)
    }
    setWasConnected(isConnected)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isConnected])

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setExpanded(true)
  }

  const handleMouseLeave = () => {
    setExpanded(false)
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, mounted }) => {
        if (!mounted) return null

        if (!account) {
          return (
            <button
              onClick={openConnectModal}
              className="cursor-pointer rounded-full border border-white/80 bg-white/5 px-7 py-2.5 text-sm uppercase tracking-widest text-white backdrop-blur-sm transition-all duration-200 "
            >
              Connect
            </button>
          )
        }

        if (chain?.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="cursor-pointer rounded-full border border-red-500/80 bg-red-500/10 px-5 py-1.5 text-xs uppercase tracking-widest text-white backdrop-blur-sm transition-all duration-200 "
            >
              Wrong Network
            </button>
          )
        }

        return (
          <button
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={() => disconnect()}
              className="relative flex h-12 cursor-pointer items-center rounded-full border border-white/80 bg-white/5 overflow-hidden backdrop-blur-sm transition-all duration-300 ease-out "
              style={{ width: expanded ? 155 : 48 }}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center">
                {connector?.icon ? (
                  <img
                    src={connector.icon}
                    alt={connector.name}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <span className="text-base text-white">
                    {connector?.name?.[0] || "W"}
                  </span>
                )}
              </div>
              <span
                className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-xs uppercase tracking-widest text-white transition-opacity duration-300 pointer-events-none"
                style={{ opacity: expanded ? 1 : 0, paddingLeft: 36 }}
              >
                Disconnect
              </span>
          </button>
        )
      }}
    </ConnectButton.Custom>
  )
}

export function TopBar({ onMenuClick, onMenuHover }: { onMenuClick: () => void; onMenuHover?: () => void }) {
  const pathname = usePathname()
  const { query, setQuery } = useMarketStore()
  const showSearch = pathname === "/marketplace"

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center gap-4 px-4">
      <div className="flex shrink-0 items-center gap-4">
        <button
          onClick={onMenuClick}
          onMouseEnter={onMenuHover}
          className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-white/80 bg-white/5 text-white backdrop-blur-sm transition-all duration-200 "
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <Link href="/marketplace" className="font-display text-2xl font-bold tracking-wider text-white">
          EcoForge
        </Link>
      </div>

      {showSearch ? (
        <div className="flex flex-1 justify-center px-4">
          <input
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full max-w-2xl rounded-full border border-white/80 bg-white/5 px-5 py-2 text-sm text-white placeholder-white/40 outline-none backdrop-blur-sm transition-all duration-200 "
          />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="shrink-0">
        <CustomConnectButton />
      </div>
    </header>
  )
}
