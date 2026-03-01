"use client"

import { useState } from "react"
import Link from "next/link"
import { usePublicClient, useAccount } from "wagmi"
import { useQuery } from "@tanstack/react-query"
import { useDispute } from "@/hooks/useDispute"
import { useGovernanceToken } from "@/hooks/useGovernanceToken"
import { CONTRACT_ADDRESSES, GOVERNANCE_ABI, CARBON_CREDIT_ABI } from "@/services/web3/contracts"
import { LoadingSpinner } from "@/components/common/LoadingSpinner"
import { EmptyState } from "@/components/common/EmptyState"
import { CreditStatusBadge } from "@/components/credits/CreditStatusBadge"
import { DisputeStatus } from "@/types"
import type { Dispute, CreditType } from "@/types"
import { truncateAddress } from "@/lib/utils"

interface DisputeWithCredit {
  disputeIndex: number
  dispute: Dispute
  credit: CreditType | null
  autoProposalId: bigint | undefined
}

export default function DisputesPage() {
  const publicClient = usePublicClient()

  const { data: disputes, isLoading } = useQuery({
    queryKey: ["disputes"],
    enabled: !!publicClient,
    queryFn: async () => {
      if (!publicClient) throw new Error("No client")

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

      const results: DisputeWithCredit[] = await Promise.all(
        logs.map(async (log, index) => {
          const [dispute, credit] = await Promise.all([
            publicClient.readContract({
              address: CONTRACT_ADDRESSES.governance,
              abi: GOVERNANCE_ABI,
              functionName: "disputes",
              args: [BigInt(index)],
            }) as Promise<Dispute>,
            log.args.creditId !== undefined
              ? (publicClient.readContract({
                  address: CONTRACT_ADDRESSES.carbonCredit,
                  abi: CARBON_CREDIT_ABI,
                  functionName: "getCreditType",
                  args: [log.args.creditId],
                }) as Promise<CreditType>).catch(() => null)
              : Promise.resolve(null),
          ])

          return {
            disputeIndex: index,
            dispute,
            credit,
            autoProposalId: log.args.autoProposalId,
          }
        })
      )

      return results
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Disputes</h1>
          <p className="mt-1 text-zinc-400">Challenge suspicious credits or review ongoing disputes.</p>
        </div>
        <Link
          href="/governance"
          className="rounded-lg border-[1.5px] border-white px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
        >
          ← Proposals
        </Link>
      </div>

      <SubmitDisputePanel />

      {isLoading ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : !disputes || disputes.length === 0 ? (
        <EmptyState title="No disputes yet" description="When a credit is challenged, the dispute appears here with a linked DAO proposal." />
      ) : (
        <div className="space-y-3">
          {disputes.map((d) => (
            <DisputeCard key={d.disputeIndex} data={d} />
          ))}
        </div>
      )}
    </div>
  )
}

function SubmitDisputePanel() {
  const { isConnected } = useAccount()
  const { balance } = useGovernanceToken()
  const { dispute, isPending, isConfirming, isConfirmed, error } = useDispute()
  const [creditId, setCreditId] = useState("")
  const [reason, setReason] = useState("")

  const hasTokens = balance ? Number(balance) > 0 : false

  function handleSubmit() {
    if (!creditId || !reason) return
    try {
      dispute(BigInt(creditId), reason)
    } catch {
      return
    }
  }

  if (!isConnected) return null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Challenge a Credit</h3>
      <p className="mt-1 text-sm text-zinc-400">
        You must stake governance tokens to raise a dispute. If the DAO votes in your favor, you get them back + bonus. If not, your stake is burned.
      </p>

      {!hasTokens ? (
        <p className="mt-3 text-sm text-yellow-400/80">You need governance tokens to submit a dispute.</p>
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-zinc-400">Credit ID</label>
              <input
                type="number"
                value={creditId}
                onChange={(e) => setCreditId(e.target.value)}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-zinc-400">Reason</label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this credit is suspicious..."
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
              />
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isPending || isConfirming || !creditId || !reason}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
          >
            {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : "Submit Dispute"}
          </button>
          {isConfirmed && <p className="text-sm text-emerald-400">Dispute submitted! A DAO proposal has been created automatically.</p>}
          {error && <p className="text-sm text-red-400">{error.message}</p>}
        </div>
      )}
    </div>
  )
}

function DisputeCard({ data }: { data: DisputeWithCredit }) {
  const { dispute, credit, autoProposalId } = data

  const statusLabel = dispute.status === DisputeStatus.Open
    ? "Open"
    : dispute.status === DisputeStatus.Resolved
      ? "Resolved"
      : "Rejected"

  const statusStyle = dispute.status === DisputeStatus.Open
    ? "bg-yellow-500/15 text-yellow-400"
    : dispute.status === DisputeStatus.Resolved
      ? "bg-emerald-500/15 text-emerald-400"
      : "bg-red-500/15 text-red-400"

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
            {statusLabel}
          </span>
          {credit && <CreditStatusBadge status={credit.status} />}
        </div>
        {autoProposalId !== undefined && (
          <Link
            href={`/governance/${autoProposalId}`}
            className="text-xs text-emerald-400 hover:text-emerald-300"
          >
            View Proposal →
          </Link>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-medium text-zinc-100">
          {credit ? credit.projectName : `Credit #${Number(dispute.creditId)}`}
        </h3>
        <p className="mt-1 text-sm text-zinc-400">{dispute.reason}</p>
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-zinc-500">
        <span>Challenger: <span className="font-mono text-zinc-300">{truncateAddress(dispute.challenger)}</span></span>
        <span>Credit #{Number(dispute.creditId)}</span>
      </div>
    </div>
  )
}
