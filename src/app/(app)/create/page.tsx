"use client"

import { useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { CONTRACT_ADDRESSES, CARBON_CREDIT_ABI } from "@/services/web3/contracts"
import { truncateAddress } from "@/lib/utils"

type CreditPath = null | "certified" | "community"

interface FormData {
  projectName: string
  projectType: string
  region: string
  vintageYear: string
  tonnesCO2e: string
  totalSupply: string
  registrySource: string
  retirementProof: string
}

const INITIAL_FORM: FormData = {
  projectName: "",
  projectType: "",
  region: "",
  vintageYear: new Date().getFullYear().toString(),
  tonnesCO2e: "",
  totalSupply: "",
  registrySource: "",
  retirementProof: "",
}

const PROJECT_TYPES = ["Reforestation", "Renewable Energy", "Methane Capture", "Soil Carbon", "Blue Carbon", "Other"]

export default function CreatePage() {
  const { isConnected } = useAccount()
  const [path, setPath] = useState<CreditPath>(null)
  const [form, setForm] = useState<FormData>(INITIAL_FORM)
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const receipt = useWaitForTransactionReceipt({ hash })

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <h1 className="text-2xl font-bold">Connect your wallet</h1>
        <p className="text-zinc-400">Connect to tokenize a carbon credit.</p>
        <ConnectButton />
      </div>
    )
  }

  function updateField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function handleSubmit() {
    if (!form.projectName || !form.projectType || !form.region || !form.tonnesCO2e || !form.totalSupply) return

    let vintageYear: bigint, tonnesCO2e: bigint, totalSupply: bigint
    try {
      vintageYear = BigInt(form.vintageYear)
      tonnesCO2e = BigInt(form.tonnesCO2e)
      totalSupply = BigInt(form.totalSupply)
    } catch {
      return
    }

    const metadataURI = ""

    if (path === "certified") {
      if (!form.registrySource || !form.retirementProof) return
      writeContract({
        address: CONTRACT_ADDRESSES.carbonCredit,
        abi: CARBON_CREDIT_ABI,
        functionName: "createCertifiedCredit",
        args: [
          form.projectName,
          form.projectType,
          form.region,
          vintageYear,
          tonnesCO2e,
          totalSupply,
          metadataURI,
          form.registrySource,
          form.retirementProof,
        ],
      })
    } else {
      writeContract({
        address: CONTRACT_ADDRESSES.carbonCredit,
        abi: CARBON_CREDIT_ABI,
        functionName: "createCommunityCredit",
        args: [
          form.projectName,
          form.projectType,
          form.region,
          vintageYear,
          tonnesCO2e,
          totalSupply,
          metadataURI,
        ],
      })
    }
  }

  if (!path) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Create Credit</h1>
          <p className="mt-1 text-zinc-400">Choose how you want to tokenize your carbon credit.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => setPath("certified")}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-left transition-all hover:border-emerald-500/40 hover:bg-zinc-800/80"
          >
            <div className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-400">
              Certified
            </div>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">Bridge from Registry</h3>
            <p className="mt-1 text-sm text-zinc-400">
              You already have a credit on Verra or Gold Standard. Provide retirement proof to bridge it on-chain.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-zinc-500">
              <li>• Higher trust level</li>
              <li>• Verified immediately if AI confidence is high</li>
              <li>• Anti-double-bridge protection</li>
            </ul>
          </button>

          <button
            onClick={() => setPath("community")}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 text-left transition-all hover:border-blue-500/40 hover:bg-zinc-800/80"
          >
            <div className="inline-flex rounded-full border border-blue-500/30 bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-400">
              Community
            </div>
            <h3 className="mt-3 text-lg font-semibold text-zinc-100">Submit New Project</h3>
            <p className="mt-1 text-sm text-zinc-400">
              Submit a new carbon project directly. It will be verified by AI and the DAO community.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-zinc-500">
              <li>• Open to anyone</li>
              <li>• 7-day DAO challenge period</li>
              <li>• AI + community verification</li>
            </ul>
          </button>
        </div>
      </div>
    )
  }

  const isCertified = path === "certified"

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setPath(null)} className="text-sm text-zinc-500 hover:text-zinc-300">← Back</button>
        <h1 className="text-2xl font-bold">
          {isCertified ? "Certified Credit" : "Community Credit"}
        </h1>
      </div>

      <div className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <Field label="Project Name" value={form.projectName} onChange={(v) => updateField("projectName", v)} placeholder="Amazon Reforestation Block 42" />

        <div>
          <label className="text-sm font-medium text-zinc-400">Project Type</label>
          <select
            value={form.projectType}
            onChange={(e) => updateField("projectType", e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
          >
            <option value="">Select type...</option>
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <Field label="Region" value={form.region} onChange={(v) => updateField("region", v)} placeholder="Para, Brazil" />

        <div className="grid grid-cols-3 gap-4">
          <Field label="Vintage Year" value={form.vintageYear} onChange={(v) => updateField("vintageYear", v)} type="number" />
          <Field label="Tonnes CO2e" value={form.tonnesCO2e} onChange={(v) => updateField("tonnesCO2e", v)} type="number" placeholder="10000" />
          <Field label="Total Supply" value={form.totalSupply} onChange={(v) => updateField("totalSupply", v)} type="number" placeholder="100" />
        </div>

        {isCertified && (
          <>
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Registry Information</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-400">Registry Source</label>
              <select
                value={form.registrySource}
                onChange={(e) => updateField("registrySource", e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-zinc-500"
              >
                <option value="">Select registry...</option>
                <option value="Verra">Verra (VCS)</option>
                <option value="Gold Standard">Gold Standard</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Field label="Retirement Proof (Serial Number)" value={form.retirementProof} onChange={(v) => updateField("retirementProof", v)} placeholder="VCS-1234-2025-001" />
          </>
        )}
      </div>

      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 text-sm text-yellow-400/80">
        {isCertified
          ? "AI verification is mandatory. Claude will check proof consistency before minting."
          : "AI verification is mandatory. Your credit will be minted as Pending with a 7-day DAO challenge period."
        }
      </div>

      <button
        onClick={handleSubmit}
        disabled={isPending || receipt.isPending}
        className="w-full rounded-lg bg-emerald-600 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Confirm in wallet..." : receipt.isPending ? "Confirming..." : receipt.isSuccess ? "Credit created!" : "Create Credit"}
      </button>

      {error && <p className="text-sm text-red-400">{error.message}</p>}
      {hash && (
        <p className="text-sm text-zinc-500">Tx: <span className="font-mono">{truncateAddress(hash)}</span></p>
      )}
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="text-sm font-medium text-zinc-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
      />
    </div>
  )
}
