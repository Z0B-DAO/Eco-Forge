"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useDisconnect } from "wagmi"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/create", label: "Create" },
  { href: "/governance", label: "Governance" },
  { href: "/portfolio", label: "Portfolio" },
]

function AccountDropdown({ address, displayName, onClose }: { address: string; displayName: string; onClose: () => void }) {
  const { disconnect } = useDisconnect()
  const ref = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [onClose])

  const copyAddress = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <div ref={ref} className="absolute right-0 top-full mt-2 w-56 border border-white/10 bg-background p-3 shadow-lg shadow-black/40">
      <p className="font-display text-xs uppercase tracking-widest text-white">{displayName}</p>
      <p className="mt-1 text-[10px] tracking-wide text-white/40">{address}</p>
      <div className="mt-3 flex flex-col gap-1">
        <button
          onClick={copyAddress}
          className="cursor-pointer rounded-sm px-3 py-1.5 text-left text-xs uppercase tracking-widest text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          {copied ? "Copied" : "Copy address"}
        </button>
        <button
          onClick={() => { disconnect(); onClose() }}
          className="cursor-pointer rounded-sm px-3 py-1.5 text-left text-xs uppercase tracking-widest text-white/60 transition-colors hover:bg-white/5 hover:text-white"
        >
          Disconnect
        </button>
      </div>
    </div>
  )
}

function CustomConnectButton() {
  const [open, setOpen] = useState(false)

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, openChainModal, mounted }) => {
        const ready = mounted
        if (!ready) return null

        if (!account) {
          return (
            <button
              onClick={openConnectModal}
              className="font-display cursor-pointer rounded-sm bg-white px-5 py-1.5 text-xs uppercase tracking-widest text-background transition-all duration-200 hover:bg-background hover:text-white hover:outline hover:outline-1 hover:outline-white"
            >
              Connect
            </button>
          )
        }

        if (chain?.unsupported) {
          return (
            <button
              onClick={openChainModal}
              className="font-display cursor-pointer rounded-sm bg-red-500/80 px-5 py-1.5 text-xs uppercase tracking-widest text-white transition-all duration-200 hover:bg-red-500"
            >
              Wrong Network
            </button>
          )
        }

        return (
          <div className="relative">
            <button
              onClick={() => setOpen(!open)}
              className="font-display group cursor-pointer rounded-sm bg-white px-5 py-1.5 text-xs uppercase tracking-widest text-background transition-all duration-200 hover:bg-background hover:text-white hover:outline hover:outline-1 hover:outline-white"
            >
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-positive group-hover:bg-positive" />
                {account.displayName}
              </span>
            </button>
            {open && (
              <AccountDropdown
                address={account.address}
                displayName={account.displayName}
                onClose={() => setOpen(false)}
              />
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/marketplace" className="font-display text-xl font-bold tracking-wider">
            EcoForge
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href)
                    ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <CustomConnectButton />
      </div>
    </header>
  )
}
