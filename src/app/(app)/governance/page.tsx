"use client"

import Link from "next/link"
import { ProposalType } from "@/types"
import { percentage } from "@/lib/utils"
import type { Proposal } from "@/types"

const now = Math.floor(Date.now() / 1000)

const MOCK_PROPOSALS: Proposal[] = [
  { id: 1n, proposer: "0x1234567890abcdef1234567890abcdef12345678", pType: ProposalType.DisputeResolution, description: "Dispute: Chilean Lithium Wetland Offset — Satellite imagery shows no wetland restoration activity. Suspected fraudulent carbon credit issuance.", forVotes: 18n, againstVotes: 4n, deadline: BigInt(now + 86400 * 3), executed: false },
  { id: 2n, proposer: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd", pType: ProposalType.CreditEligibility, description: "Eligibility review: Should Direct Air Capture projects qualify for community-verified credits without third-party audit?", forVotes: 12n, againstVotes: 9n, deadline: BigInt(now + 86400 * 5), executed: false },
  { id: 3n, proposer: "0x9876543210fedcba9876543210fedcba98765432", pType: ProposalType.DisputeResolution, description: "Dispute: Siberian Permafrost Monitoring — Project claims CO2 sequestration from permafrost monitoring, but monitoring alone does not sequester carbon.", forVotes: 25n, againstVotes: 2n, deadline: BigInt(now + 86400 * 1), executed: false },
  { id: 4n, proposer: "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef", pType: ProposalType.CreditEligibility, description: "Eligibility review: Propose minimum 50 impactScore threshold for community credits to be tradeable on marketplace.", forVotes: 31n, againstVotes: 7n, deadline: BigInt(now - 86400 * 2), executed: true },
  { id: 5n, proposer: "0xcafebabecafebabecafebabecafebabecafebabe", pType: ProposalType.DisputeResolution, description: "Dispute: Bangladesh Solar Microgrid — Issuer claimed 750 tCO2e offset but independent review estimates only 200 tCO2e. Possible overstatement.", forVotes: 8n, againstVotes: 14n, deadline: BigInt(now - 86400 * 5), executed: true },
  { id: 6n, proposer: "0xaabbccddaabbccddaabbccddaabbccddaabbccdd", pType: ProposalType.CreditEligibility, description: "Eligibility review: Add 'Biochar' as an officially recognized project type for certified credits from Verra registry.", forVotes: 22n, againstVotes: 3n, deadline: BigInt(now + 86400 * 7), executed: false },
  { id: 7n, proposer: "0x1111222233334444555566667777888899990000", pType: ProposalType.DisputeResolution, description: "Dispute: Morocco Solar Desalination — Project listed as Renewable Energy but desalination component has significant energy consumption not accounted for.", forVotes: 6n, againstVotes: 6n, deadline: BigInt(now + 86400 * 4), executed: false },
  { id: 8n, proposer: "0xffeeddccbbaa99887766554433221100ffeeddcc", pType: ProposalType.CreditEligibility, description: "Eligibility review: Require satellite imagery verification for all Reforestation credits regardless of origin (Certified or Community).", forVotes: 15n, againstVotes: 11n, deadline: BigInt(now - 86400 * 1), executed: false },
  { id: 9n, proposer: "0xdac0dac0dac0dac0dac0dac0dac0dac0dac0dac0", pType: ProposalType.DisputeResolution, description: "Dispute: Philippines Coral Reef Restoration — Community credit pending review. Local NGO reports project site is actually a commercial fishing zone.", forVotes: 19n, againstVotes: 1n, deadline: BigInt(now + 86400 * 6), executed: false },
  { id: 10n, proposer: "0x5555666677778888999900001111222233334444", pType: ProposalType.CreditEligibility, description: "Eligibility review: Increase challenge period from 7 days to 14 days for community credits with impactScore below 70.", forVotes: 10n, againstVotes: 10n, deadline: BigInt(now + 86400 * 2), executed: false },
]

export default function GovernancePage() {
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
        <div className="space-y-3">
          {MOCK_PROPOSALS.map((p) => (
            <ProposalCard key={p.id.toString()} proposal={p} />
          ))}
        </div>
      </div>
    </div>
  )
}

function ProposalCard({ proposal }: { proposal: Proposal }) {
  const totalVotes = proposal.forVotes + proposal.againstVotes
  const forPct = percentage(proposal.forVotes, totalVotes)
  const isActive = Number(proposal.deadline) * 1000 > Date.now() && !proposal.executed

  const deadlineDate = new Date(Number(proposal.deadline) * 1000)
  const diffMs = deadlineDate.getTime() - Date.now()
  const diffDays = Math.abs(Math.round(diffMs / (1000 * 60 * 60 * 24)))
  const timeLabel = diffMs > 0 ? `${diffDays}d left` : `${diffDays}d ago`

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
        <span className="text-xs text-zinc-500">{timeLabel}</span>
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
