import { scoreToBgColor } from "@/lib/utils"

export function ImpactScoreBadge({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-full ${scoreToBgColor(score)}`} />
      <span className="text-sm font-semibold text-zinc-100">{score}</span>
      <span className="text-xs text-zinc-500">/100</span>
    </div>
  )
}
