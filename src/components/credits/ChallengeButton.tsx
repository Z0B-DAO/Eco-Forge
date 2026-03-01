"use client"

import { useState } from "react"
import { useDispute } from "@/hooks/useDispute"
import { Modal } from "@/components/common/Modal"

export function ChallengeButton({ creditId }: { creditId: bigint }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const { dispute, isPending, isConfirming, isConfirmed, error } = useDispute()

  function handleSubmit() {
    if (!reason.trim()) return
    dispute(creditId, reason)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-xl border-[0.5px] border-white/60 bg-[#111111] px-4 py-2 text-base font-semibold text-red-400"
      >
        Challenge this credit
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Challenge Credit">
        <p className="text-sm text-zinc-400">
          You must stake governance tokens to submit a dispute. If the dispute fails, your staked tokens will be burned.
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this credit should be challenged..."
          rows={4}
          className="mt-4 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 outline-none focus:border-zinc-500"
        />

        <button
          onClick={handleSubmit}
          disabled={isPending || isConfirming || !reason.trim()}
          className="mt-4 w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Confirm in wallet..." : isConfirming ? "Confirming..." : isConfirmed ? "Dispute submitted!" : "Submit Dispute"}
        </button>

        {error && <p className="mt-2 text-xs text-red-400">{error.message}</p>}
      </Modal>
    </>
  )
}
