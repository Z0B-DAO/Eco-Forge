import { formatUnits } from "viem"

export function formatAvax(wei: bigint, decimals: number = 4): string {
  const formatted = formatUnits(wei, 18)
  const num = parseFloat(formatted)
  return num.toFixed(decimals)
}

export function truncateAddress(address: string, chars: number = 4): string {
  if (!address) return ""
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

export function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) * 1000)
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function timeFromNow(timestamp: bigint): string {
  const now = Date.now()
  const target = Number(timestamp) * 1000
  const diff = target - now
  const absDiff = Math.abs(diff)

  const minutes = Math.floor(absDiff / (1000 * 60))
  const hours = Math.floor(absDiff / (1000 * 60 * 60))
  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24))

  let relative: string
  if (days > 0) relative = `${days}d`
  else if (hours > 0) relative = `${hours}h`
  else relative = `${minutes}m`

  return diff > 0 ? `${relative} left` : `${relative} ago`
}

export function scoreToColor(score: number): string {
  if (score >= 80) return "text-green-500"
  if (score >= 60) return "text-yellow-500"
  if (score >= 40) return "text-orange-500"
  return "text-red-500"
}

export function scoreToBgColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 60) return "bg-yellow-500"
  if (score >= 40) return "bg-orange-500"
  return "bg-red-500"
}

export function formatCO2(tonnes: bigint): string {
  const num = Number(tonnes)
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M tCO2e`
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K tCO2e`
  return `${num} tCO2e`
}

export function percentage(part: bigint, total: bigint): number {
  if (total === BigInt(0)) return 0
  return Number((part * BigInt(100)) / total)
}

export function formatBigInt(value: bigint): string {
  return Number(value).toLocaleString("en-US")
}
