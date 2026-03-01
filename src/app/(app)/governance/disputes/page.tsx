"use client"

import { useState } from "react"
import Link from "next/link"
import { useAccount } from "wagmi"
import { CreditStatusBadge } from "@/components/credits/CreditStatusBadge"
import { DisputeStatus, CreditOrigin, CreditStatus } from "@/types"
import type { Dispute, CreditType } from "@/types"
import { truncateAddress } from "@/lib/utils"

interface DisputeWithCredit {
  disputeIndex: number
  dispute: Dispute
  credit: CreditType | null
  autoProposalId: bigint
}

const MOCK_DISPUTES: DisputeWithCredit[] = [
  { disputeIndex: 0, dispute: { creditId: 11n, challenger: "0x1234567890abcdef1234567890abcdef12345678", reason: "Satellite imagery shows no wetland restoration activity at the claimed site. The coordinates match a lithium mining operation.", status: DisputeStatus.Open }, credit: { id: 11n, projectName: "Chilean Lithium Wetland Offset", projectType: "Wetland Conservation", region: "Chile", vintageYear: 2024n, tonnesCO2e: 950n, totalSupply: 950n, impactScore: 58n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Suspended, issuer: "0xbadbadbadbadbadbadbadbadbadbadbadbadbadba", registrySource: "", retirementProof: "" }, autoProposalId: 1n },
  { disputeIndex: 1, dispute: { creditId: 23n, challenger: "0x9876543210fedcba9876543210fedcba98765432", reason: "Permafrost monitoring does not sequester carbon. The project falsely claims CO2 removal from passive monitoring activities.", status: DisputeStatus.Open }, credit: { id: 23n, projectName: "Siberian Permafrost Monitoring", projectType: "Wetland Conservation", region: "Russia", vintageYear: 2024n, tonnesCO2e: 550n, totalSupply: 550n, impactScore: 45n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Suspended, issuer: "0xrurururururururururururururururururururu0000", registrySource: "", retirementProof: "" }, autoProposalId: 3n },
  { disputeIndex: 2, dispute: { creditId: 17n, challenger: "0xcafebabecafebabecafebabecafebabecafebabe", reason: "Independent review estimates only 200 tCO2e offset, not 750 tCO2e as claimed. Significant overstatement of impact.", status: DisputeStatus.Rejected }, credit: { id: 17n, projectName: "Bangladesh Solar Microgrid", projectType: "Renewable Energy", region: "Bangladesh", vintageYear: 2025n, tonnesCO2e: 750n, totalSupply: 750n, impactScore: 69n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0xbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbdbd", registrySource: "", retirementProof: "" }, autoProposalId: 5n },
  { disputeIndex: 3, dispute: { creditId: 19n, challenger: "0x1111222233334444555566667777888899990000", reason: "Desalination component has significant energy consumption not accounted for in carbon offset calculations.", status: DisputeStatus.Open }, credit: { id: 19n, projectName: "Morocco Solar Desalination", projectType: "Renewable Energy", region: "Morocco", vintageYear: 2024n, tonnesCO2e: 1600n, totalSupply: 1600n, impactScore: 72n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Verified, issuer: "0xma0cma0cma0cma0cma0cma0cma0cma0cma0cma0c", registrySource: "", retirementProof: "" }, autoProposalId: 7n },
  { disputeIndex: 4, dispute: { creditId: 20n, challenger: "0xdac0dac0dac0dac0dac0dac0dac0dac0dac0dac0", reason: "Local NGO reports project site is actually a commercial fishing zone. No coral restoration observed during field visit.", status: DisputeStatus.Open }, credit: { id: 20n, projectName: "Philippines Coral Reef Restoration", projectType: "Blue Carbon", region: "Philippines", vintageYear: 2025n, tonnesCO2e: 380n, totalSupply: 380n, impactScore: 67n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0xphphphphphphphphphphphphphphphphphphphph00", registrySource: "", retirementProof: "" }, autoProposalId: 9n },
  { disputeIndex: 5, dispute: { creditId: 7n, challenger: "0xaabbccddaabbccddaabbccddaabbccddaabbccdd", reason: "Agroforestry project claims cover area of 500 hectares but government land registry shows only 120 hectares allocated.", status: DisputeStatus.Resolved }, credit: { id: 7n, projectName: "Congo Basin Agroforestry", projectType: "Agroforestry", region: "DR Congo", vintageYear: 2024n, tonnesCO2e: 2200n, totalSupply: 2200n, impactScore: 73n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Suspended, issuer: "0x1111222233334444555566667777888899990000", registrySource: "", retirementProof: "" }, autoProposalId: 4n },
  { disputeIndex: 6, dispute: { creditId: 8n, challenger: "0xffeeddccbbaa99887766554433221100ffeeddcc", reason: "Norwegian Kelp Farming project timeline inconsistent. Claims 3 years of growth data but project was registered 8 months ago.", status: DisputeStatus.Open }, credit: { id: 8n, projectName: "Norwegian Kelp Farming", projectType: "Blue Carbon", region: "Norway", vintageYear: 2025n, tonnesCO2e: 450n, totalSupply: 450n, impactScore: 81n, metadataURI: "", origin: CreditOrigin.CommunityVerified, status: CreditStatus.Pending, issuer: "0xffeeddccbbaa99887766554433221100ffeeddcc", registrySource: "", retirementProof: "" }, autoProposalId: 10n },
]

export default function DisputesPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Disputes</h1>
            <p className="mt-1 text-zinc-400">Challenge suspicious credits or review ongoing disputes.</p>
          </div>
          <Link
            href="/governance"
            className="inline-flex items-center gap-2 rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-4 py-2 text-base font-semibold text-white"
          >
            ← Proposals
          </Link>
        </div>

        <SubmitDisputePanel />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto pt-2 pb-6">
        <div className="space-y-3">
          {MOCK_DISPUTES.map((d) => (
            <DisputeCard key={d.disputeIndex} data={d} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SubmitDisputePanel() {
  const { isConnected } = useAccount()
  const [creditId, setCreditId] = useState("")
  const [reason, setReason] = useState("")

  if (!isConnected) return null

  return (
    <div className="mt-4 rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
      <h3 className="text-sm font-medium uppercase tracking-wider text-zinc-500">Challenge a Credit</h3>
      <p className="mt-1 text-sm text-zinc-400">
        You must stake governance tokens to raise a dispute. If the DAO votes in your favor, you get them back + bonus. If not, your stake is burned.
      </p>
      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-zinc-400">Credit ID</label>
            <input
              type="number"
              min="1"
              value={creditId}
              onChange={(e) => {
                const v = e.target.value
                if (v === "" || (Number(v) > 0 && Number.isInteger(Number(v)))) setCreditId(v)
              }}
              placeholder="1"
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
          disabled={!creditId || !reason}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:opacity-50"
        >
          Submit Dispute
        </button>
      </div>
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
      ? "bg-white/10 text-white"
      : "bg-red-500/15 text-red-400"

  return (
    <div className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${statusStyle}`}>
            {statusLabel}
          </span>
          {credit && <CreditStatusBadge status={credit.status} />}
        </div>
        <Link
          href={`/governance/${autoProposalId}`}
          className="text-xs text-white hover:text-zinc-300"
        >
          View Proposal →
        </Link>
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
