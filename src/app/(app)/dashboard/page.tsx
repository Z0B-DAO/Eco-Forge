"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { CreditOriginBadge } from "@/components/credits/CreditOriginBadge"
import { AvaxLogo } from "@/components/common/AvaxLogo"
import { formatAvax, formatCO2 } from "@/lib/utils"
import { CreditOrigin, CreditStatus } from "@/types"
import type { CreditType, CreditsRetiredEvent, ListedEvent, SoldEvent } from "@/types"

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
    <div className="flex h-full flex-col">
      <div className="shrink-0 space-y-6 py-3">
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
      </div>

      <div className="flex-1 min-h-0 flex flex-col pt-4">
        {tab === "holdings" && <HoldingsTab />}
        {tab === "retired" && <RetiredTab />}
        {tab === "history" && <HistoryTab />}
      </div>
    </div>
  )
}

const MOCK_HOLDINGS: { credit: CreditType; balance: bigint; estimatedValue: bigint }[] = [
  { credit: { id: 1n, projectName: "Amazon Rainforest REDD+", projectType: "Forest Conservation", region: "Brazil", vintageYear: 2024n, tonnesCO2e: 5000n, totalSupply: 5000n, impactScore: 92n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0x1234567890abcdef1234567890abcdef12345678", registrySource: "Verra", retirementProof: "" }, balance: 120n, estimatedValue: 300000000000000000n },
  { credit: { id: 2n, projectName: "Gujarat Solar Farm", projectType: "Renewable Energy", region: "India", vintageYear: 2024n, tonnesCO2e: 12000n, totalSupply: 12000n, impactScore: 87n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", registrySource: "Gold Standard", retirementProof: "" }, balance: 500n, estimatedValue: 900000000000000000n },
  { credit: { id: 4n, projectName: "Kenya Cookstoves Program", projectType: "Clean Cooking", region: "Kenya", vintageYear: 2024n, tonnesCO2e: 3200n, totalSupply: 3200n, impactScore: 95n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", registrySource: "Gold Standard", retirementProof: "" }, balance: 80n, estimatedValue: 248000000000000000n },
  { credit: { id: 5n, projectName: "Borneo Peatland Protection", projectType: "Wetland Conservation", region: "Indonesia", vintageYear: 2025n, tonnesCO2e: 1500n, totalSupply: 1500n, impactScore: 64n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Verified, issuer: "0xcafebabecafebabecafebabecafebabecafebabe", registrySource: "", retirementProof: "" }, balance: 300n, estimatedValue: 270000000000000000n },
  { credit: { id: 9n, projectName: "Thai Biochar Initiative", projectType: "Biochar", region: "Thailand", vintageYear: 2024n, tonnesCO2e: 1800n, totalSupply: 1800n, impactScore: 91n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xaaaa1111bbbb2222cccc3333dddd4444eeee5555", registrySource: "Verra", retirementProof: "" }, balance: 200n, estimatedValue: 560000000000000000n },
  { credit: { id: 10n, projectName: "Sahel Great Green Wall", projectType: "Reforestation", region: "Niger", vintageYear: 2025n, tonnesCO2e: 6700n, totalSupply: 6700n, impactScore: 85n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0x5555666677778888999900001111222233334444", registrySource: "Gold Standard", retirementProof: "" }, balance: 1000n, estimatedValue: 1900000000000000000n },
  { credit: { id: 12n, projectName: "Iceland Geothermal DAC", projectType: "Direct Air Capture", region: "Iceland", vintageYear: 2025n, tonnesCO2e: 200n, totalSupply: 200n, impactScore: 98n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xdac0dac0dac0dac0dac0dac0dac0dac0dac0dac0", registrySource: "Verra", retirementProof: "" }, balance: 10n, estimatedValue: 450000000000000000n },
  { credit: { id: 15n, projectName: "Vietnam Mangrove Belt", projectType: "Blue Carbon", region: "Vietnam", vintageYear: 2025n, tonnesCO2e: 2800n, totalSupply: 2800n, impactScore: 88n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvnvn", registrySource: "Gold Standard", retirementProof: "" }, balance: 350n, estimatedValue: 1190000000000000000n },
  { credit: { id: 18n, projectName: "Canadian Boreal Rewilding", projectType: "Reforestation", region: "Canada", vintageYear: 2025n, tonnesCO2e: 9200n, totalSupply: 9200n, impactScore: 94n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xcacacacacacacacacacacacacacacacacacacaca00", registrySource: "Verra", retirementProof: "" }, balance: 600n, estimatedValue: 1560000000000000000n },
  { credit: { id: 22n, projectName: "Costa Rica Cloud Forest Buffer", projectType: "Forest Conservation", region: "Costa Rica", vintageYear: 2025n, tonnesCO2e: 2100n, totalSupply: 2100n, impactScore: 93n, metadataURI: "", origin: CreditOrigin.Certified, status: CreditStatus.Verified, issuer: "0xcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcrcr0000", registrySource: "Verra", retirementProof: "" }, balance: 150n, estimatedValue: 570000000000000000n },
]

const MOCK_RETIRED_EVENTS: CreditsRetiredEvent[] = [
  { owner: "0x0000000000000000000000000000000000000000", creditId: 1n, amount: 50n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 2n, amount: 200n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 4n, amount: 30n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 9n, amount: 100n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 5n, amount: 75n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 10n, amount: 400n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 15n, amount: 120n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 18n, amount: 250n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 22n, amount: 60n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 12n, amount: 5n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 1n, amount: 25n },
  { owner: "0x0000000000000000000000000000000000000000", creditId: 2n, amount: 100n },
]

const MOCK_RETIRED_CREDIT_MAP = new Map<bigint, CreditType>(
  MOCK_HOLDINGS.map((h) => [h.credit.id, h.credit])
)

const MOCK_LISTED: ListedEvent[] = [
  { listingId: 1n, creditId: 1n, seller: "0x0000000000000000000000000000000000000000", amount: 100n, price: 250000000000000000n },
  { listingId: 3n, creditId: 4n, seller: "0x0000000000000000000000000000000000000000", amount: 50n, price: 155000000000000000n },
  { listingId: 5n, creditId: 10n, seller: "0x0000000000000000000000000000000000000000", amount: 300n, price: 570000000000000000n },
  { listingId: 7n, creditId: 15n, seller: "0x0000000000000000000000000000000000000000", amount: 200n, price: 680000000000000000n },
  { listingId: 9n, creditId: 22n, seller: "0x0000000000000000000000000000000000000000", amount: 80n, price: 304000000000000000n },
  { listingId: 11n, creditId: 18n, seller: "0x0000000000000000000000000000000000000000", amount: 150n, price: 390000000000000000n },
]

const MOCK_SOLD: SoldEvent[] = [
  { listingId: 2n, buyer: "0x0000000000000000000000000000000000000000", creditId: 2n, amount: 500n, totalPrice: 900000000000000000n },
  { listingId: 4n, buyer: "0x0000000000000000000000000000000000000000", creditId: 5n, amount: 300n, totalPrice: 270000000000000000n },
  { listingId: 6n, buyer: "0x0000000000000000000000000000000000000000", creditId: 9n, amount: 200n, totalPrice: 560000000000000000n },
  { listingId: 8n, buyer: "0x0000000000000000000000000000000000000000", creditId: 12n, amount: 10n, totalPrice: 450000000000000000n },
  { listingId: 10n, buyer: "0x0000000000000000000000000000000000000000", creditId: 1n, amount: 120n, totalPrice: 300000000000000000n },
  { listingId: 12n, buyer: "0x0000000000000000000000000000000000000000", creditId: 10n, amount: 1000n, totalPrice: 1900000000000000000n },
  { listingId: 13n, buyer: "0x0000000000000000000000000000000000000000", creditId: 18n, amount: 600n, totalPrice: 1560000000000000000n },
  { listingId: 14n, buyer: "0x0000000000000000000000000000000000000000", creditId: 4n, amount: 80n, totalPrice: 248000000000000000n },
]

function StatsRow() {
  const totalValue = MOCK_HOLDINGS.reduce((sum, h) => sum + h.estimatedValue, 0n)
  const totalUnits = MOCK_HOLDINGS.reduce((sum, h) => sum + Number(h.balance), 0)
  const totalCO2 = MOCK_RETIRED_EVENTS.reduce((sum, e) => {
    const credit = MOCK_RETIRED_CREDIT_MAP.get(e.creditId)
    return sum + (credit ? e.amount * credit.tonnesCO2e / credit.totalSupply : 0n)
  }, 0n)

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
        <p className="mt-2 text-2xl font-bold text-zinc-100">3</p>
        <p className="mt-1 text-xs text-zinc-500">0.3% of supply</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-zinc-800">
          <div className="h-full rounded-full transition-all duration-500 bg-[#f97316]" style={{ width: `${((2 + 0.6) / 7) * 100}%` }} />
        </div>
        <div className="mt-2 flex gap-1">
          {[1,2,3,4,5,6,7].map((i) => (
            <div
              key={i}
              className={`flex-1 rounded py-0.5 text-center text-[10px] font-medium ${
                i <= 2 ? "bg-white/20 text-white" : i === 3 ? "border border-white/40 text-white" : "bg-zinc-800 text-zinc-500"
              }`}
            >
              T{i}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function HoldingsTab() {
  return (
    <div className="flex flex-1 min-h-0 flex-col rounded-xl border-[0.5px] border-white/60 bg-[#111111]">
      <table className="w-full text-sm">
        <thead className="border-b border-white/60 bg-[#111111]">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Project</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Type</th>
            <th className="px-4 py-3 text-left font-medium text-zinc-400">Origin</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-400">Balance</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-400">Unit Price</th>
            <th className="px-4 py-3 text-right font-medium text-zinc-400">Total Value</th>
          </tr>
        </thead>
      </table>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-zinc-800">
            {MOCK_HOLDINGS.map((h) => (
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
    </div>
  )
}

function RetiredTab() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-6">
      {MOCK_RETIRED_EVENTS.map((e, i) => {
        const credit = MOCK_RETIRED_CREDIT_MAP.get(e.creditId)
        return (
          <div key={i} className="flex items-center justify-between rounded-lg border-[0.5px] border-white/60 bg-[#111111] px-4 py-3 text-sm">
            <div className="flex items-center gap-3">
              <span className="rounded bg-zinc-700/50 px-2 py-0.5 text-xs font-medium text-zinc-300">Retired</span>
              <span className="text-zinc-100">{credit?.projectName ?? `Credit #${Number(e.creditId)}`}</span>
              <span className="text-zinc-500">{Number(e.amount)}</span>
            </div>
            {credit && (
              <span className="text-zinc-400">{Number(credit.tonnesCO2e * e.amount / credit.totalSupply)} tCO2e</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HistoryTab() {
  const allTrades = [
    ...MOCK_LISTED.map((l) => ({ type: "Listed" as const, creditId: l.creditId, amount: l.amount, value: l.price, key: `l-${l.listingId}` })),
    ...MOCK_SOLD.map((s) => ({ type: "Bought" as const, creditId: s.creditId, amount: s.amount, value: s.totalPrice, key: `s-${s.listingId}` })),
  ]

  return (
    <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pb-6">
      {allTrades.map((t) => (
        <div key={t.key} className="flex items-center justify-between rounded-lg border-[0.5px] border-white/60 bg-[#111111] px-4 py-3 text-sm">
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
  )
}
