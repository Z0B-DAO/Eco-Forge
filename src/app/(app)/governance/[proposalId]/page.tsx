"use client"

import { use } from "react"
import { usePublicClient } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { useVote } from "@/hooks/useVote"
import { useGovernanceToken } from "@/hooks/useGovernanceToken"
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI } from "@/services/web3/contracts"
import { LoadingBar } from "@/components/common/LoadingSpinner"
import { ProposalType } from "@/types"
import type { Proposal } from "@/types"
import { timeFromNow, percentage, truncateAddress } from "@/lib/utils"

export default function ProposalDetailPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId: proposalIdStr } = use(params)
  const proposalId = BigInt(proposalIdStr)
  const publicClient = usePublicClient()

  const { data: proposal, isLoading } = useQuery({
    queryKey: ["proposal", proposalIdStr],
    enabled: !!publicClient,
    queryFn: async () => {
      if (!publicClient) throw new Error("No client")
      return publicClient.readContract({
        address: CONTRACT_ADDRESSES.governance,
        abi: GOVERNANCE_ABI,
        functionName: "proposals",
        args: [proposalId],
      }) as Promise<Proposal>
    },
  })

  const { vote, isPending, isConfirming, isConfirmed, error } = useVote()
  const { balance } = useGovernanceToken()

  return (
    <LoadingBar isLoading={isLoading}>
      <ProposalContent proposal={proposal} proposalId={proposalId} vote={vote} isPending={isPending} isConfirming={isConfirming} isConfirmed={isConfirmed} error={error} balance={balance} />
    </LoadingBar>
  )
}

function ProposalContent({ proposal, proposalId, vote, isPending, isConfirming, isConfirmed, error, balance }: {
  proposal: Proposal | undefined
  proposalId: bigint
  vote: (id: bigint, support: boolean) => void
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  error: Error | null
  balance: bigint | undefined
}) {
  if (!proposal) {
    return <p className="py-20 text-center text-zinc-400">Proposal not found.</p>
  }

  const totalVotes = proposal.forVotes + proposal.againstVotes
  const forPct = percentage(proposal.forVotes, totalVotes)
  const isActive = Number(proposal.deadline) * 1000 > Date.now() && !proposal.executed
  const votingPower = balance ? Number(balance) : 0

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
            proposal.pType === ProposalType.DisputeResolution
              ? "bg-red-500/15 text-red-400"
              : "bg-blue-500/15 text-blue-400"
          }`}>
            {proposal.pType === ProposalType.DisputeResolution ? "Dispute Resolution" : "Credit Eligibility"}
          </span>
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${
            proposal.executed
              ? "bg-zinc-500/15 text-zinc-400"
              : isActive ? "bg-white/10 text-white" : "bg-yellow-500/15 text-yellow-400"
          }`}>
            {proposal.executed ? "Executed" : isActive ? "Active" : "Ended"}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold">Proposal #{Number(proposal.id)}</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Proposed by <span className="font-mono text-zinc-300">{truncateAddress(proposal.proposer)}</span> · {timeFromNow(proposal.deadline)}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Description</h3>
        <p className="mt-2 text-sm text-zinc-100">{proposal.description}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Votes</h3>

        <div className="mt-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-white">FOR — {Number(proposal.forVotes)} votes ({forPct}%)</span>
            <span className="text-red-400">AGAINST — {Number(proposal.againstVotes)} votes ({100 - forPct}%)</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-zinc-800">
            <div className="bg-white transition-all" style={{ width: `${forPct}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${100 - forPct}%` }} />
          </div>
        </div>
      </div>

      {isActive && (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Cast Your Vote</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Your voting power: <span className="font-medium text-zinc-100">{votingPower} token{votingPower !== 1 ? "s" : ""}</span>
          </p>

          {votingPower === 0 ? (
            <p className="mt-3 text-sm text-yellow-400/80">You need governance tokens to vote.</p>
          ) : (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => vote(proposalId, true)}
                disabled={isPending || isConfirming}
                className="flex-1 rounded-lg border border-white/80 bg-white/5 backdrop-blur-sm py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {isPending || isConfirming ? "Voting..." : "Vote FOR"}
              </button>
              <button
                onClick={() => vote(proposalId, false)}
                disabled={isPending || isConfirming}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {isPending || isConfirming ? "Voting..." : "Vote AGAINST"}
              </button>
            </div>
          )}

          {isConfirmed && <p className="mt-3 text-sm text-white">Vote submitted!</p>}
          {error && <p className="mt-3 text-sm text-red-400">{error.message}</p>}
        </div>
      )}
    </div>
  )
}
