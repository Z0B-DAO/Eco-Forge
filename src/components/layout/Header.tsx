"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ConnectButton } from "@rainbow-me/rainbowkit"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/create", label: "Create" },
  { href: "/governance", label: "Governance" },
  { href: "/portfolio", label: "Portfolio" },
]

export function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/80 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">
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
        <ConnectButton />
      </div>
    </header>
  )
}
