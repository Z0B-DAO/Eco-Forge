"use client"

import { use, useState, useCallback } from "react"
import Link from "next/link"
import { usePublicClient } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { useVote } from "@/hooks/useVote"
import { useGovernanceToken } from "@/hooks/useGovernanceToken"
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI, CARBON_CREDIT_ABI } from "@/services/web3/contracts"
import { LoadingBar } from "@/components/common/LoadingSpinner"
import { CreditCard } from "@/components/credits/CreditCard"
import { ProposalType } from "@/types"
import type { Proposal, CreditType } from "@/types"
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

  const { data: disputeCredit } = useQuery({
    queryKey: ["dispute-credit", proposalIdStr],
    enabled: !!publicClient && !!proposal && proposal.pType === ProposalType.DisputeResolution,
    queryFn: async () => {
      if (!publicClient) return null
      const logs = await publicClient.getLogs({
        address: CONTRACT_ADDRESSES.governance,
        event: {
          type: "event",
          name: "DisputeRaised",
          inputs: [
            { name: "creditId", type: "uint256", indexed: true },
            { name: "challenger", type: "address", indexed: true },
            { name: "autoProposalId", type: "uint256", indexed: true },
          ],
        },
        fromBlock: 0n,
        toBlock: "latest",
      })
      const match = logs.find((l) => l.args.autoProposalId === proposalId)
      if (!match?.args.creditId) return null
      try {
        const credit = await publicClient.readContract({
          address: CONTRACT_ADDRESSES.carbonCredit,
          abi: CARBON_CREDIT_ABI,
          functionName: "getCreditType",
          args: [match.args.creditId],
        }) as CreditType
        return credit
      } catch {
        return null
      }
    },
  })

  const { vote, isPending, isConfirming, isConfirmed, error } = useVote()
  const { balance } = useGovernanceToken()

  return (
    <LoadingBar isLoading={isLoading}>
      {proposal ? (
        <ProposalContent
          proposal={proposal}
          proposalId={proposalId}
          disputeCredit={disputeCredit ?? undefined}
          vote={vote}
          isPending={isPending}
          isConfirming={isConfirming}
          isConfirmed={isConfirmed}
          error={error}
          balance={balance}
        />
      ) : (
        <p className="py-20 text-center text-zinc-400">Proposal not found.</p>
      )}
    </LoadingBar>
  )
}

function ProposalContent({ proposal, proposalId, disputeCredit, vote, isPending, isConfirming, isConfirmed, error, balance }: {
  proposal: Proposal
  proposalId: bigint
  disputeCredit?: CreditType
  vote: (id: bigint, support: boolean) => void
  isPending: boolean
  isConfirming: boolean
  isConfirmed: boolean
  error: Error | null
  balance: bigint | undefined
}) {
  const [copied, setCopied] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const copyAddress = useCallback(() => {
    navigator.clipboard.writeText(proposal.proposer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [proposal.proposer])

  const totalVotes = proposal.forVotes + proposal.againstVotes
  const forPct = percentage(proposal.forVotes, totalVotes)
  const isActive = Number(proposal.deadline) * 1000 > Date.now() && !proposal.executed
  const votingPower = balance ? Number(balance) : 0

  const handleVote = (support: boolean) => {
    vote(proposalId, support)
    setHasVoted(true)
  }

  return (
    <div className="mx-auto h-full max-w-2xl overflow-y-auto space-y-6 py-3 pb-6">
      <Link href="/governance" className="inline-flex items-center gap-2 rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-4 py-2 text-base font-semibold text-white">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="m12 19-7-7 7-7"/></svg>
        Back
      </Link>

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
          Proposed by{" "}
          <button
            onClick={copyAddress}
            className="relative font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Click to copy"
          >
            {proposal.proposer}
            {copied && (
              <span className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 text-white text-sm font-sans">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Copied
              </span>
            )}
          </button>
          <span className="ml-1">· {timeFromNow(proposal.deadline)}</span>
        </p>
      </div>

      <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Description</h3>
        <p className="mt-2 text-sm text-zinc-100">{proposal.description}</p>
      </div>

      {disputeCredit && (
        <div>
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500">Contested Credit</h3>
          <CreditCard credit={disputeCredit} />
        </div>
      )}

      <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
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

      {isActive && !hasVoted && !isConfirmed && (
        <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Cast Your Vote</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Your voting power: <span className="font-medium text-zinc-100">{votingPower} token{votingPower !== 1 ? "s" : ""}</span>
          </p>

          {votingPower === 0 ? (
            <p className="mt-3 text-sm text-yellow-400/80">You need governance tokens to vote.</p>
          ) : (
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => handleVote(true)}
                disabled={isPending || isConfirming}
                className="flex-1 rounded-lg border border-white/80 bg-white/5 backdrop-blur-sm py-2.5 text-sm font-medium text-white disabled:opacity-50"
              >
                {isPending || isConfirming ? "Voting..." : "Vote FOR"}
              </button>
              <button
                onClick={() => handleVote(false)}
                disabled={isPending || isConfirming}
                className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
              >
                {isPending || isConfirming ? "Voting..." : "Vote AGAINST"}
              </button>
            </div>
          )}

          {error && <p className="mt-3 text-sm text-red-400">{error.message}</p>}
        </div>
      )}

      {(hasVoted || isConfirmed) && (
        <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-5 py-4 text-sm text-zinc-300 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          You have already voted on this proposal.
        </div>
      )}
    </div>
  )
}
