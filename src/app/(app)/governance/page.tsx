"use client"

import Link from "next/link"
import { useProposals } from "@/hooks/useProposals"
import { LoadingBar } from "@/components/common/LoadingSpinner"
import { EmptyState } from "@/components/common/EmptyState"
import { ProposalType } from "@/types"
import { timeFromNow, percentage } from "@/lib/utils"
import type { Proposal } from "@/types"

export default function GovernancePage() {
  const { data: proposals, isLoading } = useProposals()

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Governance</h1>
            <p className="mt-1 text-zinc-400">Vote on proposals and review disputes.</p>
          </div>
          <Link
            href="/governance/disputes"
            className="inline-flex items-center gap-2 rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-4 py-2 text-base font-semibold text-white"
          >
            View Disputes
          </Link>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pt-2 pb-6">
        <LoadingBar isLoading={isLoading}>
          {!proposals || proposals.length === 0 ? (
            <EmptyState title="No proposals yet" description="Proposals are created when credits are disputed or governance changes are proposed." />
          ) : (
            <div className="space-y-3">
              {proposals.map((p: Proposal) => (
                <ProposalCard key={p.id.toString()} proposal={p} />
              ))}
            </div>
          )}
        </LoadingBar>
      </div>
    </div>
  )
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const totalVotes = proposal.forVotes + proposal.againstVotes
  const forPct = percentage(proposal.forVotes, totalVotes)
  const isActive = Number(proposal.deadline) * 1000 > Date.now() && !proposal.executed

  return (
    <Link
      href={`/governance/${proposal.id}`}
      className="block rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
            proposal.pType === ProposalType.DisputeResolution
              ? "bg-red-500/15 text-red-400"
              : "bg-blue-500/15 text-blue-400"
          }`}>
            {proposal.pType === ProposalType.DisputeResolution ? "Dispute" : "Eligibility"}
          </span>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
            proposal.executed
              ? "bg-zinc-500/15 text-zinc-400"
              : isActive
                ? "bg-white/10 text-white"
                : "bg-yellow-500/15 text-yellow-400"
          }`}>
            {proposal.executed ? "Executed" : isActive ? "Active" : "Ended"}
          </span>
        </div>
        <span className="text-xs text-zinc-500">{timeFromNow(proposal.deadline)}</span>
      </div>

      <p className="mt-3 text-sm text-zinc-100">{proposal.description}</p>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-zinc-400">
          <span>FOR {forPct}%</span>
          <span>AGAINST {100 - forPct}%</span>
        </div>
        <div className="mt-1 flex h-2 overflow-hidden rounded-full bg-zinc-800">
          <div className="bg-white transition-all" style={{ width: `${forPct}%` }} />
          <div className="bg-red-500 transition-all" style={{ width: `${100 - forPct}%` }} />
        </div>
        <p className="mt-1 text-xs text-zinc-500">{Number(totalVotes)} total votes</p>
      </div>
    </Link>
  )
}
