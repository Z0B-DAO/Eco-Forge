"use client"

import { use, useState, useCallback } from "react"
import Link from "next/link"
import { ProposalType, CreditOrigin, CreditStatus } from "@/types"
import type { Proposal, CreditType } from "@/types"
import { percentage } from "@/lib/utils"
import { CreditCard } from "@/components/credits/CreditCard"
import type { Listing } from "@/types"

const now = Math.floor(Date.now() / 1000)

interface ProposalMock extends Proposal {
  creditId?: bigint
}

const MOCK_CREDITS: Record<string, CreditType> = {
  "11": { id: 11n, projectName: "Chilean Lithium Wetland Offset", projectType: "Wetland Conservation", region: "Chile", vintageYear: 2024n, tonnesCO2e: 950n, totalSupply: 950n, impactScore: 58n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Suspended, issuer: "0xbadbadbadbadbadbadbadbadbadbadbadbadbadba", registrySource: "", retirementProof: "" },
  "23": { id: 23n, projectName: "Siberian Permafrost Monitoring", projectType: "Wetland Conservation", region: "Russia", vintageYear: 2024n, tonnesCO2e: 550n, totalSupply: 550n, impactScore: 45n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Suspended, issuer: "0xrurururururururururururururururururururu0000", registrySource: "", retirementProof: "" },
  "17": { id: 17n, projectName: "Bangladesh Solar Microgrid", projectType: "Renewable Energy", region: "Bangladesh", vintageYear: 2025n, tonnesCO2e: 750n, totalSupply: 750n, impactScore: 69n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0xbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbd", registrySource: "", retirementProof: "" },
  "19": { id: 19n, projectName: "Morocco Solar Desalination", projectType: "Renewable Energy", region: "Morocco", vintageYear: 2024n, tonnesCO2e: 1600n, totalSupply: 1600n, impactScore: 72n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Verified, issuer: "0xma0cma0cma0cma0cma0cma0cma0cma0cma0cma0c", registrySource: "", retirementProof: "" },
  "20": { id: 20n, projectName: "Philippines Coral Reef Restoration", projectType: "Blue Carbon", region: "Philippines", vintageYear: 2025n, tonnesCO2e: 380n, totalSupply: 380n, impactScore: 67n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0xphphphphphphphphphphphphphphphphphphphph00", registrySource: "", retirementProof: "" },
}

const MOCK_LISTINGS: Record<string, Listing> = {
  "11": { listingId: 11n, creditId: 11n, seller: "0xbadbadbadbadbadbadbadbadbadbadbadbadbadba", amount: 950n, pricePerUnit: 800000000000000n, active: true },
  "23": { listingId: 23n, creditId: 23n, seller: "0xrurururururururururururururururururururu0000", amount: 550n, pricePerUnit: 600000000000000n, active: true },
  "17": { listingId: 17n, creditId: 17n, seller: "0xbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbd", amount: 750n, pricePerUnit: 1200000000000000n, active: true },
  "19": { listingId: 19n, creditId: 19n, seller: "0xma0cma0cma0cma0cma0cma0cma0cma0cma0cma0c", amount: 800n, pricePerUnit: 1400000000000000n, active: true },
  "20": { listingId: 20n, creditId: 20n, seller: "0xphphphphphphphphphphphphphphphphphphphph00", amount: 380n, pricePerUnit: 6100000000000000n, active: true },
}

const MOCK_PROPOSALS: Record<string, ProposalMock> = {
  "1": { id: 1n, proposer: "0x1234567890abcdef1234567890abcdef12345678", pType: ProposalType.DisputeResolution, description: "Dispute: Chilean Lithium Wetland Offset — Satellite imagery shows no wetland restoration activity. Suspected fraudulent carbon credit issuance.", forVotes: 18n, againstVotes: 4n, deadline: BigInt(now + 86400 * 3), executed: false, creditId: 11n },
  "2": { id: 2n, proposer: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", pType: ProposalType.CreditEligibility, description: "Eligibility review: Should Direct Air Capture projects qualify for community-verified credits without third-party audit?", forVotes: 12n, againstVotes: 9n, deadline: BigInt(now + 86400 * 5), executed: false },
  "3": { id: 3n, proposer: "0x9876543210fedcba9876543210fedcba98765432", pType: ProposalType.DisputeResolution, description: "Dispute: Siberian Permafrost Monitoring — Project claims CO2 sequestration from permafrost monitoring, but monitoring alone does not sequester carbon.", forVotes: 25n, againstVotes: 2n, deadline: BigInt(now + 86400 * 1), executed: false, creditId: 23n },
  "4": { id: 4n, proposer: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", pType: ProposalType.CreditEligibility, description: "Eligibility review: Propose minimum 50 impactScore threshold for community credits to be tradeable on marketplace.", forVotes: 31n, againstVotes: 7n, deadline: BigInt(now - 86400 * 2), executed: true },
  "5": { id: 5n, proposer: "0xcafebabecafebabecafebabecafebabecafebabe", pType: ProposalType.DisputeResolution, description: "Dispute: Bangladesh Solar Microgrid — Issuer claimed 750 tCO2e offset but independent review estimates only 200 tCO2e. Possible overstatement.", forVotes: 8n, againstVotes: 14n, deadline: BigInt(now - 86400 * 5), executed: true, creditId: 17n },
  "6": { id: 6n, proposer: "0xaabbccddaabbccddaabbccddaabbccddaabbccdd", pType: ProposalType.CreditEligibility, description: "Eligibility review: Add 'Biochar' as an officially recognized project type for certified credits from Verra registry.", forVotes: 22n, againstVotes: 3n, deadline: BigInt(now + 86400 * 7), executed: false },
  "7": { id: 7n, proposer: "0x1111222233334444555566667777888899990000", pType: ProposalType.DisputeResolution, description: "Dispute: Morocco Solar Desalination — Project listed as Renewable Energy but desalination component has significant energy consumption not accounted for.", forVotes: 6n, againstVotes: 6n, deadline: BigInt(now + 86400 * 4), executed: false, creditId: 19n },
  "8": { id: 8n, proposer: "0xffeeddccbbaa99887766554433221100ffeeddcc", pType: ProposalType.CreditEligibility, description: "Eligibility review: Require satellite imagery verification for all Reforestation credits regardless of origin (Certified or Community).", forVotes: 15n, againstVotes: 11n, deadline: BigInt(now - 86400 * 1), executed: false },
  "9": { id: 9n, proposer: "0xdac0dac0dac0dac0dac0dac0dac0dac0dac0dac0", pType: ProposalType.DisputeResolution, description: "Dispute: Philippines Coral Reef Restoration — Community credit pending review. Local NGO reports project site is actually a commercial fishing zone.", forVotes: 19n, againstVotes: 1n, deadline: BigInt(now + 86400 * 6), executed: false, creditId: 20n },
  "10": { id: 10n, proposer: "0x5555666677778888999900001111222233334444", pType: ProposalType.CreditEligibility, description: "Eligibility review: Increase challenge period from 7 days to 14 days for community credits with impactScore below 70.", forVotes: 10n, againstVotes: 10n, deadline: BigInt(now + 86400 * 2), executed: false },
}

export default function ProposalDetailPage({ params }: { params: Promise<{ proposalId: string }> }) {
  const { proposalId: proposalIdStr } = use(params)
  const proposal = MOCK_PROPOSALS[proposalIdStr]
  const [copied, setCopied] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const copyAddress = useCallback(() => {
    if (!proposal) return
    navigator.clipboard.writeText(proposal.proposer)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }, [proposal])

  if (!proposal) {
    return <p className="py-20 text-center text-zinc-400">Proposal not found.</p>
  }

  const totalVotes = proposal.forVotes + proposal.againstVotes
  const forPct = percentage(proposal.forVotes, totalVotes)
  const isActive = Number(proposal.deadline) * 1000 > Date.now() && !proposal.executed

  const deadlineDate = new Date(Number(proposal.deadline) * 1000)
  const diffMs = deadlineDate.getTime() - Date.now()
  const diffDays = Math.abs(Math.round(diffMs / (1000 * 60 * 60 * 24)))
  const timeLabel = diffMs > 0 ? `ends in ${diffDays}d` : `ended ${diffDays}d ago`

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
          <span className="ml-1">· {timeLabel}</span>
        </p>
      </div>

      <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
        <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Description</h3>
        <p className="mt-2 text-sm text-zinc-100">{proposal.description}</p>
      </div>

      {proposal.creditId !== undefined && MOCK_CREDITS[proposal.creditId.toString()] && (
        <div>
          <h3 className="mb-2 text-sm font-medium uppercase tracking-wider text-zinc-500">Contested Credit</h3>
          <CreditCard
            credit={MOCK_CREDITS[proposal.creditId.toString()]}
            listing={MOCK_LISTINGS[proposal.creditId.toString()]}
          />
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

      {isActive && !hasVoted && (
        <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
          <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Cast Your Vote</h3>
          <p className="mt-2 text-sm text-zinc-400">
            Your voting power: <span className="font-medium text-zinc-100">3 tokens</span>
          </p>

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => setHasVoted(true)}
              className="flex-1 rounded-lg border border-white/80 bg-white/5 backdrop-blur-sm py-2.5 text-sm font-medium text-white"
            >
              Vote FOR
            </button>
            <button
              onClick={() => setHasVoted(true)}
              className="flex-1 rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500"
            >
              Vote AGAINST
            </button>
          </div>
        </div>
      )}

      {hasVoted && (
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
