"use client"

import { useMilestoneProgress } from "@/hooks/useMilestoneProgress"

export function MilestoneProgress() {
  const { progress, milestones, isLoading } = useMilestoneProgress()

  if (isLoading) return <Skeleton />
  if (!progress || !milestones) return null

  const actions = Number(progress.actions)
  const currentTier = Number(progress.currentMilestone)
  const isComplete = currentTier >= milestones.length
  const nextMilestone = !isComplete ? milestones[currentTier] : null
  const prevActions = currentTier > 0 ? Number(milestones[currentTier - 1].actionsRequired) : 0

  const targetActions = nextMilestone ? Number(nextMilestone.actionsRequired) : prevActions
  const reward = nextMilestone ? Number(nextMilestone.tokensRewarded) : 0
  const range = nextMilestone ? targetActions - prevActions : 1
  const done = nextMilestone ? actions - prevActions : 1
  const pct = nextMilestone ? Math.min(100, Math.round((done / range) * 100)) : 100

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Milestone Progress</h3>

      <div className="mt-3 flex items-end justify-between">
        <p className="text-sm text-zinc-300">
          <span className="text-lg font-bold text-zinc-100">{actions}</span>
          {nextMilestone && <span className="text-zinc-500"> / {targetActions} actions</span>}
        </p>
        {nextMilestone ? (
          <span className="text-sm text-white">+{reward} tokens</span>
        ) : (
          <span className="text-sm text-zinc-500">All tiers reached</span>
        )}
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
        <div
          className="h-full rounded-full bg-[#f97316] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex gap-1.5">
        {milestones.map((m, i) => (
          <div
            key={i}
            className={`flex-1 rounded py-1 text-center text-xs font-medium ${
              i < currentTier || isComplete
                ? "bg-white/20 text-white"
                : i === currentTier
                  ? "border border-white/40 text-white"
                  : "bg-zinc-800 text-zinc-500"
            }`}
          >
            T{i + 1}
          </div>
        ))}
      </div>
    </div>
  )
}

function Skeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="h-4 w-36 rounded bg-zinc-800" />
      <div className="mt-3 h-6 w-24 rounded bg-zinc-800" />
      <div className="mt-2 h-2 rounded-full bg-zinc-800" />
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-6 flex-1 rounded bg-zinc-800" />
        ))}
      </div>
    </div>
  )
}
