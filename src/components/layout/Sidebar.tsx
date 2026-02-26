"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarItem {
  href: string
  label: string
}

interface SidebarProps {
  items: SidebarItem[]
}

export function Sidebar({ items }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-48 shrink-0">
      <nav className="flex flex-col gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              pathname === item.href
                ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
